/**
 * チャット制御層 — ヒーロー画面 CSS システム対応版
 * .msg / .msg--user / .msg--ai / .msg__av / .msg__tx クラスを使用
 */

import { buildChatSystemPrompt, sendChatMessage, sendCheatSheetNotification } from './api.js';
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

let sendInFlight = false;

async function handleSend() {
  if (sendInFlight) return; // 返信待ち中の二重送信（例：モバイル欄からの連続送信）を防ぐ
  const input = document.getElementById('chat-input');
  const text = input?.value.trim();
  if (!text) return;

  sendInFlight = true;
  input.value = '';
  input.disabled = true;
  const mInp = document.getElementById('m-inp');
  if (mInp) mInp.disabled = true;

  // sendInFlight〜disabledの解除は必ずfinallyで行う。この中のどこか
  // （appendMessageやavatarNod等）が予期せず例外を投げても、入力欄が
  // 永久にブロックされたままにならないよう、ガード解除まるごとtry内に置く。
  let reply = null;
  try {
    appendMessage('user', text);
    messages.push({ role: 'user', content: text });
    userTurnCount++;

    // アバター：ユーザー送信直後の視覚フィードバック（受け止め） & Nudgeタイマー解除
    if (typeof window.avatarNod === 'function') window.avatarNod();
    if (typeof window.avatarDisarmNudge === 'function') window.avatarDisarmNudge();
    if (window.avatarAudio) {
      try { window.avatarAudio.pause(); } catch(e) {}
    }

    showTyping(true);

    reply = await sendChatMessage(messages, apiKey, currentSystemPrompt);
    messages.push({ role: 'assistant', content: reply });
    // アバター：AI応答テキストを読み上げ＆話す動作（視覚）
    // Nudgeの再武装は読み上げ完了後（index.html側のavatarSpeakラッパー）に行う。
    // ここで即座に再武装すると、読み上げ中にNudge音声が重なって再生されてしまう。
    if (typeof window.avatarSpeak === 'function') window.avatarSpeak(reply);
    appendMessage('ai', reply);
  } catch (err) {
    appendError(err.message || 'エラーが発生しました。');
  } finally {
    // 入力欄は返信テキストが届いた時点ですぐ再開する。確信度チェック（下記）は
    // Thinking Modeでさらに10秒前後かかるため、それを待たせると入力欄が
    // 無効なままの状態が長引き、その間の操作で画面が乱れる原因になっていた。
    showTyping(false);
    sendInFlight = false;
    input.disabled = false;
    if (mInp) mInp.disabled = false;
    input.focus({ preventScroll: true });
  }

  if (reply === null) return; // 送信自体が失敗した場合は確信度チェックへ進まない

  /* ハイブリッド完了フロー（入力欄をブロックしないバックグラウンド処理）：
     3往復以降「相談を終える」ボタンを表示（手動トリガー）。
     4往復以降はヒアリングの深まり具合（readiness）を監視し、0.8以上ならボタン自体で提案する（自律トリガー）。
     categoryやindustryの分類確信度（confidence）とは別物 —— 話題が早々に特定できても、
     ヒアリングとして浅いままなら提案しない。実際の要約生成（summaryMessage）はボタン押下時のみ発火する。 */
  if (isSummaryTiming(userTurnCount) && !hearingComplete) {
    showCreateSheetButton();
    try {
      await runAnalysis({ forceSummary: false });
      if (isConfidenceSuggestTiming(userTurnCount) && (analysisResult?.readiness ?? 0) >= 0.8) {
        suggestCreateSheet();
      } else {
        unsuggestCreateSheet();
      }
    } catch (e) {
      console.warn('確信度チェック失敗:', e.message);
    }
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
      // 締めの要約もアバターが読み上げる（他のメッセージは全て読み上げるのに
      // ここだけ無音だと一貫性がないため）。markHearingComplete が先に
      // soHearingComplete を立てているので、読み上げ後にNudgeは再武装されない。
      if (typeof window.avatarSpeak === 'function') {
        window.avatarSpeak(analysisResult.summaryMessage);
      }
      notifyAdmin(analysisResult);
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
    btn.textContent = 'そろそろ相談を終えられますか？ →';
  });
}

