const test = require('node:test'), assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
const C = require('../app/core.js'), A = require('../app/ai.js'), I = require('../app/i18n.js');
const NOW = new Date(2026, 10, 2, 12, 0).getTime();
const KEY = 'sk-ant-api03-' + 'Ab3_'.repeat(10);
const mk = async (list, extra = {}) => {
  const c = Object.assign({ id: 'c', name: 'Flat 3B Kim', kind: 'noise', quiet: [22, 7], entries: [], steps: [], counterpart: 'Kim Minsu', goal: 'Ask Kim to stop', }, extra);
  for (const f of list) { const last = c.entries[c.entries.length - 1]; c.entries.push(await C.seal(last ? last.hash : '', Object.assign({ type: 'event', rec: C.parseAt(f.at).ts + 6e4, text: 'loud music from unit 3B, phone 010-1234-5678, Mapo-gu 12-3' }, f))); }
  return c;
};

test('validateKey accepts an API key shape and refuses everything else', () => {
  assert.equal(A.validateKey(KEY).ok, true);
  assert.equal(A.validateKey('  ' + KEY + '  ').key, KEY, 'surrounding spaces are trimmed');
  for (const [bad, reason] of [['', 'empty'], ['   ', 'empty'], [KEY + ' x', 'space'], ['sk-proj-abcdefghijklmnopqrstuvwx', 'prefix'], ['sk-ant-admin01-' + 'a'.repeat(30), 'admin'], ['sk-ant-short', 'format'], ['sk-ant-' + 'a'.repeat(30) + '!', 'format'], [null, 'empty']]) {
    const r = A.validateKey(bad); assert.equal(r.ok, false, String(bad)); assert.equal(r.reason, reason, String(bad));
  }
});

test('buildFacts sends counts and dates only: no names, entry text, notes, tags, phone or address', async () => {
  const c = await mk([{ at: '2026-10-30T23:10', sev: 4, dur: 30, tags: ['bass'], witness: 'Park Jiho' }, { at: '2026-10-31T23:40' }]);
  c.steps.push({ id: 's', kind: 'talk', at: '2026-10-29', note: 'Kim said sorry', due: '2026-11-01', done: false });
  const f = A.buildFacts(c, NOW), json = JSON.stringify(f);
  for (const secret of ['Kim', 'Park', 'Jiho', 'Flat', '3B', '010', 'Mapo', 'bass', 'stop', 'sorry', 'loud music']) assert.ok(!json.includes(secret), 'leaked: ' + secret);
  assert.equal(f.totals.incidents, 2); assert.equal(f.parties.counterpart, '당사자 A'); assert.equal(f.evidence.withWitness, 1); assert.equal(f.evidence.withTags, 1);
  assert.equal(f.steps[0].dueInDays, -1, 'a step due 1 Nov is one day overdue on 2 Nov');
  assert.equal(f.span.first, '2026-10-30');
});

test('buildRequest: direct browser call to the Messages API, key only in the header', async () => {
  const req = A.buildRequest(KEY, A.buildFacts(await mk([{ at: '2026-10-30T23:10' }]), NOW));
  assert.equal(req.url, 'https://api.anthropic.com/v1/messages'); assert.equal(req.init.method, 'POST');
  assert.equal(req.init.headers['x-api-key'], KEY); assert.equal(req.init.headers['anthropic-dangerous-direct-browser-access'], 'true'); assert.equal(req.init.headers['anthropic-version'], '2023-06-01');
  assert.ok(!req.init.body.includes(KEY), 'key must not reach the body');
  const body = JSON.parse(req.init.body); assert.equal(body.model, 'claude-haiku-5-5'); assert.equal(body.messages[0].role, 'user');
  assert.ok(!('temperature' in body) && !('thinking' in body), 'no sampling or thinking params');
  assert.ok(body.system.includes('법률 자문이 아닙니다')); assert.ok(body.system.includes('"gaps"'));
});

test('extractText joins text blocks and ignores anything else', () => {
  assert.equal(A.extractText({ content: [{ type: 'text', text: 'a' }, { type: 'thinking', thinking: 'x' }, { type: 'text', text: 'b' }] }), 'ab');
  assert.equal(A.extractText({ type: 'error', error: { message: 'no' } }), ''); assert.equal(A.extractText(null), '');
});

