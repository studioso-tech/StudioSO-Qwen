# Studio S.O — Qwen Cloud ハッカソン提出用デモ動画 制作ガイド（StudioSO-Qwen版）v2

このリポジトリ（StudioSO-Qwen）専用のデモ動画プランです。AIエンジンは **Alibaba Cloud DashScope の `qwen3.7-max`（Thinking Mode有効）** のみを使用します。管理人への自動配信も、本番版のGoogle Workspace Studio + Gemini + Gmailではなく、**Cloudflare Worker + Qwen3.7-Max + Resend** で実装済み・動作確認済みです（`POST /notify`）。

**v2の変更点**：前バージョンはカリナリーラボ1業種の深掘りに時間を割いていましたが、今回は「**このAIエージェントはAIコンサルタント専用ではなく、旅行・料理にも同じ仕組みで対応する**」という点を最も強く訴求する構成に変更しました。同じアバター・同じUIが、業種ごとに言葉遣いも掘り下げる観点もまったく変えて対応する様子を、3業種の対話を並べて見せることが今回のシナリオの核です。

---

## 🎯 審査基準とシーンの対応表

| 審査基準 | 配点 | 対応するシーン |
|---|---|---|
| 技術的深さ・エンジニアリング | 30% | シーン4（アーキテクチャ／Thinking Mode）、シーン3（確信度ゲート） |
| イノベーション・AI創造性 | 30% | **シーン2（1エージェント・3業種の切り替え）**、脱・専門用語ローカル辞書 |
| 課題の価値・インパクト | 25% | シーン1（オープニングの課題提起）、シーン3の連絡先先取り |
| プレゼン・ドキュメント | 15% | 全体の構成・字幕・`docs/architecture.png` |

---

## 🎥 動画の基本設計
* **目標時間**: 2分（120秒）
* **デモ実演環境**: ローカルテスト環境 (`http://localhost:3001/`) または提出用サイト (`https://studioso-qwen.web.app/`)
* **クライマックス**: 顧客との対話だけで完結させず、**実際に管理人の受信箱にメールが届く瞬間**を映すこと。ここが「Autopilot Agent（人間監督下の業務自動化）」を体現している証拠。
* **⚠️ 収録上の注意（Thinking Mode）**: `qwen3.7-max`のThinking Modeにより、AIの1返信あたり実際には10〜15秒程度かかります。ライブでその待ち時間をそのまま流すと間延びするため、**各回答の「考えている間」は編集でタイムラプス（早送り）にする**ことを前提に台本を組んでいます。撮影自体はノーカットで長めに回し、編集で詰めてください。

---

## 📄 タイムライン別・ナレーション台本（コピペ用英語スクリプト）

### 1. オープニング／課題提起（0秒〜12秒）— Impact 25%
* **表示画面**: スライド1（タイトル＆キャッチコピー）
* **英語スクリプト**:
  > "A missed first contact costs a small business its next client. But a solo consultant can't staff three different front desks — one for business advice, one for travel, one for food. Studio S.O is one AI agent that does all three."
* **日本語訳**:
  > 「見逃した最初の問い合わせは、中小企業にとって次の顧客を失うことを意味します。しかし個人事業主は、経営相談・旅行相談・料理相談それぞれに窓口を置くことはできません。Studio S.Oは、その3つすべてに対応する、たった1つのAIエージェントです。」

### 2. 【核心】1エージェント・3業種の切り替え（12秒〜70秒）— Innovation 30%
これが今回のシナリオで最も見せたい部分です。**同じアバター・同じチャットUI**のまま、話しかける内容によってAIの言葉遣いと掘り下げる観点がまったく変わることを、3つの短い対話を並べて見せます。編集では3つの対話を素早くカット割りし、ナレーションで繋ぎます。

* **表示画面**: 同一のアバター画面上で、3つの異なる相談を順番に入力していく（それぞれ2〜3往復程度で十分。長い返信は編集でタイムラプス）

* **② -A：AIコンサルティング（12秒〜30秒）**
  * 入力例：「毎日の配送記録を手書きしていて大変です」
  * AIの反応ポイント：専門用語（ＡＩ・DX等）を一切使わず、「事務作業を楽にする方法」のような現場の言葉で受け止める
  * **英語スクリプト**:
    > "Talk business, and it never says 'AI' or 'DX' — it answers in the words of the shop floor."
  * **日本語訳**:
    > 「業務の話をすれば、『ＡＩ』や『ＤＸ』とは言わず、現場の言葉で答えます。」

