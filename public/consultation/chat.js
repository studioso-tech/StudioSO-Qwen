/**
 * チャット制御層 — ヒーロー画面 CSS システム対応版
 * .msg / .msg--user / .msg--ai / .msg__av / .msg__tx クラスを使用
 */

import { buildChatSystemPrompt, sendChatMessage } from './api.js';
import { analyzeConversation, isSummaryTiming, isConfidenceSuggestTiming } from './logic.js';
import { generatePreparationSheet, generatePreparationSheetText } from './output.js';

let apiKey = '';
let messages = [];
let userTurnCount = 0;
let analysisResult = null;
let currentSystemPrompt = '';
let hearingComplete = false;

export function initChat(key) {
  apiKey = key;
  currentSystemPrompt = buildChatSystemPrompt();
  bindEvents();
  showWelcome();
}

// ── DOM バインディング ───────────────────────────────────────────────

function bindEvents() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const voiceBtn = document.getElementById('voice-btn');

  if (form) form.addEventListener('submit', e => { e.preventDefault(); handleSend(); });
  if (input) input.addEventListener('keydown', e => {
    // 日本語IME変換中のEnterは送信しない（isComposingとkeyCode 229の両方をチェック）
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      handleSend();
    }
  });
  if (voiceBtn) bindVoice(voiceBtn, input);
}

// ── 送信処理 ─────────────────────────────────────────────────────────

async function handleSend() {
  const input = document.getElementById('chat-input');
  const text = input?.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;

  appendMessage('user', text);
  messages.push({ role: 'user', content: text });
  userTurnCount++;

  // アバター：ユーザー送信直後の視覚フィードバック（受け止め） & Nudgeタイマー解除
  if (typeof window.avatarNod === 'function') window.avatarNod();
  if (typeof window.avatarDisarmNudge === 'function') window.avatarDisarmNudge();

  showTyping(true);

  try {
    const reply = await sendChatMessage(messages, apiKey, currentSystemPrompt);
    messages.push({ role: 'assistant', content: reply });
    // アバター：AI応答テキストを読み上げ＆話す動作（視覚）
    if (typeof window.avatarSpeak === 'function') window.avatarSpeak(reply);
    appendMessage('ai', reply);
    // 応答後、20秒無入力Nudgeを再武装
    if (typeof window.avatarArmNudge === 'function') window.avatarArmNudge();

    /* ハイブリッド完了フロー：
       2往復以降「準備シートを作成する」ボタンを表示（手動トリガー）。
       3往復以降は確信度を監視し、0.8以上ならボタン自体で提案する（自律トリガー）。
       実際の要約生成（summaryMessage）はボタン押下時のみ発火する。 */
    if (isSummaryTiming(userTurnCount) && !hearingComplete) {
      showCreateSheetButton();
      await runAnalysis({ forceSummary: false });
      if (isConfidenceSuggestTiming(userTurnCount) && (analysisResult?.confidence ?? 0) >= 0.8) {
        suggestCreateSheet();
      } else {
        unsuggestCreateSheet();
      }
    }
  } catch (err) {
    appendError(err.message || 'エラーが発生しました。');
  } finally {
    showTyping(false);
    input.disabled = false;
    input.focus();
  }
}

// ── 分析・要約 ────────────────────────────────────────────────────────

async function runAnalysis({ forceSummary = false } = {}) {
  try {
    analysisResult = await analyzeConversation(messages, apiKey, { forceSummary });

    // ローカル翻訳辞書でシステムプロンプト更新
    currentSystemPrompt = buildChatSystemPrompt(analysisResult.dictionaryText);

    if (forceSummary && analysisResult.summaryMessage) {
      appendSummaryBubble(analysisResult);
      markHearingComplete();
    }

    updateAnalysisPanel(analysisResult);
  } catch (e) {
    console.warn('分析失敗:', e.message);
  }
}

// ── 準備シート作成ボタン（ハイブリッド完了フロー） ──────────────────────

function getCreateSheetButtons() {
  return [
    document.getElementById('create-sheet-btn'),
    document.getElementById('m-create-sheet-btn'),
  ].filter(Boolean);
}

