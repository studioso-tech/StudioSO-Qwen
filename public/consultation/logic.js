/**
 * 第2層：論理層 — カテゴリ判定・業界推定・レベル判定
 */

import { classifyConversation, generateSummaryMessage } from './api.js';
import { INDUSTRIES, INDUSTRY_LABELS, quickEstimateIndustry, dictionaryToPromptText } from './dictionary.js';

export const CATEGORIES = {
  AI_CONSULTING: 'A',
  TRAVEL:        'T',
  CULINARY:      'C',
  MIXED:         'M',
};

export const CATEGORY_LABELS = {
  [CATEGORIES.AI_CONSULTING]: 'ＡＩコンサルティング',
  [CATEGORIES.TRAVEL]:        'トラベルデザイン',
  [CATEGORIES.CULINARY]:      'カリナリーアート',
  [CATEGORIES.MIXED]:         '複合（複数事業）',
};

export const LEVEL_LABELS = [
  'レベル０：ＡＩを全く知らない',
  'レベル１：興味はあるが何から始めるか不明',
  'レベル２：具体的な導入を検討中',
  'レベル３：高度な設計・哲学レベルの議論',
];

const CATEGORY_KEYWORDS = {
  [CATEGORIES.AI_CONSULTING]: [
    '効率', '自動', 'システム', '日報', '管理', 'データ', '分析', '業務',
    'デジタル', '手書き', '書類', '帳票', '在庫', '発注', '仕入れ', '工程',
    'スタッフ', 'コスト', '残業', '無駄', 'ミス',
  ],
  [CATEGORIES.TRAVEL]: [
    '旅行', '旅', '観光', '京都', '温泉', '海外', '国内', 'ホテル', '宿',
    '航空', 'フライト', 'ツアー', 'プラン', '旅程', '行き先', '名所',
    '妻', '夫', '家族', '友人', '一人旅',
  ],
  [CATEGORIES.CULINARY]: [
    'レシピ', '料理', '食材', 'メニュー', '調理', '食', 'シェフ', '料理研究',
    '食品開発', '味', '栄養', '食文化', 'グルメ', '食卓',
  ],
};

function getConversationText(messages) {
  return messages.map(m => m.content).join(' ');
}

function quickEstimateCategory(text) {
  const scores = {};
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.filter(kw => text.includes(kw)).length;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length < 2) return CATEGORIES.AI_CONSULTING;
  const [first, second] = sorted;
  if (first[1] > 0 && second[1] > 0 && first[1] - second[1] <= 1) return CATEGORIES.MIXED;
  return first[1] > 0 ? first[0] : CATEGORIES.AI_CONSULTING;
}

export async function analyzeConversation(messages, apiKey) {
  const text = getConversationText(messages);
  const quickCategory = quickEstimateCategory(text);
  const quickIndustry = quickEstimateIndustry(text);

  let classification = null;
  try {
    classification = await classifyConversation(messages, apiKey);
  } catch (e) {
    console.warn('分類API呼び出し失敗、キーワード推定値を使用:', e.message);
  }

  const category = classification?.category || quickCategory;
  const industry  = classification?.industry  || quickIndustry;
  const level     = classification?.level ?? 0;
  const dictText  = dictionaryToPromptText(industry);

  let summaryMessage = null;
  if (messages.length >= 6) {
    try {
      summaryMessage = await generateSummaryMessage(
        { category, industry, level, main_concern: classification?.main_concern || '' },
        messages,
        dictText,
        apiKey
      );
    } catch (e) {
      console.warn('要約生成失敗:', e.message);
    }
  }

  return {
    category,
    categoryLabel:      CATEGORY_LABELS[category] || category,
    industry,
    industryLabel:      INDUSTRY_LABELS[industry] || industry,
    level,
    levelLabel:         LEVEL_LABELS[level] || `レベル${level}`,
    mainConcern:        classification?.main_concern || '',
    confidence:         classification?.confidence ?? 0.5,
    recommendedApproach: classification?.recommended_approach || '',
    summaryMessage,
    dictionaryText:     dictText,
  };
}

export function isSummaryTiming(userTurnCount) {
  return userTurnCount >= 2;
}
