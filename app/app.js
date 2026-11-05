/* Marginlog UI. No framework: string templates + event delegation. Strict CSP friendly (no inline handlers). */
(function () {
  'use strict';
  var C = window.MLCore, I = window.MLI18n, KEY = 'marginlog:v1';
  var S = { cases: [], cur: null, tab: 'log', view: 'list', lang: 'en', f:{ q: '', tag: '', sev: 0, voided: false } };
  var persisted = null, stale = false, blocked = false, corruptKey = null, lastTrig = null, root = document.getElementById('root'), pending = { photos: [] }, toastTimer = null, liveTimer = null, undoBuf = null;

  function t(k, v) {
    var s = (I.L[S.lang] && I.L[S.lang][k]); if (s == null) s = I.L.en[k]; if (s == null) return k;
    if (v) for (var x in v) s = s.split('{' + x + '}').join(v[x]);
    return s;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, el) { return (el || document).querySelector(sel); }
  function cur() { return S.cases.filter(function (c) { return c.id === S.cur; })[0] || null; }
  function now() { return Date.now(); }

  /* ---------- storage ---------- */
  var CPKEY = KEY + ':cp';
  function readCp() { try { return JSON.parse(localStorage.getItem(CPKEY) || '{}') || {}; } catch (e) { return {}; } }
  function load() {
    var raw = null, d = null;
    try { raw = localStorage.getItem(KEY); d = raw ? JSON.parse(raw) : null; } catch (e) { d = undefined; }
    if (d === undefined || (d && !Array.isArray(d.cases))) {
      /* unreadable data: keep a copy first and refuse to overwrite it if the copy fails */
      try { var k0 = KEY + ':corrupt', k1 = KEY + ':corrupt-b', v0 = localStorage.getItem(k0), v1 = localStorage.getItem(k1); corruptKey = v0 === raw ? k0 : v1 === raw ? k1 : v0 === null ? k0 : v1 === null ? k1 : null; if (!corruptKey) blocked = true; else if (localStorage.getItem(corruptKey) !== raw) localStorage.setItem(corruptKey, raw); } catch (e2) { corruptKey = null; blocked = true; }
    } else if (d) { S.cases = d.cases.map(C.sanitizeCase).filter(Boolean); S.cur = d.cur; S.lang = Object.prototype.hasOwnProperty.call(I.L, d.lang) ? d.lang : S.lang; }
    if (!S.cases.some(function (c) { return c.id === S.cur; })) S.cur = (S.cases.filter(function (c) { return !c.archived; })[0] || S.cases[0] || {}).id || null;
  }
  function saveMsg() { return blocked ? t('corruptBlocked') : stale ? t('otherTabBusy') : t('saveFail'); }
  function save() {
    if (blocked) { toast(t('corruptBlocked')); return false; }
    if (stale) { toast(t('otherTabBusy')); return false; }
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, lang: S.lang, cur: S.cur, cases: S.cases })); return true; }
    catch (e) { toast(t('saveFail')); return false; }
  }
  /* The checkpoint only moves when an entry is sealed (or a backup is restored), never on unrelated saves, so removing the tail is still caught later. */
  function bumpCp(c) {
    try { var cp = readCp(); if (c.entries.length) cp[c.id] = { n: c.entries.length, head: c.entries[c.entries.length - 1].hash }; else delete cp[c.id]; localStorage.setItem(CPKEY, JSON.stringify(cp)); } catch (e) { /* best effort */ }
  }
  var db = null;
  function idb() {
    if (db) return db;
    db = new Promise(function (res, rej) {
      try {
        var r = indexedDB.open('marginlog', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('photos'); };
        r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
      } catch (e) { rej(e); }
    });
    return db;
  }
  function photoPut(id, data) { return idb().then(function (d) { return new Promise(function (res, rej) { var q = d.transaction('photos', 'readwrite').objectStore('photos').put(data, id); q.onsuccess = res; q.onerror = function () { rej(q.error); }; }); }); }
  function photoDel(id) { return idb().then(function (d) { d.transaction('photos', 'readwrite').objectStore('photos').delete(id); }, function () { /* no store */ }); }
  function photoSweep() {
    var used = {}; if (blocked || corruptKey) return;
    try { (JSON.parse(localStorage.getItem(KEY) || '{}').cases || []).forEach(function (c) { (c.entries || []).forEach(function (e) { (e.photos || []).forEach(function (p) { used[p.id] = 1; }); }); }); } catch (e) { return; }
    idb().then(function (d) { var q = d.transaction('photos').objectStore('photos').getAllKeys(); q.onsuccess = function () { q.result.forEach(function (k) { if (!used[k]) photoDel(k); }); }; }, function () { /* no store */ });
  }
  function photoGet(id) { return idb().then(function (d) { return new Promise(function (res) { var q = d.transaction('photos').objectStore('photos').get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }, function () { return null; }); }

  /* ---------- helpers ---------- */
  function fmtAt(at) { var p = C.parseAt(at); return p ? t('days')[p.dow] + ' ' + p.day + ' ' + C.pad(p.h) + ':' + C.pad(p.mi) : at; }
  function fmtDur(m) { return m >= 60 ? Math.floor(m / 60) + ' ' + t('hShort') + (m % 60 ? ' ' + (m % 60) + ' ' + t('min') : '') : m + ' ' + t('min'); }
  function toast(msg, action, fn) {
    var el = $('#toast'); if (!el) return;
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? ' <button type="button" id="toast-act">' + esc(action) + '</button>' : '');
    clearTimeout(toastTimer);
    if (action) $('#toast-act').addEventListener('click', function () { fn(); el.innerHTML = ''; });
    toastTimer = setTimeout(function () { el.innerHTML = ''; undoBuf = null; }, action ? 9000 : 6000);
  }
  function download(name, mime, text) {
    var a = document.createElement('a'), u = URL.createObjectURL(new Blob([text], { type: mime }));
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 500);
  }
  function labels() {
    return { counterpart: t('counterpart'), goal: t('goal'), generated: t('generated'), summary: t('summary'), total: t('stTotal'), last30: t('stLast30'), prev30: t('stPrev30'), avgSev: t('stAvg'), minutes: t('stMinutes'), quietHits: t('stQuiet'), pattern: t('pattern'), days: t('days'), timeline: t('timeline'), sev: t('sevWord'), late: t('lateBadge'), witness: t('witness'), photos: t('photos'), reportedTo: t('reportedBadge'), voidedBadge: t('voidedBadge'), recordedAt: t('recordedAt'), steps: t('stepsH'), stepNames: I.stepNames(S.lang), due: t('dueWord'), answered: t('answered'), integrity: t('integrity'), chainOk: t('chainOk'), chainBad: t('chainBad') };
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9぀-ヿ㐀-鿿가-힯]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'case'; }

  /* ---------- render ---------- */
  function render() {
    var ae = document.activeElement, fkey = null;
    if (ae && ae !== document.body && root.contains(ae) && !(dlg && dlg.contains(ae))) fkey = ae.id ? '#' + ae.id : ae.getAttribute('data-act') ? '[data-act="' + ae.getAttribute('data-act') + '"]' + (ae.getAttribute('data-id') ? '[data-id="' + ae.getAttribute('data-id') + '"]' : ae.getAttribute('data-tab') ? '[data-tab="' + ae.getAttribute('data-tab') + '"]' : '') : null;
    renderInner();
    if (fkey && !dlg) { var nf = $(fkey) || $('#panel') || $('#main'); if (nf) { if (!/^(BUTTON|SELECT|INPUT|A)$/.test(nf.tagName)) nf.setAttribute('tabindex', '-1'); nf.focus(); } }
    if (S.focusId) {
      var fid = S.focusId, fe = null; S.focusId = null;
      try { fe = $('.entry[data-id="' + (window.CSS && CSS.escape ? CSS.escape(fid) : fid) + '"]'); } catch (e) { fe = null; }
      if (fe) { fe.setAttribute('tabindex', '-1'); fe.scrollIntoView({ block: 'center' }); fe.focus(); }
    }
    if (S.tab === 'report' && cur()) fillReport();
  }
  function renderInner() {
    document.documentElement.lang = S.lang; document.title = 'Marginlog';
    var c = cur(), h = '<header class="top"><div class="brand-wrap"><h1 class="brand-h"><a class="brand" href="./"><svg class="mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect class="m-bg" width="64" height="64" rx="14"/><rect class="m-bar" x="14" y="18" width="36" height="6" rx="3"/><rect class="m-bar" x="14" y="30" width="22" height="6" rx="3" opacity="0.55"/><rect class="m-bar" x="14" y="42" width="30" height="6" rx="3" opacity="0.85"/></svg><span>Marginlog</span></a></h1><p class="brand-tag">' + esc(t('appTagline')) + '</p></div><div class="topbtns"><label class="sr" for="lang">' + esc(t('language')) + '</label><select id="lang">' +
      Object.keys(I.L).map(function (k) { return '<option value="' + k + '"' + (k === S.lang ? ' selected' : '') + '>' + esc(I.L[k].name) + '</option>'; }).join('') +
      '</select><button type="button" class="ghost" data-act="overview">' + esc(t('overviewBtn')) + '</button><button type="button" class="ghost" data-act="data">' + esc(t('dataBtn')) + '</button></div></header>';
    h += '<main id="main">';
    h += remindersBlock();
    h += c ? caseView(c) : emptyView();
    h += '</main><footer class="site-foot"><div class="foot-brand"><a class="brand" href="./"><svg class="mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect class="m-bg" width="64" height="64" rx="14"/><rect class="m-bar" x="14" y="18" width="36" height="6" rx="3"/><rect class="m-bar" x="14" y="30" width="22" height="6" rx="3" opacity="0.55"/><rect class="m-bar" x="14" y="42" width="30" height="6" rx="3" opacity="0.85"/></svg><span>Marginlog</span></a><p class="foot-desc">' + esc(t('footNote')) + '</p><p class="foot-desc">' + esc(t('privacy')) + '</p></div><p class="foot-disc">' + esc(t('disclaimer')) + '</p><p class="foot-copy">' + esc(t('footCopy')) + '</p></footer>';
    root.innerHTML = h;
    hydratePhotos(); startLiveTick(); paintAi();
  }
  function emptyView() {
    var h = '<section class="empty"><h2>' + esc(t('emptyH')) + '</h2><p>' + esc(t('emptyB')) + '</p><div class="kinds">';
    Object.keys(C.KINDS).forEach(function (k) { h += '<button type="button" class="kind" data-act="newcase" data-kind="' + k + '"><b>' + esc(t('kind_' + k)) + '</b><span>' + esc(t('kindHint_' + k)) + '</span></button>'; });
    h += '</div><p class="hint">' + esc(t('sealHint')) + '</p></section>';
    return h;
  }
  /* in-app reminders: open reply deadlines that are overdue or due within a week, across all active cases */
  function remindersBlock() {
    var rem = C.dueItems(S.cases, now(), 7); if (!rem.length) return '';
    var names = I.stepNames(S.lang);
    return '<section class="remind" aria-labelledby="rem-h"><h2 id="rem-h">' + esc(t('remindH')) + '</h2><ul>' + rem.slice(0, 3).map(function (r) {
      var v = { step: names[r.kind] || r.kind, 'case': r.caseName, d: r.daysLeft, date: r.due }, key = r.overdue ? 'remindOver' : r.daysLeft === 0 ? 'remindToday' : r.daysLeft === 1 ? 'remindTomorrow' : 'remindSoon';
      return '<li' + (r.overdue ? ' class="warn"' : '') + '><button type="button" class="link" data-act="remindopen" data-id="' + esc(r.caseId) + '">' + esc(t(key, v)) + '</button></li>';
    }).join('') + '</ul>' + (rem.length > 3 ? '<p class="hint">' + esc(t('remindMore', { n: rem.length - 3 })) + '</p>' : '') + '</section>';
  }
  function caseView(c) {
    var st = C.stats(c, now()), sg = C.suggestNext(c, now()), act = S.cases;
    var h = '<div class="caserow"><label class="sr" for="casesel">' + esc(t('caseSel')) + '</label><select id="casesel">' +
      act.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === c.id ? ' selected' : '') + '>' + esc(x.name) + (x.archived ? ' (' + esc(t('archivedWord')) + ')' : '') + '</option>'; }).join('') +
      '</select><button type="button" class="ghost" data-act="newcase" data-kind="">' + esc(t('newCase')) + '</button></div>';
    h += '<section class="hero" aria-labelledby="hero-h"><h2 id="hero-h" class="sr">' + esc(c.name) + '</h2>';
    if (!st.total) h += '<p class="big">' + esc(t('noneYet')) + '</p>';
    else h += '<p class="big"><span class="digits">' + st.sinceDays + '</span> ' + esc(t(st.sinceDays === 1 ? 'daySince1' : 'daysSince')) + '</p>';
    h += '<dl class="mini"><div><dt>' + esc(t('stTotal')) + '</dt><dd>' + st.total + '</dd></div><div><dt>' + esc(t('stLast30')) + '</dt><dd>' + st.last30 + (st.trend !== 'flat' ? ' <span class="tr ' + st.trend + '" title="' + esc(t('trend_' + st.trend)) + '">' + (st.trend === 'up' ? '▲' : '▼') + '<span class="sr"> ' + esc(t('trend_' + st.trend)) + '</span></span>' : '') + '</dd></div><div><dt>' + esc(t('stAvg')) + '</dt><dd>' + (st.avgSev || '–') + '</dd></div><div><dt>' + esc(t('strengthWord')) + '</dt><dd>' + (st.total ? C.caseStrength(c) + '%' : '–') + '</dd></div></dl>';
    h += suggestion(c, sg) + '</section>';
    if (c.live) h += '<section class="live" aria-live="off"><p><b>' + esc(t('liveOn')) + '</b> <span id="live-clock" data-start="' + c.live.start + '">00:00</span></p><div class="btns"><button type="button" class="pri" data-act="livestop">' + esc(t('liveStop')) + '</button><button type="button" class="ghost" data-act="livedrop">' + esc(t('liveDrop')) + '</button></div></section>';
    else h += '<div class="actions"><button type="button" class="pri" data-act="log">' + esc(t('logBtn')) + '</button><button type="button" class="sec" data-act="livestart">' + esc(t('liveStart')) + '</button></div>';
    h += '<nav class="tabs" role="tablist" aria-label="' + esc(t('sections')) + '">' + ['log', 'patterns', 'steps', 'report', 'case'].map(function (k) { return '<button type="button" role="tab" id="tab-' + k + '" aria-selected="' + (S.tab === k) + '" tabindex="' + (S.tab === k ? 0 : -1) + '" aria-controls="panel" data-act="tab" data-tab="' + k + '" class="tab' + (S.tab === k ? ' on' : '') + '">' + esc(t('tab_' + k)) + '</button>'; }).join('') + '</nav>';
    h += '<section id="panel" role="tabpanel" aria-labelledby="tab-' + S.tab + '">' + ({ log: logTab, patterns: patternsTab, steps: stepsTab, report: reportTab, 'case': caseTab }[S.tab])(c) + '</section>';
    return h;
  }
  function suggestion(c, sg) {
    var names = I.stepNames(S.lang);
    if (sg.key === 'none') return '<p class="sugg">' + esc(t('sg_none')) + '</p>';
    var sn = names[(sg.kind || (sg.step && sg.step.kind))] || '', msg = t('sg_' + sg.key, { step: (S.lang === 'en' || S.lang === 'es') && (I.L[S.lang]['sg_' + sg.key] || '').indexOf('{step}') !== 0 ? sn.toLowerCase() : sn, date: sg.step ? sg.step.due : '' });
    return '<p class="sugg ' + (sg.key === 'overdue' ? 'warn' : '') + '"><b>' + esc(t('nextStep')) + '</b> ' + esc(msg) + (sg.kind ? ' <button type="button" class="link" data-act="addstep" data-kind="' + sg.kind + '">' + esc(t('logStep')) + '</button>' : '') + (sg.step ? ' <button type="button" class="link" data-act="stepdone" data-id="' + esc(sg.step.id) + '">' + esc(t('markAnswered')) + '</button>' : '') + '</p>';
  }

  function matches(e, c) {
    var f = S.f; if (f.sev && e.sev < f.sev) return false;
    if (f.tag && e.tags.indexOf(f.tag) < 0) return false;
    if (f.q) { var q = f.q.toLowerCase(); if ((e.text + ' ' + e.witness + ' ' + e.tags.join(' ') + ' ' + C.addenda(c.entries, e.id).map(function (n) { return n.text; }).join(' ')).toLowerCase().indexOf(q) < 0) return false; }
    return true;
  }
  function logTools(c) {
    var n = C.photoIndex(c).length, tl = S.view === 'timeline';
    return '<div class="btns sm wrap logtools"><div class="seg" role="group" aria-label="' + esc(t('viewWord')) + '"><button type="button" aria-pressed="' + (!tl) + '" data-act="view" data-id="list">' + esc(t('viewList')) + '</button><button type="button" aria-pressed="' + tl + '" data-act="view" data-id="timeline">' + esc(t('viewTimeline')) + '</button></div>' +
      (n ? '<button type="button" class="ghost" data-act="gallery">' + esc(t('photosBtn', { n: n })) + '</button>' : '') + '</div>';
  }
  function monthLabel(ym) {
    var y = +ym.slice(0, 4), m = +ym.slice(5, 7);
    try { return new Intl.DateTimeFormat(S.lang, { year: 'numeric', month: 'long' }).format(new Date(y, m - 1, 1)); } catch (e) { return ym; }
  }
  /* month header suffix: total minutes disturbed in that month, when any were logged */
  function minsLabel(items) {
    var m = items.reduce(function (a, e) { return a + (e.dur || 0); }, 0);
    return m ? ' · ' + m + ' ' + t('min') : '';
  }
  /* timeline: one compact list per month, newest first; same filtered entries as the list view */
  function timelineView(list, v) {
    return C.monthGroups(list).map(function (g) {
      return '<section class="tlm"><h3>' + esc(monthLabel(g.ym)) + ' <span class="cap">(' + g.items.length + minsLabel(g.items) + ')</span></h3><ol class="tl">' + g.items.map(function (e) {
        var isV = !!v[e.id], short = e.text.replace(/\s+/g, ' ').trim();
        return '<li' + (isV ? ' class="voided"' : '') + '><span class="tlh"><button type="button" class="link" data-act="tlopen" data-id="' + esc(e.id) + '"><time>' + esc(fmtAt(e.at)) + '</time></button>' + (e.sev ? '<span class="sev s' + e.sev + '">' + esc(t('sevWord')) + ' ' + e.sev + '/5</span>' : '') + (isV ? '<span class="pill warn">' + esc(t('voidedBadge')) + '</span>' : '') + '</span>' +
          '<span class="tlt">' + esc(short.length > 160 ? short.slice(0, 157) + '…' : short) + '</span></li>';
      }).join('') + '</ol></section>';
    }).join('');
  }
  /* photo gallery for the whole case; the viewer opens inside this dialog (no nested dialogs) */
  function galleryDialog(c) {
    var items = C.photoIndex(c), v = C.voidedIds(c.entries);
    if (!items.length) return toast(t('photoMissing'));
    var d = openDialog('<h2 id="dlg-h">' + esc(t('galleryH')) + '</h2><p class="hint">' + esc(t('galleryHelp')) + '</p>' +
      '<div id="gal-view" class="galview" hidden><img class="big-ph" alt=""><div class="btns"><button type="button" class="ghost" data-gal-hide>' + esc(t('close')) + '</button></div></div>' +
      '<ul class="gal">' + items.map(function (p) {
        return '<li><button type="button" class="thumb" data-pid="' + esc(p.id) + '" aria-label="' + esc(t('openPhoto') + ', ' + fmtAt(p.at)) + '"><img alt="" data-pid="' + esc(p.id) + '" width="120" height="120"></button><span class="cap">' + esc(fmtAt(p.at)) + (v[p.entry] ? ' · ' + esc(t('voidedBadge')) : '') + '</span></li>';
      }).join('') + '</ul><p class="err" role="alert" hidden></p><div class="btns"><button type="button" class="ghost" data-close>' + esc(t('close')) + '</button></div>', null, { focus: '[data-close]' });
    hydratePhotos(d);
    d.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('[data-gal-hide]')) { $('#gal-view', d).hidden = true; return; }
      var b = ev.target.closest && ev.target.closest('button[data-pid]'); if (!b) return;
      photoGet(b.getAttribute('data-pid')).then(function (src) {
        if (!src) return err(t('photoMissing'));
        $('#gal-view img', d).src = src; $('#gal-view', d).hidden = false; err('');
      });
    });
  }
  function logTab(c) {
    var v = C.voidedIds(c.entries), all = c.entries.filter(function (e) { return e.type === 'event' && (S.f.voided || !v[e.id]); });
    if (!c.entries.some(function (e) { return e.type === 'event'; })) return '<div class="empty small"><h3>' + esc(t('logEmptyH')) + '</h3><p>' + esc(t('logEmptyB')) + '</p></div>';
    var tags = {}; C.events(c.entries).forEach(function (e) { e.tags.forEach(function (x) { tags[x] = 1; }); });
    var list = all.filter(function (e) { return matches(e, c); }).sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    var h = '<form class="filters" role="search" id="filters" autocomplete="off"><label class="sr" for="fq">' + esc(t('search')) + '</label><input id="fq" type="search" placeholder="' + esc(t('search')) + '" value="' + esc(S.f.q) + '" maxlength="60">' +
      '<label class="sr" for="ftag">' + esc(t('tagsWord')) + '</label><select id="ftag"><option value="">' + esc(t('anyTag')) + '</option>' + Object.keys(tags).sort().map(function (x) { return '<option' + (S.f.tag === x ? ' selected' : '') + ' value="' + esc(x) + '">' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<label class="sr" for="fsev">' + esc(t('sevWord')) + '</label><select id="fsev"><option value="0">' + esc(t('anySev')) + '</option>' + [2, 3, 4, 5].map(function (n) { return '<option' + (S.f.sev === n ? ' selected' : '') + ' value="' + n + '">' + esc(t('sevMin', { n: n })) + '</option>'; }).join('') + '</select>' +
      '<label class="chk"><input type="checkbox" id="fvoid"' + (S.f.voided ? ' checked' : '') + '> ' + esc(t('showVoided')) + '</label></form>' + logTools(c);
    if (!list.length) return h + '<div class="empty small"><p>' + esc(t(!all.length ? 'allVoided' : 'noMatch')) + '</p><button type="button" class="ghost" data-act="clearf">' + esc(t('clearFilters')) + '</button></div>';
    if (S.view === 'timeline') return h + '<p class="count" role="status">' + esc(t('showing', { n: list.length, t: all.length })) + '</p>' + timelineView(list, v);
    h += '<p class="count" role="status">' + esc(t('showing', { n: list.length, t: all.length })) + '</p><ol class="entries">';
    list.forEach(function (e) {
      var s = C.strength(e), isV = !!v[e.id], notes = C.addenda(c.entries, e.id), p = C.parseAt(e.at), quiet = p && C.inQuiet(p.h, c.quiet);
      h += '<li class="entry' + (isV ? ' voided' : '') + '" data-id="' + esc(e.id) + '"><div class="eh"><b>' + esc(fmtAt(e.at)) + '</b>' + (e.sev ? '<span class="sev s' + e.sev + '" title="' + esc(t('sevWord') + ' ' + e.sev + '/5') + '"><span aria-hidden="true">' + '●'.repeat(e.sev) + '○'.repeat(5 - e.sev) + '</span><span class="sr">' + esc(t('sevWord') + ' ' + e.sev + '/5') + '</span></span>' : '') + (e.dur ? '<span class="pill">' + esc(fmtDur(e.dur)) + '</span>' : '') +
        (C.isLate(e) ? '<span class="pill warn" title="' + esc(t('lateHint')) + '">' + esc(t('lateBadge')) + '</span>' : '') + (quiet ? '<span class="pill">' + esc(t('quietBadge')) + '</span>' : '') + (e.reported ? '<span class="pill ok">' + esc(t('reportedBadge')) + '</span>' : '') + (isV ? '<span class="pill warn">' + esc(t('voidedBadge')) + '</span>' : '') + '</div>' +
        '<p class="et">' + esc(e.text) + '</p>' +
        (e.tags.length ? '<p class="tg">' + e.tags.map(function (x) { return '<span class="tag">#' + esc(x) + '</span>'; }).join(' ') + '</p>' : '') +
        (e.witness ? '<p class="wit">' + esc(t('witness')) + ': ' + esc(e.witness) + '</p>' : '') +
        (e.photos.length ? '<div class="ph">' + e.photos.map(function (p2) { return '<button type="button" class="thumb" data-act="photo" data-pid="' + esc(p2.id) + '" aria-label="' + esc(t('openPhoto')) + '"><img alt="" data-pid="' + esc(p2.id) + '" width="64" height="64"></button>'; }).join('') + '</div>' : '') +
        notes.map(function (n) { return '<p class="note"><span>+ ' + esc(fmtAt(n.at)) + '</span> ' + esc(n.text) + '</p>'; }).join('') +
        (isV ? '<p class="note">' + esc(t('voidReason')) + ': ' + esc(v[e.id].text) + '</p>' : '') +
        '<div class="meter" title="' + esc(t('strengthWord')) + '"><span class="bar"><i style="width:' + s.score + '%"></i></span><span class="sc">' + esc(t('strengthWord')) + ' ' + s.score + '%</span></div>' +
        (!isV && s.tips.length ? '<p class="tips">' + esc(t('improve')) + ' ' + s.tips.slice(0, 3).map(function (x) { return esc(t('tip_' + x)); }).join(' · ') + '</p>' : '') +
        (!isV ? '<div class="btns sm"><button type="button" class="ghost" data-act="note" data-id="' + esc(e.id) + '">' + esc(t('addNote')) + '</button><button type="button" class="ghost danger" data-act="void" data-id="' + esc(e.id) + '">' + esc(t('voidBtn')) + '</button></div>' : '') +
        '</li>';
    });
    return h + '</ol>';
  }
  function wlabel(ts) { try { return new Intl.DateTimeFormat(S.lang, { month: 'numeric', day: 'numeric' }).format(new Date(ts)); } catch (e) { return C.toLocalStamp(new Date(ts)).slice(5, 10); } }
  function patternsTab(c) {
    var evs = C.events(c.entries), st = C.stats(c, now());
    if (evs.length < 2) return '<div class="empty small"><h3>' + esc(t('patEmptyH')) + '</h3><p>' + esc(t('patEmptyB')) + '</p></div>';
    var hm = C.heatmap(evs), wk = C.weekly(evs, now(), 8), tb = C.topBand(evs), maxW = Math.max.apply(null, wk.map(function (w) { return w.n; })) || 1;
    var h = '<h3>' + esc(t('patH')) + '</h3>';
    if (tb) h += '<p class="insight">' + esc(t('patSentence', { day: t('days')[tb.dow], dshare: tb.dowShare, a: C.pad(tb.from) + ':00', b: C.pad(tb.to) + ':00', hshare: tb.hourShare })) + '</p>';
    h += '<div class="hm" aria-hidden="true"><div class="hmrow hmhead"><span></span>' + [0, 3, 6, 9, 12, 15, 18, 21].map(function (x) { return '<span class="hl" style="grid-column:' + (x + 2) + ' / span 3">' + C.pad(x) + '</span>'; }).join('') + '</div>';
    hm.grid.forEach(function (row, d) {
      h += '<div class="hmrow"><span class="dl">' + esc(t('days')[d]) + '</span>' + row.map(function (n, hr) { return '<i class="hc' + '' + '" style="opacity:' + (n ? (0.3 + 0.7 * n / hm.max).toFixed(2) : 0.1) + '" title="' + esc(t('days')[d] + ' ' + C.pad(hr) + ':00 – ' + n) + '"></i>'; }).join('') + '</div>';
    });
    if (c.quiet) h += '<div class="hmrow"><span class="dl">' + esc(t('quietShort')) + '</span>' + hm.grid[0].map(function (n, hr) { return '<i class="qb' + (C.inQuiet(hr, c.quiet) ? ' on' : '') + '"></i>'; }).join('') + '</div>';
    h += '</div><ul class="sr" aria-label="' + esc(t('heatAria')) + '">'; hm.grid.forEach(function (row, d) { row.forEach(function (n, hr) { if (n) h += '<li>' + esc(t('days')[d] + ' ' + C.pad(hr) + ':00 – ' + n) + '</li>'; }); }); h += '</ul><p class="cap">' + esc(t('heatCap')) + (c.quiet ? ' ' + esc(t('heatQuiet')) : '') + '</p>';
    h += '<h3>' + esc(t('weeksH')) + '</h3><ul class="sr" aria-label="' + esc(t('weeksAria')) + '">' + wk.map(function (w) { return '<li>' + esc(wlabel(w.start) + ': ' + w.n) + '</li>'; }).join('') + '</ul><div class="wk" aria-hidden="true">' + wk.map(function (w) {
      var d = new Date(w.start); return '<div class="wc"><span class="wn">' + w.n + '</span><i style="height:' + Math.round(6 + 64 * w.n / maxW) + 'px" title="' + esc(w.n + ' · ' + wlabel(w.start)) + '"></i><span class="wd">' + wlabel(w.start) + '</span></div>';
    }).join('') + '</div>';
    h += '<h3>' + esc(t('factsH')) + '</h3><ul class="facts"><li>' + esc(t('fact_total', { n: st.total, a: st.first.slice(0, 10), b: st.last.slice(0, 10) })) + '</li><li>' + esc(t('fact_gap', { n: st.longestGap })) + '</li>' +
      (st.minutes ? '<li>' + esc(t('fact_minutes', { n: st.minutes, h: Math.round(10 * st.minutes / 60) / 10 })) + '</li>' : '') +
      (c.quiet ? '<li>' + esc(t('fact_quiet', { n: st.quiet, a: C.pad(c.quiet[0]) + ':00', b: C.pad(c.quiet[1]) + ':00' })) + '</li>' : '') +
      (st.late ? '<li>' + esc(t('fact_late', { n: st.late })) + '</li>' : '') +
      '<li>' + esc(t('fact_trend_' + st.trend, { a: st.last30, b: st.prev30 })) + '</li></ul>';
    var tc = C.tagCounts(evs, 6);
    if (tc.length) h += '<h3>' + esc(t('tagsH')) + '</h3><ul class="tagbars">' + tc.map(function (x) { return '<li><span class="tn">#' + esc(x.tag) + '</span><span class="tbar" aria-hidden="true"><i style="width:' + Math.round(100 * x.n / tc[0].n) + '%"></i></span><span class="tc">' + x.n + '</span></li>'; }).join('') + '</ul>';
    return h;
  }
  function stepsTab(c) {
    var names = I.stepNames(S.lang), done = {}; (c.steps || []).forEach(function (s) { done[s.kind] = 1; });
    var h = '<h3>' + esc(t('ladderH')) + '</h3><ol class="ladder">' + C.ladder(c).map(function (k, i) { return '<li class="' + (done[k] ? 'dn' : '') + '"><span class="num">' + (done[k] ? '✓' : i + 1) + '</span><div><b>' + esc(names[k]) + '</b><span>' + esc(t('stepHint_' + k)) + '</span></div><button type="button" class="ghost" data-act="addstep" data-kind="' + k + '">' + esc(t('logStep')) + '</button></li>'; }).join('') + '</ol>';
    h += '<div class="btns wrap"><button type="button" class="sec" data-act="letter">' + esc(t('ltrBtn')) + '</button>' + ((c.steps || []).some(function (s) { return s.due && !s.done; }) ? '<button type="button" class="ghost" data-act="dlics">' + esc(t('icsBtn')) + '</button>' : '') + '</div>';
    h += aiPanel(c);
    h += '<h3>' + esc(t('stepsH')) + '</h3>';
    if (!(c.steps || []).length) return h + '<div class="empty small"><p>' + esc(t('stepsEmpty')) + '</p></div>';
    h += '<ul class="steps">' + c.steps.slice().sort(function (a, b) { return a.at < b.at ? 1 : -1; }).map(function (s) {
      var overdue = s.due && !s.done && s.due < C.toLocalStamp(new Date(now())).slice(0, 10);
      return '<li><div><b>' + esc(names[s.kind]) + '</b> · ' + esc(s.at) + (s.note ? '<br>' + esc(s.note) : '') + (s.due ? '<br><span class="pill' + (overdue ? ' warn' : '') + '">' + esc(t('dueWord')) + ' ' + esc(s.due) + (s.done ? ' · ' + esc(t('answered')) : overdue ? ' · ' + esc(t('overdueWord')) : '') + '</span>' : '') + '</div><div class="btns sm">' + (s.due && !s.done ? '<button type="button" class="ghost" data-act="stepdone" data-id="' + esc(s.id) + '">' + esc(t('markAnswered')) + '</button>' : '') + '<button type="button" class="ghost danger" data-act="stepdel" data-id="' + esc(s.id) + '">' + esc(t('delete')) + '</button></div></li>';
    }).join('') + '</ul>';
    return h;
  }
  function reportTab(c) {
    if (!c.entries.some(function (e) { return e.type === 'event'; })) return '<div class="empty small"><h3>' + esc(t('repEmptyH')) + '</h3><p>' + esc(t('repEmptyB')) + '</p></div>';
    var rd = C.readiness(c, now()), rh = '<section class="ready" aria-labelledby="rd-h"><h3 id="rd-h">' + esc(t('rdH')) + '</h3><p class="cap">' + esc(t('rdScore', { n: rd.met, m: rd.total })) + '</p><ul class="rdl">' + rd.checks.map(function (x) { return '<li class="' + (x.ok ? 'ok' : 'no') + '"><span aria-hidden="true">' + (x.ok ? '✓' : '○') + '</span> ' + esc(t('rd_' + x.key)) + '</li>'; }).join('') + '</ul></section>';
    return rh + '<div class="btns wrap"><button type="button" class="pri" data-act="copyrep">' + esc(t('copyRep')) + '</button><button type="button" class="sec" data-act="print">' + esc(t('printRep')) + '</button><button type="button" class="ghost" data-act="dlmd">' + esc(t('dlMd')) + '</button><button type="button" class="ghost" data-act="dltxt">' + esc(t('dlTxt')) + '</button><button type="button" class="ghost" data-act="dlcsv">' + esc(t('dlCsv')) + '</button></div>' +
      '<p class="hint">' + esc(t('repHint')) + '</p><p id="chainline" class="chain" role="status">' + esc(t('verifying')) + '</p><button type="button" class="ghost" data-act="verify">' + esc(t('verifyNow')) + '</button><pre id="repview" class="rep" tabindex="0" aria-label="' + esc(t('tab_report')) + '"></pre><div id="repphotos" class="repphotos"></div>';
  }
  function caseTab(c) {
    var h = '<form id="caseform-inline" class="form" autocomplete="off"><p class="hint">' + esc(t('kind_' + c.kind)) + '</p><button type="button" class="sec" data-act="editcase">' + esc(t('editCase')) + '</button></form>';
    h += '<p class="hint">' + esc(t('sealExplain')) + '</p><div class="btns wrap"><button type="button" class="ghost" data-act="archive">' + esc(c.archived ? t('unarchive') : t('archive')) + '</button><button type="button" class="ghost danger" data-act="delcase">' + esc(t('deleteCase')) + '</button></div>';
    return h;
  }

  /* ---------- photos ---------- */
  function hydratePhotos(scope) {
    var imgs = (scope || root).querySelectorAll('img[data-pid]');
    return Promise.all(Array.prototype.map.call(imgs, function (img) { return photoGet(img.getAttribute('data-pid')).then(function (d) { if (d) img.src = d; else img.alt = t('photoMissing'); }); }));
  }
  function readPhoto(file) {
    return new Promise(function (res, rej) {
      var fr = new FileReader();
      fr.onerror = function () { rej(new Error('read')); };
      fr.onload = function () {
        var im = new Image();
        im.onerror = function () { rej(new Error('image')); };
        im.onload = function () {
          var max = 1280, k = Math.min(1, max / Math.max(im.width, im.height)), cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(im.width * k)); cv.height = Math.max(1, Math.round(im.height * k));
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', 0.8));
        };
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* ---------- dialogs ---------- */
  var dlg = null;
  function openDialog(html, onSubmit, opts) {
    closeDialog();
    dlg = document.createElement('dialog'); dlg.className = 'dlg'; dlg.setAttribute('aria-labelledby', 'dlg-h');
    dlg.innerHTML = '<form method="dialog" novalidate>' + html + '</form>';
    document.body.appendChild(dlg);
    var form = $('form', dlg);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault(); if (!onSubmit || form.__busy) return; form.__busy = true;
      var btns = form.querySelectorAll('button[type=submit]'); Array.prototype.forEach.call(btns, function (b) { b.disabled = true; });
      var done = function () { form.__busy = false; Array.prototype.forEach.call(btns, function (b) { b.disabled = false; }); };
      var fail = function () { err(t(window.crypto && window.crypto.subtle ? 'saveFail' : 'cryptoFail')); };
      var r; try { r = onSubmit(form, ev); } catch (e) { done(); return fail(); }
      Promise.resolve(r).catch(fail).then(done);
    });
    dlg.addEventListener('cancel', function () { pending.photos = []; });
    var thisDlg = dlg;
    /* a late close event from a dialog that was already replaced must not remove the newer one */
    dlg.addEventListener('close', function () { thisDlg.remove(); if (dlg && dlg !== thisDlg) return; dlg = null; setTimeout(restoreFocus, 0); if (stale) { stale = false; S.cases = []; S.cur = null; load(); render(); toast(t('otherTab')); } });
    $('[data-close]', dlg) && Array.prototype.forEach.call(dlg.querySelectorAll('[data-close]'), function (b) { b.addEventListener('click', function () { pending.photos = []; closeDialog(); }); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    var first = $((opts && opts.focus) || 'input,textarea,select,button', dlg); first && first.focus();
    return dlg;
  }
  function restoreFocus() {
    if (!lastTrig) return; var a = lastTrig.split('|'), el = (a[1] && $('[data-act="' + a[0] + '"][data-id="' + a[1] + '"]')) || $('[data-act="' + a[0] + '"]') || $('#main');
    if (el && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('dialog'))) { if (el.id === 'main') el.setAttribute('tabindex', '-1'); el.focus(); }
  }
  function closeDialog() { if (dlg) { try { dlg.close(); } catch (e) { /* already closed */ } if (dlg) { dlg.remove(); dlg = null; } } }
  function err(msg) { var e = $('.err', dlg); if (e) { e.textContent = msg; e.hidden = !msg; } }
  function btnRow(saveKey) { return '<p class="err" role="alert" hidden></p><div class="btns"><button type="submit" class="pri">' + esc(t(saveKey || 'save')) + '</button><button type="button" class="ghost" data-close>' + esc(t('cancel')) + '</button></div>'; }

  function entryDialog(c, pre) {
    pre = pre || {}; pending.photos = [];
    var kind = C.KINDS[c.kind], nowStamp = C.toLocalStamp(new Date(now()));
    var sugg = kind.tags.map(function (x) { return '<button type="button" class="tag sug" data-tagadd="' + esc(x) + '">+ ' + esc(x) + '</button>'; }).join(' ');
    var d = openDialog('<h2 id="dlg-h">' + esc(t('logBtn')) + '</h2>' +
      '<label for="e-at">' + esc(t('when')) + '</label><input id="e-at" type="datetime-local" required value="' + esc(pre.at || nowStamp) + '" max="' + esc(nowStamp) + '">' +
      '<label for="e-text">' + esc(t('what')) + '</label><textarea id="e-text" rows="4" maxlength="4000" required placeholder="' + esc(t('whatPh_' + c.kind)) + '" aria-describedby="e-help"></textarea><p id="e-help" class="hint">' + esc(t('whatHelp')) + '</p>' +
      '<fieldset><legend>' + esc(t('sevWord')) + '</legend><div class="sevpick">' + [1, 2, 3, 4, 5].map(function (n) { return '<label><input type="radio" name="sev" value="' + n + '"' + (n === 2 ? ' checked' : '') + '><span>' + n + '</span></label>'; }).join('') + '</div><p class="hint">' + esc(t('sevHelp')) + '</p></fieldset>' +
      '<label for="e-dur">' + esc(t('durMin')) + '</label><input id="e-dur" type="number" min="0" max="14400" inputmode="numeric" value="' + (pre.dur || '') + '">' +
      '<label for="e-tags">' + esc(t('tagsWord')) + '</label><input id="e-tags" maxlength="120" placeholder="' + esc(t('tagsPh')) + '"><div class="sugs">' + sugg + '</div>' +
      '<label for="e-wit">' + esc(t('witness')) + '</label><input id="e-wit" maxlength="200" placeholder="' + esc(t('witnessPh')) + '">' +
      '<label class="chk"><input type="checkbox" id="e-rep"> ' + esc(t('reportedChk')) + '</label>' +
      '<label for="e-ph">' + esc(t('addPhotos')) + '</label><input id="e-ph" type="file" accept="image/*" multiple><div id="e-phl" class="ph"></div><p class="hint">' + esc(t('photoHelp')) + '</p>' + btnRow('sealSave'),
      function (form) { return submitEntry(c, form, pre); });
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('[data-tagadd]'); if (!b) return;
      var inp = $('#e-tags', d), cur2 = C.cleanTags(inp.value); cur2.push(b.getAttribute('data-tagadd')); inp.value = C.cleanTags(cur2).join(', ');
    });
    $('#e-ph', d).addEventListener('change', function (ev) {
      var files = Array.prototype.slice.call(ev.target.files).slice(0, 6 - pending.photos.length);
      Promise.all(files.map(function (f) { return readPhoto(f).catch(function () { return null; }); })).then(function (r) {
        var bad = r.filter(function (x) { return !x; }).length; r.forEach(function (x) { if (x && pending.photos.length < 6) pending.photos.push(x); });
        paintPhotos(d); err(bad ? t('photoBad') : ''); ev.target.value = '';
      });
    });
    d.addEventListener('click', function (ev) { var rb = ev.target.closest && ev.target.closest('[data-rm]'); if (rb) { pending.photos.splice(+rb.getAttribute('data-rm'), 1); paintPhotos(d); } });
  }
  function paintPhotos(d) {
    $('#e-phl', d).innerHTML = pending.photos.map(function (x, i) { return '<span class="pv"><img alt="" width="64" height="64" src="' + x + '"><button type="button" class="rm" data-rm="' + i + '" aria-label="' + esc(t('rmPhoto')) + '">×</button></span>'; }).join('');
  }
  async function submitEntry(c, form, pre) {
    var at = $('#e-at', form).value, text = $('#e-text', form).value.trim(), p = C.parseAt(at);
    if (!p) return err(t('errWhen'));
    if (p.ts > now() + 5 * 6e4) return err(t('errFuture'));
    if (text.length < 3) { $('#e-text', form).focus(); return err(t('errText')); }
    var dur = $('#e-dur', form).value; if (dur !== '' && !(+dur >= 0 && +dur <= 14400)) return err(t('errDur'));
    var sev = +(form.querySelector('input[name=sev]:checked') || { value: 2 }).value, photos = [];
    try {
      for (var i = 0; i < pending.photos.length; i++) { var data = pending.photos[i], h = await C.sha256Hex(data), id = C.uid(); await photoPut(id, data); photos.push({ id: id, h: h }); }
    } catch (e) { return err(t('photoStoreFail')); }
    var last = c.entries[c.entries.length - 1], e = await C.seal(last ? last.hash : '', { type: 'event', at: at, rec: now(), text: text, sev: sev, dur: dur === '' ? 0 : +dur, tags: $('#e-tags', form).value, witness: $('#e-wit', form).value.trim(), photos: photos, reported: $('#e-rep', form).checked });
    c.entries.push(e); var liveWas = c.live; if (pre && pre.live) c.live = null;
    if (!save()) { c.entries.pop(); c.live = liveWas; photos.forEach(function (p) { photoDel(p.id); }); return err(saveMsg()); }
    bumpCp(c);
    pending.photos = []; closeDialog(); S.tab = 'log'; render(); toast(t('sealed', { h: e.hash.slice(0, 8) }));
  }
  function noteDialog(c, id) {
    openDialog('<h2 id="dlg-h">' + esc(t('addNote')) + '</h2><p class="hint">' + esc(t('noteHelp')) + '</p><label for="n-text">' + esc(t('noteText')) + '</label><textarea id="n-text" rows="3" maxlength="1000" required></textarea>' + btnRow('sealSave'), async function (form) {
      var text = $('#n-text', form).value.trim(); if (text.length < 2) return err(t('errText'));
      var last = c.entries[c.entries.length - 1], e = await C.seal(last.hash, { type: 'note', ref: id, at: C.toLocalStamp(new Date(now())), rec: now(), text: text });
      c.entries.push(e); if (!save()) { c.entries.pop(); return err(saveMsg()); } bumpCp(c); closeDialog(); render(); toast(t('sealed', { h: e.hash.slice(0, 8) }));
    });
  }
  function voidDialog(c, id) {
    openDialog('<h2 id="dlg-h">' + esc(t('voidBtn')) + '</h2><p class="hint">' + esc(t('voidHelp')) + '</p><label for="v-text">' + esc(t('voidReason')) + '</label><textarea id="v-text" rows="2" maxlength="300" required></textarea>' + btnRow('voidConfirm'), async function (form) {
      var text = $('#v-text', form).value.trim(); if (text.length < 3) return err(t('errText'));
      var last = c.entries[c.entries.length - 1], e = await C.seal(last.hash, { type: 'void', ref: id, at: C.toLocalStamp(new Date(now())), rec: now(), text: text });
      c.entries.push(e); if (!save()) { c.entries.pop(); return err(saveMsg()); } bumpCp(c); closeDialog(); render(); toast(t('voided'));
    });
  }
  function stepDialog(c, kind) {
    var names = I.stepNames(S.lang), today = C.toLocalStamp(new Date(now())).slice(0, 10);
    openDialog('<h2 id="dlg-h">' + esc(t('logStep')) + '</h2><label for="s-kind">' + esc(t('stepKind')) + '</label><select id="s-kind">' + C.STEP_KINDS.map(function (k) { return '<option value="' + k + '"' + (k === kind ? ' selected' : '') + '>' + esc(names[k]) + '</option>'; }).join('') + '</select>' +
      '<label for="s-at">' + esc(t('stepDate')) + '</label><input id="s-at" type="date" required value="' + today + '" max="' + today + '"><label for="s-note">' + esc(t('stepNote')) + '</label><textarea id="s-note" rows="2" maxlength="300"></textarea>' +
      '<label for="s-due">' + esc(t('stepDue')) + '</label><input id="s-due" type="date"><p class="hint">' + esc(t('stepDueHelp')) + '</p>' + btnRow(), function (form) {
      var at = $('#s-at', form).value, due = $('#s-due', form).value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(at)) return err(t('errWhen')); if (at > today) return err(t('errFuture')); if (due && due < at) return err(t('errDue'));
      (c.steps = c.steps || []).push({ id: C.uid(), kind: $('#s-kind', form).value, at: at, note: $('#s-note', form).value.trim().slice(0, 300), due: due, done: false });
      if (!save()) { c.steps.pop(); return err(saveMsg()); } closeDialog(); S.tab = 'steps'; render(); toast(t('stepSaved'));
    });
  }
  function caseDialog(kind, existing) {
    var c = existing, k = c ? c.kind : kind || 'other', q = c ? c.quiet : C.KINDS[k].quiet;
    openDialog('<h2 id="dlg-h">' + esc(t(c ? 'editCase' : 'newCase')) + '</h2>' +
      '<label for="c-kind">' + esc(t('caseKind')) + '</label><select id="c-kind"' + (c ? ' disabled' : '') + '>' + Object.keys(C.KINDS).map(function (x) { return '<option value="' + x + '"' + (x === k ? ' selected' : '') + '>' + esc(t('kind_' + x)) + '</option>'; }).join('') + '</select>' +
      '<label for="c-name">' + esc(t('caseName')) + '</label><input id="c-name" maxlength="80" required value="' + esc(c ? c.name : '') + '" placeholder="' + esc(t('caseNamePh')) + '">' +
      '<label for="c-who">' + esc(t('counterpart')) + '</label><input id="c-who" maxlength="80" value="' + esc(c ? c.counterpart : '') + '" placeholder="' + esc(t('counterpartPh')) + '">' +
      '<label for="c-goal">' + esc(t('goal')) + '</label><input id="c-goal" maxlength="200" value="' + esc(c ? c.goal : '') + '" placeholder="' + esc(t('goalPh')) + '">' +
      '<fieldset><legend>' + esc(t('quietWord')) + '</legend><label class="chk"><input type="checkbox" id="c-qon"' + (q ? ' checked' : '') + '> ' + esc(t('quietOn')) + '</label><div class="two"><div><label for="c-qa">' + esc(t('quietFrom')) + '</label><input id="c-qa" type="number" min="0" max="23" value="' + (q ? q[0] : 22) + '"></div><div><label for="c-qb">' + esc(t('quietTo')) + '</label><input id="c-qb" type="number" min="0" max="23" value="' + (q ? q[1] : 7) + '"></div></div></fieldset>' + btnRow(), function (form) {
      var name = $('#c-name', form).value.trim(); if (!name) { $('#c-name', form).focus(); return err(t('errName')); }
      if ($('#c-qon', form).checked) { var qa = +$('#c-qa', form).value, qb = +$('#c-qb', form).value; if ($('#c-qa', form).value === '' || $('#c-qb', form).value === '' || !(qa >= 0 && qa <= 23 && qb >= 0 && qb <= 23) || Math.round(qa) === Math.round(qb)) return err(t('errQuiet')); }
      var quiet = $('#c-qon', form).checked ? [C.clampInt($('#c-qa', form).value, 0, 23), C.clampInt($('#c-qb', form).value, 0, 23)] : null;
      var o = c || { id: C.uid(), kind: $('#c-kind', form).value, created: now(), archived: false, entries: [], steps: [], live: null };
      var snap = { n: o.name, w: o.counterpart, g: o.goal, q: o.quiet, cur: S.cur }; o.name = name; o.counterpart = $('#c-who', form).value.trim(); o.goal = $('#c-goal', form).value.trim(); o.quiet = quiet; if (!c) S.cases.push(o); S.cur = o.id; if (!c) S.tab = 'log';
      if (!save()) { if (!c) S.cases.pop(); else { o.name = snap.n; o.counterpart = snap.w; o.goal = snap.g; o.quiet = snap.q; } S.cur = snap.cur; return err(saveMsg()); } closeDialog(); render();
    });
    if (!c) $('#c-kind', dlg).addEventListener('change', function (ev) { var q2 = C.KINDS[ev.target.value].quiet; $('#c-qon', dlg).checked = !!q2; if (q2) { $('#c-qa', dlg).value = q2[0]; $('#c-qb', dlg).value = q2[1]; } });
  }
  function letterLabels() { return Object.assign({}, I.L[S.lang], { stepNames: I.stepNames(S.lang) }); }
  function letterDialog(c) {
    if (!C.events(c.entries).length) return toast(t('ltrNone'));
    var dirty = false, L = letterLabels();
    var d = openDialog('<h2 id="dlg-h">' + esc(t('ltrH')) + '</h2><p class="hint">' + esc(t('ltrHelp')) + '</p>' +
      '<label for="l-days">' + esc(t('ltrDays')) + '</label><select id="l-days">' + [7, 14, 21, 30].map(function (n) { return '<option value="' + n + '"' + (n === 14 ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>' +
      '<label class="sr" for="l-text">' + esc(t('ltrH')) + '</label><textarea id="l-text" class="letter" rows="14" maxlength="6000"></textarea>' +
      '<p class="err" role="alert" hidden></p><div class="btns wrap"><button type="button" class="pri" id="l-copy">' + esc(t('ltrCopy')) + '</button><button type="button" class="ghost" id="l-dl">' + esc(t('ltrDl')) + '</button><button type="submit" class="sec">' + esc(t('ltrLog')) + '</button><button type="button" class="ghost" data-close>' + esc(t('close')) + '</button></div>',
      function (form) {
        var days = +$('#l-days', form).value, today = C.toLocalStamp(new Date(now())).slice(0, 10);
        (c.steps = c.steps || []).push({ id: C.uid(), kind: 'written', at: today, note: t('ltrSubj', { name: c.name }).slice(0, 300), due: C.addDays(today, days), done: false });
        if (!save()) { c.steps.pop(); return err(saveMsg()); } closeDialog(); S.tab = 'steps'; render(); toast(t('ltrLogged'));
      });
    function gen() { $('#l-text', d).value = C.noticeLetter(c, L, now(), +$('#l-days', d).value); }
    gen();
    var shownDue = C.addDays(C.toLocalStamp(new Date(now())).slice(0, 10), +$('#l-days', d).value);
    $('#l-days', d).addEventListener('change', function () {
      var nd = C.addDays(C.toLocalStamp(new Date(now())).slice(0, 10), +this.value);
      if (!dirty) gen(); else { var ta = $('#l-text', d); ta.value = ta.value.split(shownDue).join(nd); }
      shownDue = nd;
    });
    $('#l-text', d).addEventListener('input', function () { dirty = true; });
    $('#l-copy', d).addEventListener('click', async function () { var ta = $('#l-text', d); try { await navigator.clipboard.writeText(ta.value); toast(t('ltrCopied')); } catch (e) { ta.focus(); ta.select(); } });
    $('#l-dl', d).addEventListener('click', function () { download('marginlog-notice-' + slug(c.name) + '.txt', 'text/plain', '\ufeff' + $('#l-text', d).value); });
    return d;
  }
  function dataDialog() {
    openDialog('<h2 id="dlg-h">' + esc(t('dataH')) + '</h2><p class="hint">' + esc(t('dataHelp')) + '</p><div class="btns wrap"><button type="button" class="pri" id="d-exp">' + esc(t('backup')) + '</button><label class="btn sec" for="d-imp">' + esc(t('restore')) + '</label><input id="d-imp" class="sr" type="file" accept="application/json,.json"></div><label for="d-pass">' + esc(t('passLabel')) + '</label><input id="d-pass" type="password" autocomplete="new-password"><p class="hint">' + esc(t('passHint')) + '</p>' + (corruptKey ? '<p><button type="button" class="sec" id="d-corrupt">' + esc(t('dlCorrupt')) + '</button></p>' : '') + '<p class="hint">' + esc(persisted === null ? '' : t(persisted ? 'persistYes' : 'persistNo')) + '</p><p class="hint">' + esc(t('installHint')) + '</p><p class="err" role="alert" hidden></p><div class="btns"><button type="button" class="ghost" data-close>' + esc(t('close')) + '</button></div>');
    $('#d-exp', dlg).addEventListener('click', backup);
    if (corruptKey) $('#d-corrupt', dlg).addEventListener('click', function () { try { download('marginlog-unreadable.txt', 'text/plain', localStorage.getItem(corruptKey) || ''); } catch (e) { err(saveMsg()); } });
    $('#d-imp', dlg).addEventListener('change', function (ev) { var f = ev.target.files[0]; if (f) restore(f); });
  }
  async function backup() {
    var photos = {}, ids = [];
    S.cases.forEach(function (c) { c.entries.forEach(function (e) { e.photos.forEach(function (p) { ids.push(p.id); }); }); });
    var missing = 0; for (var i = 0; i < ids.length; i++) { var d = await photoGet(ids[i]); if (d) photos[ids[i]] = d; else missing++; }
    var cp = {}; S.cases.forEach(function (c) { if (c.entries.length) cp[c.id] = { n: c.entries.length, head: c.entries[c.entries.length - 1].hash }; });
    var pass = dlg && $('#d-pass', dlg) ? $('#d-pass', dlg).value : '', stamp = C.toLocalStamp(new Date(now())).slice(0, 10);
    if (pass && pass.length < 8) return err(t('passShort'));
    try {
      var body = JSON.stringify({ app: 'marginlog', v: 1, cases: S.cases, photos: photos, cp: cp });
      if (pass) { var env = await C.encryptText(body, pass); download('marginlog-backup-' + stamp + '-encrypted.json', 'application/json', JSON.stringify({ app: 'marginlog', v: 2, enc: env })); }
      else download('marginlog-backup-' + stamp + '.json', 'application/json', body);
      err(''); try { localStorage.setItem(KEY + ':lastbackup', String(now())); } catch (e4) { /* optional */ } toast(t('backupDone') + (missing ? ' ' + t('backupMissing', { n: missing }) : ''));
    }
    catch (e) { err(saveMsg()); }
  }
  function overviewDialog() {
    var rows = C.overview(S.cases, now()), items = rows.length ? rows.map(function (r) {
      var lab = esc(r.name || t('kind_' + r.kind));
      return '<li><button type="button" class="ghost" data-ov="' + esc(r.id) + '" style="width:100%;text-align:left"><strong>' + lab + '</strong>' + (r.archived ? ' <span class="pill">' + esc(t('ovArchived')) + '</span>' : '') +
        '<br><span class="hint">' + esc(t('kind_' + r.kind)) + ' · ' + esc(t('ovEntries', { n: r.total })) + (r.lastAt ? ' · ' + esc(t('ovLast', { d: r.lastAt.slice(0, 10) })) : '') + '</span><br>' +
        (r.overdue ? '<span class="pill warn">' + esc(t('ovOverdue', { n: r.overdue })) + '</span> ' : '') + (r.openSteps ? '<span class="pill">' + esc(t('ovOpen', { n: r.openSteps })) + '</span> ' : '') +
        '<span class="pill">' + esc(t('ovStrength', { s: r.strength })) + '</span></button></li>'; }).join('') : '<li class="hint">' + esc(t('ovNone')) + '</li>';
    openDialog('<h2 id="dlg-h">' + esc(t('overviewH')) + '</h2><p class="hint">' + esc(t('overviewHelp')) + '</p><label class="sr" for="ov-q">' + esc(t('ovSearch')) + '</label><input id="ov-q" type="search" placeholder="' + esc(t('ovSearch')) + '" maxlength="60" autocomplete="off"><ul class="facts">' + items + '</ul><p class="hint" id="ov-nomatch" hidden>' + esc(t('noMatch')) + '</p><p class="err" role="alert" hidden></p><div class="btns wrap"><button type="button" class="sec" data-ov-act="ics">' + esc(t('ovIcs')) + '</button><button type="button" class="sec" data-ov-act="digest">' + esc(t('ovDigest')) + '</button></div><div class="btns"><button type="button" class="ghost" data-close>' + esc(t('close')) + '</button></div>');
    /* live filter over the case rows: hides rows whose text does not contain the query */
    dlg.addEventListener('input', function (ev) {
      if (ev.target.id !== 'ov-q') return;
      var q = ev.target.value.trim().toLowerCase();
      var shown = 0;
      Array.prototype.forEach.call(dlg.querySelectorAll('.facts > li'), function (li) { li.hidden = !!q && li.textContent.toLowerCase().indexOf(q) < 0; if (!li.hidden) shown++; });
      var nm = $('#ov-nomatch', dlg); if (nm) nm.hidden = !q || shown > 0;
    });
    dlg.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-ov-act]');
      if (a) {
        var lb = Object.assign({}, I.L[S.lang], { stepNames: I.stepNames(S.lang) }), stamp = C.toLocalStamp(new Date(now())).slice(0, 10);
        if (a.getAttribute('data-ov-act') === 'ics') { var ics = C.calendarAll(S.cases, lb, now()); if (!ics) return err(t('ovNoDeadlines')); download('marginlog-deadlines-' + stamp + '.ics', 'text/calendar', ics); }
        else download('marginlog-digest-' + stamp + '.md', 'text/markdown', C.digest(S.cases, lb, now()));
        return;
      }
      var b = ev.target.closest('[data-ov]'); if (!b) return;
      S.cur = b.getAttribute('data-ov'); S.tab = 'log'; S.f = { q: '', tag: '', sev: 0, voided: false }; save(); closeDialog(); render();
    });
  }
  function restore(file) {
    var fr = new FileReader();
    fr.onerror = function () { err(t('badFile')); };
    fr.onload = async function () {
      try {
        var d = JSON.parse(fr.result);
        if (d && d.enc) {
          var pw = dlg && $('#d-pass', dlg) ? $('#d-pass', dlg).value : '';
          if (!pw) return err(t('passNeeded'));
          try { d = JSON.parse(await C.decryptText(d.enc, pw)); } catch (e6) { return err(t('passWrong')); }
        }
        if (!d || d.app !== 'marginlog' || !Array.isArray(d.cases)) throw new Error('shape');
        var cs = d.cases.map(C.sanitizeCase).filter(Boolean), broken = 0, ph = d.photos && typeof d.photos === 'object' ? d.photos : {}, fcp = d.cp && typeof d.cp === 'object' ? d.cp : {}, n = 0, skipped = 0, photoBad = 0, newCp = {};
        var vok = [], rejected = 0;
        for (var i = 0; i < cs.length; i++) { var v = await C.verifyChain(cs[i].entries, fcp[cs[i].id]); vok.push(v.ok); }
        var before = S.cases.slice(), keep = [], has = function (list, h) { return list.some(function (e) { return e.hash === h; }); };
        cs.forEach(function (c, ci) {
          var origId = c.id, ex = before.filter(function (x) { return x.id === origId; })[0], cl = c.entries.length ? c.entries[c.entries.length - 1].hash : '';
          if (ex) {
            var el = ex.entries.length ? ex.entries[ex.entries.length - 1].hash : '';
            if (!cl) { (c.steps || []).forEach(function (st2) { if (!(ex.steps || []).some(function (y) { return y.id === st2.id; })) (ex.steps = ex.steps || []).push(st2); }); skipped++; return; }
            if (cl === el || has(ex.entries, cl)) { skipped++; return; }
            {          /* same or older copy of a case we already hold is skipped above */
            if (!vok[ci]) { rejected++; return; }                                         /* never let an unverifiable copy replace local data */
            if (!el || has(c.entries, el)) { (ex.steps || []).forEach(function (st3) { if (!(c.steps || []).some(function (y) { return y.id === st3.id; })) (c.steps = c.steps || []).push(st3); }); S.cases.splice(S.cases.indexOf(ex), 1); }       /* backup is a verified newer copy: replace */
            else c.id = C.uid();                                                          /* diverged history: keep both */
            }
          }
          if (!vok[ci]) broken++;
          if (fcp[origId]) newCp[c.id] = fcp[origId];
          keep.push(c);
        });
        for (var j = 0; j < keep.length; j++) for (var k = 0; k < keep[j].entries.length; k++) for (var m = 0; m < keep[j].entries[k].photos.length; m++) {
          var p = keep[j].entries[k].photos[m], data = ph[p.id];
          if (typeof data === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(data) && data.length < 6e6 && await C.sha256Hex(data) === p.h) { await photoPut(p.id, data); n++; } else photoBad++;
        }
        S.cases = S.cases.concat(keep); if (!S.cur && keep[0]) S.cur = keep[0].id;
        if (!save()) { S.cases = before; return err(saveMsg()); }
        try { var cpAll = readCp(); Object.keys(newCp).forEach(function (id) { cpAll[id] = newCp[id]; }); localStorage.setItem(CPKEY, JSON.stringify(cpAll)); } catch (e3) { /* checkpoint is best effort */ }
        closeDialog(); render();
        toast((broken ? t('restoredBroken', { n: keep.length, b: broken }) : t('restored', { n: keep.length })) + (skipped ? ' ' + t('restoredSkipped', { n: skipped }) : '') + (rejected ? ' ' + t('restoredRejected', { n: rejected }) : '') + (photoBad ? ' ' + t('photoHashBad', { n: photoBad }) : ''));
      } catch (e) { err(t('badFile')); }
    };
    fr.readAsText(file);
  }

  /* ---------- report ---------- */
  /* the seal as the report states it: chain intact and every photo still matches its fingerprint; {ok:false} otherwise */
  async function sealStatus(c) {
    var chain; try { chain = await C.verifyChain(c.entries, readCp()[c.id]); } catch (e) { return { ok: false }; }
    for (var i = 0; i < c.entries.length; i++) for (var j = 0; j < c.entries[i].photos.length; j++) { var p = c.entries[i].photos[j], d = await photoGet(p.id); if (!d || await C.sha256Hex(d) !== p.h) return { ok: false }; }
    return chain.ok ? chain : { ok: false };
  }
  async function fillReport() {
    var c = cur(), pre = $('#repview'); if (!c || !pre) return;
    var chain, bad = 0; try { chain = await C.verifyChain(c.entries, readCp()[c.id]); } catch (e) { var ln = $('#chainline'); if (ln) { ln.textContent = t('cryptoFail'); ln.className = 'chain bad'; } return; }
    for (var i = 0; i < c.entries.length; i++) for (var j = 0; j < c.entries[i].photos.length; j++) { var p = c.entries[i].photos[j], d = await photoGet(p.id); if (!d || await C.sha256Hex(d) !== p.h) bad++; }
    var ok = chain.ok && !bad, md = C.reportMarkdown(c, labels(), now(), ok ? chain : { ok: false });
    pre.textContent = md; var line = $('#chainline'); if (line) { line.textContent = ok ? t('chainOk', { n: c.entries.length, h: chain.head }) : (chain.ok ? t('photoHashBad', { n: bad }) : t(chain.truncated ? 'chainTrunc' : 'chainBadAt', { n: chain.bad + 1 })); line.className = 'chain ' + (ok ? 'good' : 'bad'); }
    var box = $('#repphotos'); if (box) {
      var h = ''; C.events(c.entries).forEach(function (e) { e.photos.forEach(function (p2) { h += '<figure><img alt="" data-pid="' + esc(p2.id) + '"><figcaption>' + esc(fmtAt(e.at)) + '</figcaption></figure>'; }); }); box.innerHTML = h; await hydratePhotos(); await Promise.all(Array.prototype.map.call(box.querySelectorAll('img[src]'), function (im) { return im.decode ? im.decode().catch(function () { /* broken image */ }) : null; }));
    }
    return md;
  }

  /* ---------- live timer ---------- */
  function startLiveTick() {
    clearInterval(liveTimer); var el = $('#live-clock'); if (!el) return;
    function tick() { var s = Math.max(0, Math.floor((now() - +el.getAttribute('data-start')) / 1000)); el.textContent = (s >= 3600 ? C.pad(Math.floor(s / 3600)) + ':' : '') + C.pad(Math.floor(s / 60) % 60) + ':' + C.pad(s % 60); }
    tick(); liveTimer = setInterval(tick, 1000);
  }

  /* ---------- AI analysis ----------
     The panel always shows the built-in analysis (MLAI.localAnalysis, computed here, no network).
     The API is called only from runAi(), on an explicit click. The key lives in localStorage; results live in memory only.
     Model output is written with textContent only. */
  var A = window.MLAI, AIS = {};
  function aiKey() { try { return A.validateKey(localStorage.getItem(A.KEY_STORAGE) || '').key || ''; } catch (e) { return ''; } }
  function aiSaveKey(raw) {
    var v = A.validateKey(raw); if (!v.ok) return { err: 'key' };
    try { localStorage.setItem(A.KEY_STORAGE, v.key); } catch (e) { return { err: 'storage' }; }
    return { ok: true };
  }
  function removeAiKey(c) {
    try { localStorage.removeItem(A.KEY_STORAGE); } catch (e) { /* nothing stored */ }
    delete AIS[c.id]; S.aiMsg = { k: 'ai_removed' }; render();
  }
  function aiPanel(c) {
    var key = aiKey(), h = '<section class="ai" aria-labelledby="ai-h"><h3 id="ai-h">' + esc(t('ai_h')) + '</h3><p class="hint">' + esc(t('ai_intro')) + '</p>';
    h += '<details class="aisend"><summary>' + esc(t('ai_sendH')) + '</summary><p class="hint">' + esc(t('ai_sendBody')) + '</p></details>';
    h += '<div class="aiblock" id="ai-local"></div>';
    if (key) h += '<div class="btns wrap"><button type="button" class="pri" data-act="aiRun" data-id="' + esc(c.id) + '" id="ai-run">' + esc(t('ai_run')) + '</button><button type="button" class="ghost" data-act="aiKeyRemove">' + esc(t('ai_keyRemove')) + '</button></div>';
    else h += '<form id="ai-keyform" class="aikey" autocomplete="off"><label for="ai-key">' + esc(t('ai_keyLabel')) + '</label><input id="ai-key" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="ai-keyhint"><p class="hint" id="ai-keyhint">' + esc(t('ai_keyHint')) + '</p><p class="hint">' + esc(t('ai_keyNeeded')) + '</p><div class="btns"><button type="submit" class="sec">' + esc(t('ai_keySave')) + '</button></div></form>';
    h += '<p id="ai-status" class="hint" role="status" aria-live="polite"></p><div id="ai-out"></div></section>';
    return h;
  }
  function mk(tag, text, cls) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = String(text); return e; }
  function fillResult(box, res, heading, note) {
    box.appendChild(mk('h4', heading));
    if (note) box.appendChild(mk('p', note, 'hint'));
    var p = mk('p'); p.appendChild(mk('b', t('ai_sumH'))); p.appendChild(document.createTextNode(' ' + res.summary)); box.appendChild(p);
    box.appendChild(mk('h5', t('ai_gapsH')));
    var ul = mk('ul'); res.gaps.forEach(function (g) { ul.appendChild(mk('li', g)); }); box.appendChild(ul);
    box.appendChild(mk('h5', t('ai_nextH')));
    box.appendChild(mk('p', res.nextStep));
  }
  function paintAi() {
    var c = cur(), box = $('#ai-local'); if (!c || !box) return;
    box.textContent = '';
    fillResult(box, A.localAnalysis(c, now()), t('ai_localH'), t('ai_localNote'));
    var st = AIS[c.id], stale = !!st && st.sig !== A.signature(c), out = $('#ai-out'), status = $('#ai-status'), run = $('#ai-run'), kf = $('#ai-keyform');
    out.textContent = '';
    if (st && st.status === 'done') fillResult(out, st.result, t('ai_aiH'), stale ? t('ai_stale') : '');
    else if (st && st.status === 'error') out.appendChild(mk('p', t('ai_err_' + st.err), 'err'));
    if (run) { var busy = !!st && st.status === 'busy'; run.disabled = busy; run.textContent = busy ? t('ai_busy') : t('ai_run'); }
    var msg = S.aiMsg; S.aiMsg = null;
    if (status) { status.className = msg && msg.err ? 'err' : 'hint'; status.textContent = msg ? t(msg.k) : ''; }
    if (kf && !kf.getAttribute('data-bound')) kf.setAttribute('data-bound', '1'), kf && kf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var r = aiSaveKey($('#ai-key', kf).value);
      if (r.err) { var s = $('#ai-status'); if (s) { s.className = 'err'; s.textContent = t('ai_err_' + r.err); } $('#ai-key', kf).focus(); return; }
      S.aiMsg = { k: 'ai_keyOk' }; render();
    });
  }
  function runAi(c) {
    var key = aiKey(); if (!key) { S.aiMsg = { k: 'ai_keyNeeded', err: true }; return render(); }
    var id = c.id, sig = A.signature(c), req = A.buildRequest(key, A.buildFacts(c, now()));
    AIS[id] = { status: 'busy', sig: sig }; paintAi();
    fetch(req.url, req.init).then(function (r) {
      if (!r.ok) throw { status: r.status };
      return r.json();
    }).then(function (j) {
      var res = A.parseOutput(A.extractText(j));
      if (!res) throw { parse: true };
      AIS[id] = { status: 'done', sig: sig, result: res }; S.aiMsg = { k: 'ai_done' };
    }).catch(function (e) {
      var code = e && e.status ? A.errorKind(e.status) : e && e.parse ? 'parse' : e instanceof TypeError ? 'net' : 'parse';
      AIS[id] = { status: 'error', sig: sig, err: code };
    }).then(function () { paintAi(); });
  }

  /* ---------- events ---------- */
  root.addEventListener('click', async function (ev) {
    var b = ev.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), c = cur(), id = b.getAttribute('data-id'); lastTrig = act + '|' + (id || '');
    if (act === 'data') return dataDialog();
    if (act === 'overview') return overviewDialog();
    if (act === 'newcase') return caseDialog(b.getAttribute('data-kind') || 'other');
    if (act === 'remindopen') { S.cur = id; S.tab = 'steps'; S.f = { q: '', tag: '', sev: 0, voided: false }; save(); render(); return; }
    if (!c) return;
    if (act === 'view') { S.view = id === 'timeline' ? 'timeline' : 'list'; return render(); }
    if (act === 'gallery') return galleryDialog(c);
    if (act === 'tlopen') { var tv = C.voidedIds(c.entries); S.view = 'list'; S.f = { q: '', tag: '', sev: 0, voided: !!tv[id] }; S.focusId = id; return render(); }
    if (act === 'dltxt') { var ss = await sealStatus(c); return download('marginlog-chronology-' + slug(c.name) + '.txt', 'text/plain', '﻿' + C.chronologyText(c, labels(), now(), ss)); }
    if (act === 'tab') { S.tab = b.getAttribute('data-tab'); render(); var tb = $('#tab-' + S.tab); tb && tb.focus(); if (S.tab === 'report') fillReport(); return; }
    if (act === 'log') return entryDialog(c);
    if (act === 'livestart') { c.live = { start: now() }; if (!save()) { c.live = null; return; } render(); return; }
    if (act === 'livedrop') { var lv = c.live; c.live = null; if (!save()) { c.live = lv; return; } render(); toast(t('liveDropped'), t('undo'), function () { c.live = lv; save(); render(); }); return; }
    if (act === 'livestop') { var st = new Date(c.live.start); return entryDialog(c, { at: C.toLocalStamp(st), dur: Math.max(1, Math.ceil((now() - c.live.start) / 6e4)), live: true }); }
    if (act === 'aiRun') return runAi(c);
    if (act === 'aiKeyRemove') return removeAiKey(c);
    if (act === 'note') return noteDialog(c, id);
    if (act === 'void') return voidDialog(c, id);
    if (act === 'addstep') return stepDialog(c, b.getAttribute('data-kind'));
    if (act === 'stepdone') { var sd = (c.steps || []).filter(function (s) { return s.id === id; })[0]; if (sd) { sd.done = true; if (!save()) { sd.done = false; return; } } render(); if (S.tab === 'report') fillReport(); return; }
    if (act === 'stepdel') { var del = c.steps.filter(function (s) { return s.id === id; })[0]; var oldSteps = c.steps; c.steps = c.steps.filter(function (s) { return s.id !== id; }); if (!save()) { c.steps = oldSteps; return; } render(); toast(t('stepRemoved'), t('undo'), function () { c.steps.push(del); if (!save()) c.steps.pop(); render(); }); return; }
    if (act === 'clearf') { S.f = { q: '', tag: '', sev: 0, voided: S.f.voided }; return render(); }
    if (act === 'editcase') return caseDialog(null, c);
    if (act === 'archive') { c.archived = !c.archived; if (!save()) { c.archived = !c.archived; return; } render(); toast(t(c.archived ? 'archivedMsg' : 'unarchivedMsg')); return; }
    if (act === 'delcase') {
      return openDialog('<h2 id="dlg-h">' + esc(t('deleteCase')) + '</h2><p>' + esc(t('delConfirm', { name: c.name })) + '</p><p class="hint">' + esc(t('delHint')) + '</p><p class="err" role="alert" hidden></p><div class="btns"><button type="submit" class="pri danger">' + esc(t('deleteCase')) + '</button><button type="button" class="ghost" data-close>' + esc(t('cancel')) + '</button></div>', function () {
        var idx = S.cases.indexOf(c), was = S.cur, undone = false, pids = []; c.entries.forEach(function (e) { e.photos.forEach(function (p) { pids.push(p.id); }); });
        S.cases.splice(idx, 1); S.cur = (S.cases.filter(function (x) { return !x.archived; })[0] || S.cases[0] || {}).id || null;
        if (!save()) { S.cases.splice(idx, 0, c); S.cur = was; return err(saveMsg()); }
        setTimeout(function () { if (undone || S.cases.indexOf(c) >= 0) return; var used = {}; S.cases.forEach(function (x) { x.entries.forEach(function (e) { e.photos.forEach(function (p) { used[p.id] = 1; }); }); }); pids.forEach(function (id) { if (!used[id]) photoDel(id); }); }, 12000); closeDialog(); render();
        toast(t('caseDeleted'), t('undo'), function () { undone = true; S.cases.splice(idx, 0, c); S.cur = was; save(); render(); });
      }, { focus: '[data-close]' });
    }
    if (act === 'photo') { var d = await photoGet(b.getAttribute('data-pid')); if (!d) return toast(t('photoMissing')); var pd = openDialog('<h2 id="dlg-h" class="sr">' + esc(t('openPhoto')) + '</h2><img class="big-ph" alt=""><div class="btns"><button type="button" class="ghost" data-close>' + esc(t('close')) + '</button></div>'); $('.big-ph', pd).src = d; return; }
    if (act === 'verify') { var l = $('#chainline'); if (l) l.textContent = t('verifying'); return fillReport(); }
    if (act === 'copyrep') { var pv = $('#repview'), md = pv && pv.textContent ? pv.textContent : await fillReport(); try { await navigator.clipboard.writeText(md); toast(t('copied')); } catch (e) { var pre = $('#repview'); var r = document.createRange(); r.selectNodeContents(pre); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast(t('copyFail')); } return; }
    if (act === 'dlmd') { var md2 = await fillReport(); return download('marginlog-' + slug(c.name) + '.md', 'text/markdown', md2); }
    if (act === 'letter') return letterDialog(c);
    if (act === 'dlics') { var ics = C.toIcs(c, letterLabels(), now()); if (!ics) return toast(t('icsNone')); return download('marginlog-deadlines-' + slug(c.name) + '.ics', 'text/calendar', ics); }
    if (act === 'dlcsv') return download('marginlog-' + slug(c.name) + '.csv', 'text/csv', '﻿' + C.toCsv(c));
    if (act === 'print') { await fillReport(); return window.print(); }
  });
  root.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.id === 'lang') { S.lang = el.value; save(); render(); if (S.tab === 'report') fillReport(); }
    else if (el.id === 'casesel') { S.cur = el.value; S.f = { q: '', tag: '', sev: 0, voided: false }; save(); render(); if (S.tab === 'report') fillReport(); }
    else if (el.id === 'ftag') { S.f.tag = el.value; render(); }
    else if (el.id === 'fsev') { S.f.sev = +el.value; render(); }
    else if (el.id === 'fvoid') { S.f.voided = el.checked; render(); }
  });
  function onSearch(ev) {
    if (ev.target.id === 'fq' && !ev.isComposing) { S.f.q = ev.target.value; var pos = ev.target.selectionStart; render(); var q = $('#fq'); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }
  }
  root.addEventListener('input', onSearch); root.addEventListener('compositionend', onSearch);
  root.addEventListener('keydown', function (ev) {
    var tb = ev.target.closest && ev.target.closest('[role=tab]'); if (!tb || (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft' && ev.key !== 'Home' && ev.key !== 'End')) return;
    var keys = ['log', 'patterns', 'steps', 'report', 'case'], i = keys.indexOf(tb.getAttribute('data-tab'));
    i = ev.key === 'Home' ? 0 : ev.key === 'End' ? keys.length - 1 : (i + (ev.key === 'ArrowRight' ? 1 : keys.length - 1)) % keys.length;
    ev.preventDefault(); S.tab = keys[i]; render(); $('#tab-' + S.tab).focus(); if (S.tab === 'report') fillReport();
  });
  root.addEventListener('submit', function (ev) { ev.preventDefault(); });

  var tel = document.createElement('div'); tel.id = 'toast'; tel.className = 'toast'; tel.setAttribute('role', 'status'); tel.setAttribute('aria-live', 'polite'); tel.addEventListener('click', function (ev) { if (ev.target.tagName !== 'BUTTON') tel.innerHTML = ''; }); document.body.appendChild(tel);
  /* ---------- paid access ---------- */
  var CFG = window.ML_CONFIG || {}, Lic = window.MLLicense;
  function paywall() {
    var h = '<h2 id="dlg-h">' + esc(t('pwTitle')) + '</h2><p class="hint">' + esc(t('pwLead')) + '</p>';
    if (CFG.checkoutLive) h += '<p><a class="btn pri" href="' + esc(CFG.checkoutUrl) + '" rel="noopener">' + esc(t('pwBuy')) + '</a></p>';
    h += '<label for="pw-k">' + esc(t('pwKey')) + '</label><input id="pw-k" name="key" autocomplete="off" autocapitalize="off" spellcheck="false" required>' +
      '<p class="hint">' + esc(t('pwHint')) + '</p><p class="err" role="alert" hidden></p>' +
      '<div class="btns wrap"><button type="submit" class="pri">' + esc(t('pwActivate')) + '</button></div>';
    var d = openDialog(h, function (form) {
      return Lic.activate({ store: localStorage, fetch: window.fetch.bind(window), api: CFG.licenseApi, key: $('#pw-k', form).value }).then(function (r) {
        if (r.ok) { closeDialog(); toast(t('pwOk')); } else err(t(r.reason === 'network' ? 'pwNet' : 'pwBad'));
      });
    }, { focus: '#pw-k' });
    /* a locked app cannot be dismissed with Escape; only a valid key unlocks it */
    d.addEventListener('cancel', function (ev) { ev.preventDefault(); });
  }

  /* ---------- boot ---------- */
  var nl = (navigator.language || 'en').slice(0, 2); if (Object.prototype.hasOwnProperty.call(I.L, nl)) S.lang = nl;
  load(); render(); if (S.tab === 'report') fillReport();
  if (Lic && CFG.licenseApi) Lic.status({ store: localStorage, fetch: window.fetch.bind(window), api: CFG.licenseApi }).then(function (s) { if (s.locked) paywall(); }, function () { /* could not tell: stay open */ });
  try { if (/[?&]log=1\b/.test(location.search) && cur() && !blocked && !cur().live) { history.replaceState(null, '', location.pathname); entryDialog(cur()); } } catch (e7) { /* optional */ }
  if (blocked) toast(t('corruptBlocked'));
  else if (corruptKey) toast(t('corrupt', { k: corruptKey }));
  else if (!(window.crypto && window.crypto.subtle)) toast(t('cryptoFail'));
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
  setTimeout(photoSweep, 8000);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(function (ok) { persisted = ok; }); } catch (e5) { /* optional */ }
  try {
    var total = S.cases.reduce(function (a, c) { return a + C.events(c.entries).length; }, 0), lb = +localStorage.getItem(KEY + ':lastbackup') || 0;
    if (!blocked && !corruptKey && total >= 3 && now() - lb > 14 * 864e5) setTimeout(function () { if (!dlg) toast(t('backupNudge')); }, 1500);
  } catch (e6) { /* optional */ }
  window.addEventListener('storage', function (ev) { if (ev.key !== KEY) return; if (dlg) { stale = true; toast(t('otherTabBusy')); return; } stale = false; S.cases = []; S.cur = null; load(); render(); toast(t('otherTab')); });
  window.__ml = { S: S, render: render };
})();
