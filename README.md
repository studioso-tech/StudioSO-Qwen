# Studio S.O — AI Intake Autopilot (Qwen Cloud edition)

**An avatar-led intake agent that turns a customer's own words into a structured
handoff brief for a human — end to end, powered by Alibaba Cloud Qwen-Max.**

Built for the *Global AI Hackathon Series with Qwen Cloud* — track: **Autopilot Agent**
(end-to-end business workflow automation with human oversight).

- Live demo: https://studioso-qwen.web.app — **fully bilingual**: use the 日本語 / English
  toggle on the hero screen to try the whole experience (avatar greeting with recorded
  English voice, dialogue, UI) in English
- Architecture diagram: [`docs/architecture.png`](docs/architecture.png)
- Proof of Alibaba Cloud usage: [`docs/alibaba_cloud_proof.png`](docs/alibaba_cloud_proof.png) · [`cloudflare-worker/README.md`](cloudflare-worker/README.md)

## The problem

Local businesses and solo consultants (the Studio S.O founder is one) can't staff
a 24/7 front desk, but a missed or mishandled first contact costs them the client.
Generic chatbots make it worse: they either interrogate the customer with a rigid
form, or bury a non-technical small-business owner in jargon they didn't ask for.
What a human admin actually needs isn't a transcript — it's a two-minute brief:
*who is this, what do they need, and what should I say when I call them back?*

## The business behind it — "The Intelligent Atelier"

Studio S.O is a real one-person consultancy being founded in Iwakuni, Yamaguchi
(regional Japan) under the concept **"The Intelligent Atelier"** — AI consulting
(B2B) as the revenue core, with travel design and a culinary lab as B2C *proving
labs* that feed sensory-data structuring know-how back into the B2B offer. This
agent is **pillar #3 of that actual go-to-market plan** ("an AI-driven intake desk
that lowers the psychological barrier and qualifies leads") — deployed and
answering real visitors today, not a concept demo.

The value the whole business sells is **"room to breathe" (時間の余白) and a
redefinition of the everyday**: not tool adoption for its own sake, but removing
the gravel-road grind of daily operations so an owner gets time back — and with
it, the bandwidth to expand their own sensibility and redefine a richer daily
life. That philosophy is stated outright on the site's hero screen ("AIによって
人間の感性を拡張し、より豊かな日常を再定義する。" — *Expanding human sensibility
through AI, redefining a richer everyday life*), and this agent is the mechanism
that buys back that time: it does the tedious first-contact triage so the
founder's own hours go toward the work only a human can do.

- **The founder spent 25+ years building refinery information systems** (RIS at
  Koa Oil, now ENEOS) — the origin of the product's core metaphor: an information
  system is an *organizational nervous system* of five elements (hardware, software,
  data, process, people), of which AI is only one. The consultancy's mission is to
  **democratize that nervous system** for small regional businesses that could never
  afford enterprise systems.
- **The jargon ban is the business strategy, not a UX nicety.** The target customers —
  factory owners, bakers, restaurant operators in regional Japan — are precisely the
  people alienated by "AI/DX/DIKW" language. The *local-translation* layer (a
  craftsman's 勘/intuition becomes a "recipe"; AI becomes a walking stick, not a
  magic wand) exists because breaking that psychological barrier is what wins these
  clients at all.