* **② -B：トラベルデザイン（30秒〜48秒）**
  * 入力例：「妻と京都へ行きたいのですが、何から決めればいいか分かりません」
  * AIの反応ポイント：課題解決調ではなく、「旅の魂」「五感」など、感性・体験を引き出す温かい問いかけに切り替わる
  * **英語スクリプト**:
    > "Talk about a trip, and the same agent stops solving problems — it starts asking what you want to feel."
  * **日本語訳**:
    > 「旅行の話をすれば、同じエージェントが『課題解決』をやめ、『何を感じたいか』を尋ねはじめます。」

* **② -C：カリナリーラボ（48秒〜70秒）**
  * 入力例：「米麹を使った発酵レシピを知りたいです」
  * AIの反応ポイント：科学的アプローチ（低温調理・分子ガストロノミー相当）への関心や、家庭用か業務用かを丁寧に確認
  * **英語スクリプト**:
    > "Talk about food, and it shifts again — probing the science behind the flavor, not just the recipe. Same agent, same underlying Qwen-Max reasoning, three completely different conversations."
  * **日本語訳**:
    > 「料理の話をすれば、また表情を変えます──レシピそのものではなく、味の裏にある科学的な関心を掘り下げます。同じエージェント、同じQwen-Maxの推論エンジンで、まったく異なる3つの対話が生まれます。」

### 3. 連絡先の先取りと相談の終え方（70秒〜85秒）— Impact 25% ＋ Technical Depth 30%
* **表示画面**: ヒヤリング開始直後、AIが連絡先（お電話番号は必須・Eメールは任意）を最初にお伺いする場面 → 確信度が上がり「相談を終える」ボタンが出現 → クリック → 「ご相談内容の確認」画面
* **英語スクリプト**:
  > "Before anything else, the agent asks how to reach you back — phone required, email optional — so even a customer who leaves mid-conversation is never a lost lead. Once Qwen-Max's own confidence score crosses eighty percent, 'End the consultation' appears — the system deciding for itself when it has enough, not the customer guessing."
* **日本語訳**:
  > 「何よりも先に、AIは折り返しの連絡先をお伺いします──お電話番号は必須、Eメールは任意。途中で離脱した顧客でも、機会損失にはなりません。Qwen-Max自身の確信度スコアが80%を超えると『相談を終える』ボタンが出現します──顧客が推測するのではなく、システム自身が『十分な情報が揃った』と判断する仕組みです。」

### 4. 自動配信の瞬間（85秒〜100秒）— Technical Depth 30% ＋ Innovation 30%（動画のクライマックス）
* **表示画面**: 「ご相談内容の確認」が完成する瞬間 → （カット）→ 受信箱に実際のメールが届いている画面
* **英語スクリプト**:
  > "The moment it's ready, this Worker — not a no-code automation tool, code we wrote — emails the human admin directly, with the category, the concern, and the customer's contact details already in place. Trigger, Qwen-Max reasoning, action — fully automated."
* **日本語訳**:
  > 「準備が整った瞬間、このWorker──ノーコードツールではなく、私たちが書いたコードです──が管理人に直接メールを送ります。相談カテゴリ、悩みの内容、顧客の連絡先まで、すべて整った状態で届きます。トリガー、Qwen-Maxによる推論、アクション──すべて自動化されています。」

### 5. アーキテクチャ（100秒〜113秒）— Technical Depth 30%
* **表示画面**: スライド2（システム構成図 `docs/architecture.png`）＋ Alibaba Cloud利用証明（`docs/alibaba_cloud_proof.png`）
* **英語スクリプト**:
  > "Every reasoning step — dialogue, classification, summarization — runs on Alibaba Cloud's Qwen3.7-Max with Thinking Mode, called through a Cloudflare Worker that also handles the admin hand-off via Resend. One persona layer serves all three business lines, switching its local dictionary and tone by category — not three separate bots stitched together."
* **日本語訳**:
  > 「対話・分類・要約というすべての推論ステップは、Thinking Modeを有効にしたAlibaba CloudのQwen3.7-Maxで動いており、Cloudflare Worker経由で呼び出され、同じWorkerが管理人への配信もResend経由で担っています。1つの人格層が3つの事業すべてに対応し、カテゴリごとにローカル辞書とトーンを切り替えます──3つの別々のボットを繋ぎ合わせたものではありません。」

