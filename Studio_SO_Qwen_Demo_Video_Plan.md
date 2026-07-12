# Studio S.O — Qwen Cloud ハッカソン提出用デモ動画 制作ガイド（StudioSO-Qwen版）v3

このリポジトリ（StudioSO-Qwen）専用のデモ動画プランです。AIエンジンは **Alibaba Cloud DashScope の `qwen-max`** のみを使用します。管理人への自動配信も、本番版のGoogle Workspace Studio + Gemini + Gmailではなく、**Cloudflare Worker + Qwen-Max + Resend** で実装済み・動作確認済みです（`POST /notify`）。

**v2の変更点**：前バージョンはカリナリーラボ1業種の深掘りに時間を割いていましたが、v2では「**このAIエージェントはAIコンサルタント専用ではなく、旅行・料理にも同じ仕組みで対応する**」という点を最も強く訴求する構成に変更しました。同じアバター・同じUIが、業種ごとに言葉遣いも掘り下げる観点もまったく変えて対応する様子を、3業種の対話を並べて見せることがシナリオの核です。

**v3の変更点**：v2は「取りこぼしゼロ（機会損失を防ぐ）」という業務効率の軸で締めていましたが、v3ではそれよりも「**まったく異なる異業種であっても、1つのAIエージェントが、数字やスペックに落とし込みにくいこと（悩み・感性・こだわり）にまで踏み込んで答えを出す**」という推論力そのものを訴求軸に据え直しました。業務の悩みは数値化しやすい一方、旅の「魂」や料理への「こだわり」は本質的に数字にならないもの——その両極を同じ推論エンジンが扱える点が、今回最も見せたい技術的・創造的な差別化ポイントです。

**v4の変更点**：Studio S.Oの根底にある「ローカル翻訳戦略」（DIKWモデルのような高度な知性を、現場が腹落ちする比喩へ変換する哲学）を、シーン2の説明に明示的に組み込みました。これは思いつきの機能ではなく、`api.js`の「絶対に使ってはいけない言葉」リスト（ＡＩ、DX、DIKW、五感タグ等）と、それを「事務作業を楽にする方法」「ベテランの勘をレシピに変える仕組み」といった現場の言葉へ変換する仕組みとして、コード上に実装済みの設計思想です。現場の職人の「勘」をデジタルの「レシピ」へ翻訳するプロセスこそが、Studio S.Oの真の介在価値であることを、ナレーションで一言添えます。

---

## 🎯 審査基準とシーンの対応表

| 審査基準 | 配点 | 対応するシーン |
|---|---|---|
| 技術的深さ・エンジニアリング | 30% | シーン4（アーキテクチャ）、シーン3（確信度ゲート） |
| イノベーション・AI創造性 | 30% | **シーン2（数字にならない悩みにも答える、1エージェント・3業種の推論）**、「ローカル翻訳戦略」（DIKW→現場の比喩へ変換する脱・専門用語辞書） |
| 課題の価値・インパクト | 25% | シーン1（オープニングの課題提起）、シーン3の連絡先先取り |
| プレゼン・ドキュメント | 15% | 全体の構成・字幕・`docs/architecture.png` |

---

## 🎥 動画の基本設計
* **目標時間**: 2分（120秒）
* **デモ実演環境**: ローカルテスト環境 (`http://localhost:3001/`) または提出用サイト (`https://studioso-qwen.web.app/`)
* **クライマックス**: 顧客との対話だけで完結させず、**実際に管理人の受信箱にメールが届く瞬間**を映すこと。ここが「Autopilot Agent（人間監督下の業務自動化）」を体現している証拠。

---

## 📄 タイムライン別・ナレーション台本（コピペ用英語スクリプト）

### 1. オープニング／課題提起（0秒〜12秒）— Impact 25%
* **表示画面**: スライド1（タイトル＆キャッチコピー）
* **英語スクリプト**:
  > "A missed first contact costs a small business its next client. But a solo consultant can't staff three different front desks — one for business advice, one for travel, one for food. Studio S.O is one AI agent that does all three."
* **日本語訳**:
  > 「見逃した最初の問い合わせは、中小企業にとって次の顧客を失うことを意味します。しかし個人事業主は、経営相談・旅行相談・料理相談それぞれに窓口を置くことはできません。Studio S.Oは、その3つすべてに対応する、たった1つのAIエージェントです。」

