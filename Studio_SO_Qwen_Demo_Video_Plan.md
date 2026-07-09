# Studio S.O — Qwen Cloud ハッカソン提出用デモ動画 制作ガイド（StudioSO-Qwen版）

このリポジトリ（StudioSO-Qwen）専用のデモ動画プランです。本番版（Studio-SO-deploy／ADK2バックエンド）とは異なり、AIエンジンは **Alibaba Cloud DashScope の `qwen-max`** のみを使用します。Google Workspace Studioの3ステップ連携やGmail自動送信は本番限定の機能でありこのリポジトリには実装されていないため、台本からは除外しています（準備シートは「テキストをコピー」ボタンまでが実装範囲）。

---

## 🎥 動画の基本設計
* **目標時間**: 2分（120秒）
* **デモ実演環境**: ローカルテスト環境 (`http://localhost:3001/`) または提出用サイト (`https://studioso-qwen.web.app/`)
* **訴求テーマ**:
  1. 「トラベルデザイン」と「カリナリーラボ」を、人間の感性・五感データを **Qwen-Max** を通じて知恵に昇華させる**「生きた実証実験ラボ（ポートフォリオ）」**として位置づける。
  2. 特にカリナリーラボは、感性と分子ガストロノミー（科学）を融合した**「日常のステキ。心身を整える科学的アプローチ」**を体現する事業として掘り下げる。対話から引き出した五感データをAIが構造化し、「準備シート」として即座に生成、管理人がテキストコピーですぐ使える形にする。
  3. Alibaba Cloud DashScope (`qwen-max`) を Cloudflare Worker 経由で呼び出すアーキテクチャを画面で明示し、ハッカソンの審査基準（Alibaba Cloud利用の証明）を満たす。

---

## 📄 タイムライン別・ナレーション台本（コピペ用英語スクリプト）

### 1. イントロ（0秒〜20秒）
* **表示画面**: スライド1（タイトル＆キャッチコピー）
* **英語スクリプト**:
  > "Welcome to Studio S.O. We leverage Alibaba Cloud's Qwen-Max model to bridge the gap between complex technology and human intuition. Through our travel design and culinary lab projects, we capture human emotions and sensory data, using them as a living portfolio to prove the power of custom AI implementation."
* **日本語訳**:
  > 「Studio S.Oへようこそ。私たちはAlibaba CloudのQwen-Maxモデルを活用し、複雑なテクノロジーと人間の直感のギャップを埋めます。トラベルデザインとカリナリーラボのプロジェクトを通じて、人間の感情や五感のデータを捉え、AIの実力を証明する生きたポートフォリオとして活用しています。」

### 2. コア機能のデモ：カリナリーラボを中心に（20秒〜75秒）
* **表示画面**: 実際のブラウザ画面（`http://localhost:3001/`）でのチャット対話
* **英語スクリプト**:
  > "Our AI never uses technical jargon — it speaks the language of the person in front of it. In our Culinary Lab — 'Today's Wonders, a Scientific Approach to Wellness' — the AI gently asks about the taste you want to recreate, your interest in techniques like sous-vide, espuma foams, or liquid nitrogen, even your concern for reducing food waste. Every answer becomes structured data, the same kind of molecular gastronomy insight that once let us discover that yuzu and a certain mushroom share an aroma compound — turning raw data into a genuinely new recipe. Once our backend, running on Qwen-Max, reaches an eighty-percent confidence threshold, the complete button automatically appears, instantly generating a structured cheat sheet with the customer profile, conversation summary, and next-step advice — ready to copy and act on."
* **日本語訳**:
  > 「私たちのAIは専門用語を一切使わず、目の前の相手の言葉で話します。カリナリーラボ──『日常のステキ。心身を整える科学的アプローチ』──では、再現したい味や、低温調理・エスプーマ・液体窒素といった技法への関心、フードロス削減への意識までAIが優しく引き出します。すべての回答は構造化データとなり、かつて『柚子と特定のキノコが同じ香気成分を共有している』という発見を全く新しいレシピへ変換した、分子ガストロノミーの知見と同じ仕組みで処理されます。Qwen-Maxで動くバックエンドの分析確信度が80%に達すると、完了ボタンが自動的に出現し、顧客プロファイル・会話要約・次の一手のアドバイスが記載された準備シートを即座に生成。そのままコピーして活用できます。」

