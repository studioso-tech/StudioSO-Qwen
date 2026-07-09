/**
 * qwen-proxy — Cloudflare Worker
 *
 * Proof of Alibaba Cloud usage for the "Global AI Hackathon Series with Qwen Cloud".
 *
 * Purpose:
 *   The frontend (public/consultation/api.js) is written against an
 *   Anthropic-style Messages API. Alibaba Cloud DashScope's OpenAI-compatible
 *   endpoint cannot be called directly from a browser (CORS), and its request/
 *   response shape differs from Anthropic's. This Worker sits between the two:
 *
 *     Browser --(Anthropic-style request, x-api-key)--> qwen-proxy
 *     qwen-proxy --(OpenAI-compatible request, Bearer)--> Alibaba Cloud DashScope
 *     qwen-proxy <--(OpenAI-compatible response)-- Alibaba Cloud DashScope
 *     Browser <--(Anthropic-style response)-- qwen-proxy
 *
 *   POST /notify is a second route on the same Worker: the "Autopilot Agent"
 *   handoff step. Once the frontend's Qwen-Max-powered analysis reaches
 *   confidence >= 0.8 and generates the cheat sheet (public/consultation/output.js),
 *   the browser posts the finished text here, and this Worker emails it to the
 *   human admin via Resend — the trigger→action delivery step that Studio S.O's
 *   production version does with Google Workspace Studio + Gemini + Gmail. This
 *   is the Qwen-Cloud-only equivalent: Resend's API key, the admin's address, and
 *   the shared notify secret all stay server-side as Worker secrets, never sent
 *   to or read by the browser.
 *
 * Deployed at: https://qwen-proxy.studioso.workers.dev/
 * Upstream:    https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
 * Model:       qwen-max (Alibaba Cloud Model Studio / DashScope)
 */

const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
const RESEND_URL = 'https://api.resend.com/emails';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, x-api-key, x-notify-secret, anthropic-version, anthropic-dangerous-direct-browser-access',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: { message: 'Method not allowed' } }, 405);
    }

    const url = new URL(request.url);
    if (url.pathname === '/notify') {
      return handleNotify(request, env);
    }

    // The DashScope API key is passed straight through from the frontend via
    // the Anthropic-convention `x-api-key` header (see public/consultation/api.js
    // fetchClaude()), then re-issued to DashScope as a Bearer token below.
    const dashscopeApiKey = request.headers.get('x-api-key');
    if (!dashscopeApiKey) {
      return jsonResponse({ error: { message: 'Missing x-api-key header' } }, 401);
    }

    let anthropicBody;
    try {
      anthropicBody = await request.json();
    } catch {
      return jsonResponse({ error: { message: 'Invalid JSON body' } }, 400);
    }

    // ── Anthropic Messages format → OpenAI-compatible (DashScope) format ──
    const { model, max_tokens, system, messages } = anthropicBody;
    const openAiMessages = [];
    if (system) openAiMessages.push({ role: 'system', content: system });
    for (const m of messages || []) {
      openAiMessages.push({ role: m.role, content: m.content });
    }

    const dashscopeRequest = {
      model: model || 'qwen-max',
      messages: openAiMessages,
      max_tokens: max_tokens || 512,
    };

    let dashscopeResponse;
    try {
      dashscopeResponse = await fetch(DASHSCOPE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${dashscopeApiKey}`,
        },
        body: JSON.stringify(dashscopeRequest),
      });
    } catch (e) {
      return jsonResponse({ error: { message: `Upstream request failed: ${e.message}` } }, 502);
    }

    const dashscopeJson = await dashscopeResponse.json().catch(() => null);

    if (!dashscopeResponse.ok || !dashscopeJson) {
      return jsonResponse(
        { error: { message: dashscopeJson?.error?.message || `DashScope error ${dashscopeResponse.status}` } },
        dashscopeResponse.status || 502
      );
    }

    // ── OpenAI-compatible (DashScope) response → Anthropic Messages format ──
    // Note: usage/id are passed through from DashScope as-is (OpenAI-style
    // field names) rather than renamed, since the frontend only reads
    // response.content[0].text and doesn't depend on usage field naming.
    const choice = dashscopeJson.choices?.[0];
    const anthropicResponse = {
      id: dashscopeJson.id || crypto.randomUUID(),
      type: 'message',
      role: 'assistant',
      model: dashscopeJson.model || dashscopeRequest.model,
      content: [
        {
          type: 'text',
          text: choice?.message?.content ?? '',
        },
      ],
      stop_reason: choice?.finish_reason === 'length' ? 'max_tokens' : 'end_turn',
      usage: dashscopeJson.usage || {},
    };

    return jsonResponse(anthropicResponse, 200);
  },
};

/**
 * POST /notify — cheat-sheet handoff to the human admin.
 *
 * Body: { subject: string, text: string }
 * Auth: x-notify-secret header must match the NOTIFY_SECRET Worker secret
 *       (kept separate from the DashScope x-api-key so a leaked chat key
 *       can't be used to spam the admin's inbox).
 *
 * Required Worker secrets/vars (see cloudflare-worker/README.md for setup):
 *   RESEND_API_KEY   — Resend API key, sends the email
 *   ADMIN_EMAIL      — where the cheat sheet is delivered
 *   NOTIFY_SECRET    — shared secret the frontend must present
 *   NOTIFY_FROM_EMAIL (optional) — defaults to Resend's sandbox sender
 */
async function handleNotify(request, env) {
  const providedSecret = request.headers.get('x-notify-secret');
  if (!env.NOTIFY_SECRET || !providedSecret || providedSecret !== env.NOTIFY_SECRET) {
    return jsonResponse({ error: { message: 'Unauthorized' } }, 401);
  }
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL) {
    return jsonResponse({ error: { message: 'Notify endpoint not configured (missing RESEND_API_KEY or ADMIN_EMAIL)' } }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: { message: 'Invalid JSON body' } }, 400);
  }

  const { subject, text } = body;
  if (!subject || !text) {
    return jsonResponse({ error: { message: 'subject and text are required' } }, 400);
  }

  let resendResponse;
  try {
    resendResponse = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.NOTIFY_FROM_EMAIL || 'Studio S.O <onboarding@resend.dev>',
        to: [env.ADMIN_EMAIL],
        subject,
        text,
      }),
    });
  } catch (e) {
    return jsonResponse({ error: { message: `Resend request failed: ${e.message}` } }, 502);
  }

  const resendJson = await resendResponse.json().catch(() => null);
  if (!resendResponse.ok) {
    return jsonResponse(
      { error: { message: resendJson?.message || `Resend error ${resendResponse.status}` } },
      resendResponse.status || 502
    );
  }

  return jsonResponse({ ok: true, id: resendJson?.id }, 200);
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