function unsuggestCreateSheet() {
  if (hearingComplete) return;
  getCreateSheetButtons().forEach(btn => {
    btn.classList.remove('suggest');
    btn.textContent = '相談を終える';
  });
}

function markHearingComplete() {
  hearingComplete = true;
  // 「ご相談は完了です」の後にNudge（15秒無操作の促し文）が出続けると
  // 矛盾するため、index/contact側のタイマーを止め、以後の再武装も禁止する
  window.soHearingComplete = true;
  if (typeof window.avatarDisarmNudge === 'function') window.avatarDisarmNudge();
  getCreateSheetButtons().forEach(btn => btn.classList.add('hidden'));
}

/* Autopilot Agent のアクション段：シート確定と同時に管理人へ自動配信する。
   （Workspace Studio + Gemini + Gmail の代わりに Cloudflare Worker + Qwen が担う） */
async function notifyAdmin(analysis) {
  try {
    const missingContact = !analysis.contactPhone;
    const subject = `【至急対応】${missingContact ? '⚠️電話番号未取得／' : ''}アバターヒアリング完了：${analysis.categoryLabel}のご相談`;
    const text = generatePreparationSheetText(analysis, messages);
    await sendCheatSheetNotification(subject, text);
    showVoiceToast('ご相談内容を担当者へお送りしました ✓', 3500, 'info');
  } catch (e) {
    console.warn('管理人への自動通知に失敗:', e.message);
    showVoiceToast('自動送信に失敗しました。「テキストをコピー」から手動で共有してください。', 4500);
  }
}

window.onCreateSheetClick = async function () {
  if (hearingComplete) return;
  if (typeof window.avatarDisarmNudge === 'function') window.avatarDisarmNudge();
  if (window.avatarAudio) {
    try { window.avatarAudio.pause(); } catch(e) {}
  }
  await runAnalysis({ forceSummary: true });
};

// ── DOM 操作 ─────────────────────────────────────────────────────────

// 会話が長くなると、ユーザーが読み返すために上にスクロールしている最中に
// ナッジ等のバックグラウンド発言が追加され、強制的に一番下へ引き戻されて
// しまうことがあった。既に下端付近にいる場合のみ自動追従する。
function isNearBottom(container, threshold = 80) {
  return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}

