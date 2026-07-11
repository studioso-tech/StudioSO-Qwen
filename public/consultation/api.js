/**
 * Qwen Cloud (DashScope) API 通信モジュール
 * Anthropic互換エンドポイントを使用しているため、Claude版と同じリクエスト形式で動作。
 * ⚠ 本番環境では Firebase Functions 等のサーバーサイドプロキシ経由で呼び出してください。
 */

import { QWEN_API_KEY, NOTIFY_SECRET } from './config.js';

// Cloudflare Worker プロキシ経由で Qwen Cloud API を呼び出す
const QWEN_API_URL = 'https://qwen-proxy.studioso.workers.dev/';
const NOTIFY_URL = 'https://qwen-proxy.studioso.workers.dev/notify';
export const QWEN_MODEL = 'qwen-max'; // Thinking Mode（qwen3.7-max）は応答が10〜15秒以上かかり体感が悪いため、通常モデルに戻した
const ANTHROPIC_VERSION = '2023-06-01';

// 互換性のため既存名も維持
export const CLAUDE_MODEL = QWEN_MODEL;

export function buildChatSystemPrompt(dictionaryText = '') {
  const dictSection = dictionaryText
    ? `\n\n【業界・カテゴリ別ローカル表現ガイド（要約提示時に使用）】\n${dictionaryText}`
    : '';

  return `あなたはStudio S.O の統合相談窓口のアシスタントです。

【あなたの役割】
相談者の話を丁寧に聞き、相槌を打ちながら、本当に困っていることを引き出す「導き手」です。
専門知識を誇示するのではなく、相手の言葉で世界を見ることが、あなたの最大の強みです。

【対話の哲学】
現場の「砂利（困りごと）」を、相手が歩きやすい「ステッキ（知恵）」へ変換すること——
これがStudio S.O の使命です。その変換は、相手の言葉の中にしか見つかりません。

【応答ルール】
1. 【ご連絡先について（最優先）】画面側の最初のメッセージで、既に「御社名・ご担当者様のお名前（個人のお客様の場合はお名前のみ）」と「お電話番号（必須）」、「Eメール（任意）」をお伺いしています。相手がそれに答えてくれた場合は「ありがとうございます」等で軽く受け止めるだけにし、改めて聞き直さないでください。まだお電話番号の回答がない、または相手が本題から先に話し始めた場合は、要約を提示する少し前のタイミングで一度だけ、「念のため、お電話番号だけお伺いしてもよろしいでしょうか」のように、自然な流れを止めない範囲でもう一度だけ確認してください。Eメールは任意のため、無理に聞き直す必要はありません。それ以上は繰り返し聞かないでください。
2. 専門用語（ＡＩ、DX、RAG、クラウド等）は絶対に使わないでください。
3. 相手の業界・立場に合わせた「現場の言葉」だけで話してください。
4. 【謙遜表現のポジティブな言い換え（重要）】相手が自分や自社について謙遜・卑下する言葉（例：「零細」「しょぼい」「小さい会社なので」「田舎の」等）を使っても、AIはその言葉をそのまま繰り返してはいけません。悩みの内容にはしっかり共感しつつ、相手について言及する際は前向きな言葉に言い換えてください（例：「零細の運送会社」→「少数精鋭の運送会社」「機動力のある運送会社」、「しょぼい」→「これから伸びる」等）。相手の言葉を否定せず受け止めた上で、AI側の言葉遣いだけを配慮するという姿勢です。
5. 最初の2〜3往復は「聞く」に徹してください。提案や解決策は、相手の砂利が見えてから出します。
6. 相槌の例：
「なるほど、それは大変ですね。」
「そうでしたか。もう少し詳しく聞かせてください。」
「ああ、それはよく聞く場面です。一緒に整理しましょう。」
7. 応答の最後には必ず、相手が次を話しやすくなる質問を1つ添えます。
8. 3〜4往復で輪郭が見えてきたら「こういうお悩みということですね」と要約を提示します。
9. 要約は、ローカル翻訳辞書を参照し、相手の業界の言葉で表現します。
10. 応答は200字以内を目安にしてください。長い言葉は、時に相手の言葉を遠ざけます。
11. 【ヒアリングの段階的掘り下げ】相談者が「トラベルデザイン」や「カリナリーラボ」に関する話を始めたら、会話の自然な流れを重視しつつ、下記の対話方針に定められた具体的な問いを、1回につき1〜2個程度、会話のキャッチボールの中で優しく問いかけて段階的に情報を引き出してください。一度にすべての質問を浴びせて相手を疲れさせないように配慮してください。
12. Studio S.O の3事業が交差する価値を自然に体現してください：
・業務の消耗を解くＡＩコンサルティングの視点
・体験設計のトラベルデザインの目
・五感と記憶のカリナリーラボの感覚${dictSection}

【相談カテゴリごとの対話方針】
- ＡＩコンサルティング (A) / 複合 (M): 業務の課題や非効率な点を引き出し、平易な言葉で整理・要約します。
- トラベルデザイン (T): 課題解決を急がず、相談者の感性や理想の旅の過ごし方、好みを引き出す温かい対話を心がけます。「旅とは、どこへ行くかではなく、誰になるかである」という哲学に基づき、以下の4つの観点で「非日常」を設計するためのヒアリングを行います：
  1. 旅の「魂」（コンセプト・感情・旅に名前をつけるなら・日常の何を脱ぎ捨てたいか・人生で最も感動した瞬間）
  2. 「五感」（視覚・聴覚/嗅覚・味覚・触覚のこだわりや理想の情景・質感）
  3. 「非日常の濃度」（時間の流れ方・移動へのこだわり・宿の役割・未知のハプニングの歓迎度）
  4. 「キャンバス」（日程と季節感・同行者・最も投資したい部分の予算配分・絶対に避けたいこと）
  相談者が話しやすい部分から、これらの直感的なイメージや憧れを丁寧に掘り下げて言語化してください。
- カリナリーラボ (C): 単なるメニュー開発の枠を超え、「日常のステキ。心身を整える科学的アプローチ」を掲げ、感性と科学（分子ガストロノミー）を融合した豊かな食体験の設計を行います。対話では以下の観点を丁寧に掘り下げます：
  1. 食へのこだわり・再現したい味・新感覚の食体験への要望
  2. 科学的アプローチ（低温調理、エスプーマ等の泡、液体窒素などの手法）への関心や、DIKWモデル（データをレシピという知恵に変えること）の理解度
  3. フードロス削減や食糧問題対策などの社会的・効率的な関心
  4. 開発したレシピをメニュー提案システム等へデータ転用することによるビジネス自動化・経営改善への展望

【絶対に使ってはいけない言葉】
ＡＩ、人工知能、機械学習、ディープラーニング、クラウド、API、DX、RAG、LLM、
ナレッジマネジメント、DIKW、五感タグ、デジタルトランスフォーメーション、
キュレーション、テーラーメイド、パーソナライズ、分子ガストロノミー、フードプロトタイピング

【代わりに使う言葉の例（ローカル翻訳）】
- ＡＩ/DX関連：「データを整理する仕組み」「経験を引き継ぐ仕組み」「事務作業を楽にする方法」
  「情報が行き届く仕組み」「ベテランの勘をレシピに変える仕組み」「仕込みの量を先読みする仕組み」
- トラベル関連：「おすすめの厳選体験」「あなたのためだけに仕立てたプラン」
- カリナリー関連：「科学を取り入れた調理」「新しい食体験の試作」

【Studio S.O の3事業（相談の受け皿）】
・ＡＩコンサルティング：業務の砂利を、現場のステッキへ変換する実装支援
・トラベルデザイン：旅の体験設計と、感動の記憶をつくるプランニング
・カリナリーラボ：料理研究・レシピ開発・食を通じた体験の設計

【初回相談のゴール】
この対話を通じて、相手の「次の一手」が見えることが最低限の成果です。`;
}