### 3. 技術スタック（75秒〜105秒）
* **表示画面**: スライド2（システム構成図 `docs/architecture.png`）＋ Alibaba Cloud利用証明（`docs/alibaba_cloud_proof.png`）
* **英語スクリプト**:
  > "Under the hood, every request from the browser is routed through a Cloudflare Worker proxy, which forwards it to Alibaba Cloud DashScope's Qwen-Max model using an Anthropic-compatible interface. This means the entire consultation experience — the empathetic dialogue, the industry-aware translation dictionary, and the confidence-based classification — is powered end-to-end by Alibaba Cloud."
* **日本語訳**:
  > 「裏側では、ブラウザからのすべてのリクエストがCloudflare Workerプロキシを経由し、Anthropic互換インターフェースでAlibaba Cloud DashScopeのQwen-Maxモデルへ転送されます。共感的な対話、業界に応じたローカル翻訳辞書、確信度ベースの分類——相談体験のすべてがAlibaba Cloudによって支えられています。」

### 4. 結び（105秒〜120秒）
* **表示画面**: スライド3（まとめ・今後の展望）
* **英語スクリプト**:
  > "Studio S.O turns raw sensory data — from a dream vacation to a dream recipe — into actionable wisdom, powered end-to-end by Alibaba Cloud's Qwen-Max. Thank you for watching."
* **日本語訳**:
  > 「Studio S.Oは、理想の旅から理想のレシピまで、生の感性データを実用的な知恵へと変換します。そのすべてをAlibaba CloudのQwen-Maxが支えています。ご視聴ありがとうございました。」

---

## 🛠️ スライドの構成イメージ

* **スライド1（表紙）**:
  * タイトル: `Studio S.O`
  * サブタイトル: `Unifying Human Senses and Qwen-Max`
  * コンセプト: 「トラベルデザイン」と「カリナリーラボ」を感性データR&Dエンジンとして紹介。
* **スライド2（システム構成）**:
  * `Browser → Cloudflare Worker (qwen-proxy) → Alibaba Cloud DashScope (qwen-max) → 応答`
  * `docs/architecture.png` を使用
* **スライド3（Alibaba Cloud利用証明）**:
  * `docs/alibaba_cloud_proof.png` ＋ ライブレスポンス例（`cloudflare-worker/README.md` 参照）
* **スライド4（まとめ）**:
  * `Production-Ready Demo`
  * URL: `studioso-qwen.web.app`

---

## 🎥 画面キャプチャのデモ実演手順

1. **アバター起動 (0s〜20s)**:
   `index.html`（総合受付タブ）を開き、アバターを起動させて挨拶シークエンスが流れるところを見せます。
2. **カリナリーラボの相談デモ (20s〜60s)**:
   相談窓口に、再現したい味・低温調理やエスプーマへの関心など、カリナリーラボに関する内容を自分の言葉で入力。AIが専門用語を使わず、「調理科学（分子）」や「食へのこだわり」について優しく段階的に問いかけてくる様子を見せます（カテゴリ判定は自動）。
3. **確信度に応じた準備シート自動生成 (60s〜90s)**:
   対話が進み確信度（`confidence >= 0.8`）に達したタイミングで `✨ これまでの内容で準備シートを作成する` ボタンがふわっと出現。クリックして、完成した準備シート（顧客プロファイル・会話要約・対応のツボ）が表示され、「テキストをコピー」ボタンで管理人がすぐに活用できる流れを見せます。
4. **（余裕があれば）トラベルデザインにも軽く触れる (90s〜105s)**:
   別の相談例として、旅の「魂」や「五感」のこだわりを尋ねる場面を一瞬見せ、2事業に対応できるバランスを示します。

---

## ✅ 収録前チェックリスト
- [ ] `public/consultation/config.js` に有効なQwen APIキーが設定されているか
- [ ] Cloudflare Worker（`qwen-proxy.studioso.workers.dev`）が正常応答するか（`cloudflare-worker/README.md` のcurl例で確認）
- [ ] `docs/architecture.png` / `docs/alibaba_cloud_proof.png` が最新か
- [ ] Google Workspace Studio連携・Gmail自動送信など、本番限定機能に言及していないか
