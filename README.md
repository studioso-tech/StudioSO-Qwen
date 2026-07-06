# StudioSO-Qwen （Qwenハッカソン応募用）

Studio S.O 本番サイトから派生した、Qwen Cloud API を利用するデモバージョン。

## 差分（本番との違い）

- チャット AI エンジンを Claude API → **Qwen Cloud（Anthropic互換エンドポイント）** に切替
- 使用モデル：`qwen-max`（`consultation/api.js` の `QWEN_MODEL` で変更可）
- ブラウザ側 API キー入力を廃止し、`consultation/config.js` から読み込み
- Firebase プロジェクト紐付けは空（誤って本番へデプロイしないため）

## セットアップ

1. `public/consultation/config.js` を開き、`PASTE_YOUR_QWEN_API_KEY_HERE` を実際の Qwen API キーに置換
2. `firebase use --add` で新しい Firebase プロジェクトを紐付け（推奨）
3. `firebase deploy`

## 注意事項

- `config.js` はブラウザに露出するためキーが公開されます。ハッカソン提出用の暫定運用のみ想定。
- 本格運用時は Firebase Functions / Cloud Run 経由のサーバーサイドプロキシに移行を推奨。
- `.gitignore` により `config.js` は Git 管理外です。

## エンドポイント

- URL: `https://dashscope-intl.aliyuncs.com/api/v2/apps/anthropic/v1/messages`
- ヘッダ：`x-api-key`, `anthropic-version: 2023-06-01`
- リクエスト形式は Anthropic Messages API 準拠