### 2. 【核心】数字にならない悩みにも答える、1エージェント・3業種（12秒〜70秒）— Innovation 30%
これが今回のシナリオで最も見せたい部分です。業務の悩みは時間・コストといった数字に落とし込みやすい一方、旅への憧れや料理へのこだわりは本質的に数値化できません。**同じアバター・同じチャットUI**のまま、この「数字になるもの」と「数字にならないもの」の両方に、AIが表面的な相槌ではなく踏み込んだ答えを出せることを、3つの短い対話を並べて見せます。編集では3つの対話を素早くカット割りし、ナレーションで繋ぎます。

この切り替えは、Studio S.Oが掲げる「ローカル翻訳戦略」の実装そのものです。DIKW（データ・情報・知識・知恵）のような高度な知性を、現場が腹落ちする比喩へ変換する——コードの`api.js`には「ＡＩ」「DX」「DIKW」といった言葉を絶対に使わないルールと、代わりに「事務作業を楽にする方法」「ベテランの勘をレシピに変える仕組み」といった現場の言葉へ翻訳する仕組みが実装されています。現場の職人の「勘」をデジタルの「レシピ」へ翻訳するプロセスこそが、この製品の真の介在価値であることを、シーン冒頭かナレーションのどこかで一言触れてください（例：「哲学を、現場の比喩に変える。」というテロップを一瞬挟むだけでも効果的です）。

* **表示画面**: 同一のアバター画面上で、3つの異なる相談を順番に入力していく（それぞれ2〜3往復程度で十分）

* **② -A：AIコンサルティング（12秒〜30秒）**
  * 入力例：「毎日の配送記録を手書きしていて大変です」
  * AIの反応ポイント：専門用語（ＡＩ・DX等）を一切使わず、「事務作業を楽にする方法」のような現場の言葉で受け止める。時間・人手という数字に落とし込める悩みを、的確に深掘りする
  * **英語スクリプト**:
    > "Talk business, and it never says 'AI' or 'DX' — it drills into hours and headcount, the parts of your problem that do fit a spreadsheet."
  * **日本語訳**:
    > 「業務の話をすれば、『ＡＩ』や『ＤＸ』とは言わず、時間や人手という、数字に落とし込める部分を的確に掘り下げます。」

* **② -B：トラベルデザイン（30秒〜48秒）**
  * 入力例：「妻と京都へ行きたいのですが、何から決めればいいか分かりません」
  * AIの反応ポイント：課題解決調ではなく、「旅の魂」「五感」など、本質的に数字にならない感性・体験を引き出す温かい問いかけに切り替わる
  * **英語スクリプト**:
    > "Talk about a trip, and the same agent stops counting — it starts asking what you want to feel. There's no spreadsheet for that, and it doesn't try to force one."
  * **日本語訳**:
    > 「旅行の話をすれば、同じエージェントが『数える』のをやめ、『何を感じたいか』を尋ねはじめます。それは数字にできないもので、無理に数値化しようともしません。」

* **② -C：カリナリーラボ（48秒〜70秒）**
  * 入力例：「米麹を使った発酵レシピを知りたいです」
  * AIの反応ポイント：科学的アプローチ（低温調理・分子ガストロノミー相当）への関心や、家庭用か業務用かを丁寧に確認しつつ、「再現したい味」という言語化しにくい感覚にも踏み込む
  * **英語スクリプト**:
    > "Talk about food, and it shifts again — chasing a taste that's hard to put into words, not just a recipe. Same agent, same underlying Qwen-Max reasoning, handling the measurable and the immeasurable in the same breath."
  * **日本語訳**:
    > 「料理の話をすれば、また表情を変えます──レシピそのものではなく、言葉にしにくい『再現したい味』を追いかけます。同じエージェント、同じQwen-Maxの推論エンジンが、数字になるものとならないものを、同じように扱います。」

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
  > "Every reasoning step — dialogue, classification, summarization — runs on Alibaba Cloud's Qwen-Max, called through a Cloudflare Worker that also handles the admin hand-off via Resend. One persona layer serves all three business lines, switching its local dictionary and tone by category — not three separate bots stitched together."
* **日本語訳**:
  > 「対話・分類・要約というすべての推論ステップは、Alibaba CloudのQwen-Maxで動いており、Cloudflare Worker経由で呼び出され、同じWorkerが管理人への配信もResend経由で担っています。1つの人格層が3つの事業すべてに対応し、カテゴリごとにローカル辞書とトーンを切り替えます──3つの別々のボットを繋ぎ合わせたものではありません。」