function showCreateSheetButton() {
  getCreateSheetButtons().forEach(btn => btn.classList.remove('hidden'));
}

function suggestCreateSheet() {
  getCreateSheetButtons().forEach(btn => {
    btn.classList.add('suggest');
    btn.textContent = '準備シートを作成できます →';
  });
}

function unsuggestCreateSheet() {
  if (hearingComplete) return;
  getCreateSheetButtons().forEach(btn => {
    btn.classList.remove('suggest');
    btn.textContent = '準備シートを作成する';
  });
}

function markHearingComplete() {
  hearingComplete = true;
  getCreateSheetButtons().forEach(btn => btn.classList.add('hidden'));
}

window.onCreateSheetClick = async function () {
  if (hearingComplete) return;
  await runAnalysis({ forceSummary: true });
};

// ── DOM 操作 ─────────────────────────────────────────────────────────

function appendMessage(role, text) {
  const containers = [
    document.getElementById('chat-messages'),
    document.getElementById('m-chat-messages'),
  ].filter(Boolean);
  if (containers.length === 0) return;

  const isUser = role === 'user';
  for (const container of containers) {
    const wrapper = document.createElement('div');
    wrapper.className = `msg ${isUser ? 'msg--user' : 'msg--ai'} animate-fadein`;

    if (!isUser) {
      const av = document.createElement('span');
      av.className = 'msg__av';
      av.textContent = 'S.O';
      wrapper.appendChild(av);
    }

    const bubble = document.createElement('div');
    bubble.className = 'msg__tx';
    bubble.textContent = text;
    wrapper.appendChild(bubble);

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }
}

let summaryBubbleEl = null;

function appendSummaryBubble(analysis) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const bubbleHtml = `
    <div class="summary-header">
      <span class="summary-badge">カテゴリ ${escHtml(analysis.category)}</span>
      <span class="summary-meta">${escHtml(analysis.industryLabel)} / ${escHtml(analysis.levelLabel)}</span>
    </div>
    <p>${escHtml(analysis.summaryMessage)}</p>
    <button class="show-sheet-link" onclick="showPreparationSheet()">準備シートを見る →</button>
  `;

  // 既存の要約バブルがあれば新規追加せず内容だけ更新（会話継続で内容が育つ）
  if (summaryBubbleEl && summaryBubbleEl.isConnected) {
    summaryBubbleEl.innerHTML = bubbleHtml;
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'msg msg--ai animate-fadein';

  const av = document.createElement('span');
  av.className = 'msg__av';
  av.textContent = 'S.O';
  wrapper.appendChild(av);

  const bubble = document.createElement('div');
  bubble.className = 'msg__tx summary-bubble';
  bubble.innerHTML = bubbleHtml;
  wrapper.appendChild(bubble);
  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
  summaryBubbleEl = bubble;
}

function appendError(msg) {
  const containers = [
    document.getElementById('chat-messages'),
    document.getElementById('m-chat-messages'),
  ].filter(Boolean);
  if (containers.length === 0) return;

  for (const container of containers) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg msg--ai animate-fadein';

    const av = document.createElement('span');
    av.className = 'msg__av';
    av.textContent = 'S.O';
    wrapper.appendChild(av);

    const bubble = document.createElement('div');
    bubble.className = 'msg__tx msg__tx--error';
    bubble.textContent = `⚠ ${msg}`;
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }
}

function showTyping(visible) {
  const el = document.getElementById('typing-indicator');
  if (el) el.classList.toggle('hidden', !visible);
}

function showWelcome() {
  const msg = 'こんにちは。Studio S.O の相談窓口です。どのようなことでもお気軽にお話しください。';
  appendMessage('ai', msg);
  /* アバターがあれば挨拶を音声・動作で伝える（初回ロード時のオートプレイポリシー
     によりブラウザ内では即発話できないケースがあるため、ユーザー操作後にも
     再度合図が届くよう avatarNod → avatarSpeak の順で呼び出す） */
  setTimeout(function() {
    try {
      if (typeof window.avatarNod === 'function') window.avatarNod();
      if (typeof window.avatarSpeak === 'function') window.avatarSpeak(msg);
    } catch (e) {}
  }, 200);
}

// ── 分析パネル更新 ────────────────────────────────────────────────────

