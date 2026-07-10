/**
 * 第4層：出力層 — 準備シート生成
 */

import { CATEGORY_LABELS, LEVEL_LABELS } from './logic.js';
import { INDUSTRY_LABELS, getIndustryDictionary } from './dictionary.js';

export function generatePreparationSheet(analysis, messages) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => `<li style="padding:4px 0;border-bottom:1px solid #f0f4f6;">${escapeHtml(m.content)}</li>`)
    .join('');

  const dict = getIndustryDictionary(analysis.industry);
  const dictItems = Object.entries(dict)
    .slice(0, 6)
    .map(([term, local]) =>
      `<tr>
        <td style="padding:4px 8px;color:#6b7280;font-size:12px;">${escapeHtml(term)}</td>
        <td style="padding:4px 8px;color:#2F3E46;font-weight:600;font-size:12px;">→ ${escapeHtml(local)}</td>
      </tr>`
    ).join('');

  const categoryColor = { A:'#1B4965', T:'#2d6a4f', C:'#b5451b', M:'#6b3fa0' }[analysis.category] || '#1B4965';

  const hasPhone = !!analysis.contactPhone;
  const nameParts = [];
  if (analysis.contactName) nameParts.push(analysis.contactName);
  if (analysis.contactPerson) nameParts.push(`ご担当：${analysis.contactPerson}`);
  const nameDisplay = nameParts.length ? nameParts.join('　') : '（お名前・御社名は未取得）';

  return `
<div style="font-family:'Noto Sans JP',sans-serif;border-radius:12px;overflow:hidden;border:1px solid #E0F2F7;background:#fff;">
  <div style="padding:16px 20px;background:${categoryColor};display:flex;justify-content:space-between;align-items:center;">
    <div>
      <p style="color:rgba(255,255,255,0.75);font-size:11px;margin-bottom:4px;">Studio S.O 相談窓口</p>
      <h2 style="color:#fff;font-size:16px;font-weight:700;">ご相談内容のまとめ</h2>
    </div>
    <div style="text-align:right;">
      <p style="color:rgba(255,255,255,0.75);font-size:11px;">${escapeHtml(dateStr)}</p>
      <span style="display:inline-block;margin-top:4px;padding:2px 10px;border-radius:999px;color:#fff;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,0.4);">カテゴリ ${escapeHtml(analysis.category)}</span>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #E0F2F7;background:#F8FBFC;">
    ${sheetCell('事業カテゴリ', analysis.categoryLabel || analysis.category)}
    ${sheetCell('推定業界', analysis.industryLabel || analysis.industry)}
    ${sheetCell('課題レベル', analysis.levelLabel || `レベル${analysis.level}`)}
  </div>
  <div style="padding:14px 20px;border-bottom:1px solid #E0F2F7;background:${hasPhone ? '#f0fdf4' : '#fef2f2'};">
    <p style="font-size:11px;color:#9ca3af;letter-spacing:0.1em;margin-bottom:4px;">ご連絡先</p>
    <p style="color:#2F3E46;font-weight:700;">${escapeHtml(nameDisplay)}</p>
    <p style="color:${hasPhone ? '#166534' : '#b91c1c'};font-weight:700;margin-top:2px;">📞 ${hasPhone ? escapeHtml(analysis.contactPhone) : '⚠️ 未取得（必須）：電話番号を別途ご確認ください'}</p>
    ${analysis.contactEmail ? `<p style="color:#2F3E46;margin-top:2px;">✉️ ${escapeHtml(analysis.contactEmail)}</p>` : ''}
  </div>
  <div style="padding:14px 20px;border-bottom:1px solid #E0F2F7;">
    <p style="font-size:11px;color:#9ca3af;letter-spacing:0.1em;margin-bottom:4px;">顧客のプロファイル（主要な悩み）</p>
    <p style="color:#2F3E46;font-weight:500;">${escapeHtml(analysis.mainConcern || '（分析中）')}</p>
  </div>
  <div style="padding:14px 20px;border-bottom:1px solid #E0F2F7;background:#FDF8F5;">
    <p style="font-size:11px;color:#9ca3af;letter-spacing:0.1em;margin-bottom:4px;">今回のアバターとの会話要約</p>
    <p style="color:#2F3E46;font-weight:500;">${escapeHtml(analysis.summaryMessage || '主要な悩み：' + (analysis.mainConcern || '（分析中）'))}</p>
  </div>
  <div style="padding:14px 20px;border-bottom:1px solid #E0F2F7;background:#f0f9ff;">
    <p style="font-size:11px;color:#9ca3af;letter-spacing:0.1em;margin-bottom:4px;">人間の管理人へのアドバイス（対応のツボ）</p>
    <p style="color:#1B4965;font-weight:600;">${escapeHtml(analysis.recommendedApproach || '（対話を深めて確認してください）')}</p>
  </div>
  <div style="padding:14px 20px;border-bottom:1px solid #E0F2F7;">
    <p style="font-size:11px;color:#9ca3af;letter-spacing:0.1em;margin-bottom:8px;">ユーザー発言（全件）</p>
    <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:#2F3E46;">
      ${userMessages || '<li style="color:#9ca3af">（まだ発言がありません）</li>'}
    </ul>
  </div>
  <div style="padding:14px 20px;border-bottom:1px solid #E0F2F7;">
    <p style="font-size:11px;color:#9ca3af;letter-spacing:0.1em;margin-bottom:8px;">業界別ローカル翻訳辞書（${escapeHtml(analysis.industryLabel || analysis.industry)} 向け抜粋）</p>
    <table style="width:100%;border:1px solid #E0F2F7;border-radius:6px;border-collapse:collapse;overflow:hidden;">
      <thead><tr style="background:#E0F2F7;">
        <th style="padding:4px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:500;">ＩＴ用語</th>
        <th style="padding:4px 8px;text-align:left;font-size:11px;color:#6b7280;font-weight:500;">現場の言葉</th>
      </tr></thead>
      <tbody>${dictItems}</tbody>
    </table>
  </div>
  <div style="padding:14px 20px;">
    <p style="font-size:11px;color:#9ca3af;margin-bottom:4px;">判定確信度</p>
    <div style="height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
      <div style="height:100%;border-radius:999px;width:${Math.round((analysis.confidence || 0.5)*100)}%;background:${categoryColor};transition:width 700ms;"></div>
    </div>
    <p style="font-size:11px;color:#9ca3af;text-align:right;margin-top:2px;">${Math.round((analysis.confidence || 0.5)*100)}%</p>
  </div>
</div>`.trim();
}

