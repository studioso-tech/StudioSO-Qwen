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
 * Deployed at: https://qwen-proxy.studioso.workers.dev/
 * Upstream:    https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
 * Model:       qwen-max (Alibaba Cloud Model Studio / DashScope)
 */

const DASHSCOPE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: { message: 'Method not allowed' } }, 405);
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

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