### 6. 結び（113秒〜120秒）
* **表示画面**: スライド3（まとめ）
* **英語スクリプト**:
  > "One agent. Three businesses. Zero missed leads. Studio S.O, built entirely on Alibaba Cloud's Qwen Cloud. Thank you for watching."
* **日本語訳**:
  > 「1つのエージェント。3つの事業。取りこぼしゼロ。Alibaba CloudのQwen Cloudだけで作られた、Studio S.O。ご視聴ありがとうございました。」

---

## 🛠️ スライドの構成イメージ

* **スライド1（表紙）**: タイトル `Studio S.O` ／サブタイトル `One Agent. Three Businesses. — An Autopilot for the First Contact` ／トラック明記：`Qwen Cloud Hackathon — Autopilot Agent`
* **スライド2（システム構成）**: `Browser → Qwen3.7-Max Thinking Mode (dialogue/classify/summarize) → Cloudflare Worker → Resend → 管理人の受信箱`。4層構造（人格層/論理層/知識層/出力層）と「1人格層が3業種を横断」を併記。`docs/architecture.png` を使用。
* **スライド3（Alibaba Cloud利用証明）**: `docs/alibaba_cloud_proof.png` ＋ ライブレスポンス例（`cloudflare-worker/README.md` 参照）
* **スライド4（まとめ）**: `One Agent. Three Businesses. Zero Missed Leads.` ／ URL: `studioso-qwen.web.app`

---

## 🎥 画面キャプチャのデモ実演手順

1. **アバター起動 (0s〜12s)**: `index.html`を開き、アバター起動〜挨拶（ここは通常速度でOK、短いので）。
2. **3業種デモ用の素材撮り (別テイクで3本、それぞれ長めに撮影)**:
   - テイクA：「毎日の配送記録を手書きしていて大変です」→ AI応答1〜2往復
   - テイクB：「妻と京都へ行きたいのですが、何から決めればいいか分かりません」→ AI応答1〜2往復
   - テイクC：「米麹を使った発酵レシピを知りたいです」→ AI応答1〜2往復
   - ※各テイクの「考え中」表示から返信が出るまでの待ち時間（10〜15秒）は、編集でタイムラプスにする前提でそのまま撮影してよい
3. **編集で②A/B/Cを短く繋ぎ、ナレーションを被せる**（各18秒前後）
4. **連絡先確認〜確信度到達→相談を終える (70s〜85s)**: いずれか1テイク（推奨：カリナリーラボ）で、ヒヤリング開始直後の連絡先確認シーンと、`confidence >= 0.8`で「相談を終える」ボタンが出現→クリック→「ご相談内容の確認」表示までを撮影。
5. **【最重要】実際にメールが届く画面 (85s〜100s)**: 別ウィンドウ／別タブで受信箱（`studioso@sutekioojisan-so.com`）を開いておき、シート生成の直後にメールが届く様子を画面に残す。件名に「⚠️電話番号未取得」が付かない（＝連絡先取得済み）ことも見せられると尚良い。
6. **アーキテクチャ図の提示 (100s〜113s)**: `docs/architecture.png`とAlibaba Cloud証明画像を表示しながらナレーション。

---

## ✅ 収録前チェックリスト
- [ ] `public/consultation/config.js` に有効なQwen APIキーが設定されているか
- [ ] Cloudflare Worker（`qwen-proxy.studioso.workers.dev`）が`qwen3.7-max`＋Thinking Mode有効で正常応答するか
- [ ] `/notify`が正常応答するか（`cloudflare-worker/README.md` のPowerShell例で確認）
- [ ] 受信箱（管理人のメール）をすぐ開ける状態にしておく（シーン4で画面に映すため）
- [ ] `docs/architecture.png` / `docs/alibaba_cloud_proof.png` が最新か（1人格層3業種の構図を反映しているか）
- [ ] `firebase deploy` 済みで、提出用サイト (`studioso-qwen.web.app`) にも最新コードが反映されているか（未デプロイなら `firebase login --reauth` → `firebase deploy`）
- [ ] 3業種（AIコンサル／トラベル／カリナリー）それぞれの素材を別テイクで撮り終えているか
- [ ] 各AI応答の「考え中」区間を編集でタイムラプスにする前提で、素材は長めに（カットせず）撮っているか