test('parseOutput reads plain, fenced and wrapped JSON, clips fields and refuses wrong shapes', () => {
  const plain = '{"summary":"요약","gaps":["사진 없음"],"next_step":"서면 통지"}';
  assert.deepEqual(A.parseOutput(plain), { source: 'ai', summary: '요약', gaps: ['사진 없음'], nextStep: '서면 통지' });
  assert.deepEqual(A.parseOutput('```json\n' + plain + '\n```').nextStep, '서면 통지');
  assert.deepEqual(A.parseOutput('Here: ' + plain + ' done').gaps, ['사진 없음']);
  const many = JSON.stringify({ summary: 'x'.repeat(900), gaps: Array.from({ length: 9 }, (_, i) => 'g' + i), next_step: 'n', extra: 1 });
  const o = A.parseOutput(many); assert.equal(o.summary.length, 600); assert.equal(o.gaps.length, 5); assert.ok(!('extra' in o));
  for (const bad of ['', 'not json', '{"summary":', '[1,2]', '{"summary":"","gaps":[],"next_step":""}', '{"gaps":"no"}', null]) assert.equal(A.parseOutput(bad), null, String(bad));
});

test('errorKind maps statuses to UI message codes', () => {
  assert.equal(A.errorKind(401), 'auth'); assert.equal(A.errorKind(403), 'auth'); assert.equal(A.errorKind(429), 'rate'); assert.equal(A.errorKind(529), 'server');
  assert.equal(A.errorKind(400), 'badreq'); assert.equal(A.errorKind(418), 'other');
});

test('localAnalysis works without a key and always gives gaps and a next step', async () => {
  const empty = A.localAnalysis(await mk([]), NOW);
  assert.equal(empty.source, 'local'); assert.ok(empty.summary.includes('아직 기록이 없습니다')); assert.ok(empty.gaps.length >= 1); assert.ok(empty.nextStep.length > 10);
  const c = await mk([{ at: '2026-10-28T23:00' }, { at: '2026-10-29T23:00' }, { at: '2026-10-30T23:00' }]);
  const r = A.localAnalysis(c, NOW);
  assert.ok(r.gaps.some(g => g.startsWith('사진 빠짐: 3건')), r.gaps.join(' | ')); assert.ok(r.gaps.length <= 5);
  assert.ok(r.summary.includes('기록 3건'));
  assert.equal(r.nextStep, A.localAnalysis(c, NOW).nextStep, 'deterministic');
});

test('localAnalysis reports an overdue reply deadline from the step ladder', async () => {
  const c = await mk([{ at: '2026-10-28T23:00' }, { at: '2026-10-29T23:00' }, { at: '2026-10-30T23:00' }]);
  c.steps.push({ id: 's', kind: 'written', at: '2026-10-25', note: '', due: '2026-11-01', done: false });
  const r = A.localAnalysis(c, NOW);
  assert.ok(r.nextStep.includes('답변 기한이 지났습니다') && r.nextStep.includes('2026-11-01'), r.nextStep);
});

test('signature changes when the log changes, not when nothing does', async () => {
  const c = await mk([{ at: '2026-10-30T23:10' }]); const s1 = A.signature(c);
  assert.equal(A.signature(c), s1);
  c.entries.push(await C.seal(c.entries[0].hash, { at: '2026-10-31T23:10', rec: NOW, text: 'again' })); assert.notEqual(A.signature(c), s1);
});

test('every UI message code exists in all five languages, and AI keys are the same in each', () => {
  const en = Object.keys(I.L.en).filter(k => k.startsWith('ai_'));
  assert.ok(en.length >= 25, 'AI keys present');
  for (const code of A.ERROR_CODES) assert.ok(('ai_err_' + code) in I.L.en, 'ai_err_' + code);
  for (const lang of Object.keys(I.L)) assert.deepEqual(Object.keys(I.L[lang]).filter(k => k.startsWith('ai_')).sort(), en.slice().sort(), lang);
});

test('static guard: the AI block never writes model output as HTML', () => {
  const src = fs.readFileSync(path.join(__dirname, '../app/app.js'), 'utf8');
  const start = src.indexOf('/* ---------- AI analysis'), end = src.indexOf('/* ---------- events ---------- */');
  assert.ok(start > 0 && end > start);
  const block = src.slice(start, end);
  assert.ok(!/innerHTML|insertAdjacentHTML|outerHTML/.test(block), 'no HTML sinks in the AI block');
  assert.ok(!/fetch\(/.test(src.slice(0, start)) && !/fetch\(/.test(src.slice(end)), 'fetch only in runAi');
});

test('the AI feature needs no new library and no build step: ai.js is a plain script that core.js and app.js load', () => {
  const html = fs.readFileSync(path.join(__dirname, '../app/index.html'), 'utf8');
  assert.ok(html.indexOf('ai.js') > html.indexOf('core.js') && html.indexOf('ai.js') < html.indexOf('app.js'));
  const headers = fs.readFileSync(path.join(__dirname, '../_headers'), 'utf8');
  assert.ok(headers.includes('connect-src \'self\' https://api.anthropic.com'), 'CSP allows only the Anthropic origin for fetch');
});