- **The three business lines are structural, not decorative.** Travel design and the
  culinary lab are B2C *proving labs*: they demonstrate — publicly — that the same
  agent can structure unquantifiable, sensory needs (a journey's "soul", a taste to
  recreate), and that know-how flows back into the B2B consulting offer (e.g. a
  bakery's demand forecasting). One agent serving all three lines through one front
  door is the company's shop window for exactly that claim.
- **The handoff brief maps to real money.** A qualified lead becomes a ¥33,000
  initial assessment, then ¥500,000+ implementation projects and ¥100,000+/month
  advisory. A missed or badly-handled first contact is a lost client — which is why
  the pipeline obsesses over contact capture, readiness gating, and a brief the
  admin can act on in under a minute.

## What it does

A single avatar handles three very different lines of business — AI/DX consulting,
travel design, and a culinary R&D lab — through one conversational front door:

1. **Captures contact details up front, without interrogating.** A short form
   (name, phone, address with postal-code auto-fill, consultation genre) opens as
   the hearing starts. The values are injected into the conversation as known
   context, so the agent **never re-asks** for a name or phone number mid-dialogue —
   and even a customer who drops out mid-conversation is never a lost lead.
2. **Listens without jargon.** The system prompt forbids AI/DX/culinary/travel
   buzzwords outright and requires the model to mirror the customer's own
   vocabulary back to them, translated live through an industry-specific
   local-language dictionary (see *Innovation*, below).
3. **Classifies as it goes.** Every turn is scored against a business category
   (consulting / travel / culinary / mixed) and an industry, with **confidence and
   readiness scores** the customer never sees but the UI acts on.
4. **Waits for real signal before acting.** The "create handoff sheet" affordance
   only turns proactive once the readiness score crosses **0.8** — the system's own
   estimate that it has heard enough to be useful, not a fixed turn count — and the
   agent itself proposes wrapping up once the hearing has genuinely converged.
5. **Hands off automatically.** Once the customer confirms, Qwen-Max generates
   the brief and a Cloudflare Worker delivers it straight to the human admin's
   inbox — no copy-paste required, no dashboard to check.
6. **Speaks the customer's language, literally.** The whole experience is bilingual:
   a hero-screen toggle switches every page, the avatar greeting (recorded English
   voice + lip-synced video), speech recognition, text-to-speech, and Qwen-Max's
   dialogue between Japanese and English — while the handoff brief for the
   Japanese-speaking admin **stays in Japanese** (a separate Japanese summary is
   generated for the brief, an English one for the customer).

## Why "Autopilot Agent"

This is deliberately not a chatbot demo — it's a **trigger → AI → action** pipeline
with a human as the last, decisive step:

```
Customer fills the contact form (name / phone / address / genre)
        │                            (injected as known context — the agent
        ▼                             never asks for contact details again)
Customer types/speaks
        │
        ▼
Qwen-Max dialogue turn  ──┐  (persona: no jargon, listens first, asks one
        │                 │   grounded question at a time — see api.js)
        ▼                 │
Qwen-Max classification  ─┘  (category + industry + confidence + readiness, logic.js)
        │
        ▼ readiness >= 0.8, customer confirms
Qwen-Max summarization       (structured brief: profile / conversation summary /
        │                     advice-for-the-admin — always in Japanese for the
        ▼                     admin, plus an English summary for EN customers)
Cloudflare Worker  ──POST /notify──▶  Resend  ──▶  human admin's inbox
        │
        ▼
Human admin makes the call, fully briefed, in under a minute
```

Production's original version of this same idea used Google Workspace Studio's
no-code trigger/action builder with Gemini in the middle and a Gmail draft as the
output. This repo rebuilds the same shape end-to-end on Alibaba Cloud instead:
Qwen-Max does every reasoning step (dialogue, classification, summarization), and
a Cloudflare Worker — not a Google automation tool — performs the final action.
See [`cloudflare-worker/qwen-proxy.js`](cloudflare-worker/qwen-proxy.js) (`POST /notify`).

## Architecture

The frontend is organized into four layers, each independently testable:

| Layer | File | Responsibility |
|---|---|---|
| 人格層 (Persona) | [`consultation/api.js`](public/consultation/api.js) | System prompt, jargon ban, per-category dialogue policy, Qwen-Max calls, admin-notify dispatch |
| 論理層 (Logic) | [`consultation/logic.js`](public/consultation/logic.js) | Category/industry classification, confidence scoring, keyword-based fallback if the API call fails |
| 知識層 (Knowledge) | [`consultation/dictionary.js`](public/consultation/dictionary.js) | Per-industry jargon → plain-language dictionaries (9 industries, auto-selected by classification) |
| 出力層 (Output) | [`consultation/output.js`](public/consultation/output.js) | Renders the handoff brief (HTML modal + plaintext for email/clipboard) |

**Engineering details that back up the "sophisticated use of Qwen" claim:**

- **Local-language dictionary, not just a system-prompt instruction.** Rather than
  hoping the model avoids jargon, [`dictionary.js`](public/consultation/dictionary.js)
  ships hand-written term → plain-language mappings per industry (manufacturing,
  logistics, construction, agriculture, healthcare, travel, culinary, …), injected
  into the Qwen-Max prompt only for the industry actually detected — so a factory
  manager and a honeymoon-trip customer get differently-grounded language from the
  same agent.
- **Graceful degradation.** If the Qwen-Max classification call fails or times out,
  `logic.js` falls back to a local keyword-scoring heuristic (`quickEstimateIndustry`)
  so the conversation never breaks — the agent is disposable, the conversation isn't.
- **Readiness as a UI signal, not a black box.** Classification returns two separate
  scores: *confidence* (is the category right?) and *readiness* (has the hearing gone
  deep enough to hand off?). The 0.8 readiness threshold gates *when the UI offers
  to act*, not just what it says — this is the "human oversight" half of Autopilot
  Agent: the system proposes, the customer still has to confirm, the admin still
  makes the call.
- **Bilingual by design, not by translation layer.** UI text switches via lightweight
  `data-en` attributes (`consultation/i18n.js`); the dialogue language is a single
  system-prompt directive; and the handoff pipeline generates *two* summaries in EN
  mode — English for the customer-facing bubble and read-aloud, Japanese for the
  admin's brief — so the admin's workflow never changes no matter what language the
  customer speaks.
- **Secrets never reach the browser.** Both the DashScope proxy and the notify
  endpoint live behind the same Cloudflare Worker; the admin's email address,
  the Resend API key, and the notify shared-secret are Worker secrets, never
  shipped in client JS.

## Tech stack

- **AI:** Alibaba Cloud DashScope, model `qwen-max`, called through an
  Anthropic-Messages-compatible request shape (see `fetchClaude()` in `api.js`)
- **Edge proxy / automation:** Cloudflare Workers (`cloudflare-worker/qwen-proxy.js`) —
  translates the frontend's request format to DashScope's OpenAI-compatible API,
  and separately handles the confidence-gated admin-notify email via Resend
- **Frontend:** vanilla HTML/CSS/JS, no framework, no build step — Firebase Hosting
- **Speech:** browser `SpeechRecognition` for voice input and `speechSynthesis`
  for read-aloud — both follow the selected language (ja-JP / en-US); the greeting
  sequence uses locally recorded avatar video + voice in both Japanese and English
- **Address assist:** postal-code → address auto-fill on the contact form (zipcloud)

## Setup

1. Open [`public/consultation/config.js`](public/consultation/config.js) and set:
   - `QWEN_API_KEY` — your Alibaba Cloud DashScope API key
   - `NOTIFY_SECRET` — any string, must match the Cloudflare Worker's `NOTIFY_SECRET`
2. Deploy/configure the Worker — see [`cloudflare-worker/README.md`](cloudflare-worker/README.md)
   for both the chat proxy and the `/notify` admin-handoff endpoint (Resend setup,
   required secrets).
3. `firebase use --add` to link your own Firebase project (this repo's `.firebaserc`
   is intentionally unlinked so it can never accidentally deploy to production).
4. `firebase deploy`

## Differences from Studio S.O's production site

This repo is a fork of Studio S.O's production frontend, re-pointed at Qwen Cloud
end-to-end instead of the production stack (Claude for dialogue, Vertex AI/Gemini +
Google Workspace Studio for the admin handoff):

- Chat + classification + summarization: Claude API → **Qwen-Max** (via the
  Cloudflare Worker above)
- Admin handoff automation: Google Workspace Studio + Gemini + Gmail →
  **Cloudflare Worker + Qwen-Max + Resend** (`POST /notify`)
- No server-side key storage (yet) — `config.js` exposes the DashScope key to the
  browser, which is fine for this hackathon build but should move behind a proper
  server-side proxy (Firebase Functions / Cloud Run) before any real production use
- `.firebaserc` is unlinked from production on purpose

## Notes

- `config.js` is `.gitignore`d — it holds the DashScope API key and the notify
  shared secret. Never commit it.
- License: MIT (see [`LICENSE`](LICENSE)).
