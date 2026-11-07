/* Marginlog AI analysis: pure logic, no DOM and no network. Browser: window.MLAI. Node tests: require().
   The panel always shows localAnalysis() (computed here from core.js rules). The API is called only from app.js, on an explicit click,
   with the request built by buildRequest() and the reply read by extractText() + parseOutput(). */
(function (root) {
  'use strict';
  var C = typeof module !== 'undefined' && module.exports ? require('./core.js') : root.MLCore;
  var MODEL = 'claude-haiku-5-5', KEY_STORAGE = 'marginlog-ai-key', API_URL = 'https://api.anthropic.com/v1/messages', API_VERSION = '2023-06-01', MAX_TOKENS = 900;

  var SYSTEM_PROMPT = [
    '당신은 분쟁 기록 정리를 돕는 도우미입니다. 사용자 메시지의 JSON은 한 사건을 익명화한 집계입니다. 사람 이름, 주소, 전화번호, 기록 본문은 포함되어 있지 않습니다. 당사자는 "당사자 A"로 표시됩니다.',
    '다음을 평이한 한국어로 작성하세요: (1) summary: 기록의 흐름을 2~3문장으로 요약, (2) gaps: 증거에서 빠진 부분과 보완 방법을 최대 5개, (3) next_step: 에스컬레이션 단계 기준으로 다음 한 단계 제안.',
    '이 결과는 추정이며 법률 자문이 아닙니다. 법적 결론이나 승소 가능성을 단정하지 마세요. 집계에 적힌 내용만 근거로 삼으세요.',
    '반드시 다음 형식의 JSON 객체 하나만 출력하세요: {"summary": "문자열", "gaps": ["문자열"], "next_step": "문자열"}. 설명 문장이나 코드 블록을 덧붙이지 마세요.'
  ].join('\n');

  var STEP_KO = { talk: '직접 대화', written: '서면 통지', complaint: '민원 제기', mediation: '조정', authority: '관계기관 신고', legal: '법적 절차' };
  var TREND_KO = { up: '증가', down: '감소', flat: '유지' };
  var TIP_KO = { text: '상세 기록(40자 이상)', dur: '지속 시간', witness: '목격자', photo: '사진', timely: '24시간 안의 기록', tag: '태그' };
  var NEXT_KO = {
    none: function () { return '먼저 사건을 한두 건 기록하세요. 날짜와 시간, 짧은 내용이면 충분합니다.'; },
    talk: function () { return '가장 가벼운 단계는 차분하게 직접 말하는 것입니다. 대화한 날짜와 반응을 기록으로 남기세요.'; },
    written: function (s) { return '기록이 충분합니다. 날짜를 적은 서면 통지(' + s + ')를 보내고, 답변 기한을 대응 탭에 기록하세요.'; },
    complaint: function (s) { return '서면 통지 뒤에도 반복됩니다. 다음 단계는 ' + s + '입니다.'; },
    next: function (s) { return '앞 단계로는 멈추지 않았습니다. 다음 검토 단계: ' + s + '.'; },
    waiting: function (s, d) { return '답변 기한이 남아 있습니다: ' + s + ' (기한 ' + d + '). 기한까지 기다리며 기록을 이어 가세요.'; },
    overdue: function (s, d) { return '답변 기한이 지났습니다: ' + s + ' (기한 ' + d + '). 답이 없었다는 사실도 기록으로 남기고 다음 단계를 준비하세요.'; },
    keep: function () { return '아직 단계를 올릴 근거가 부족합니다. 계속 기록하세요.'; },
    exhausted: function () { return '사다리의 모든 단계를 거쳤습니다. 관계기관이나 법률 상담 창구를 확인하세요.'; }
  };
  var GAP_KO = {
    count: '기록이 아직 적습니다. 3건 이상이면 패턴을 보여 줄 수 있습니다.',
    span: '기록 기간이 짧습니다. 1주 이상이면 날짜의 범위가 넓어집니다.',
    parties: '사건 정보에 상대방과 원하는 결과를 적어 두세요.',
    written: '서면으로 통지한 기록이 없습니다.',
    late: '48시간이 지나 늦게 기록한 항목이 많습니다. 발생한 날 기록하세요.'
  };

  function clipStr(v, n) { return typeof v === 'string' ? v.trim().slice(0, n) : ''; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* Key check only: the shape of an Anthropic API key. Admin keys (sk-ant-admin...) are refused: they belong to the Admin API. */
  function validateKey(raw) {
    var k = String(raw == null ? '' : raw).trim();
    if (!k) return { ok: false, reason: 'empty' };
    if (/\s/.test(k)) return { ok: false, reason: 'space' };
    if (k.indexOf('sk-ant-') !== 0) return { ok: false, reason: 'prefix' };
    if (k.indexOf('sk-ant-admin') === 0) return { ok: false, reason: 'admin' };
    if (!/^sk-ant-[A-Za-z0-9_-]{20,200}$/.test(k)) return { ok: false, reason: 'format' };
    return { ok: true, reason: '', key: k };
  }

  /* Minimum facts for the model: counts, dates, durations, severity, which evidence items exist, readiness and step timing.
     No case name, no entry text, no step notes, no free tags, no counterpart name, no witness name. */
  function buildFacts(c, nowTs) {
    var st = C.stats(c, nowTs), rd = C.readiness(c, nowTs), evs = C.events(c.entries), today = C.toLocalStamp(new Date(nowTs)).slice(0, 10);
    var gaps = {}, withWitness = 0, withPhoto = 0, tagged = 0;
    evs.forEach(function (e) {
      C.strength(e).tips.forEach(function (t) { gaps[t] = (gaps[t] || 0) + 1; });
      if (e.witness) withWitness++;
      if (e.photos && e.photos.length) withPhoto++;
      if (e.tags && e.tags.length) tagged++;
    });
    var todayN = C.dayNum(today + 'T00:00');
    return {
      caseType: Object.prototype.hasOwnProperty.call(C.KINDS, c.kind) ? c.kind : 'other',
      parties: { reporter: '기록자', counterpart: c.counterpart ? '당사자 A' : null },
      hasGoal: !!c.goal,
      quietHours: c.quiet ? [pad2(c.quiet[0]) + ':00', pad2(c.quiet[1]) + ':00'] : null,
      totals: {
        incidents: st.total, last30: st.last30, prev30: st.prev30, trend: st.trend, avgSeverity: st.avgSev,
        minutes: st.minutes, quietHits: st.quiet, recordedLate: st.late, longestGapDays: st.longestGap, daysSinceLast: st.sinceDays
      },
      span: { first: st.first ? st.first.slice(0, 10) : null, last: st.last ? st.last.slice(0, 10) : null },
      evidence: { avgStrength: C.caseStrength(c), withWitness: withWitness, withPhoto: withPhoto, withTags: tagged, missing: gaps },
      readiness: { met: rd.met, total: rd.total, unmet: rd.checks.filter(function (x) { return !x.ok; }).map(function (x) { return x.key; }) },
      steps: (c.steps || []).map(function (s) {
        var dn = /^\d{4}-\d{2}-\d{2}$/.test(s.due || '') ? C.dayNum(s.due + 'T00:00') : null;
        return { kind: s.kind, done: !!s.done, dueInDays: dn == null ? null : dn - todayN };
      }),
      ladder: C.ladder(c)
    };
  }

  /* Plain Korean analysis from the same rules the app already uses. Works with no key and no network. */
  function localAnalysis(c, nowTs) {
    var f = buildFacts(c, nowTs), t = f.totals, out = { source: 'local', summary: '', gaps: [], nextStep: '', readiness: { met: f.readiness.met, total: f.readiness.total } };
    if (!t.incidents) out.summary = '아직 기록이 없습니다. 사건이 생기면 날짜와 시간을 먼저 남기세요.';
    else out.summary = '기록 ' + t.incidents + '건, 최근 30일 ' + t.last30 + '건(그 전 30일 ' + t.prev30 + '건). 최근 흐름: ' + TREND_KO[t.trend] + '.' + (t.avgSeverity ? ' 평균 심각도 ' + t.avgSeverity + '/5.' : '');
    Object.keys(TIP_KO).forEach(function (k) { if (f.evidence.missing[k]) out.gaps.push(TIP_KO[k] + ' 빠짐: ' + f.evidence.missing[k] + '건'); });
    f.readiness.unmet.forEach(function (k) {
      if (k === 'strength') out.gaps.push('기록 상세도가 낮습니다(평균 ' + f.evidence.avgStrength + '%). 기준은 60%입니다. 법률상 증거의 판단이 아닙니다.');
      else if (GAP_KO[k]) out.gaps.push(GAP_KO[k]);
    });
    if (!out.gaps.length) out.gaps.push('눈에 띄게 빠진 증거는 없습니다. 기록을 계속 남기세요.');
    out.gaps = out.gaps.slice(0, 5);
    var sg = C.suggestNext(c, nowTs), step = sg.step || null, sk = sg.kind || (step && step.kind) || '', sn = STEP_KO[sk] || sk;
    var fn = NEXT_KO[sg.key] || NEXT_KO.keep;
    out.nextStep = fn(sn, step ? step.due : '');
    return out;
  }

  /* Request for the Messages API. The key goes only in the x-api-key header, never in the body. */
  function buildRequest(key, facts) {
    return {
      url: API_URL,
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': API_VERSION,
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: MODEL, max_tokens: MAX_TOKENS, system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: '사건 집계(JSON):\n' + JSON.stringify(facts) }]
        })
      }
    };
  }

  /* Joins the text blocks of a Messages reply. Other block types and error bodies yield ''. */
  function extractText(resp) {
    if (!resp || !Array.isArray(resp.content)) return '';
    return resp.content.filter(function (b) { return b && b.type === 'text' && typeof b.text === 'string'; }).map(function (b) { return b.text; }).join('');
  }

  /* Reads the model's JSON object. Returns null when the reply does not have the expected shape. */
  function parseOutput(text) {
    var s = String(text == null ? '' : text).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    var i = s.indexOf('{'), j = s.lastIndexOf('}');
    if (i < 0 || j < i) return null;
    var o;
    try { o = JSON.parse(s.slice(i, j + 1)); } catch (e) { return null; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    var summary = clipStr(o.summary, 600), next = clipStr(o.next_step, 400);
    var gaps = (Array.isArray(o.gaps) ? o.gaps : []).map(function (g) { return clipStr(g, 300); }).filter(Boolean).slice(0, 5);
    if (!summary && !next && !gaps.length) return null;
    return { source: 'ai', summary: summary, gaps: gaps, nextStep: next };
  }

  /* Maps an HTTP status (or a missing one) to a message code for the UI. */
  function errorKind(status) {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429 || status === 402) return 'rate';
    if (status >= 500) return 'server';
    if (status === 400 || status === 404 || status === 413 || status === 422) return 'badreq';
    return 'other';
  }

  /* Changes whenever the entries or steps change, so a stored AI result can say it is out of date. */
  function signature(c) {
    var e = c.entries || [], s = c.steps || [], last = e.length ? e[e.length - 1].hash : '';
    return e.length + ':' + last + ':' + s.length + ':' + s.filter(function (x) { return x.done; }).length;
  }

  var api = {
    MODEL: MODEL, KEY_STORAGE: KEY_STORAGE, API_URL: API_URL, SYSTEM_PROMPT: SYSTEM_PROMPT, ERROR_CODES: ['auth', 'rate', 'server', 'badreq', 'other', 'parse', 'net', 'key', 'storage'],
    validateKey: validateKey, buildFacts: buildFacts, localAnalysis: localAnalysis, buildRequest: buildRequest,
    extractText: extractText, parseOutput: parseOutput, errorKind: errorKind, signature: signature
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MLAI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
