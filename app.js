/* 장유중앙교회 대림절 달력 — 동작 (글은 cards.js 에 있습니다) */
(function () {
  'use strict';

  var D = window.ADVENT;
  var home = document.getElementById('home');
  var cardEl = document.getElementById('card');
  var backBtn = document.getElementById('backBtn');
  var brand = document.getElementById('brand');

  if (!D || !D.cards || !D.cards.length) {
    home.innerHTML = '<p class="fatal">달력 글을 불러오지 못했습니다.<br>잠시 뒤 다시 열어 주세요.</p>';
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

  /* ── 촛불 그림 ── */
  function wreath(lit) {
    // 켜지는 순서: 첫째·둘째(보라), 셋째(분홍), 넷째(보라), 성탄(가운데 흰 초)
    var c = [
      { x: 52, h: 58, col: '#7b56b3' }, { x: 106, h: 70, col: '#7b56b3' },
      { x: 214, h: 82, col: '#e59ab4' }, { x: 268, h: 94, col: '#7b56b3' },
      { x: 160, h: 118, col: '#fdf6e3' }
    ];
    var base = 168, s = '';
    s += '<defs><radialGradient id="gl"><stop offset="0" stop-color="#ffd978" stop-opacity=".7"/><stop offset="1" stop-color="#ffd978" stop-opacity="0"/></radialGradient></defs>';
    c.forEach(function (k, i) {
      var top = base - k.h, on = i < lit, w = i === 4 ? 34 : 28;
      if (on) s += '<circle class="glow" cx="' + k.x + '" cy="' + (top - 20) + '" r="46" fill="url(#gl)"/>';
      s += '<rect x="' + (k.x - w / 2) + '" y="' + top + '" width="' + w + '" height="' + k.h + '" rx="5" fill="' + k.col + '" opacity="' + (on ? 1 : .55) + '"/>';
      s += '<rect x="' + (k.x - 1.5) + '" y="' + (top - 8) + '" width="3" height="9" rx="1.5" fill="#2a1c12"/>';
      if (on) {
        s += '<g class="flame f' + (i % 3 + 1) + '"><path d="M' + k.x + ' ' + (top - 38) + ' C' + (k.x + 11) + ' ' + (top - 24) + ' ' + (k.x + 9) + ' ' + (top - 7) + ' ' + k.x + ' ' + (top - 5) + ' C' + (k.x - 9) + ' ' + (top - 7) + ' ' + (k.x - 11) + ' ' + (top - 24) + ' ' + k.x + ' ' + (top - 38) + ' Z" fill="#ffc94a"/>' +
          '<path d="M' + k.x + ' ' + (top - 24) + ' C' + (k.x + 5) + ' ' + (top - 16) + ' ' + (k.x + 4) + ' ' + (top - 8) + ' ' + k.x + ' ' + (top - 7) + ' C' + (k.x - 4) + ' ' + (top - 8) + ' ' + (k.x - 5) + ' ' + (top - 16) + ' ' + k.x + ' ' + (top - 24) + ' Z" fill="#fff6d6"/></g>';
      }
    });
    for (var x = 14; x <= 306; x += 15) {
      s += '<ellipse cx="' + x + '" cy="' + (base + (x % 2 ? 2 : -2)) + '" rx="15" ry="8" fill="' + (x % 2 ? '#2f6b4f' : '#3d8562') + '" transform="rotate(' + (x % 2 ? -18 : 18) + ' ' + x + ' ' + base + ')"/>';
    }
    [34, 132, 188, 290].forEach(function (x) { s += '<circle cx="' + x + '" cy="' + (base - 2) + '" r="4.5" fill="#c0392b"/>'; });
    var label = lit === 0 ? '아직 켜지지 않은 대림절 초 다섯 개' : '대림절 초 다섯 개 가운데 ' + lit + '개가 켜져 있습니다';
    return '<svg class="wreath" viewBox="0 0 320 184" role="img" aria-label="' + label + '">' + s + '</svg>';
  }

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
        '<p>' + (isKakao ? '카카오톡' : '이 앱') + ' 안에서는 홈 화면에 설치할 수 없습니다. ' + (isIOS ? '사파리' : '크롬') + '로 열면 설치할 수 있습니다.</p>' +
        '<button type="button" class="btn gold" data-act="open-external">' + (isIOS ? '사파리' : '크롬') + '로 열기</button>' +
        '<p class="hint">버튼이 안 되면, 화면 ' + (isIOS ? '아래쪽 공유 버튼' : '오른쪽 위 ⋮ 버튼') + '을 누르고 "다른 브라우저로 열기"를 고르세요.</p>' +
        later + '</section>';
    }
    if (isIOS) {
      return '<section class="install" aria-label="설치 안내">' + head +
        '<h2>홈 화면에 달력을 놓아 두세요</h2><p>' + why + '</p>' +
        '<ol class="steps">' +
        '<li>' + PIC.share + '<div><b>1. 공유 버튼을 누릅니다</b><small>화면 아래(또는 위)의 네모에 화살표 모양. 안 보이면 ⋯ 를 먼저 누르세요.</small></div></li>' +
        '<li>' + PIC.add + '<div><b>2. "홈 화면에 추가"를 누릅니다</b><small>목록을 아래로 조금 내리면 보입니다.</small></div></li>' +
        '<li>' + PIC.ok + '<div><b>3. 오른쪽 위 "추가"를 누릅니다</b><small>홈 화면에 촛불 그림이 생깁니다.</small></div></li>' +
        '</ol>' + later + '</section>';
    }
    if (isAndroid || deferredPrompt) {
      return '<section class="install" aria-label="설치 안내">' + head +
        '<h2>홈 화면에 달력을 놓아 두세요</h2><p>' + why + '</p>' +
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

  /* ── 첫 화면 ── */
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>';

  function renderHome() {
    var t = today(), p = phase(t), h = '';
    var act = p === 'during' ? actOf(t) : null;
    var lit = p === 'before' ? 0 : p === 'after' ? 5 : act.no + (t === END ? 1 : 0);

    h += '<section class="hero">' + wreath(lit);
    if (p === 'before') {
      var n = daysBetween(t, START);
      h += '<p class="eyebrow">2026 ' + esc(D.title) + '</p>' +
        '<h1>대림절까지 <strong>' + n + '</strong>일</h1>' +
        '<p class="lead">11월 29일 주일에 첫 칸이 열립니다. 성탄절까지 27일 동안, 매일 성경 속 한 사람을 만납니다.</p>';
    } else if (p === 'during') {
      var c = cardOf(t), opened = has('opened', t), done = has('done', t);
      h += '<p class="eyebrow">' + (t === END ? '성탄절' : '대림절 ' + ORD[act.no - 1] + ' 주') + ' · ' + act.no + '막</p>' +
        '<h1>' + mdLong(t) + ' ' + WD[wday(t)] + '</h1>' +
        '<p class="candle-note">' + (t === END ? '오늘, 가운데 흰 초가 켜졌습니다' : wday(t) === 0 ? '오늘, ' + ORD[act.no - 1] + ' 초가 켜졌습니다' : '주일마다 초가 하나씩 켜집니다') + '</p>';
      h += opened
        ? '<button type="button" class="today-btn opened" data-open="' + t + '"><b>오늘의 사람 · ' + esc(c.name) + '</b><span>' + (done ? '✓ 오늘 실천했어요 · 다시 읽기' : '다시 읽기') + '</span></button>'
        : '<button type="button" class="today-btn" data-open="' + t + '"><b>오늘의 칸 열기</b><span>오늘은 누구를 만날까요?</span></button>';
      var j = count('joined');
      if (j > 0) h += '<p class="together"><b>' + j + '일째</b> 함께하고 있어요</p>';
    } else {
      h += '<p class="eyebrow">2026 ' + esc(D.title) + '</p><h1>성탄을 축하합니다</h1>' +
        '<p class="lead">스물일곱 칸을 모두 다시 볼 수 있습니다. 보고 싶은 칸을 눌러 보세요.</p>';
    }
    h += '</section><div id="installSlot"></div>';

    ACTS.forEach(function (a) {
      h += '<section class="act"><div class="act-head"><span class="act-no">' + a.no + '막</span><h2 class="act-title">' + esc(a.title) + '</h2></div>' +
        '<p class="act-range">' + ORD[a.no - 1] + ' 주 · ' + md(a.start) + ' ~ ' + md(a.end) + '</p><div class="grid">';
      CARDS.forEach(function (c) {
        if (c.date < a.start || c.date > a.end) return;
        var dlabel = md(c.date) + ' ' + WD1[wday(c.date)];
        if (!unlocked(c.date, t)) {
          h += '<button type="button" class="tile locked" data-locked="' + c.date + '" aria-label="' + mdLong(c.date) + ', 아직 잠겨 있음"><span class="d">' + dlabel + '</span>' + LOCK + '</button>';
        } else {
          var isToday = c.date === t && p === 'during', op = has('opened', c.date);
          h += '<button type="button" class="tile' + (isToday ? ' today' : '') + (op ? ' read' : '') + '" data-open="' + c.date + '">' +
            '<span class="d">' + dlabel + '</span><span class="n">' + (isToday && !op ? '오늘 열기' : esc(c.name)) + '</span>' +
            (has('done', c.date) ? '<span class="ok" aria-label="실천함">✓</span>' : '') + '</button>';
        }
      });
      h += '</div></section>';
    });

    h += '<footer class="foot">' +
      '<button type="button" class="btn line" data-act="share-app">이 달력 알려 주기</button>' +
      '<button type="button" class="link" id="installLink" data-act="install-show">홈 화면에 설치하는 방법</button>' +
      '<p>' + esc(D.church) + ' · 2026 대림절</p></footer>';

    home.innerHTML = h;
    renderInstall();
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
      '<button type="button" class="btn line" data-act="back">달력으로 돌아가기</button></div>' +
      '<div class="c-nav">' +
      (prev && unlocked(prev.date, t) ? '<button type="button" data-open="' + prev.date + '" data-replace="1">‹ 어제 칸 · ' + esc(prev.name) + '</button>' : '<span></span>') +
      (next && unlocked(next.date, t) ? '<button type="button" data-open="' + next.date + '" data-replace="1">' + esc(next.name) + ' · 다음 칸 ›</button>' : '<span></span>') +
      '</div></article>';
    if (first) h += '<div class="doors" aria-hidden="true"><i></i><i></i><em>' + mdLong(c.date) + '</em></div>';
    cardEl.innerHTML = h;
    if (first) setTimeout(function () { var d = cardEl.querySelector('.doors'); if (d) d.remove(); }, 1500);
  }

  /* ── 화면 전환 (주소 뒤 #날짜) ── */
  var homeScroll = 0, cameFromHome = false, shownDay = today();

  function route() {
    var t = today(); shownDay = t;
    var m = /^#(\d{4}-\d{2}-\d{2})$/.exec(location.hash), c = m && cardOf(m[1]);
    if (c && !unlocked(c.date, t)) {
      toast(phase(t) === 'before' && c.date === START ? '11월 29일에 첫 칸이 열려요' : mdLong(c.date) + '에 열려요');
      c = null;
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }
    if (c) {
      var first = !has('opened', c.date);
      mark('opened', c.date);
      if (c.date === t) mark('joined', t);
      renderCard(c, first);
      home.hidden = true; cardEl.hidden = false; backBtn.hidden = false; brand.hidden = true;
      document.body.classList.add('reading');
      window.scrollTo(0, 0);
    } else {
      renderHome();
      cardEl.hidden = true; home.hidden = false; backBtn.hidden = true; brand.hidden = false;
      document.body.classList.remove('reading');
      window.scrollTo(0, homeScroll);
    }
    var chip = document.querySelector('.preview-chip');
    if (preview && !chip) { chip = document.createElement('div'); chip.className = 'preview-chip'; chip.textContent = '미리보기 ' + preview; document.body.appendChild(chip); }
  }

  function openCard(date, replace) {
    if (replace) {
      try { history.replaceState(null, '', location.pathname + location.search + '#' + date); } catch (e) { location.hash = date; return; }
      route();
    } else {
      homeScroll = window.scrollY || 0; cameFromHome = true;
      location.hash = date;
    }
  }
  function goHome() {
    if (cameFromHome) { cameFromHome = false; history.back(); return; }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    route();
  }

  function share(title, text, url) {
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + '\n' + url).then(function () { toast('주소를 복사했습니다. 카카오톡에 붙여 넣으세요'); }, function () { toast(url); });
    } else { toast(url); }
  }
  var BASE = location.origin + location.pathname;

  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-open],[data-locked],[data-act]') : null;
    if (el === null && e.target === backBtn) el = backBtn;
    if (!el) return;
    if (el.hasAttribute('data-open')) return openCard(el.getAttribute('data-open'), el.hasAttribute('data-replace'));
    if (el.hasAttribute('data-locked')) {
      var d = el.getAttribute('data-locked');
      return toast(mdLong(d) + ' ' + WD[wday(d)] + '에 열려요');
    }
    var act = el.getAttribute('data-act');
    if (act === 'back') return goHome();
    if (act === 'done') {
      var date = el.getAttribute('data-date'), on = el.getAttribute('aria-pressed') !== 'true';
      mark('done', date, on);
      el.setAttribute('aria-pressed', String(on));
      el.querySelector('.lbl').textContent = on ? '했어요' : '오늘 했어요';
      if (on) toast('잘하셨습니다. 달력에 표시해 두었어요');
      return;
    }
    if (act === 'share-card') {
      var c = cardOf(el.getAttribute('data-date'));
      return share(D.church + ' ' + D.title, '[대림절 달력] ' + mdLong(c.date) + ' · ' + c.name + '\n오늘의 칸을 함께 열어요.', BASE + '#' + c.date);
    }
    if (act === 'share-app') return share(D.church + ' ' + D.title, '[' + D.church + ' 대림절 달력]\n매일 한 칸씩, 성경 속 한 사람을 만나요.', BASE);
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

  window.addEventListener('hashchange', route);
  // 자정이 지나면(또는 다음 날 다시 열면) 새 칸이 열리도록 날짜를 다시 확인한다
  function checkDay() { if (today() !== shownDay && cardEl.hidden) route(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkDay(); });
  setInterval(checkDay, 30000);

  route();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('./sw.js').catch(function () {}); });
  }
})();
