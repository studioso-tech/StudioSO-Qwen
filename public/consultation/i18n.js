/**
 * サイト全体の言語切替（日本語/English）
 * - 選択状態は localStorage('so_lang') に保存し、全ページで共有する（初期値は日本語）
 * - 静的テキストはHTML側の data-en / data-en-html / data-en-placeholder 属性で英訳を持ち、
 *   ここが一括で差し替える（日本語原文は初回適用時に data-ja* へ退避して往復可能にする）
 * - カンニングシート（準備シート）はEnglish選択時も日本語のまま（仕様）のため、
 *   シート系の要素にはdata-en属性を付けないことで対象外にしている
 */
(function () {
  var KEY = 'so_lang';

  function getLang() {
    try {
      return localStorage.getItem(KEY) === 'en' ? 'en' : 'ja';
    } catch (e) {
      return 'ja';
    }
  }

  function apply(lang) {
    var en = lang === 'en';
    document.documentElement.lang = en ? 'en' : 'ja';

    document.querySelectorAll('[data-en]').forEach(function (el) {
      if (!el.hasAttribute('data-ja')) el.setAttribute('data-ja', el.textContent);
      el.textContent = en ? el.getAttribute('data-en') : el.getAttribute('data-ja');
    });

    document.querySelectorAll('[data-en-html]').forEach(function (el) {
      if (!el.hasAttribute('data-ja-html')) el.setAttribute('data-ja-html', el.innerHTML);
      el.innerHTML = en ? el.getAttribute('data-en-html') : el.getAttribute('data-ja-html');
    });

    document.querySelectorAll('[data-en-placeholder]').forEach(function (el) {
      if (!el.hasAttribute('data-ja-placeholder')) {
        el.setAttribute('data-ja-placeholder', el.getAttribute('placeholder') || '');
      }
      el.setAttribute('placeholder', en
        ? el.getAttribute('data-en-placeholder')
        : el.getAttribute('data-ja-placeholder'));
    });

    document.querySelectorAll('.so-lang-btn').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-lang') === lang);
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
  }

  function setLang(l) {
    l = l === 'en' ? 'en' : 'ja';
    try { localStorage.setItem(KEY, l); } catch (e) {}
    apply(l);
    document.dispatchEvent(new CustomEvent('so-lang-change', { detail: { lang: l } }));
  }

  window.SO_I18N = {
    getLang: getLang,
    setLang: setLang,
    apply: function () { apply(getLang()); },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(getLang()); });
  } else {
    apply(getLang());
  }
})();
