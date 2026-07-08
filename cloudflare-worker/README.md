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
deployment on 2026-07-08 via a direct PowerShell call:

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