function updateAnalysisPanel(analysis) {
  const panel = document.getElementById('analysis-panel');
  if (panel) panel.classList.remove('hidden');

  setText('analysis-category', analysis.categoryLabel);
  setText('analysis-industry', analysis.industryLabel);
  setText('analysis-level', analysis.levelLabel);
  setText('analysis-concern', analysis.mainConcern);

  const bar = document.getElementById('confidence-bar');
  if (bar) bar.style.width = `${Math.round((analysis.confidence || 0.5) * 100)}%`;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '—';
}

// ── 準備シートモーダル ────────────────────────────────────────────────

window.showPreparationSheet = function () {
  if (!analysisResult) return;
  const modal = document.getElementById('sheet-modal');
  const content = document.getElementById('sheet-content');
  if (!modal || !content) return;

  content.innerHTML = generatePreparationSheet(analysisResult, messages);
  modal.classList.remove('hidden');
};

window.closeSheetModal = function () {
  const modal = document.getElementById('sheet-modal');
  if (modal) modal.classList.add('hidden');
};

window.copySheetToClipboard = function () {
  if (!analysisResult) return;
  const text = generatePreparationSheetText(analysisResult, messages);
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('sheet-copy-btn');
    if (btn) { btn.textContent = 'コピー完了 ✓'; setTimeout(() => { btn.textContent = 'テキストをコピー'; }, 2000); }
  });
};

// ── 音声入力 ─────────────────────────────────────────────────────────

function bindVoice(btn, input) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.style.display = 'none';
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'ja-JP';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;

  let isRecording = false;
  let finalText = '';
  let baseText = '';

  btn.addEventListener('click', () => {
    if (isRecording) {
      try { rec.stop(); } catch (e) {}
      return;
    }
    baseText = input ? input.value : '';
    finalText = '';
    try {
      rec.start();
    } catch (e) {
      showVoiceToast('音声認識を開始できませんでした：' + (e.message || e.name));
    }
  });

  rec.onstart = () => {
    isRecording = true;
    btn.classList.add('recording');
    showVoiceToast('マイクに向かってお話しください…', 2000, 'info');
  };
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t;
      else interim += t;
    }
    if (input) {
      const glue = baseText && !/[\s、。！？]$/.test(baseText) ? ' ' : '';
      input.value = baseText + glue + finalText + interim;
    }
  };
  rec.onerror = e => {
    isRecording = false;
    btn.classList.remove('recording');
    const msg = voiceErrorMessage(e.error);
    if (msg) showVoiceToast(msg);
  };
  rec.onend = () => {
    isRecording = false;
    btn.classList.remove('recording');
  };
}

function voiceErrorMessage(code) {
  switch (code) {
    case 'no-speech':      return '音声が検出されませんでした。もう一度マイクを押して話しかけてください。';
    case 'audio-capture':  return 'マイクが見つかりません。マイクが接続されているか確認してください。';
    case 'not-allowed':    return 'マイクの使用が許可されていません。ブラウザのマイク許可を有効にしてください。';
    case 'service-not-allowed': return '音声認識サービスが利用できません。';
    case 'network':        return 'ネットワークエラーで音声認識ができませんでした。';
    case 'aborted':        return '';
    default:               return '音声認識エラー：' + code;
  }
}

function showVoiceToast(message, ms, level) {
  const existing = document.getElementById('voice-toast');
  if (existing) existing.remove();
  const t = document.createElement('div');
  t.id = 'voice-toast';
  t.textContent = message;
  const bg = level === 'info' ? 'rgba(27,73,101,0.94)' : 'rgba(183,28,28,0.94)';
  t.style.cssText =
    'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
    'background:' + bg + ';color:#fff;padding:12px 18px;border-radius:10px;' +
    'font-family:"Noto Sans JP",sans-serif;font-size:14px;font-weight:500;' +
    'box-shadow:0 8px 28px rgba(0,0,0,0.28);z-index:99999;max-width:90%;' +
    'text-align:center;letter-spacing:0.02em;';
  document.body.appendChild(t);
  setTimeout(() => { if (t.parentNode) t.remove(); }, ms || 4000);
}

// ── ユーティリティ ────────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
