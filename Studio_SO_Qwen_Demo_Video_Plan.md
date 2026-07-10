# Studio S.O — Qwen Cloud ハッカソン提出用デモ動画 制作ガイド（StudioSO-Qwen版）

このリポジトリ（StudioSO-Qwen）専用のデモ動画プランです。AIエンジンは **Alibaba Cloud DashScope の `qwen3.7-max`（Thinking Mode有効）** のみを使用します。管理人への自動配信も、本番版のGoogle Workspace Studio + Gemini + Gmailではなく、**Cloudflare Worker + Qwen3.7-Max + Resend** で実装済み・動作確認済みです（`POST /notify`）。

---

## 🎯 審査基準とシーンの対応表

このハッカソンは4軸で採点されます。各シーンがどこに効くかを意識して撮影してください。

| 審査基準 | 配点 | 対応するシーン |
|---|---|---|
| 技術的深さ・エンジニアリング | 30% | シーン3（アーキテクチャ）、シーン2の確信度ゲート |
| イノベーション・AI創造性 | 30% | シーン2の脱・専門用語ローカル辞書、シーン3の4層構造 |
| 課題の価値・インパクト | 25% | シーン1（オープニングの課題提起） |
| プレゼン・ドキュメント | 15% | 全体の構成・字幕・`docs/architecture.png` |

---

## 🎥 動画の基本設計
* **目標時間**: 2分（120秒）
* **デモ実演環境**: ローカルテスト環境 (`http://localhost:3001/`) または提出用サイト (`https://studioso-qwen.web.app/`)
* **クライマックス**: 顧客との対話だけで完結させず、**実際に管理人の受信箱にメールが届く瞬間**を映すこと。ここが「Autopilot Agent（人間監督下の業務自動化）」を体現している証拠であり、技術的深さ・イノベーション両方の得点に直結します。

---

## 📄 タイムライン別・ナレーション台本（コピペ用英語スクリプト）

### 1. オープニング／課題提起（0秒〜15秒）— Impact 25%
* **表示画面**: スライド1（タイトル＆キャッチコピー）
* **英語スクリプト**:
  > "A missed first contact costs a small business its next client — but a solo consultant can't staff a 24/7 front desk. Studio S.O is an avatar that listens, and an autopilot that hands a human admin everything they need to follow up in under a minute."
* **日本語訳**:
  > 「見逃した最初の問い合わせは、中小企業にとって次の顧客を失うことを意味します。しかし個人事業主が24時間受付を置くことはできません。Studio S.Oは、話を聞くアバターであり、人間の管理人が1分以内にフォローできるよう、必要な情報をすべて手渡すオートパイロットです。」

### 2. コア機能のデモ：カリナリーラボを中心に（15秒〜70秒）— Innovation 30%
* **表示画面**: 実際のブラウザ画面（`http://localhost:3001/`）でのチャット対話
* **英語スクリプト**:
  > "Our AI never uses technical jargon — it speaks the language of the person in front of it, translated live through an industry-specific dictionary running underneath. In our Culinary Lab — 'Today's Wonders, a Scientific Approach to Wellness' — it gently asks about the taste you want to recreate, your interest in sous-vide or liquid nitrogen, even food waste. Once Qwen-Max's own confidence score crosses eighty percent, the complete button appears — the system deciding for itself when it has enough, not the customer guessing."
* **日本語訳**:
  > 「私たちのAIは専門用語を一切使わず、目の前の相手の言葉で話します。裏側で動く業界別辞書によってリアルタイムに翻訳されています。カリナリーラボ──『日常のステキ。心身を整える科学的アプローチ』──では、再現したい味や低温調理・液体窒素への関心、フードロス削減への意識までAIが優しく引き出します。Qwen-Max自身の確信度スコアが80%を超えると完了ボタンが出現します──顧客が推測するのではなく、システム自身が『十分な情報が揃った』と判断する仕組みです。」

### 3. 自動配信の瞬間（70秒〜90秒）— Technical Depth 30% ＋ Innovation 30%（動画のクライマックス）
* **表示画面**: 準備シートが生成される瞬間 → （カット）→ 受信箱に実際のメールが届いている画面
* **英語スクリプト**:
  > "The moment the sheet is ready, this Worker — not a no-code automation tool, code we wrote — emails the human admin directly. No dashboard to check, no copy-paste. Trigger, Qwen-Max reasoning, action — fully automated, with the customer's own confirmation as the only human gate before it fires."