function appendMessage(role, text) {
  const containers = [
    document.getElementById('chat-messages'),
    document.getElementById('m-chat-messages'),
  ].filter(Boolean);
  if (containers.length === 0) return;

  const isUser = role === 'user';
  for (const container of containers) {
    const shouldStickToBottom = isUser || isNearBottom(container);

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
    if (shouldStickToBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
window.appendMessage = appendMessage;

let summaryBubbleEls = [];

function appendSummaryBubble(analysis) {
  // デスクトップ(chat-messages)とモバイル(m-chat-messages)の両方に出す。
  // 以前はデスクトップ側のみで、モバイル表示では .p-chat ごと display:none の
  // ため、スマホの顧客には要約も「ご相談内容を確認する」リンクも見えなかった。
  const containers = [
    document.getElementById('chat-messages'),
    document.getElementById('m-chat-messages'),
  ].filter(Boolean);
  if (containers.length === 0) return;

  const bubbleHtml = `
    <div class="summary-header">
      <span class="summary-badge">カテゴリ ${escHtml(analysis.category)}</span>
      <span class="summary-meta">${escHtml(analysis.industryLabel)} / ${escHtml(analysis.levelLabel)}</span>
    </div>
    <p>${escHtml(analysis.summaryMessage)}</p>
    <button class="show-sheet-link" onclick="showPreparationSheet()">ご相談内容を確認する →</button>
  `;

  // 既存の要約バブルがあれば新規追加せず内容だけ更新（会話継続で内容が育つ）
  const connected = summaryBubbleEls.filter(el => el.isConnected);
  if (connected.length) {
    connected.forEach(el => { el.innerHTML = bubbleHtml; });
    return;
  }

  summaryBubbleEls = [];
  for (const container of containers) {
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
    summaryBubbleEls.push(bubble);
  }
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
  // デスクトップ用とモバイル用の両方を切り替える（モバイルにも返信待ちのフィードバックを出す）
  ['typing-indicator', 'm-typing-indicator'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !visible);
  });
}

// 固定ディレイでは、直前のセリフの読み上げが終わる前に次のセリフが
// speechSynthesis.cancel()で割り込み、途中（電話番号の手前など）で
// 発話が切れてしまっていた。文字数から概算した時間だけ空けて繋ぐ。
function estimateSpeechMs(text) {
  return Math.max(1800, text.length * 180);
}

function showWelcome() {
  // 総合受付（index.html）はヒーロー画面のアバターがクリック起動時に
  // startWelcomeGreeting() で6ステップ挨拶を担当するため、ここでは何もしない。
  // 簡易版チャット窓口（contact.html等）だけ、この場で挨拶する。
  const isContactPage = window.location.pathname.includes('contact.html');
  if (isContactPage) {
    const msg = 'こんにちは。Studio S.O の相談窓口です。\nどのようなことでもお気軽にお話しください。';
    appendMessage('ai', msg);
    setTimeout(function() {
      try {
        if (typeof window.avatarNod === 'function') window.avatarNod();
        if (typeof window.avatarSpeak === 'function') window.avatarSpeak(msg);
      } catch (e) {}
    }, 200);
    setTimeout(askForContactInfo, 200 + estimateSpeechMs(msg));
  }
}

/* 管理人が折り返し連絡できるよう、会話の最初に一度だけご連絡先をお伺いする。
   （3〜4往復後の要約直前だと、途中で離脱した顧客の連絡先が一切取れないため） */
function askForContactInfo() {
  const msg = 'まず、担当者からご連絡できるよう、御社名・ご担当者様のお名前（個人のお客様はお名前のみで結構です）と、お電話番号を教えていただけますか。お電話番号は必須でお願いしております。メールアドレスもございましたら、合わせてお願いいたします。';
  appendMessage('ai', msg);
  setTimeout(function() {
    try {
      if (typeof window.avatarNod === 'function') window.avatarNod();
      if (typeof window.avatarSpeak === 'function') window.avatarSpeak(msg);
    } catch (e) {}
  }, 200);
  setTimeout(explainHowToEnd, 200 + estimateSpeechMs(msg));
}

/* ヒヤリングの終わり方も、開始時点であらかじめ案内しておく。
   （終了ボタンの存在に気づかず、話し終えた後も迷わせてしまうのを防ぐため） */
function explainHowToEnd() {
  const msg = 'ご相談内容がひと通り伺えましたら、画面に「相談を終える」ボタンが表示されます。そちらを押していただくと、ここまでの内容を担当の者へお伝えして、ご相談は完了です。';
  appendMessage('ai', msg);
  setTimeout(function() {
    try {
      if (typeof window.avatarNod === 'function') window.avatarNod();
      if (typeof window.avatarSpeak === 'function') window.avatarSpeak(msg);
    } catch (e) {}
  }, 200);
}
window.askForContactInfo = askForContactInfo;

// 独自音声ファイルの再生（アバター動画の動きと連動・自動再生ブロック回避設計）
export function playAvatarAudio(audioUrl, onEnded) {
  const corner = document.getElementById('avatar-corner');
  if (corner) {
    corner.classList.remove('av-listen', 'av-speak', 'av-nudge');
    corner.classList.add('av-speak');
  }

  // ユーザー操作と同期したグローバルAudioオブジェクトの使い回しでアンロック状態を継承
  if (!window.avatarAudio) {
    window.avatarAudio = new Audio();
  }
  const audio = window.avatarAudio;
  audio.src = audioUrl;
  audio.play().catch(function(e) {
    console.error("Audio play failed:", e);
    // 再生エラー時もフォールバックとして次に進めるようにする
    if (onEnded) setTimeout(onEnded, 2000);
  });

  const vid = document.getElementById('avatar-video');
  if (vid) {
    vid.loop = false; // 発話中はループさせず動画自体のタイムラインを再生
    vid.playbackRate = 1.0; // 音声のテンポに合わせて等倍速（1.0）にする
    vid.play().catch(function() {});
  }

  audio.onended = function() {
    if (corner) corner.classList.remove('av-speak');
    if (vid) {
      vid.pause();
      vid.loop = false;
      vid.playbackRate = 1.0;
    }
    if (onEnded) onEnded();
  };
}
window.playAvatarAudio = playAvatarAudio;

// アニメーション付き音声のみ再生（Nudge等用・自動再生ブロック回避設計）
export function playAvatarAudioOnly(audioUrl) {
  const corner = document.getElementById('avatar-corner');
  if (corner) {
    corner.classList.remove('av-listen', 'av-speak', 'av-nudge');
    corner.classList.add('av-speak');
  }

  if (!window.avatarAudio) {
    window.avatarAudio = new Audio();
  }
  const audio = window.avatarAudio;
  audio.src = audioUrl;
  audio.play().catch(function(e) {
    console.error("Nudge audio play failed:", e);
  });

  const vid = document.getElementById('avatar-video');
  if (vid) {
    vid.loop = false;
    vid.playbackRate = 1.0;
    vid.play().catch(function() {});
  }

  audio.onended = function() {
    if (corner) corner.classList.remove('av-speak');
    if (vid) {
      vid.pause();
      vid.loop = false;
      vid.playbackRate = 1.0;
    }
  };
}
window.playAvatarAudioOnly = playAvatarAudioOnly;

let welcomeGreetingCanceled = false;

// 挨拶の音声に合わせて画面下部に字幕を表示する。
// （音を出せない環境や聴覚に不安のある方には、挨拶の約60秒が無音の
//   静止画面に見えてしまうため。チャット欄はまだ「稼働前」という演出を
//   保つため、チャットバブルではなく独立した字幕オーバーレイにする）
function showGreetingSubtitle(text) {
  let el = document.getElementById('greeting-subtitle');
  if (!text) {
    if (el) el.style.display = 'none';
    return;
  }
  if (!el) {
    el = document.createElement('div');
    el.id = 'greeting-subtitle';
    el.style.cssText =
      'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);' +
      'max-width:min(640px,88vw);background:rgba(255,255,255,0.94);color:#2F3E46;' +
      'padding:12px 20px;border-radius:12px;font-family:"Noto Sans JP",sans-serif;' +
      'font-size:14px;line-height:1.8;box-shadow:0 8px 28px rgba(27,73,101,0.18);' +
      'z-index:8500;text-align:center;letter-spacing:0.02em;white-space:pre-wrap;';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
}

function hideGreetingSubtitle() {
  const el = document.getElementById('greeting-subtitle');
  if (el) el.remove();
}

// 総合受付（トップページ）用の6ステップ挨拶シークエンス（ローカル音声ファイル連動）
export function startWelcomeGreeting() {
  welcomeGreetingCanceled = false;
  // チャットログをリセットして初期クリーンな状態から開始
  const containers = [
    document.getElementById('chat-messages'),
    document.getElementById('m-chat-messages'),
  ].filter(Boolean);
  containers.forEach(c => c.innerHTML = '');

  const GREETING_STEPS = [
    {
      text: "こんにちは！毎日のお仕事お疲れ様です。スタジオ エスオーでの業務の改善や旅行・料理の相談をお伺いするコンサルタントです。",
      audio: "avatar/Cut_1_voice.wav"
    },
    {
      text: "これまでに多くの業務の相談や旅行・料理相談をお受けして来た経験を活かして、あなたの業務や楽しい旅行・料理をお手伝いを全力でさせていただきます。",
      audio: "avatar/Cut_2_voice.wav"
    },
    {
      text: "", // 2秒の完全な沈黙（タメ）および頷き
      audio: "avatar/Cut_3_voice.wav"
    },
    {
      text: "具体的なご相談の内容をお聞きします。まずは、ご希望をお聞かせください。その後に、ついていくつか質問させてください。",
      audio: "avatar/Cut_4_voice.wav"
    },
    {
      text: "皆様が普段使われている言葉でやりたいことを『いつもの言葉』でお話下さい。どうぞお気軽に、今困っていることや、旅行や料理の相談について、やりたいことをそのまま私に教えてくださいね。",
      audio: "avatar/Cut_5_voice.wav"
    },
    {
      text: "チャット形式の入力エリアが稼働いたします。キーボードでの入力はもちろん、音声ボタンを使って声でお話しい頂き、入力頂くことも出来ます。\nそれでは、ヒアリングに移行いたします。入力どうぞ。順番にお伺いしますね。",
      audio: "avatar/Cut_6_voice.wav"
    }
  ];

  let currentStep = 0;
  function playNextStep() {
    if (welcomeGreetingCanceled) return;
    if (currentStep >= GREETING_STEPS.length) {
      hideGreetingSubtitle();
      // 挨拶終了後にヒヤリング入力を促す状態にする
      if (typeof window.skipAvatar === 'function') {
        window.skipAvatar();
      }
      return;
    }
    const step = GREETING_STEPS[currentStep];
    showGreetingSubtitle(step.text); // 音声と同時に字幕を表示（無音のタメでは非表示）
    playAvatarAudio(step.audio, function() {
      if (welcomeGreetingCanceled) return;
      currentStep++;
      playNextStep();
    });
  }
  playNextStep();
}
window.startWelcomeGreeting = startWelcomeGreeting;
window.cancelWelcomeGreeting = function() {
  welcomeGreetingCanceled = true;
  hideGreetingSubtitle();
  if (window.avatarAudio) {
    try { window.avatarAudio.pause(); } catch(e) {}
  }
};

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
  // 相談完了後にシートを閉じたら、次の顧客のためにヒーロー画面へ戻す
  if (hearingComplete) {
    setTimeout(function () {
      window.location.href = window.location.pathname;
    }, 200);
  }
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
  rec.continuous = true;
  rec.maxAlternatives = 1;

  let isRecording = false;
  let baseText = '';

  // continuousモードは自分では終了しないため、無音が5秒続いたら自動で
  // 認識を終了し、そのまま送信する。新しい結果が来るたびに延長する。
  let silenceTimer = null;
  function armSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      try { rec.stop(); } catch (e) {}
      handleSend();
    }, 5000);
  }
  function disarmSilenceTimer() {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
  }

  btn.addEventListener('click', () => {
    if (isRecording) {
      try { rec.stop(); } catch (e) {}
      return;
    }
    baseText = input ? input.value : '';
    try {
      rec.start();
    } catch (e) {
      showVoiceToast('音声認識を開始できませんでした：' + (e.message || e.name));
    }
  });

  rec.onstart = () => {
    isRecording = true;
    btn.classList.add('recording');
    showVoiceToast('マイクに向かって、ゆっくりはっきりお話しください。話し終えたら送信ボタンを押すか、そのままお待ちください。', 3800, 'info');
    if (typeof window.avatarDisarmNudge === 'function') window.avatarDisarmNudge();
    armSilenceTimer();
  };
  rec.onresult = e => {
    if (typeof window.avatarDisarmNudge === 'function') window.avatarDisarmNudge();
    armSilenceTimer();
    let final = '';
    let interim = '';
    for (let i = 0; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    if (input) {
      const glue = baseText && !/[\s、。！？]$/.test(baseText) ? ' ' : '';
      input.value = baseText + glue + final + interim;
    }
  };
  rec.onerror = e => {
    isRecording = false;
    btn.classList.remove('recording');
    disarmSilenceTimer();
    const msg = voiceErrorMessage(e.error);
    if (msg) showVoiceToast(msg);
  };
  rec.onend = () => {
    isRecording = false;
    btn.classList.remove('recording');
    disarmSilenceTimer();
    if (typeof window.avatarArmNudge === 'function') window.avatarArmNudge();
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