### 6. 結び（113秒〜120秒）
* **表示画面**: スライド3（まとめ）
* **英語スクリプト**:
  > "One agent. Three unrelated industries. Answers for what can't be measured. Studio S.O, built entirely on Alibaba Cloud's Qwen Cloud. Thank you for watching."
* **日本語訳**:
  > 「1つのエージェント。まったく異なる3つの業種。数字にできないことにも、答えを出す。Alibaba CloudのQwen Cloudだけで作られた、Studio S.O。ご視聴ありがとうございました。」

---

## 🛠️ スライドの構成イメージ

* **スライド1（表紙）**: タイトル `Studio S.O` ／サブタイトル `One Agent. Three Unrelated Industries. Answers for What Can't Be Measured.` ／トラック明記：`Qwen Cloud Hackathon — Autopilot Agent`
* **スライド2（システム構成）**: `Browser → Qwen-Max (dialogue/classify/summarize) → Cloudflare Worker → Resend → 管理人の受信箱`。4層構造（人格層/論理層/知識層/出力層）と「1人格層が、数字になる悩みとならない悩みの両方を横断」を併記。`docs/architecture.png` を使用。
* **スライド3（Alibaba Cloud利用証明）**: `docs/alibaba_cloud_proof.png` ＋ ライブレスポンス例（`cloudflare-worker/README.md` 参照）
* **スライド4（まとめ）**: `One Agent. Three Unrelated Industries. Answers for What Can't Be Measured.` ／ URL: `studioso-qwen.web.app`

---

## 🎥 画面キャプチャのデモ実演手順

1. **アバター起動 (0s〜12s)**: `index.html`を開き、アバター起動〜挨拶（ここは通常速度でOK、短いので）。
2. **3業種デモ用の素材撮り (別テイクで3本、それぞれ長めに撮影)**:
   - テイクA：「毎日の配送記録を手書きしていて大変です」→ AI応答1〜2往復
   - テイクB：「妻と京都へ行きたいのですが、何から決めればいいか分かりません」→ AI応答1〜2往復
   - テイクC：「米麹を使った発酵レシピを知りたいです」→ AI応答1〜2往復
3. **編集で②A/B/Cを短く繋ぎ、ナレーションを被せる**（各18秒前後）。②A開始前後に「哲学を、現場の比喩に変える。」のようなテロップを1〜2秒だけ挟み、ローカル翻訳戦略への言及とする。
4. **連絡先確認〜確信度到達→相談を終える (70s〜85s)**: いずれか1テイク（推奨：カリナリーラボ）で、ヒヤリング開始直後の連絡先確認シーンと、`confidence >= 0.8`で「相談を終える」ボタンが出現→クリック→「ご相談内容の確認」表示までを撮影。
5. **【最重要】実際にメールが届く画面 (85s〜100s)**: 別ウィンドウ／別タブで受信箱（`studioso@sutekioojisan-so.com`）を開いておき、シート生成の直後にメールが届く様子を画面に残す。件名に「⚠️電話番号未取得」が付かない（＝連絡先取得済み）ことも見せられると尚良い。
6. **アーキテクチャ図の提示 (100s〜113s)**: `docs/architecture.png`とAlibaba Cloud証明画像を表示しながらナレーション。

---

## ✅ 収録前チェックリスト
- [ ] `public/consultation/config.js` に有効なQwen APIキーが設定されているか
- [ ] Cloudflare Worker（`qwen-proxy.studioso.workers.dev`）が`qwen-max`で正常応答するか
- [ ] `/notify`が正常応答するか（`cloudflare-worker/README.md` のPowerShell例で確認）
- [ ] 受信箱（管理人のメール）をすぐ開ける状態にしておく（シーン4で画面に映すため）
- [ ] `docs/architecture.png` / `docs/alibaba_cloud_proof.png` が最新か（1人格層3業種の構図を反映しているか）
- [ ] `firebase deploy` 済みで、提出用サイト (`studioso-qwen.web.app`) にも最新コードが反映されているか（未デプロイなら `firebase login --reauth` → `firebase deploy`）
- [ ] 3業種（AIコンサル／トラベル／カリナリー）それぞれの素材を別テイクで撮り終えているか