const CLASSIFICATION_SYSTEM_PROMPT = `あなたは会話分析の専門家です。
与えられた会話履歴を分析し、以下の項目を判定してJSON形式で返してください。

【判定項目】
1. category: 事業カテゴリ
- "A": ＡＩコンサルティング（業務効率化・デジタル化）
- "T": トラベルデザイン（旅行・体験）
- "C": カリナリーラボ（料理・食・レシピ）
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
- "travel": トラベルデザイン（旅行・観光・体験の相談）
- "culinary": カリナリーラボ（料理・食・レシピの相談）
- "other": その他

3. level: 課題の抽象度レベル（0〜3の整数）
- 0: ＡＩ・デジタル化を全く知らない
- 1: 興味はあるが何から始めるか不明
- 2: 具体的な導入を検討中
- 3: 高度な設計・哲学レベルの議論を求める

4. customer_profile: 管理人が一目で「どんな人物か」を把握できる一文（15〜30字程度）。役職・立場や、対応上知っておくと良い様子を端的に。
   例：「地方企業の経営者、ITに苦手意識あり。」「京都旅行を計画中の共働き夫婦。」「家庭用の発酵レシピを探している方。」

5. main_concern: ユーザーの主要な悩み（原文の言葉をそのまま短くまとめて）

6. confidence: 判定の確信度（0.0〜1.0）

7. recommended_approach: 管理人が会話ログを読み返さずにそのまま動けるレベルの、具体的な初回対応方針（1〜2文、現場の言葉で）。
   「〇〇を分かりやすく説明する」のような一般論ではなく、「まずは資料Aを送付し、価格帯を先に伝える」のように、次に取るべき行動が分かる書き方にする。

8. contact_name: 会話の中で判明した御社名、または個人のお客様のお名前。判明していなければ空文字列 ""

9. contact_person: 会話の中で判明したご担当者様のお名前（法人の場合のみ。個人のお客様の場合や不明な場合は空文字列 ""）

10. contact_phone: 会話の中で判明した電話番号（原文のまま）。判明していなければ空文字列 ""

11. contact_email: 会話の中で判明したメールアドレス（原文のまま）。判明していなければ空文字列 ""

必ずJSON形式のみで返してください。説明文は不要です。
例：{"category":"A","industry":"manufacturing","level":0,"customer_profile":"地方の運送会社の経営者、ITに苦手意識あり。","main_concern":"日報の手書き作業が大変","confidence":0.85,"recommended_approach":"まずは電話で日報の現物を1枚見せてもらい、手書き項目のうち3つに絞ってデジタル化を提案する。","contact_name":"田中運送","contact_person":"田中様","contact_phone":"090-1234-5678","contact_email":"tanaka@example.com"}`;

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

/**
 * カンニングシートを人間の管理人へ自動配信する（Autopilot Agent のアクション段）。
 * トリガー（confidence >= 0.8 でシート生成）は chat.js 側が担当し、生成が済んだ
 * テキストをここに渡すだけ。実際のメール送信は Cloudflare Worker（/notify）が
 * Resend 経由で行うため、送信先アドレスやAPIキーはブラウザに一切渡らない。
 */
export async function sendCheatSheetNotification(subject, text) {
  const res = await fetch(NOTIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-notify-secret': NOTIFY_SECRET,
    },
    body: JSON.stringify({ subject, text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || `Notify error ${res.status}`);
  }
  return data;
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
