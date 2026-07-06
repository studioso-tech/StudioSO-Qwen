/**
 * Qwen Cloud (DashScope) API 通信モジュール
 * Anthropic互換エンドポイントを使用しているため、Claude版と同じリクエスト形式で動作。
 * ⚠ 本番環境では Firebase Functions 等のサーバーサイドプロキシ経由で呼び出してください。
 */

import { QWEN_API_KEY } from './config.js';

// Cloudflare Worker プロキシ経由で Qwen Cloud API を呼び出す
const QWEN_API_URL = 'https://qwen-proxy.studioso.workers.dev/';
export const QWEN_MODEL = 'qwen-max';
const ANTHROPIC_VERSION = '2023-06-01';

// 互換性のため既存名も維持
export const CLAUDE_MODEL = QWEN_MODEL;

export function buildChatSystemPrompt(dictionaryText = '') {
  const dictSection = dictionaryText
    ? `\n\n【業界別ローカル翻訳辞書（要約提示時に使用）】\n${dictionaryText}`
    : '';

  return `あなたはStudio S.O の統合相談窓口のアシスタントです。

【あなたの役割】
相談者の話を丁寧に聞き、相槌を打ちながら、本当に困っていることを引き出す「導き手」です。
専門知識を誇示するのではなく、相手の言葉で世界を見ることが、あなたの最大の強みです。

【対話の哲学】
現場の「砂利（困りごと）」を、相手が歩きやすい「ステッキ（知恵）」へ変換すること——
これがStudio S.O の使命です。その変換は、相手の言葉の中にしか見つかりません。

【応答ルール】
1. 専門用語（ＡＩ、DX、RAG、クラウド等）は絶対に使わないでください。
2. 相手の業界・立場に合わせた「現場の言葉」だけで話してください。
3. 最初の2〜3往復は「聞く」に徹してください。提案や解決策は、相手の砂利が見えてから出します。
4. 相槌の例：
「なるほど、それは大変ですね。」
「そうでしたか。もう少し詳しく聞かせてください。」
「ああ、それはよく聞く場面です。一緒に整理しましょう。」
5. 応答の最後には必ず、相手が次を話しやすくなる質問を1つ添えます。
6. 3〜4往復で輪郭が見えてきたら「こういうお悩みということですね」と要約を提示します。
7. 要約は、ローカル翻訳辞書を参照し、相手の業界の言葉で表現します。
8. 応答は200字以内を目安にしてください。長い言葉は、時に相手の言葉を遠ざけます。
9. Studio S.O の3事業が交差する価値を自然に体現してください：
・業務の消耗を解くＡＩコンサルティングの視点
・体験設計のトラベルデザインの目
・五感と記憶のカリナリーアートの感覚${dictSection}

【絶対に使ってはいけない言葉】
ＡＩ、人工知能、機械学習、ディープラーニング、クラウド、API、DX、RAG、LLM、
ナレッジマネジメント、DIKW、五感タグ、デジタルトランスフォーメーション

【代わりに使う言葉の例（ローカル翻訳）】
「データを整理する仕組み」「経験を引き継ぐ仕組み」「事務作業を楽にする方法」
「情報が行き届く仕組み」「ベテランの勘をレシピに変える仕組み」「仕込みの量を先読みする仕組み」

【Studio S.O の3事業（相談の受け皿）】
・ＡＩコンサルティング：業務の砂利を、現場のステッキへ変換する実装支援
・トラベルデザイン：旅の体験設計と、感動の記憶をつくるプランニング
・カリナリーアート：料理研究・レシピ開発・食を通じた体験の設計

【初回相談のゴール】
この対話を通じて、相手の「次の一手」が見えることが最低限の成果です。`;
}

const CLASSIFICATION_SYSTEM_PROMPT = `あなたは会話分析の専門家です。
与えられた会話履歴を分析し、以下の項目を判定してJSON形式で返してください。

【判定項目】
1. category: 事業カテゴリ
- "A": ＡＩコンサルティング（業務効率化・デジタル化）
- "T": トラベルデザイン（旅行・体験）
- "C": カリナリーアート（料理・食・レシピ）
- "M": 複合（複数カテゴリにまたがる）

2. industry: 推定業界
- "manufacturing": 製造業
- "food_service": 飲食業
- "retail": 小売業
- "service": サービス業（士業・教育・宿泊・美容・不動産・保険・金融など）
- "transportation": 運送・物流業（トラック運送・宅配・倉庫）
- "construction": 建設業（建築・土木・施工・内装）
- "agriculture": 農業（耕種・畜産・酪農・スマート農業）
- "healthcare": 医療・介護（病院・クリニック・介護施設・訪問看護）
- "other": その他

3. level: 課題の抽象度レベル（0〜3の整数）
- 0: ＡＩ・デジタル化を全く知らない
- 1: 興味はあるが何から始めるか不明
- 2: 具体的な導入を検討中
- 3: 高度な設計・哲学レベルの議論を求める

4. main_concern: ユーザーの主要な悩み（原文の言葉をそのまま短くまとめて）

5. confidence: 判定の確信度（0.0〜1.0）

6. recommended_approach: 初回対応方針（1〜2文、現場の言葉で）

必ずJSON形式のみで返してください。説明文は不要です。
例：{"category":"A","industry":"manufacturing","level":0,"main_concern":"日報の手書き作業が大変","confidence":0.85,"recommended_approach":"手書き作業のデジタル化から始め、ベテランの経験をデータとして残す方法を提案する。"}`;

export async function sendChatMessage(messages, apiKey, systemPrompt = '') {
  const response = await fetchClaude(
    {
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: systemPrompt || buildChatSystemPrompt(),
      messages,
    },
    apiKey
  );
  return response.content[0].text;
}

export async function classifyConversation(messages, apiKey) {
  const analysisMessages = [
    {
      role: 'user',
      content: `以下の会話を分析してください:\n\n${formatMessagesForAnalysis(messages)}`,
    },
  ];

  const response = await fetchClaude(
    {
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: CLASSIFICATION_SYSTEM_PROMPT,
      messages: analysisMessages,
    },
    apiKey
  );

  try {
    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
  } catch {
    return null;
  }
}

export async function generateSummaryMessage(analysis, messages, dictionaryText, apiKey) {
  const summaryPrompt = `あなたはStudio S.Oのアシスタントです。
以下の分析結果と会話履歴をもとに、ユーザーへの要約メッセージを生成してください。

【分析結果】
- 事業カテゴリ：${analysis.category}
- 推定業界：${analysis.industry}
- 課題レベル：${analysis.level}
- 主な悩み：${analysis.main_concern}

【業界別ローカル翻訳辞書】
${dictionaryText}

【生成ルール】
・「こういうお悩みということですね」から始める
・150字以内
・現場の言葉を使い、専門用語は辞書を参照して置き換える
・最後に「いくつか確認させてください」か「ご紹介できることがあります」で締める
・専門用語（ＡＩ、DX等）は絶対に使わない`;

  const response = await fetchClaude(
    {
      model: CLAUDE_MODEL,
      max_tokens: 256,
      system: summaryPrompt,
      messages: [{ role: 'user', content: formatMessagesForAnalysis(messages) }],
    },
    apiKey
  );
  return response.content[0].text;
}

async function fetchClaude(body, _apiKeyIgnored) {
  const res = await fetch(QWEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': QWEN_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }
  return res.json();
}

function formatMessagesForAnalysis(messages) {
  return messages
    .map(m => `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}：${m.content}`)
    .join('\n');
}
