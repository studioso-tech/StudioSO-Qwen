# qwen-proxy — Cloudflare Worker

This directory documents the Cloudflare Worker that proxies all AI requests from
the Studio S.O consultation frontend to **Alibaba Cloud DashScope (Model Studio)**.

- **Live endpoint:** https://qwen-proxy.studioso.workers.dev/
- **Upstream (Alibaba Cloud):** https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions
- **Model:** `qwen-max`
- **Source:** [`qwen-proxy.js`](./qwen-proxy.js)

## Why this exists

The frontend ([`public/consultation/api.js`](../public/consultation/api.js)) is
written against an Anthropic-style Messages API. DashScope's OpenAI-compatible
endpoint can't be called directly from a browser (CORS), and its request/response
shape differs from Anthropic's. This Worker is the translation layer:

```
Browser --(Anthropic-style request, x-api-key)--> qwen-proxy (Cloudflare)
qwen-proxy --(OpenAI-compatible request, Bearer)--> Alibaba Cloud DashScope (qwen-max)
qwen-proxy <--(OpenAI-compatible response)-- Alibaba Cloud DashScope
Browser <--(Anthropic-style response)-- qwen-proxy
```

## Verification

The request/response contract in `qwen-proxy.js` was verified against the live
deployment on 2026-07-08 via a direct PowerShell call. On 2026-07-11 the Worker
was briefly upgraded to `qwen3.7-max` with `enable_thinking: true`, but reverted
the same day — Thinking Mode added 10-15s of latency per reply, which read as
sluggish in real conversation. Back on plain `qwen-max`.

```powershell
$body = @{
  model = "qwen-max"
  max_tokens = 64
  system = "あなたはテストアシスタントです。"
  messages = @(@{ role = "user"; content = "こんにちはとだけ返してください。" })
} | ConvertTo-Json -Depth 10 -Compress

Invoke-RestMethod -Uri "https://qwen-proxy.studioso.workers.dev/" -Method POST `
  -Headers @{ "x-api-key" = "<DashScope API key>"; "anthropic-version" = "2023-06-01" } `
  -Body $body
```

Live response confirming Alibaba Cloud (qwen-max) is the backend:

```json
{
  "id": "chatcmpl-744e601b-2546-9bcb-b41b-c9b87002b7a0",
  "type": "message",
  "role": "assistant",
  "model": "qwen-max",
  "content": [{ "type": "text", "text": "こんにちは" }],
  "stop_reason": "end_turn",
  "usage": { "prompt_tokens": 28, "completion_tokens": 1, "total_tokens": 29 }
}
```

## POST /notify — cheat-sheet auto-delivery (Autopilot Agent action step)

A second route on the same Worker. When the frontend's Qwen-Max-powered
analysis reaches `confidence >= 0.8` and the cheat sheet is finalized
(`public/consultation/chat.js` → `notifyAdmin()`), the browser posts the
finished text here and this Worker emails it to the human admin via
[Resend](https://resend.com). This is the Qwen-Cloud-only replacement for
production's Workspace Studio + Gemini + Gmail hand-off — same
trigger→action shape, but the AI step and the delivery step both stay in
this repo's own stack.

```
Browser --(subject, text, x-notify-secret)--> qwen-proxy /notify
qwen-proxy --(Bearer RESEND_API_KEY)--> Resend
Resend --(email)--> ADMIN_EMAIL
```

**Setup (one-time):**

1. Create a free [Resend](https://resend.com) account and generate an API key.
   The sandbox sender `onboarding@resend.dev` works with no domain
   verification — fine for a hackathon demo. Swap in a verified domain later
   for production use.
2. Set three secrets on the **same** Worker that already serves the root
   endpoint (via the Cloudflare dashboard → Workers → qwen-proxy → Settings →
   Variables, or via Wrangler if you manage this Worker with a `wrangler.toml`):
   ```
   wrangler secret put RESEND_API_KEY
   wrangler secret put ADMIN_EMAIL
   wrangler secret put NOTIFY_SECRET
   ```
   - `RESEND_API_KEY` — from step 1
   - `ADMIN_EMAIL` — where the cheat sheet should land
   - `NOTIFY_SECRET` — any random string; must exactly match
     `NOTIFY_SECRET` in `public/consultation/config.js` (defaults to the
     placeholder `CHANGE_ME_so-notify-2026` — change both sides together)
   - `NOTIFY_FROM_EMAIL` (optional) — defaults to `Studio S.O <onboarding@resend.dev>`
3. Redeploy `qwen-proxy.js` (paste the updated source into the dashboard's
   editor, or `wrangler deploy` if using the CLI).

**Verification**, once configured:

```powershell
Invoke-RestMethod -Uri "https://qwen-proxy.studioso.workers.dev/notify" -Method POST `
  -Headers @{ "x-notify-secret" = "<same value as config.js>" } `
  -Body (@{ subject = "Test"; text = "Hello from the notify endpoint" } | ConvertTo-Json)
```

A `401` means the secret doesn't match on both sides; a `500` means
`RESEND_API_KEY`/`ADMIN_EMAIL` aren't set yet; `{"ok":true,"id":"..."}` means
the email was accepted by Resend.
