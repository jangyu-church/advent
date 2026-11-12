/* 주님 오심을 기다리며 · 장유중앙교회 대림절 묵상 — 동작 (글은 cards.js 에 있습니다) */
(function () {
  'use strict';

  var D = window.ADVENT;
  var home = document.getElementById('home');
  var cardEl = document.getElementById('card');
  var backBtn = document.getElementById('backBtn');
  var brand = document.getElementById('brand');

  if (!D || !D.cards || !D.cards.length) {
    home.innerHTML = '<p class="fatal">묵상 글을 불러오지 못했습니다.<br>잠시 뒤 다시 열어 주세요.</p>';
    return;
  }

  var CARDS = D.cards, ACTS = D.acts;
  var START = CARDS[0].date, END = CARDS[CARDS.length - 1].date;
  var WD = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var WD1 = ['주일', '월', '화', '수', '목', '금', '토'];
  var ORD = ['첫째', '둘째', '셋째', '넷째'];

  /* ── 날짜 (한국 시간) · 검수용 미리보기 ?date=2026-12-08 ── */
  var preview = null;
  try {
    var q = new URLSearchParams(location.search).get('date');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q) && !isNaN(Date.parse(q + 'T00:00:00Z'))) preview = q;
  } catch (e) {}

  function today() {
    if (preview) return preview;
    return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  }
  function utc(d) { return Date.parse(d + 'T00:00:00Z'); }
  function daysBetween(a, b) { return Math.round((utc(b) - utc(a)) / 86400000); }
  function wday(d) { return new Date(utc(d)).getUTCDay(); }
  function md(d) { return (+d.slice(5, 7)) + '/' + (+d.slice(8)); }
  function mdLong(d) { return (+d.slice(5, 7)) + '월 ' + (+d.slice(8)) + '일'; }
  function phase(t) { return t < START ? 'before' : t > END ? 'after' : 'during'; }
  function unlocked(d, t) { var p = phase(t); return p === 'after' || (p === 'during' && d <= t); }
  function actOf(d) { for (var i = 0; i < ACTS.length; i++) if (d >= ACTS[i].start && d <= ACTS[i].end) return ACTS[i]; return ACTS[0]; }
  function cardOf(d) { for (var i = 0; i < CARDS.length; i++) if (CARDS[i].date === d) return CARDS[i]; return null; }

  /* ── 기기 안 저장 (실패해도 앱은 계속 돈다 · 미리보기 때는 저장하지 않는다) ── */
  var mem = {};
  var store = {
    get: function (k, def) {
      if (k in mem) return mem[k];
      if (preview && k !== 'font') return def;
      try { var v = localStorage.getItem('advent2026.' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
    },
    set: function (k, v) {
      mem[k] = v;
      if (preview && k !== 'font') return;
      try { localStorage.setItem('advent2026.' + k, JSON.stringify(v)); } catch (e) {}
    }
  };
  function mark(key, date, on) {
    var o = store.get(key, {}) || {};
    if (on === false) delete o[date]; else o[date] = 1;
    store.set(key, o);
  }
  function has(key, date) { var o = store.get(key, {}) || {}; return !!o[date]; }
  function count(key) { return Object.keys(store.get(key, {}) || {}).length; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var toastTimer;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ── 글씨 크기 ── */
  function setFont(f) {
    if (['normal', 'large', 'xlarge'].indexOf(f) < 0) f = 'normal';
    document.documentElement.setAttribute('data-font', f);
    Array.prototype.forEach.call(document.querySelectorAll('.font button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-font') === f ? 'true' : 'false');
    });
    store.set('font', f);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.font button'), function (b) {
    b.addEventListener('click', function () { setFont(b.getAttribute('data-font')); });
  });
  setFont(store.get('font', 'normal'));

  /* ── 홈 화면 설치 안내 ── */
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isKakao = /KAKAOTALK/i.test(ua);
  var inApp = isKakao || /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|BAND\//i.test(ua);
  var standalone = false;
  try { standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; } catch (e) {}
  var deferredPrompt = null, forceInstall = false, androidHelp = false;

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; renderInstall(); });
  window.addEventListener('appinstalled', function () { deferredPrompt = null; store.set('installed', 1); renderInstall(); toast('홈 화면에 설치했습니다'); });

  var PIC = {
    share: '<svg viewBox="0 0 96 64" aria-hidden="true"><rect x="2" y="34" width="92" height="28" rx="8" fill="#eef1f6" stroke="#cfd5e2"/><circle cx="20" cy="48" r="3" fill="#aab2c5"/><circle cx="76" cy="48" r="3" fill="#aab2c5"/><circle cx="48" cy="34" r="21" fill="#fff" stroke="#f0b232" stroke-width="3"/><path d="M48 21v19M41 28l7-7 7 7M38 33v13h20V33" fill="none" stroke="#0a66ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    add: '<svg viewBox="0 0 96 64" aria-hidden="true"><rect x="2" y="14" width="92" height="36" rx="9" fill="#fff" stroke="#f0b232" stroke-width="3"/><text x="8" y="36" font-size="9" font-weight="700" fill="#241b12" font-family="sans-serif">홈 화면에 추가</text><rect x="73" y="23" width="16" height="16" rx="4" fill="none" stroke="#241b12" stroke-width="2"/><path d="M81 27v8M77 31h8" stroke="#241b12" stroke-width="2" stroke-linecap="round"/></svg>',
    ok: '<svg viewBox="0 0 96 64" aria-hidden="true"><rect x="2" y="8" width="92" height="48" rx="9" fill="#eef1f6" stroke="#cfd5e2"/><text x="10" y="27" font-size="10" fill="#8a93a8" font-family="sans-serif">취소</text><rect x="56" y="13" width="34" height="22" rx="8" fill="#fff" stroke="#f0b232" stroke-width="3"/><text x="63" y="28" font-size="11" font-weight="700" fill="#0a66ff" font-family="sans-serif">추가</text><rect x="10" y="40" width="20" height="10" rx="3" fill="#0f1630"/><rect x="34" y="42" width="40" height="6" rx="3" fill="#cfd5e2"/></svg>',
    menu: '<svg viewBox="0 0 96 64" aria-hidden="true"><rect x="2" y="6" width="92" height="24" rx="8" fill="#eef1f6" stroke="#cfd5e2"/><rect x="10" y="13" width="50" height="10" rx="5" fill="#fff"/><circle cx="80" cy="18" r="11" fill="#fff" stroke="#f0b232" stroke-width="3"/><circle cx="80" cy="13" r="1.8" fill="#241b12"/><circle cx="80" cy="18" r="1.8" fill="#241b12"/><circle cx="80" cy="23" r="1.8" fill="#241b12"/><rect x="30" y="36" width="64" height="24" rx="6" fill="#fff" stroke="#f0b232" stroke-width="2"/><text x="36" y="52" font-size="10" font-weight="700" fill="#241b12" font-family="sans-serif">홈 화면에 추가</text></svg>'
  };

  function installHTML() {
    if (standalone) return '';
    if (!forceInstall && (store.get('installDismissed', 0) || store.get('installed', 0))) return '';
    var head = '<button type="button" class="x" data-act="install-close" aria-label="설치 안내 닫기">×</button>';
    var why = phase(today()) === 'before'
      ? '지금 설치해 두시면 11월 29일부터 홈 화면에서 바로 열 수 있습니다.'
      : '홈 화면에 두면 매일 한 번에 열 수 있습니다.';
    var later = '<button type="button" class="later" data-act="install-close">다음에 할게요</button>';

    if (inApp) {
      return '<section class="install" aria-label="설치 안내">' + head +
        '<h2>먼저 인터넷 앱으로 열어 주세요</h2>' +
        '<p>' + (isKakao ? '카카오톡' : '이 앱') + ' 안에서는 홈 화면에 설치할 수 없습니다. ' + (isIOS ? '사파리로' : '크롬으로') + ' 열면 설치할 수 있습니다.</p>' +
        '<button type="button" class="btn gold" data-act="open-external">' + (isIOS ? '사파리로' : '크롬으로') + ' 열기</button>' +
        '<p class="hint">버튼이 안 되면, 화면 ' + (isIOS ? '아래쪽 공유 버튼' : '오른쪽 위 ⋮ 버튼') + '을 누르고 "다른 브라우저로 열기"를 고르세요.</p>' +
        later + '</section>';
    }
    if (isIOS) {
      return '<section class="install" aria-label="설치 안내">' + head +
        '<h2>홈 화면에 대림절 묵상을 놓아 두세요</h2><p>' + why + '</p>' +
        '<ol class="steps">' +
        '<li>' + PIC.share + '<div><b>1. 공유 버튼을 누릅니다</b><small>화면 아래(또는 위)의 네모에 화살표 모양. 안 보이면 ⋯ 를 먼저 누르세요.</small></div></li>' +
        '<li>' + PIC.add + '<div><b>2. "홈 화면에 추가"를 누릅니다</b><small>목록을 아래로 조금 내리면 보입니다.</small></div></li>' +
        '<li>' + PIC.ok + '<div><b>3. 오른쪽 위 "추가"를 누릅니다</b><small>홈 화면에 촛불 그림이 생깁니다.</small></div></li>' +
        '</ol>' + later + '</section>';
    }
    if (isAndroid || deferredPrompt) {
      return '<section class="install" aria-label="설치 안내">' + head +
        '<h2>홈 화면에 대림절 묵상을 놓아 두세요</h2><p>' + why + '</p>' +
        '<button type="button" class="btn gold" data-act="install">홈 화면에 설치하기</button>' +
        (androidHelp ? '<ol class="steps"><li>' + PIC.menu + '<div><b>오른쪽 위 ⋮ 를 누르고<br>"홈 화면에 추가"를 누릅니다</b><small>"앱 설치"라고 나오기도 합니다.</small></div></li></ol>' : '') +
        later + '</section>';
    }
    if (forceInstall) {
      return '<section class="install" aria-label="설치 안내">' + head +
        '<h2>휴대폰에서 열어 주세요</h2><p>휴대폰의 크롬(안드로이드)이나 사파리(아이폰)로 이 주소를 열면 홈 화면에 설치할 수 있습니다.</p></section>';
    }
    return '';
  }
  function renderInstall() {
    var slot = document.getElementById('installSlot');
    if (slot) slot.innerHTML = installHTML();
    var link = document.getElementById('installLink');
    if (link) link.hidden = standalone || !!installHTML();
  }

  /* ── 첫 화면(표지): 촛불과 날짜. 누르면 막으로 들어간다 ── */
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';
  var STAR_SVG = '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5l2.6 7.1 7.4.6-5.7 4.8 1.9 7.3L12 17.2 5.8 21.3l1.9-7.3L2 9.2l7.4-.6z" fill="currentColor"/></svg>';
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function candleFig(n, cls) {
    return '<figure class="arch' + (cls ? ' ' + cls : '') + '"><img src="img/candle-' + n + '.jpg" alt="대림초 ' + n + '개에 불이 켜진 그림" width="520" height="575"></figure>';
  }
  function enterBtn(label) { return '<button type="button" class="enter"><span>' + label + '</span><b aria-hidden="true">→</b></button>'; }

  function renderCover() {
    var t = today(), p = phase(t), h = '';
    h += '<section class="hero cover" data-act="enter">';
    if (p === 'before') {
      var n = daysBetween(t, START);
      h += '<p class="eyebrow">' + esc(D.subtitle || '') + ' · 2026</p>' +
        '<div class="ring"><span>대림절까지</span><strong class="serif">' + n + '</strong><span>일</span></div>' +
        '<h1 class="serif">' + esc(D.title) + '</h1>' +
        '<p class="lead">11월 29일 주일에 첫 칸이 열립니다. 성탄절까지 27일 동안, 매일 성경 속 한 사람을 만납니다.</p>' +
        enterBtn('미리 둘러보기');
    } else if (p === 'during') {
      var a = actOf(t), xmas = t === END, opened = has('opened', t);
      h += candleFig(a.no) +
        '<p class="eyebrow">' + (xmas ? '성탄절' : '대림절 ' + ORD[a.no - 1] + ' 주 · ' + esc(a.candle || '')) + '</p>' +
        '<h1 class="serif">' + mdLong(t) + ' ' + WD[wday(t)] + '</h1>' +
        '<p class="lead">' + (xmas ? '기다리던 주님이 오셨습니다. 네 개의 초가 모두 켜졌습니다.' : esc(a.candleText || '')) + '</p>' +
        enterBtn(opened ? '묵상으로 들어가기' : '오늘의 칸 열기');
      var j = count('joined');
      if (j > 0) h += '<p class="together"><b>' + j + '일째</b> 함께하고 있어요</p>';
    } else {
      h += candleFig(4) + '<p class="eyebrow">' + esc(D.subtitle || '') + ' · 2026</p><h1 class="serif">성탄을 축하합니다</h1>' +
        '<p class="lead">스물일곱 칸을 모두 다시 볼 수 있습니다.</p>' + enterBtn('묵상 다시 보기');
    }
    h += '</section><div id="installSlot"></div>';
    h += '<footer class="foot">' +
      '<button type="button" class="btn line" data-act="share-app">대림절 묵상 앱 알리기</button>' +
      '<button type="button" class="link" id="installLink" data-act="install-show">홈 화면에 설치하는 방법</button>' +
      '<p>' + esc(D.church) + ' · 2026 대림절</p></footer>';
    home.innerHTML = h;
    renderInstall();
  }

  /* ── 막 화면: 한 번에 한 막만 보여 준다 ── */
  function renderAct(n, late) {
    var t = today(), p = phase(t), a = ACTS[n - 1], h = '', i = 0, hasToday = false;
    h += '<section class="stage"><div class="st-head">' + candleFig(n, 'sm') + '<div>' +
      '<p class="st-week">대림절 ' + ORD[n - 1] + ' 주 · ' + md(a.start) + '–' + md(a.end) + '</p>' +
      '<h1 class="st-no serif">' + n + '막</h1><h2 class="st-title serif">' + esc(a.title) + '</h2></div></div>' +
      (a.candle ? '<p class="st-candle"><b>' + esc(a.candle) + '</b>' + esc(a.candleText || '') + '</p>' : '') +
      '<div class="grid">';
    CARDS.forEach(function (c) {
      if (c.date < a.start || c.date > a.end) return;
      var dlabel = md(c.date) + ' ' + WD1[wday(c.date)], delay = ' style="animation-delay:' + ((late ? 950 : 80) + i++ * 70) + 'ms"';
      if (!unlocked(c.date, t)) {
        h += '<button type="button" class="tile locked" data-locked="' + c.date + '"' + delay + ' aria-label="' + mdLong(c.date) + ', 아직 잠겨 있음"><span class="d">' + dlabel + '</span>' + LOCK + '</button>';
      } else {
        var isToday = c.date === t && p === 'during', op = has('opened', c.date);
        if (isToday && !op) hasToday = true;
        h += '<button type="button" class="tile' + (isToday ? ' today' : '') + (op ? ' read' : '') + '" data-open="' + c.date + '"' + delay + '>' +
          '<span class="d">' + dlabel + '</span><span class="n serif">' + (isToday && !op ? '오늘 열기' : esc(c.name)) + '</span>' +
          (has('done', c.date) ? '<span class="ok" aria-label="실천함">✓</span>' : '') + '</button>';
      }
    });
    h += '</div><p class="st-hint">' + (hasToday ? '빛나는 칸을 눌러 여세요' : p === 'before' ? '11월 29일부터 하루에 한 칸씩 열립니다' : p === 'after' ? '보고 싶은 칸을 눌러 보세요' : '지난 칸은 언제든 다시 볼 수 있습니다') + '</p>';
    h += '<nav class="st-nav" aria-label="막 이동">' +
      '<button type="button" class="prev" data-goact="' + (n - 1) + '"' + (n === 1 ? ' disabled' : '') + '>← ' + (n - 1) + '막</button><span class="dots" aria-hidden="true">';
    for (var k = 1; k <= ACTS.length; k++) h += '<i' + (k === n ? ' class="on"' : '') + '></i>';
    h += '</span><button type="button" class="next" data-goact="' + (n + 1) + '"' + (n === ACTS.length ? ' disabled' : '') + '>' + (n + 1) + '막 →</button></nav></section>';
    home.innerHTML = h;
  }

  /* ── 인트로: 책 표지. 누르거나 잠시 기다리면 표지가 넘어간다 ── */
  function intro() {
    var title = String(D.title || ''), cut = title.lastIndexOf(' ');
    var t1 = cut > 0 ? title.slice(0, cut) : title, t2 = cut > 0 ? title.slice(cut + 1) : '';
    var tree = '<svg class="in-tree" viewBox="0 0 200 250" aria-hidden="true">' +
      '<path d="M100 8l5.6 13.2 14.3 1.2-10.9 9.3 3.4 14-12.4-7.5-12.4 7.5 3.4-14-10.9-9.3 14.3-1.2z" fill="#e7c67c"/>';
    var lv = [[66, 16], [98, 31], [130, 46], [162, 61], [194, 76]];
    lv.forEach(function (v, i) {
      var y = v[0], w = v[1], L = 100 - w, R = 100 + w, flip = i % 2;
      var d = flip ? 'M' + R + ' ' + (y - 8) + ' Q100 ' + (y + 20) + ' ' + L + ' ' + (y + 4) : 'M' + L + ' ' + (y - 8) + ' Q100 ' + (y + 20) + ' ' + R + ' ' + (y + 4);
      tree += '<path d="' + d + '" fill="none" stroke="#f5eedd" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#e7c67c" stroke-width="1.2" stroke-linecap="round" transform="translate(0 9)" opacity=".8"/>' +
        '<circle cx="' + (flip ? L : R) + '" cy="' + (y + 4) + '" r="4.5" fill="' + (i % 3 === 1 ? '#c8343a' : '#e7c67c') + '"/>';
    });
    tree += '<path d="M100 214v24" stroke="#e7c67c" stroke-width="4" stroke-linecap="round"/></svg>';
    var el = document.createElement('div');
    el.id = 'intro'; el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', title + ', ' + (D.subtitle || '') + '. 누르면 열립니다');
    el.innerHTML = '<div class="book"><p class="in-top"><i></i>2026 ' + esc(D.church) + '<i></i></p>' +
      '<h1 class="in-title">' + esc(t1) + (t2 ? '<br>' + esc(t2) : '') + '</h1>' +
      '<p class="in-sub">' + esc(D.subtitle || '') + '</p>' + tree +
      '<div class="in-fold" aria-hidden="true"><i></i><i></i></div>' +
      '<p class="in-hint">화면을 누르면 열립니다</p></div>';
    document.body.appendChild(el);
    var gone = false;
    function open() {
      if (gone) return; gone = true;
      el.classList.add('open');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, reduced ? 50 : 1150);
    }
    el.addEventListener('click', open);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') open(); });
    setTimeout(open, 4200);
  }

  /* 막이 바뀔 때: 붉은 막이 닫혔다가 열린다 */
  var busy = false;
  function curtain(n, fn) {
    if (reduced) return fn(false);
    busy = true;
    var el = document.createElement('div');
    el.className = 'curtain'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<i></i><i></i><div class="cur-t"><b class="serif">' + n + '막</b><span>' + esc(ACTS[n - 1].title) + '</span></div>';
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('close'); }, 30);
    setTimeout(function () { fn(true); }, 580);
    setTimeout(function () { el.classList.add('open'); }, 1400);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); busy = false; }, 2250);
  }

  /* 칸이 열릴 때: 문이 열리며 빛과 별이 쏟아진다 */
  function doorsHTML(c, idx) {
    var sp = '';
    for (var i = 0; i < 20; i++) {
      var ang = i / 20 * Math.PI * 2 + (i % 2 ? .2 : 0), dist = 110 + (i % 4) * 55;
      sp += '<u class="k' + (i % 3) + '" style="--x:' + Math.round(Math.cos(ang) * dist) + 'px;--y:' + Math.round(Math.sin(ang) * dist * 1.3) + 'px;animation-delay:' + (800 + (i % 5) * 70) + 'ms">' + (i % 3 === 2 ? '●' : '✦') + '</u>';
    }
    return '<div class="doors" aria-hidden="true"><i class="l"></i><i class="r"></i><b class="burst"></b>' +
      '<em><small>' + (idx + 1) + '번째 칸</small>' + mdLong(c.date) + '</em>' + sp + '</div>';
  }

  /* ── 한 칸(카드) ── */
  function renderCard(c, first) {
    var t = today(), a = actOf(c.date), idx = CARDS.indexOf(c), done = has('done', c.date);
    var prev = CARDS[idx - 1], next = CARDS[idx + 1];
    var h = '<article class="sheet">' +
      '<p class="c-act">' + a.no + '막 · ' + esc(a.title) + '</p>' +
      '<p class="c-date">' + mdLong(c.date) + ' ' + WD[wday(c.date)] + ' · ' + (idx + 1) + '번째 칸</p>' +
      '<div class="c-head"><h1 class="c-name serif">' + esc(c.name) + '</h1><span class="c-ref">' + esc(c.ref) + '</span></div>' +
      '<p class="c-story">' + esc(c.story) + '</p>' +
      '<section class="box practice"><h3>오늘의 작은 실천</h3><p>' + esc(c.practice) + '</p>' +
      '<button type="button" class="done-btn" data-act="done" data-date="' + c.date + '" aria-pressed="' + done + '"><span class="chk">✓</span><span class="lbl">' + (done ? '했어요' : '오늘 했어요') + '</span></button></section>' +
      '<section class="box prayer"><h3>짧은 기도</h3><p class="serif">' + esc(c.prayer) + '</p></section>' +
      '<div class="c-actions">' +
      '<button type="button" class="btn" data-act="share-card" data-date="' + c.date + '">이 칸 보내기 (카카오톡 등)</button>' +
      '<button type="button" class="btn line" data-act="back">묵상 목록으로</button></div>' +
      '<div class="c-nav">' +
      (prev && unlocked(prev.date, t) ? '<button type="button" data-open="' + prev.date + '" data-replace="1">‹ 어제 칸 · ' + esc(prev.name) + '</button>' : '<span></span>') +
      (next && unlocked(next.date, t) ? '<button type="button" data-open="' + next.date + '" data-replace="1">' + esc(next.name) + ' · 다음 칸 ›</button>' : '<span></span>') +
      '</div></article>';
    if (first && !reduced) h += doorsHTML(c, idx);
    cardEl.innerHTML = h;
    if (first && !reduced) {
      cardEl.querySelector('.sheet').classList.add('late');
      setTimeout(function () { var d = cardEl.querySelector('.doors'); if (d && d.parentNode) d.parentNode.removeChild(d); }, 2400);
    }
  }

  /* ── 화면 전환: 표지(#없음) → 막(#act2) → 칸(#2026-12-08) ── */
  var view = null, shownDay = today();

  function parse() {
    var h = location.hash, m;
    if ((m = /^#(\d{4}-\d{2}-\d{2})$/.exec(h))) return { v: 'card', date: m[1] };
    if ((m = /^#act([1-4])$/.exec(h))) return { v: 'act', n: +m[1] };
    return { v: 'cover' };
  }
  function go(hash, push) {
    var url = location.pathname + location.search + (hash ? '#' + hash : '');
    try {
      if (push) history.pushState({ app: 1 }, '', url); else history.replaceState(history.state, '', url);
    } catch (e) { location.hash = hash; return; }
    route();
  }

  function route() {
    var t = today(); shownDay = t;
    var r = parse(), c = r.v === 'card' ? cardOf(r.date) : null;
    if (r.v === 'card' && (!c || !unlocked(c.date, t))) {
      if (c) toast(phase(t) === 'before' ? '11월 29일부터 하루에 한 칸씩 열려요' : mdLong(c.date) + '에 열려요');
      r = c ? { v: 'act', n: actOf(c.date).no } : { v: 'cover' };
      try { history.replaceState(history.state, '', location.pathname + location.search + (r.v === 'act' ? '#act' + r.n : '')); } catch (e) {}
    }
    var prev = view;
    function show(late) {
      if (r.v === 'card') {
        var first = !has('opened', c.date);
        mark('opened', c.date);
        if (c.date === t) mark('joined', t);
        renderCard(c, first);
        home.hidden = true; cardEl.hidden = false;
        document.body.classList.add('reading');
      } else {
        if (r.v === 'act') renderAct(r.n, late); else renderCover();
        cardEl.hidden = true; home.hidden = false; cardEl.innerHTML = '';
        document.body.classList.remove('reading');
      }
      backBtn.hidden = r.v === 'cover'; brand.hidden = r.v !== 'cover';
      backBtn.textContent = r.v === 'card' ? '← 목록' : '← 처음';
      view = r;
      window.scrollTo(0, 0);
    }
    if (r.v === 'act' && prev && (prev.v === 'cover' || (prev.v === 'act' && prev.n !== r.n))) curtain(r.n, show);
    else show(false);
    var chip = document.querySelector('.preview-chip');
    if (preview && !chip) { chip = document.createElement('div'); chip.className = 'preview-chip'; chip.textContent = '미리보기 ' + preview; document.body.appendChild(chip); }
  }

  function enter() { var t = today(); go('act' + (phase(t) === 'during' ? actOf(t).no : 1), true); }
  function goAct(n) { if (n >= 1 && n <= ACTS.length) go('act' + n, false); }
  function openCard(date, replace) { go(date, !replace); }
  function goBack() {
    if (history.state && history.state.app) return history.back();
    if (view && view.v === 'card') go('act' + actOf(view.date).no, false); else go('', false);
  }

  // 막 화면에서 옆으로 밀어 넘기기
  var sx = 0, sy = 0;
  home.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  home.addEventListener('touchend', function (e) {
    if (busy || !view || view.v !== 'act') return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 70 && Math.abs(dy) < 50) goAct(view.n + (dx < 0 ? 1 : -1));
  }, { passive: true });

  function share(title, text, url) {
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + '\n' + url).then(function () { toast('주소를 복사했습니다. 카카오톡에 붙여 넣으세요'); }, function () { toast(url); });
    } else { toast(url); }
  }
  var BASE = location.origin + location.pathname;

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-open],[data-locked],[data-act],[data-goact]') : null;
    if (!el || busy) return;
    if (el.hasAttribute('data-goact')) return goAct(+el.getAttribute('data-goact'));
    if (el.hasAttribute('data-open')) return openCard(el.getAttribute('data-open'), el.hasAttribute('data-replace'));
    if (el.hasAttribute('data-locked')) {
      var d = el.getAttribute('data-locked');
      return toast(mdLong(d) + ' ' + WD[wday(d)] + '에 열려요');
    }
    var act = el.getAttribute('data-act');
    if (act === 'back') return goBack();
    if (act === 'enter') return enter();
    if (act === 'done') {
      var date = el.getAttribute('data-date'), on = el.getAttribute('aria-pressed') !== 'true';
      mark('done', date, on);
      el.setAttribute('aria-pressed', String(on));
      el.querySelector('.lbl').textContent = on ? '했어요' : '오늘 했어요';
      if (on) toast('잘하셨습니다. 표시해 두었어요');
      return;
    }
    if (act === 'share-card') {
      var c = cardOf(el.getAttribute('data-date'));
      return share(D.church + ' ' + D.title, '[' + D.title + '] ' + mdLong(c.date) + ' · ' + c.name + '\n오늘의 칸을 함께 열어요.', BASE + '#' + c.date);
    }
    if (act === 'share-app') return share(D.church + ' ' + D.title, '[' + D.church + ' ' + (D.subtitle || '') + '] ' + D.title + '\n매일 한 칸씩, 성경 속 한 사람을 만나요.', BASE);
    if (act === 'install-close') { forceInstall = false; androidHelp = false; store.set('installDismissed', 1); return renderInstall(); }
    if (act === 'install-show') { forceInstall = true; renderInstall(); var s = document.getElementById('installSlot'); if (s && s.scrollIntoView) s.scrollIntoView({ block: 'center' }); return; }
    if (act === 'install') {
      if (deferredPrompt) {
        var pr = deferredPrompt; deferredPrompt = null;
        try { pr.prompt(); if (pr.userChoice) pr.userChoice.then(function (r) { if (r && r.outcome === 'accepted') store.set('installed', 1); renderInstall(); }, function () {}); } catch (err) { androidHelp = true; renderInstall(); }
      } else { androidHelp = true; renderInstall(); }
      return;
    }
    if (act === 'open-external') {
      var url = BASE + location.search;
      if (isKakao) location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
      else if (isAndroid) location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
      else toast('아래쪽 공유 버튼을 누르고 "Safari로 열기"를 고르세요');
      return;
    }
  });
  backBtn.setAttribute('data-act', 'back');

  window.addEventListener('popstate', function () { if (!busy) route(); else setTimeout(route, 2300); });
  // 자정이 지나면(또는 다음 날 다시 열면) 새 칸이 열리도록 날짜를 다시 확인한다
  function checkDay() { if (today() !== shownDay && cardEl.hidden) route(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkDay(); });
  setInterval(checkDay, 30000);

  if (parse().v === 'cover') intro();
  route();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    // 새 버전이 올라오면 화면을 한 번 자동으로 새로 연다 (처음 설치할 때는 제외)
    var hadSW = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadSW || reloaded) return; reloaded = true; location.reload();
    });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js').then(function (reg) { if (reg && reg.update) reg.update(); }).catch(function () {});
    });
  }
})();