* **日本語訳**:
  > 「シートが完成した瞬間、このWorker──ノーコードツールではなく、私たちが書いたコードです──が管理人に直接メールを送ります。ダッシュボードを確認する必要も、コピペする必要もありません。トリガー、Qwen-Maxによる推論、アクション──すべて自動化されており、発火前の唯一の人間によるゲートは顧客自身の確認だけです。」

### 4. アーキテクチャ（90秒〜110秒）— Technical Depth 30%
* **表示画面**: スライド2（システム構成図 `docs/architecture.png`）＋ Alibaba Cloud利用証明（`docs/alibaba_cloud_proof.png`）
* **英語スクリプト**:
  > "Every reasoning step — dialogue, classification, summarization — runs on Alibaba Cloud's Qwen-Max, called through a Cloudflare Worker that also handles the admin hand-off via Resend. Four independently-testable layers: persona, logic, knowledge, and output. If the classification call fails, a local keyword fallback keeps the conversation alive — the agent is disposable, the conversation isn't."
* **日本語訳**:
  > 「対話・分類・要約というすべての推論ステップは、Alibaba CloudのQwen-Maxで動いており、Cloudflare Worker経由で呼び出され、同じWorkerが管理人への配信もResend経由で担っています。人格層・論理層・知識層・出力層という4つの独立してテスト可能な層構造です。分類API呼び出しが失敗しても、ローカルのキーワードフォールバックが対話を止めません──エージェントは壊れても、対話は壊れません。」

### 5. 結び（110秒〜120秒）
* **表示画面**: スライド3（まとめ）
* **英語スクリプト**:
  > "Studio S.O turns a customer's own words into a human admin's next move — automatically, end to end, on Alibaba Cloud's Qwen-Max. Thank you for watching."
* **日本語訳**:
  > 「Studio S.Oは、顧客自身の言葉を、人間の管理人の次の一手へと変換します──自動的に、最初から最後まで、Alibaba CloudのQwen-Maxの上で。ご視聴ありがとうございました。」

---

## 🛠️ スライドの構成イメージ

* **スライド1（表紙）**: タイトル `Studio S.O` ／サブタイトル `An Autopilot Agent for the First Contact` ／トラック明記：`Qwen Cloud Hackathon — Autopilot Agent`
* **スライド2（システム構成）**: `Browser → Qwen-Max (dialogue/classify/summarize) → Cloudflare Worker → Resend → 管理人の受信箱`。4層構造（人格層/論理層/知識層/出力層）も併記。`docs/architecture.png` を使用。
* **スライド3（Alibaba Cloud利用証明）**: `docs/alibaba_cloud_proof.png` ＋ ライブレスポンス例（`cloudflare-worker/README.md` 参照）
* **スライド4（まとめ）**: `Production-Ready & Fully Automated` ／ URL: `studioso-qwen.web.app`

---

## 🎥 画面キャプチャのデモ実演手順

1. **アバター起動 (0s〜15s)**: `index.html`を開き、アバター起動〜挨拶。
2. **カリナリーラボの相談デモ (15s〜55s)**: 再現したい味・低温調理などを自分の言葉で入力。AIの段階的な深掘りを見せる。
3. **確信度到達→準備シート生成 (55s〜70s)**: `confidence >= 0.8`でボタン出現→クリック→シート表示。
4. **【最重要】実際にメールが届く画面 (70s〜90s)**: 別ウィンドウ／別タブで受信箱（`studioso@sutekioojisan-so.com`）を開いておき、シート生成の直後にメールが届く様子を画面に残す。件名「【至急対応】アバターヒアリング完了：カリナリーラボのご相談」を見せる。
5. **アーキテクチャ図の提示 (90s〜110s)**: `docs/architecture.png`とAlibaba Cloud証明画像を表示しながらナレーション。

---

## ✅ 収録前チェックリスト
- [ ] `public/consultation/config.js` に有効なQwen APIキーが設定されているか
- [ ] Cloudflare Worker（`qwen-proxy.studioso.workers.dev`）の`/notify`が正常応答するか（`cloudflare-worker/README.md` のPowerShell例で確認 — 2026-07-09に実際のメール受信まで確認済み）
- [ ] 受信箱（管理人のメール）をすぐ開ける状態にしておく（シーン4で画面に映すため）
- [ ] `docs/architecture.png` / `docs/alibaba_cloud_proof.png` が最新か
- [ ] `firebase deploy` 済みで、提出用サイト (`studioso-qwen.web.app`) にも最新コードが反映されているか（未デプロイなら `firebase login --reauth` → `firebase deploy`）