export function generatePreparationSheetText(analysis, messages) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  const userMessages = messages.filter(m => m.role === 'user').map((m, i) => ` ${i+1}. ${m.content}`).join('\n');
  const hasPhone = !!analysis.contactPhone;
  const nameParts = [];
  if (analysis.contactName) nameParts.push(analysis.contactName);
  if (analysis.contactPerson) nameParts.push(`ご担当：${analysis.contactPerson}`);
  const nameLine = nameParts.length ? nameParts.join('　') : '（お名前・御社名は未取得）';
  const phoneLine = hasPhone ? analysis.contactPhone : '⚠️ 未取得（必須）：電話番号を別途ご確認ください';
  const emailLine = analysis.contactEmail ? `\nメール　：${analysis.contactEmail}` : '';
  return `ーーー Studio S.O ご相談内容のまとめ ーーー
生成日時：${dateStr}

■ ご連絡先：
${nameLine}
電話　　：${phoneLine}${emailLine}

■ 顧客のプロファイル：
・事業カテゴリ　　　：${analysis.categoryLabel}（${analysis.category}）
・推定業界　　　　　：${analysis.industryLabel}
・ＩＴ習熟レベル　　：${analysis.levelLabel}
・主要な悩み（原文）：${analysis.mainConcern}
・分析判定確信度　　：${Math.round((analysis.confidence || 0.5)*100)}%

■ 今回のアバターとの会話要約：
${analysis.summaryMessage || '主要な悩み：' + (analysis.mainConcern || '（分析中）')}

■ 人間の管理人へのアドバイス（対応のツボ）：
${analysis.recommendedApproach}

■ ユーザー発言（対話ログ）：
${userMessages}
━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function sheetCell(label, value) {
  return `<div style="padding:10px 14px;text-align:center;border-right:1px solid #E0F2F7;">
    <p style="font-size:10px;color:#9ca3af;margin-bottom:2px;">${escapeHtml(label)}</p>
    <p style="color:#2F3E46;font-weight:700;font-size:13px;">${escapeHtml(value)}</p>
  </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
