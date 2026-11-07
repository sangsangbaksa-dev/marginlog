/* Privacy and terms notes. Plain text only; build-site.js escapes it.
   Unresolved commercial facts stay in the "na" box. Do not add a price, a seller name, a region or a refund rule here. */
module.exports = {
  en: {
    privacyTitle: 'Privacy note – Marginlog',
    termsTitle: 'Terms note – Marginlog',
    privacyDesc: 'What Marginlog stores on this device, what a license check sends, and what is not yet stated.',
    termsDesc: 'What the Marginlog fingerprint chain, detail score and escalation prompts do and do not mean. Purchase is not yet available.',
    home: 'Home', privacyLink: 'Privacy note', termsLink: 'Terms note',
    privacy: [
      { t: 'p', v: 'This note describes what the Marginlog code in this repository does with data. It is not a privacy policy issued by a named organisation.' },
      { t: 'na', h: 'Not yet available', v: [
        'The operator’s legal name, and any postal or email contact',
        'A contact for privacy requests',
        'A price, a checkout, billing, a refund rule, and how many devices a license key can activate',
        'Where the host or Lemon Squeezy stores connection or license data, and for how long',
        'A deadline for deleting data held by anyone other than you',
        'A country or region of storage, and a governing law'
      ] },
      { t: 'p', v: 'Those items are left blank on purpose. This page does not invent them.' },
      { t: 'h', v: 'Cases and photos stay in this browser' },
      { t: 'p', v: 'There is no account. Saving a case does not upload the case. The browser keeps:' },
      { t: 'ul', v: [
        'localStorage marginlog:v1 — case name, other party, goal, entry text, the time you entered, the time you say it happened, severity, duration, tags, witness text, notes, void reasons, steps, archived flag, the chosen language and the open case.',
        'localStorage marginlog:v1:cp — how many sealed records the case had, and the last fingerprint, so a shortened log can be noticed later.',
        'localStorage marginlog:v1:lastbackup — when a backup file was last downloaded.',
        'localStorage marginlog:v1:corrupt and marginlog:v1:corrupt-b — a copy of data the app could not read, if it managed to keep one.',
        'IndexedDB database marginlog, store photos — resized photos.',
        'localStorage marginlog:license — the license key and when it was last checked, after a check that accepted it.',
        'localStorage marginlog:gate — whether the last status said paid access was on (1 or 0).',
        'localStorage marginlog-ai-key — an Anthropic API key, only if you save one.'
      ] },
      { t: 'p', v: 'Clearing this site’s data in the browser removes those copies from that browser. The app can delete a case (with a short undo) and can remove the AI key. This code does not keep a server copy of cases, so it has nothing on a server to delete and it states no deletion deadline.' },
      { t: 'h', v: 'Exports can hold personal data' },
      { t: 'p', v: 'A download stays on your device unless you send it on yourself. It contains what you typed, which can include other people’s names and details.' },
      { t: 'ul', v: [
        'Backup JSON, including photos. A passphrase, if you set one, encrypts the file with AES-GCM. The key is derived with PBKDF2-SHA256 and 310000 iterations. The passphrase is not stored. This app cannot recover a forgotten passphrase.',
        'Report (copy, print or PDF, Markdown), chronology (.txt), CSV, digest (.md), calendar (.ics) and the written-notice draft.',
        'Print and PDF can include the photos. Reports and CSV include short fingerprints. The calendar file includes case and step names you entered.'
      ] },
      { t: 'h', v: 'License check' },
      { t: 'p', v: 'When the app opens, it sends GET /api/license to this same website. There is no body. The reply is JSON with configured set to true or false. configured is true only when the server environment has LEMONSQUEEZY_PRODUCT_ID set. The function in this repository does not write that request to a database.' },
      { t: 'p', v: 'When you press Unlock, and again about every 7 days while a key is saved, the app sends POST /api/license with JSON {"key":"<the license key>"}.' },
      { t: 'p', v: 'If paid access is not configured, the function replies {configured:false} and does not contact Lemon Squeezy.' },
      { t: 'p', v: 'If it is configured, the function sends the key as the form field license_key to https://api.lemonsqueezy.com/v1/licenses/validate. It accepts the key only when Lemon Squeezy reports valid, the status is active or inactive, and the product id matches LEMONSQUEEZY_PRODUCT_ID. The browser is told only {configured, valid}. This function does not store the rest of Lemon Squeezy’s reply. The browser then stores the key in localStorage.' },
      { t: 'p', v: 'The service worker does not cache /api. The status request also asks the browser not to use its HTTP cache (cache: no-store). Case text, photos, names and the AI key are not part of the license request.' },
      { t: 'h', v: 'Payment' },
      { t: 'p', v: 'This website does not offer a checkout. The checkout address in the app configuration is still a placeholder that contains example.com, and buy buttons stay hidden for that reason. Price, refunds, billing and an activation limit are not yet available. A test checkout is not a sale, and this site does not link to one.' },
      { t: 'p', v: 'The license code can call Lemon Squeezy’s license API, as described above. That is not a statement that a store is open or that any price has been set.' },
      { t: 'h', v: 'Optional AI' },
      { t: 'p', v: 'Nothing is sent to Anthropic unless you save your own API key and press Analyse with AI. The request is POST https://api.anthropic.com/v1/messages, model claude-haiku-5-5. Your key is the x-api-key header. It stays in this browser and is not sent to /api/license.' },
      { t: 'p', v: 'The message is counts and dates for one case: type, totals, date span, durations, severity, which detail items are missing (text length, duration, witness, photo, timing, tag), readiness checks and step timing. It does not include the case name, entry text, notes, names, addresses, phone numbers or tags. If an other party was filled in, the label sent is 당사자 A. The reply is shown on screen and is not written to disk by this code. It is an estimate, not a legal assessment.' },
      { t: 'h', v: 'Hosting and other parties' },
      { t: 'p', v: 'The site is published for https://marginlog.pages.dev with Cloudflare Pages. Opening it sends an ordinary browser request to that host, which can include the page address, IP address and user agent. This repository adds no analytics script and sets no cookie of its own. It does not say how long the host keeps connection logs.' },
      { t: 'p', v: 'Parties this code can contact:' },
      { t: 'ul', v: [
        'Cloudflare, as the host of the pages and of /api/license.',
        'Lemon Squeezy at api.lemonsqueezy.com, only for the license validation above, and only when paid access is configured.',
        'Anthropic at api.anthropic.com, only for the optional AI request.'
      ] },
      { t: 'p', v: 'This site does not load a font file, an analytics script or a payment frame. The typefaces are ones already on your device. The service worker stores successful same-origin GET responses, except anything under /api, so the app can open offline. It does not store other websites’ responses.' }
    ],
    terms: [
      { t: 'p', v: 'This note describes the tool. It is not a contract for a paid product, because this website does not offer a purchase. It is not legal advice.' },
      { t: 'na', h: 'Not yet available', v: [
        'The seller’s legal name and a contact address',
        'A price, a checkout, billing, a refund rule and an activation limit',
        'A governing law or a court'
      ] },
      { t: 'p', v: 'This page does not fill those in.' },
      { t: 'h', v: 'What the tool is' },
      { t: 'p', v: 'Marginlog is a browser app for a dated personal log. It can show counts, a pattern, a detail score and a suggested next step, and it can build a file you copy or print. None of that decides who is right, and none of it is a promise that anyone will accept the log.' },
      { t: 'h', v: 'Fingerprints' },
      { t: 'p', v: 'Each saved entry stores a SHA-256 fingerprint of that entry together with the previous fingerprint. Notes, void records and photo fingerprints are included. If the stored data no longer matches, the report says the check failed and where.' },
      { t: 'p', v: 'A match does not prove that the words are true. It does not prove when something happened: the times come from the clock of the device that wrote them, and that clock can be wrong or changed. It does not stop someone who edits the stored data and calculates new fingerprints. It is not a notarised timestamp, and it is not proof that the log was not rewritten.' },
      { t: 'h', v: 'Record detail' },
      { t: 'p', v: 'The score labelled Record detail adds points for 40 or more characters (25), a duration (15), a witness note (15), a photo (20), a recorded time within 24 hours of the time you entered (15), and a tag (10). The case figure is the average of its entries. It is a reminder of blank fields. It is not a measure of legal evidence and not a prediction of an outcome.' },
      { t: 'h', v: 'Escalation suggestions' },
      { t: 'p', v: 'The ladder is a fixed list for the case type you picked: talk, written notice, complaint, mediation, and then either an authority or a legal step. The highlighted suggestion follows rules in the software, using counts, severity and dates you entered, and whether you marked a reply. It is a prompt, not a legal assessment of your situation.' },
      { t: 'p', v: 'The written-notice draft is a template built from your log. You edit it and you decide whether and how to send it. Rules differ by place. The app does not say what the law requires.' },
      { t: 'h', v: 'Your data and other people' },
      { t: 'p', v: 'You decide what to record and what to do with files you export. Record only what the law where you are allows. An export can contain other people’s personal details if you typed them. The privacy note says what stays on the device and what can be sent.' },
      { t: 'h', v: 'Purchase' },
      { t: 'p', v: 'Purchase is not yet available on this website. No price, refund rule or activation limit is stated. If a copy of the app asks for a license key, that check is the one in the privacy note. Typing a key on that screen is not a purchase from this page. A test checkout elsewhere is not a sale by this website.' },
      { t: 'h', v: 'These notes' },
      { t: 'p', v: 'They describe the code in this repository. They do not add a seller identity, a refund promise or a choice of court. If a sentence here is broader than the code, the code is what the software does, and the sentence should be narrowed. It should not be read as an extra promise.' }
    ]
  },
  ko: {
    privacyTitle: '개인정보 안내 – Marginlog',
    termsTitle: '이용 안내 – Marginlog',
    privacyDesc: 'Marginlog가 이 기기에 저장하는 것, 라이선스 확인이 보내는 것, 그리고 아직 정하지 않은 항목.',
    termsDesc: '지문 사슬, 기록 상세 점수, 단계 제안이 의미하는 것과 의미하지 않는 것. 구매는 아직 제공되지 않습니다.',
    home: '홈', privacyLink: '개인정보 안내', termsLink: '이용 안내',
    privacy: [
      { t: 'p', v: '이 안내는 이 저장소의 Marginlog 코드가 데이터를 어떻게 다루는지 설명합니다. 특정 단체가 발행한 개인정보 처리방침이 아닙니다.' },
      { t: 'na', h: '아직 제공되지 않음', v: [
        '운영자의 법적 이름, 우편 또는 이메일 연락처',
        '개인정보 요청을 받을 연락처',
        '가격, 결제 페이지, 청구, 환불 규칙, 라이선스 키를 쓸 수 있는 기기 수',
        '호스트나 Lemon Squeezy가 접속 또는 라이선스 데이터를 어디에, 얼마나 보관하는지',
        '당신 이외의 사람이 가진 데이터를 지우기까지의 기한',
        '저장 국가나 지역, 준거법'
      ] },
      { t: 'p', v: '이 항목은 일부러 비워 두었습니다. 이 페이지는 지어내지 않습니다.' },
      { t: 'h', v: '사건과 사진은 이 브라우저에 남습니다' },
      { t: 'p', v: '계정은 없습니다. 사건을 저장해도 사건 내용이 업로드되지 않습니다. 브라우저에 남는 것은 다음과 같습니다.' },
      { t: 'ul', v: [
        'localStorage marginlog:v1 — 사건 이름, 상대방, 원하는 결과, 기록 본문, 입력한 시각, 일어났다고 적은 시각, 심각도, 지속 시간, 태그, 목격자 메모, 추가 메모, 무효 사유, 대응 단계, 보관 여부, 선택한 언어, 열린 사건.',
        'localStorage marginlog:v1:cp — 봉인된 기록 수와 마지막 지문. 기록이 뒤에서 잘렸는지 나중에 알아보기 위한 값입니다.',
        'localStorage marginlog:v1:lastbackup — 백업 파일을 마지막으로 내려받은 시각.',
        'localStorage marginlog:v1:corrupt 와 marginlog:v1:corrupt-b — 앱이 읽지 못한 데이터의 사본. 사본을 남길 수 있었을 때만.',
        'IndexedDB 데이터베이스 marginlog, 스토어 photos — 크기를 줄인 사진.',
        'localStorage marginlog:license — 확인을 통과한 라이선스 키와 마지막으로 확인한 시각.',
        'localStorage marginlog:gate — 마지막 상태가 유료 확인을 켜 둔 상태였는지 (1 또는 0).',
        'localStorage marginlog-ai-key — Anthropic API 키. 직접 저장한 경우에만.'
      ] },
      { t: 'p', v: '브라우저에서 이 사이트의 데이터를 지우면 그 브라우저의 사본이 사라집니다. 앱에서 사건을 삭제할 수 있고(잠시 되돌리기), AI 키도 지울 수 있습니다. 이 코드는 사건의 서버 사본을 두지 않으므로 서버에서 지울 사본이 없고, 삭제 기한도 적지 않습니다.' },
      { t: 'h', v: '내보낸 파일에는 개인정보가 들어갈 수 있습니다' },
      { t: 'p', v: '내려받은 파일은 당신이 다시 보내지 않는 한 기기에 있습니다. 당신이 입력한 내용이 들어 있으며, 다른 사람의 이름과 정보가 포함될 수 있습니다.' },
      { t: 'ul', v: [
        '백업 JSON, 사진 포함. 암호 문구를 넣으면 AES-GCM으로 암호화됩니다. 키는 PBKDF2-SHA256, 반복 310000회로 만듭니다. 암호 문구는 저장되지 않습니다. 이 앱은 잊은 암호 문구를 복구하지 못합니다.',
        '보고서(복사, 인쇄 또는 PDF, Markdown), 시간순 기록(.txt), CSV, 요약(.md), 캘린더(.ics), 서면 통보 초안.',
        '인쇄와 PDF에는 사진이 들어갈 수 있습니다. 보고서와 CSV에는 짧은 지문이 들어갑니다. 캘린더 파일에는 입력한 사건 이름과 단계 이름이 들어갑니다.'
      ] },
      { t: 'h', v: '라이선스 확인' },
      { t: 'p', v: '앱을 열면 이 웹사이트로 GET /api/license 를 보냅니다. 본문은 없습니다. 응답 JSON의 configured 는 true 또는 false 입니다. configured 가 true 인 것은 서버 환경에 LEMONSQUEEZY_PRODUCT_ID 가 있을 때뿐입니다. 이 저장소의 함수는 그 요청을 데이터베이스에 쓰지 않습니다.' },
      { t: 'p', v: '잠금 해제를 누를 때, 그리고 키가 저장된 동안 약 7일마다, 앱은 POST /api/license 로 JSON {"key":"<라이선스 키>"} 를 보냅니다.' },
      { t: 'p', v: '유료 확인이 꺼져 있으면 함수는 {configured:false} 를 돌려주고 Lemon Squeezy 에 연락하지 않습니다.' },
      { t: 'p', v: '켜져 있으면 함수는 키를 폼 필드 license_key 로 https://api.lemonsqueezy.com/v1/licenses/validate 에 보냅니다. Lemon Squeezy 가 valid 라고 하고, 상태가 active 또는 inactive 이며, 상품 id 가 LEMONSQUEEZY_PRODUCT_ID 와 같을 때만 받습니다. 브라우저에는 {configured, valid} 만 알려 줍니다. 이 함수는 Lemon Squeezy 응답의 나머지를 저장하지 않습니다. 브라우저는 그다음 키를 localStorage 에 저장합니다.' },
      { t: 'p', v: '서비스 워커는 /api 를 캐시에 넣지 않습니다. 상태 요청도 브라우저 HTTP 캐시를 쓰지 않도록 합니다(cache: no-store). 사건 본문, 사진, 이름, AI 키는 라이선스 요청에 포함되지 않습니다.' },
      { t: 'h', v: '결제' },
      { t: 'p', v: '이 웹사이트는 결제 페이지를 제공하지 않습니다. 앱 설정의 결제 주소는 아직 example.com 이 들어 있는 자리표시자이고, 그래서 구매 버튼이 숨겨져 있습니다. 가격, 환불, 청구, 활성화 횟수는 아직 제공되지 않습니다. 테스트 결제는 판매가 아니며, 이 사이트는 그쪽으로 연결하지 않습니다.' },
      { t: 'p', v: '라이선스 코드는 위에서 적은 대로 Lemon Squeezy 라이선스 API를 호출할 수 있습니다. 그것은 상점이 열려 있다거나 가격이 정해졌다는 말이 아닙니다.' },
      { t: 'h', v: '선택적 AI' },
      { t: 'p', v: '직접 발급한 API 키를 저장하고 “AI로 분석”을 누르기 전에는 Anthropic 으로 아무것도 보내지 않습니다. 요청은 POST https://api.anthropic.com/v1/messages , 모델 claude-haiku-5-5 입니다. 키는 x-api-key 헤더입니다. 이 브라우저에만 있고 /api/license 로는 보내지 않습니다.' },
      { t: 'p', v: '메시지에는 한 사건의 건수와 날짜가 들어갑니다. 유형, 합계, 기간, 지속 시간, 심각도, 비어 있는 상세 항목(글 길이, 지속 시간, 목격자, 사진, 기록 시점, 태그), 준비 점검, 단계 시점입니다. 사건 이름, 기록 본문, 메모, 이름, 주소, 전화번호, 태그는 들어가지 않습니다. 상대방을 적었다면 보내는 표시는 당사자 A 입니다. 응답은 화면에만 보이고 이 코드가 디스크에 쓰지 않습니다. 추정이며 법률 판단이 아닙니다.' },
      { t: 'h', v: '호스팅과 다른 당사자' },
      { t: 'p', v: '사이트는 Cloudflare Pages 로 https://marginlog.pages.dev 에 게시됩니다. 열면 그 호스트로 보통의 브라우저 요청이 가며, 페이지 주소, IP 주소, 사용자 에이전트가 포함될 수 있습니다. 이 저장소는 분석 스크립트를 넣지 않고, 자체 쿠키를 설정하지 않습니다. 호스트가 접속 기록을 얼마나 보관하는지는 적지 않습니다.' },
      { t: 'p', v: '이 코드가 연락할 수 있는 곳:' },
      { t: 'ul', v: [
        'Cloudflare — 페이지와 /api/license 의 호스트.',
        'Lemon Squeezy (api.lemonsqueezy.com) — 위의 라이선스 확인만, 유료 확인이 켜져 있을 때만.',
        'Anthropic (api.anthropic.com) — 선택적 AI 요청만.'
      ] },
      { t: 'p', v: '이 사이트는 글꼴 파일, 분석 스크립트, 결제 프레임을 불러오지 않습니다. 글꼴은 기기에 이미 있는 것입니다. 서비스 워커는 같은 출처의 성공한 GET 응답만 저장하고 /api 아래는 제외합니다. 다른 웹사이트의 응답은 저장하지 않습니다.' }
    ],
    terms: [
      { t: 'p', v: '이 안내는 도구를 설명합니다. 이 웹사이트는 구매를 제공하지 않으므로 유료 상품의 계약이 아닙니다. 법률 자문도 아닙니다.' },
      { t: 'na', h: '아직 제공되지 않음', v: [
        '판매자의 법적 이름과 연락처',
        '가격, 결제 페이지, 청구, 환불 규칙, 활성화 횟수',
        '준거법이나 법원'
      ] },
      { t: 'p', v: '이 페이지는 그것들을 채우지 않습니다.' },
      { t: 'h', v: '이 도구가 하는 일' },
      { t: 'p', v: 'Marginlog 는 날짜가 있는 개인 기록을 위한 브라우저 앱입니다. 건수, 패턴, 상세 점수, 다음 단계 제안을 보여 주고, 복사하거나 인쇄할 파일을 만들 수 있습니다. 어느 쪽이 옳은지 판단하지 않고, 누군가 기록을 받아 준다는 약속도 아닙니다.' },
      { t: 'h', v: '지문' },
      { t: 'p', v: '저장된 기록마다 그 기록과 직전 지문을 합친 SHA-256 지문이 있습니다. 메모, 무효 기록, 사진 지문도 포함됩니다. 저장된 데이터가 지문과 맞지 않으면 보고서가 실패한 위치와 함께 알려 줍니다.' },
      { t: 'p', v: '지문이 맞다는 것은 글이 사실이라는 증거가 아닙니다. 언제 일어났는지도 증명하지 않습니다. 시각은 그 기록을 쓴 기기의 시계이고, 시계는 틀리거나 바뀔 수 있습니다. 저장된 데이터를 고치고 지문을 다시 계산하는 사람을 막지 못합니다. 공증된 시각 증명이 아니고, 기록이 고쳐지지 않았다는 증거도 아닙니다.' },
      { t: 'h', v: '기록 상세' },
      { t: 'p', v: '“기록 상세” 점수는 40자 이상(25), 지속 시간(15), 목격자 메모(15), 사진(20), 입력한 시각으로부터 24시간 안에 기록(15), 태그(10)에 점수를 더합니다. 사건 수치는 기록들의 평균입니다. 빈칸을 알려 주는 표시입니다. 법률상 증거의 크기가 아니고, 결과를 예측하지 않습니다.' },
      { t: 'h', v: '단계 제안' },
      { t: 'p', v: '사다리는 고른 사건 유형의 고정 목록입니다. 대화, 서면 통보, 민원, 조정, 그다음 기관 또는 법적 단계입니다. 강조된 제안은 소프트웨어 규칙을 따릅니다. 건수, 심각도, 입력한 날짜, 답변을 표시했는지를 봅니다. 당신의 상황에 대한 법률 판단이 아닙니다.' },
      { t: 'p', v: '서면 통보 초안은 기록을 바탕으로 한 틀입니다. 고치고, 보낼지와 보내는 방법은 당신이 정합니다. 규칙은 장소마다 다릅니다. 앱은 법이 무엇을 요구하는지 말하지 않습니다.' },
      { t: 'h', v: '당신의 데이터와 다른 사람' },
      { t: 'p', v: '무엇을 기록하고 내보낸 파일을 어떻게 할지는 당신이 정합니다. 있는 곳의 법이 허용하는 것만 기록하세요. 입력했다면 내보내기에는 다른 사람의 개인정보가 들어갈 수 있습니다. 기기에 남는 것과 보내질 수 있는 것은 개인정보 안내에 있습니다.' },
      { t: 'h', v: '구매' },
      { t: 'p', v: '이 웹사이트에서 구매는 아직 제공되지 않습니다. 가격, 환불 규칙, 활성화 횟수는 적지 않습니다. 앱이 라이선스 키를 물으면 그 확인은 개인정보 안내에 적은 확인입니다. 그 화면에 키를 넣는 것은 이 페이지에서의 구매가 아닙니다. 다른 곳의 테스트 결제는 이 웹사이트의 판매가 아닙니다.' },
      { t: 'h', v: '이 안내' },
      { t: 'p', v: '이 저장소의 코드를 설명합니다. 판매자 신원, 환불 약속, 법원 선택을 더하지 않습니다. 여기 문장이 코드보다 넓으면, 소프트웨어가 하는 일은 코드이고 그 문장은 좁혀야 합니다. 추가 약속으로 읽지 마세요.' }
    ]
  },
  ja: {
    privacyTitle: 'プライバシーの説明 – Marginlog',
    termsTitle: '利用の説明 – Marginlog',
    privacyDesc: 'Marginlog がこの端末に保存するもの、ライセンス確認が送るもの、まだ決めていない項目。',
    termsDesc: '指紋の鎖、記録の詳細スコア、段階の提案が意味することと意味しないこと。購入はまだ提供されません。',
    home: 'ホーム', privacyLink: 'プライバシーの説明', termsLink: '利用の説明',
    privacy: [
      { t: 'p', v: 'この説明は、このリポジトリの Marginlog のコードがデータをどう扱うかを述べます。名前のある組織が発行したプライバシーポリシーではありません。' },
      { t: 'na', h: 'まだ提供されていません', v: [
        '運営者の法的名称、郵便またはメールの連絡先',
        'プライバシーに関する請求の連絡先',
        '価格、チェックアウト、請求、返金のルール、ライセンスキーを使える端末数',
        'ホストまたは Lemon Squeezy が接続やライセンスのデータをどこにどれだけ保管するか',
        'あなた以外が持つデータを消す期限',
        '保存する国や地域、準拠法'
      ] },
      { t: 'p', v: 'これらの項目は意図して空です。このページは作りません。' },
      { t: 'h', v: '案件と写真はこのブラウザに残ります' },
      { t: 'p', v: 'アカウントはありません。案件を保存しても案件の内容はアップロードされません。ブラウザに残るものは次のとおりです。' },
      { t: 'ul', v: [
        'localStorage marginlog:v1 — 案件名、相手、望む結果、記録本文、入力した時刻、起きたと書いた時刻、深刻度、継続時間、タグ、目撃のメモ、追加メモ、無効の理由、対応の段階、アーカイブ、選んだ言語、開いている案件。',
        'localStorage marginlog:v1:cp — 封印した記録の数と最後の指紋。記録の末尾が短くなったことに後から気づくためです。',
        'localStorage marginlog:v1:lastbackup — バックアップを最後にダウンロードした時刻。',
        'localStorage marginlog:v1:corrupt と marginlog:v1:corrupt-b — アプリが読めなかったデータの写し。残せた場合だけ。',
        'IndexedDB データベース marginlog、ストア photos — 縮小した写真。',
        'localStorage marginlog:license — 確認を通ったライセンスキーと、最後に確認した時刻。',
        'localStorage marginlog:gate — 最後の状態が有料確認をオンと答えたか（1 または 0）。',
        'localStorage marginlog-ai-key — Anthropic の API キー。保存した場合だけ。'
      ] },
      { t: 'p', v: 'ブラウザでこのサイトのデータを消すと、そのブラウザの写しは消えます。アプリは案件を削除でき（少しの間元に戻せます）、AI キーも消せます。このコードは案件のサーバー上の写しを持たないので、サーバーから消す対象がなく、削除の期限も書きません。' },
      { t: 'h', v: '書き出したファイルには個人データが入り得ます' },
      { t: 'p', v: 'ダウンロードは、あなたが自分で送らない限り端末にあります。入力した内容が入っており、他の人の名前や情報が含まれることがあります。' },
      { t: 'ul', v: [
        'バックアップ JSON（写真を含む）。パスフレーズを付けると AES-GCM で暗号化します。鍵は PBKDF2-SHA256、反復 310000 回で作ります。パスフレーズは保存しません。忘れたパスフレーズをこのアプリは復元できません。',
        '報告書（コピー、印刷または PDF、Markdown）、時系列（.txt）、CSV、ダイジェスト（.md）、カレンダー（.ics）、書面通知の下書き。',
        '印刷と PDF には写真が入り得ます。報告書と CSV には短い指紋が入ります。カレンダーには入力した案件名と段階名が入ります。'
      ] },
      { t: 'h', v: 'ライセンス確認' },
      { t: 'p', v: 'アプリを開くと、この同じウェブサイトへ GET /api/license を送ります。本文はありません。応答 JSON の configured は true か false です。configured が true になるのは、サーバー環境に LEMONSQUEEZY_PRODUCT_ID があるときだけです。このリポジトリの関数はそのリクエストをデータベースに書きません。' },
      { t: 'p', v: 'ロック解除を押したとき、およびキーが保存されているあいだ約 7 日ごと、アプリは POST /api/license で JSON {"key":"<ライセンスキー>"} を送ります。' },
      { t: 'p', v: '有料確認がオフなら、関数は {configured:false} を返し、Lemon Squeezy には連絡しません。' },
      { t: 'p', v: 'オンなら、関数はキーをフォーム項目 license_key として https://api.lemonsqueezy.com/v1/licenses/validate に送ります。Lemon Squeezy が valid と答え、状態が active または inactive で、商品 id が LEMONSQUEEZY_PRODUCT_ID と一致するときだけ受け入れます。ブラウザに伝えるのは {configured, valid} だけです。この関数は Lemon Squeezy の応答の残りを保存しません。ブラウザはその後キーを localStorage に保存します。' },
      { t: 'p', v: 'サービスワーカーは /api をキャッシュしません。状態のリクエストもブラウザの HTTP キャッシュを使わないよう求めます（cache: no-store）。案件の本文、写真、名前、AI キーはライセンスのリクエストに含まれません。' },
      { t: 'h', v: '支払い' },
      { t: 'p', v: 'このウェブサイトはチェックアウトを提供しません。アプリ設定のチェックアウト先は、まだ example.com を含む仮のアドレスで、そのため購入ボタンは隠れたままです。価格、返金、請求、有効化の回数はまだ提供されていません。テストのチェックアウトは販売ではなく、このサイトはそこへリンクしません。' },
      { t: 'p', v: 'ライセンスのコードは、上に書いたとおり Lemon Squeezy のライセンス API を呼べます。それは店が開いていることや、価格が決まっていることを意味しません。' },
      { t: 'h', v: '任意の AI' },
      { t: 'p', v: '自分の API キーを保存し「AIで分析」を押すまで、Anthropic には何も送りません。リクエストは POST https://api.anthropic.com/v1/messages 、モデル claude-haiku-5-5 です。キーは x-api-key ヘッダーです。このブラウザにだけあり、/api/license には送りません。' },
      { t: 'p', v: 'メッセージは一つの案件の件数と日付です。種類、合計、期間、継続時間、深刻度、欠けている詳細（文字数、継続時間、目撃者、写真、記録のタイミング、タグ）、準備の確認、段階のタイミング。案件名、記録本文、メモ、氏名、住所、電話番号、タグは含まれません。相手を入力していた場合、送る表示は 당사자 A です。応答は画面に出るだけで、このコードはディスクに書きません。推定であり、法的な評価ではありません。' },
      { t: 'h', v: 'ホスティングと他の当事者' },
      { t: 'p', v: 'サイトは Cloudflare Pages で https://marginlog.pages.dev に公開されます。開くと、そのホストへ通常のブラウザリクエストが行き、ページのアドレス、IP アドレス、ユーザーエージェントが含まれ得ます。このリポジトリは解析スクリプトを加えず、独自のクッキーを置きません。ホストが接続記録をどれだけ保管するかは書きません。' },
      { t: 'p', v: 'このコードが連絡し得る相手:' },
      { t: 'ul', v: [
        'Cloudflare — ページと /api/license のホスト。',
        'Lemon Squeezy（api.lemonsqueezy.com）— 上のライセンス確認だけ。有料確認がオンのときだけ。',
        'Anthropic（api.anthropic.com）— 任意の AI リクエストだけ。'
      ] },
      { t: 'p', v: 'このサイトはフォントファイル、解析スクリプト、支払いのフレームを読み込みません。書体は端末に既にあるものです。サービスワーカーは同一オリジンの成功した GET 応答だけを保存し、/api 以下は除外します。他のウェブサイトの応答は保存しません。' }
    ],
    terms: [
      { t: 'p', v: 'この説明はツールの説明です。このウェブサイトは購入を提供しないので、有料製品の契約ではありません。法的助言でもありません。' },
      { t: 'na', h: 'まだ提供されていません', v: [
        '販売者の法的名称と連絡先',
        '価格、チェックアウト、請求、返金のルール、有効化の回数',
        '準拠法や裁判所'
      ] },
      { t: 'p', v: 'このページはそれらを埋めません。' },
      { t: 'h', v: 'このツールがすること' },
      { t: 'p', v: 'Marginlog は日付のある個人の記録のためのブラウザアプリです。件数、パターン、詳細スコア、次の段階の提案を示し、コピーや印刷用のファイルを作れます。どちらが正しいかは決めず、誰かが記録を受け入れる約束でもありません。' },
      { t: 'h', v: '指紋' },
      { t: 'p', v: '保存した記録には、その記録と直前の指紋をまとめた SHA-256 の指紋があります。メモ、無効の記録、写真の指紋も含まれます。保存データが指紋と合わなければ、報告書は失敗した場所を示します。' },
      { t: 'p', v: '指紋が一致しても、文章が真実である証明にはなりません。いつ起きたかの証明にもなりません。時刻は記録を書いた端末の時計であり、その時計は狂うことも変えられることもあります。保存データを編集して指紋を計算し直す人は止められません。公証された時刻証明ではなく、記録が書き換えられていないという証明でもありません。' },
      { t: 'h', v: '記録の詳細' },
      { t: 'p', v: '「記録の詳細」というスコアは、40字以上（25）、継続時間（15）、目撃のメモ（15）、写真（20）、入力した時刻から24時間以内の記録（15）、タグ（10）に点を足します。案件の数字は記録の平均です。空欄の知らせです。法的な証拠の大きさではなく、結果の予測でもありません。' },
      { t: 'h', v: '段階の提案' },
      { t: 'p', v: '段階は、選んだ案件の種類に対する固定の一覧です。話し合い、書面通知、苦情、調停、その次に機関または法的な段階です。強調される提案はソフトウェアの規則に従います。件数、深刻度、入力した日付、返答を記録したかを見ます。あなたの状況に対する法的な評価ではありません。' },
      { t: 'p', v: '書面通知の下書きは記録から作ったひな型です。直し、送るかどうかと送り方はあなたが決めます。規則は場所で違います。アプリは法律が何を求めるかは述べません。' },
      { t: 'h', v: 'あなたのデータと他の人' },
      { t: 'p', v: '何を記録し、書き出したファイルをどうするかはあなたが決めます。いる場所の法律が認める範囲だけを記録してください。入力していれば、書き出しには他の人の個人データが入り得ます。端末に残るものと送られ得るものはプライバシーの説明にあります。' },
      { t: 'h', v: '購入' },
      { t: 'p', v: 'このウェブサイトでの購入はまだ提供されていません。価格、返金のルール、有効化の回数は述べません。アプリがライセンスキーを求める場合、その確認はプライバシーの説明にある確認です。その画面にキーを入れることは、このページからの購入ではありません。別の場所のテストのチェックアウトは、このウェブサイトの販売ではありません。' },
      { t: 'h', v: 'この説明' },
      { t: 'p', v: 'このリポジトリのコードを説明します。販売者の身元、返金の約束、裁判所の選択は加えません。ここの文がコードより広ければ、ソフトウェアがすることはコードのほうであり、その文は狭めるべきです。追加の約束として読まないでください。' }
    ]
  },
  zh: {
    privacyTitle: '隐私说明 – Marginlog',
    termsTitle: '使用说明 – Marginlog',
    privacyDesc: 'Marginlog 存在本设备上的内容、许可证检查会发送的内容，以及尚未写明的事项。',
    termsDesc: '指纹链、记录完整度分数和升级提示分别表示什么、不表示什么。购买尚未提供。',
    home: '首页', privacyLink: '隐私说明', termsLink: '使用说明',
    privacy: [
      { t: 'p', v: '本说明描述本仓库中 Marginlog 代码如何处理数据。它不是某个具名机构发布的隐私政策。' },
      { t: 'na', h: '尚未提供', v: [
        '运营者的法定名称，以及邮寄或电子邮件联系方式',
        '隐私请求的联系方式',
        '价格、结账、账单、退款规则，以及一个许可证密钥可以启用的设备数量',
        '托管方或 Lemon Squeezy 把连接或许可证数据存在哪里、存多久',
        '删除由你以外的人持有的数据的期限',
        '存储所在国家或地区，以及适用法律'
      ] },
      { t: 'p', v: '这些项目是有意留空的。本页不编造它们。' },
      { t: 'h', v: '事项和照片留在这个浏览器里' },
      { t: 'p', v: '没有账号。保存事项不会上传事项内容。浏览器里保留的是：' },
      { t: 'ul', v: [
        'localStorage marginlog:v1 — 事项名称、对方、期望结果、记录正文、你输入的时间、你所写的发生时间、严重度、持续时间、标签、证人备注、附加备注、作废原因、应对步骤、是否归档、所选语言和当前事项。',
        'localStorage marginlog:v1:cp — 已封存记录的条数和最后指纹，用来事后发现记录末尾被截短。',
        'localStorage marginlog:v1:lastbackup — 上次下载备份文件的时间。',
        'localStorage marginlog:v1:corrupt 和 marginlog:v1:corrupt-b — 应用无法读取的数据副本，仅在能够留下副本时。',
        'IndexedDB 数据库 marginlog，存储 photos — 缩小后的照片。',
        'localStorage marginlog:license — 通过检查的许可证密钥，以及上次检查的时间。',
        'localStorage marginlog:gate — 上次状态是否表示已开启付费检查（1 或 0）。',
        'localStorage marginlog-ai-key — Anthropic API 密钥，仅在你保存之后。'
      ] },
      { t: 'p', v: '在浏览器中清除本网站数据，会删除该浏览器中的这些副本。应用可以删除事项（可短时间撤销），也可以移除 AI 密钥。这段代码不在服务器上保存事项副本，因此没有可在服务器上删除的副本，也不写删除期限。' },
      { t: 'h', v: '导出的文件可能含有个人数据' },
      { t: 'p', v: '下载的文件留在你的设备上，除非你自己再发送出去。其中是你输入的内容，可能包括他人的姓名和信息。' },
      { t: 'ul', v: [
        '备份 JSON，含照片。若设置口令，文件用 AES-GCM 加密。密钥由 PBKDF2-SHA256、310000 次迭代导出。口令不会被保存。本应用无法恢复遗忘的口令。',
        '报告（复制、打印或 PDF、Markdown）、时间顺序记录（.txt）、CSV、摘要（.md）、日历（.ics）和书面通知草稿。',
        '打印和 PDF 可以包含照片。报告和 CSV 包含短指纹。日历文件包含你输入的事项名称和步骤名称。'
      ] },
      { t: 'h', v: '许可证检查' },
      { t: 'p', v: '打开应用时，它向本网站发送 GET /api/license。没有请求体。响应 JSON 的 configured 为 true 或 false。只有服务器环境设置了 LEMONSQUEEZY_PRODUCT_ID 时，configured 才为 true。本仓库中的函数不把该请求写入数据库。' },
      { t: 'p', v: '当你按下解锁，以及在保存了密钥之后大约每 7 天，应用会 POST /api/license，JSON 为 {"key":"<许可证密钥>"}。' },
      { t: 'p', v: '若未开启付费检查，函数返回 {configured:false}，并且不联系 Lemon Squeezy。' },
      { t: 'p', v: '若已开启，函数把密钥作为表单字段 license_key 发送到 https://api.lemonsqueezy.com/v1/licenses/validate。仅当 Lemon Squeezy 报告 valid、状态为 active 或 inactive，且产品 id 与 LEMONSQUEEZY_PRODUCT_ID 一致时才接受。浏览器只被告知 {configured, valid}。该函数不保存 Lemon Squeezy 回复的其余部分。浏览器随后把密钥存入 localStorage。' },
      { t: 'p', v: 'Service worker 不缓存 /api。状态请求也要求浏览器不要使用 HTTP 缓存（cache: no-store）。事项正文、照片、姓名和 AI 密钥不属于许可证请求。' },
      { t: 'h', v: '付款' },
      { t: 'p', v: '本网站不提供结账。应用配置中的结账地址仍是含有 example.com 的占位地址，因此购买按钮保持隐藏。价格、退款、账单和激活次数尚未提供。测试结账不是销售，本网站也不链接到测试结账。' },
      { t: 'p', v: '许可证代码可以按上文调用 Lemon Squeezy 的许可证 API。这并不表示商店已经开放，也不表示已经确定价格。' },
      { t: 'h', v: '可选的 AI' },
      { t: 'p', v: '除非你保存自己的 API 密钥并按下“用AI分析”，否则不会向 Anthropic 发送任何内容。请求为 POST https://api.anthropic.com/v1/messages，模型 claude-haiku-5-5。密钥放在 x-api-key 头中。它只留在此浏览器，不会发给 /api/license。' },
      { t: 'p', v: '消息是一个事项的次数和日期：类型、合计、时间跨度、持续时间、严重度、缺少哪些细节（文字长度、持续时间、证人、照片、记录时间、标签）、准备检查和步骤时间。不包括事项名称、记录正文、备注、姓名、地址、电话号码或标签。若填写了对方，发送的称呼是 당사자 A。回复只显示在屏幕上，这段代码不把它写入磁盘。它是估计，不是法律评估。' },
      { t: 'h', v: '托管与其他方' },
      { t: 'p', v: '网站通过 Cloudflare Pages 发布在 https://marginlog.pages.dev。打开它会向该主机发送普通的浏览器请求，其中可以包括页面地址、IP 地址和用户代理。本仓库不加入分析脚本，也不设置自己的 cookie。它不说明主机把连接日志保留多久。' },
      { t: 'p', v: '这段代码可能联系的各方：' },
      { t: 'ul', v: [
        'Cloudflare，作为页面和 /api/license 的主机。',
        'Lemon Squeezy（api.lemonsqueezy.com），仅用于上文的许可证校验，且仅在开启付费检查时。',
        'Anthropic（api.anthropic.com），仅用于可选的 AI 请求。'
      ] },
      { t: 'p', v: '本网站不加载字体文件、分析脚本或付款框架。字体是你设备上已有的字体。Service worker 只保存同源且成功的 GET 响应，/api 之下除外，以便离线打开应用。它不保存其他网站的响应。' }
    ],
    terms: [
      { t: 'p', v: '本说明描述这个工具。因为本网站不提供购买，所以它不是付费产品的合同。它也不是法律意见。' },
      { t: 'na', h: '尚未提供', v: [
        '销售者的法定名称和联系地址',
        '价格、结账、账单、退款规则和激活次数',
        '适用法律或法院'
      ] },
      { t: 'p', v: '本页不填写这些内容。' },
      { t: 'h', v: '这个工具是什么' },
      { t: 'p', v: 'Marginlog 是用于按日期保存个人记录的浏览器应用。它可以显示次数、规律、完整度分数和建议的下一步，并生成可复制或打印的文件。这些都不判定谁是对的，也不承诺任何人会接受这份记录。' },
      { t: 'h', v: '指纹' },
      { t: 'p', v: '每条已保存的记录都有一个 SHA-256 指纹，包含该记录和上一条指纹。备注、作废记录和照片指纹都包括在内。若存储的数据不再匹配，报告会说明检查失败以及位置。' },
      { t: 'p', v: '匹配并不证明文字为真。也不证明事情发生的时间：时间来自写下记录的那台设备的时钟，而时钟可能不准或被更改。它不能阻止有人修改已存数据并重新计算指纹。它不是经公证的时间戳，也不是“记录没有被改写”的证明。' },
      { t: 'h', v: '记录完整度' },
      { t: 'p', v: '标为“记录完整度”的分数在以下情况加分：40 个字符及以上（25）、持续时间（15）、证人备注（15）、照片（20）、在你所填时间的 24 小时内记录（15）、标签（10）。事项上的数字是各条记录的平均值。它提醒哪些栏是空的。它不是法律证据的衡量，也不是对结果的预测。' },
      { t: 'h', v: '升级建议' },
      { t: 'p', v: '阶梯是你所选事项类型的固定列表：沟通、书面通知、投诉、调解，然后是主管部门或法律步骤。高亮的建议遵循软件中的规则，使用次数、严重度、你输入的日期，以及你是否标记了回复。它是提示，不是对你情况的法律评估。' },
      { t: 'p', v: '书面通知草稿是根据记录生成的模板。你来修改，并决定是否发送以及如何发送。规则因地而异。应用不说明法律要求什么。' },
      { t: 'h', v: '你的数据与他人' },
      { t: 'p', v: '记录什么、如何处理导出的文件，由你决定。只记录你所在地法律允许的内容。如果你输入了，导出内容可能包含他人的个人数据。隐私说明写明什么留在设备上、什么可能被发送。' },
      { t: 'h', v: '购买' },
      { t: 'p', v: '本网站上的购买尚未提供。这里不写价格、退款规则或激活次数。若某个应用副本要求许可证密钥，该检查就是隐私说明中的检查。在那个画面输入密钥不是从本页购买。别处的测试结账不是本网站的销售。' },
      { t: 'h', v: '这些说明' },
      { t: 'p', v: '它们描述本仓库中的代码。它们不增加销售者身份、退款承诺或法院选择。若这里的某句话比代码更宽，软件实际所做的是代码，那句话应当收窄。不要把它读成额外的承诺。' }
    ]
  },
  es: {
    privacyTitle: 'Nota de privacidad – Marginlog',
    termsTitle: 'Nota de uso – Marginlog',
    privacyDesc: 'Qué guarda Marginlog en este dispositivo, qué envía la comprobación de licencia y qué aún no está dicho.',
    termsDesc: 'Qué significan y qué no significan la cadena de huellas, la puntuación de detalle y las sugerencias de escalado. La compra aún no está disponible.',
    home: 'Inicio', privacyLink: 'Nota de privacidad', termsLink: 'Nota de uso',
    privacy: [
      { t: 'p', v: 'Esta nota describe lo que hace con los datos el código de Marginlog de este repositorio. No es una política de privacidad emitida por una organización con nombre.' },
      { t: 'na', h: 'Aún no disponible', v: [
        'El nombre legal del operador y un contacto postal o de correo',
        'Un contacto para solicitudes de privacidad',
        'Un precio, un pago, la facturación, una regla de reembolso y cuántos dispositivos puede activar una clave',
        'Dónde guardan el anfitrión o Lemon Squeezy los datos de conexión o de licencia, y por cuánto tiempo',
        'Un plazo para borrar datos que tenga alguien que no seas tú',
        'Un país o región de almacenamiento, y una ley aplicable'
      ] },
      { t: 'p', v: 'Esos puntos se dejan en blanco a propósito. Esta página no los inventa.' },
      { t: 'h', v: 'Los casos y las fotos se quedan en este navegador' },
      { t: 'p', v: 'No hay cuenta. Guardar un caso no sube el caso. El navegador conserva:' },
      { t: 'ul', v: [
        'localStorage marginlog:v1 — nombre del caso, otra parte, objetivo, texto, la hora en que lo escribiste, la hora que dices que ocurrió, gravedad, duración, etiquetas, nota del testigo, notas, motivos de anulación, pasos, si está archivado, el idioma elegido y el caso abierto.',
        'localStorage marginlog:v1:cp — cuántos registros sellados tenía el caso y la última huella, para notar más tarde si el final del registro se acortó.',
        'localStorage marginlog:v1:lastbackup — cuándo se descargó por última vez un archivo de copia.',
        'localStorage marginlog:v1:corrupt y marginlog:v1:corrupt-b — una copia de datos que la app no pudo leer, si logró conservarla.',
        'Base IndexedDB marginlog, almacén photos — fotos reducidas.',
        'localStorage marginlog:license — la clave de licencia y cuándo se comprobó por última vez, después de una comprobación que la aceptó.',
        'localStorage marginlog:gate — si la última respuesta dijo que el acceso de pago estaba activo (1 o 0).',
        'localStorage marginlog-ai-key — una clave de API de Anthropic, solo si la guardas.'
      ] },
      { t: 'p', v: 'Borrar los datos de este sitio en el navegador quita esas copias de ese navegador. La app puede borrar un caso (con un deshacer breve) y puede quitar la clave de IA. Este código no guarda una copia de los casos en un servidor, así que no tiene nada que borrar allí y no indica un plazo de borrado.' },
      { t: 'h', v: 'Las exportaciones pueden contener datos personales' },
      { t: 'p', v: 'Una descarga se queda en tu dispositivo salvo que tú la envíes. Contiene lo que escribiste, que puede incluir nombres y datos de otras personas.' },
      { t: 'ul', v: [
        'JSON de copia, con fotos. Si pones una frase, el archivo se cifra con AES-GCM. La clave se deriva con PBKDF2-SHA256 y 310000 iteraciones. La frase no se guarda. Esta app no puede recuperar una frase olvidada.',
        'Informe (copiar, imprimir o PDF, Markdown), cronología (.txt), CSV, resumen (.md), calendario (.ics) y el borrador de aviso escrito.',
        'La impresión y el PDF pueden incluir las fotos. Los informes y el CSV incluyen huellas cortas. El calendario incluye los nombres de caso y de paso que escribiste.'
      ] },
      { t: 'h', v: 'Comprobación de licencia' },
      { t: 'p', v: 'Al abrir la app, envía GET /api/license a este mismo sitio. No hay cuerpo. La respuesta JSON tiene configured en true o false. configured es true solo cuando el entorno del servidor tiene LEMONSQUEEZY_PRODUCT_ID. La función de este repositorio no escribe esa petición en una base de datos.' },
      { t: 'p', v: 'Al pulsar Desbloquear, y de nuevo cada unos 7 días mientras haya una clave guardada, la app envía POST /api/license con JSON {"key":"<la clave de licencia>"}.' },
      { t: 'p', v: 'Si el acceso de pago no está configurado, la función responde {configured:false} y no contacta con Lemon Squeezy.' },
      { t: 'p', v: 'Si lo está, la función envía la clave como campo de formulario license_key a https://api.lemonsqueezy.com/v1/licenses/validate. La acepta solo si Lemon Squeezy indica valid, el estado es active o inactive y el id de producto coincide con LEMONSQUEEZY_PRODUCT_ID. Al navegador solo se le dice {configured, valid}. Esta función no guarda el resto de la respuesta de Lemon Squeezy. El navegador guarda entonces la clave en localStorage.' },
      { t: 'p', v: 'El service worker no guarda en caché /api. La petición de estado también pide al navegador que no use su caché HTTP (cache: no-store). El texto del caso, las fotos, los nombres y la clave de IA no forman parte de la petición de licencia.' },
      { t: 'h', v: 'Pago' },
      { t: 'p', v: 'Este sitio web no ofrece un pago. La dirección de pago en la configuración de la app sigue siendo un marcador que contiene example.com, y por eso los botones de compra permanecen ocultos. El precio, los reembolsos, la facturación y un límite de activaciones aún no están disponibles. Un pago de prueba no es una venta, y este sitio no enlaza a uno.' },
      { t: 'p', v: 'El código de licencia puede llamar a la API de licencias de Lemon Squeezy, como se describe arriba. Eso no afirma que una tienda esté abierta ni que se haya fijado un precio.' },
      { t: 'h', v: 'IA opcional' },
      { t: 'p', v: 'No se envía nada a Anthropic salvo que guardes tu propia clave de API y pulses Analizar con IA. La petición es POST https://api.anthropic.com/v1/messages, modelo claude-haiku-5-5. Tu clave va en la cabecera x-api-key. Se queda en este navegador y no se envía a /api/license.' },
      { t: 'p', v: 'El mensaje son recuentos y fechas de un caso: tipo, totales, intervalo de fechas, duraciones, gravedad, qué detalles faltan (longitud del texto, duración, testigo, foto, momento del registro, etiqueta), comprobaciones de preparación y fechas de los pasos. No incluye el nombre del caso, el texto de las entradas, las notas, nombres, direcciones, teléfonos ni etiquetas. Si se rellenó otra parte, la etiqueta enviada es 당사자 A. La respuesta se muestra en pantalla y este código no la escribe en disco. Es una estimación, no una valoración legal.' },
      { t: 'h', v: 'Alojamiento y otros' },
      { t: 'p', v: 'El sitio se publica en https://marginlog.pages.dev con Cloudflare Pages. Abrirlo envía una petición normal del navegador a ese anfitrión, que puede incluir la dirección de la página, la dirección IP y el agente de usuario. Este repositorio no añade un script de analítica ni pone una cookie propia. No dice cuánto tiempo guarda el anfitrión los registros de conexión.' },
      { t: 'p', v: 'Partes a las que este código puede dirigirse:' },
      { t: 'ul', v: [
        'Cloudflare, como anfitrión de las páginas y de /api/license.',
        'Lemon Squeezy en api.lemonsqueezy.com, solo para la validación de licencia de arriba, y solo cuando el acceso de pago está configurado.',
        'Anthropic en api.anthropic.com, solo para la petición opcional de IA.'
      ] },
      { t: 'p', v: 'Este sitio no carga un archivo de fuente, un script de analítica ni un marco de pago. Los tipos de letra son los que ya tiene tu dispositivo. El service worker guarda las respuestas GET correctas del mismo origen, excepto todo lo que esté bajo /api, para que la app pueda abrirse sin conexión. No guarda respuestas de otros sitios.' }
    ],
    terms: [
      { t: 'p', v: 'Esta nota describe la herramienta. No es un contrato de un producto de pago, porque este sitio web no ofrece una compra. No es asesoramiento legal.' },
      { t: 'na', h: 'Aún no disponible', v: [
        'El nombre legal del vendedor y una dirección de contacto',
        'Un precio, un pago, la facturación, una regla de reembolso y un límite de activaciones',
        'Una ley aplicable o un tribunal'
      ] },
      { t: 'p', v: 'Esta página no los rellena.' },
      { t: 'h', v: 'Qué es la herramienta' },
      { t: 'p', v: 'Marginlog es una app de navegador para un registro personal con fechas. Puede mostrar recuentos, un patrón, una puntuación de detalle y un siguiente paso sugerido, y puede crear un archivo para copiar o imprimir. Nada de eso decide quién tiene razón, y nada de eso promete que alguien acepte el registro.' },
      { t: 'h', v: 'Huellas' },
      { t: 'p', v: 'Cada entrada guardada almacena una huella SHA-256 de esa entrada junto con la huella anterior. Se incluyen notas, anulaciones y huellas de fotos. Si los datos guardados ya no coinciden, el informe dice que la comprobación falló y dónde.' },
      { t: 'p', v: 'Una coincidencia no prueba que las palabras sean ciertas. No prueba cuándo ocurrió algo: las horas vienen del reloj del dispositivo que las escribió, y ese reloj puede estar mal o cambiarse. No impide que alguien edite los datos guardados y calcule huellas nuevas. No es un sello de tiempo notarial, y no es prueba de que el registro no se reescribió.' },
      { t: 'h', v: 'Detalle del registro' },
      { t: 'p', v: 'La puntuación llamada Detalle del registro suma puntos por 40 caracteres o más (25), una duración (15), una nota de testigo (15), una foto (20), un registro dentro de las 24 horas de la hora que indicaste (15) y una etiqueta (10). La cifra del caso es la media de sus entradas. Es un aviso de campos vacíos. No es una medida de prueba legal ni una predicción de un resultado.' },
      { t: 'h', v: 'Sugerencias de escalado' },
      { t: 'p', v: 'La escalera es una lista fija para el tipo de caso que elegiste: charla, aviso por escrito, queja, mediación y después una autoridad o un paso legal. La sugerencia destacada sigue reglas del programa, con recuentos, gravedad, fechas que escribiste y si marcaste una respuesta. Es un aviso, no una valoración legal de tu situación.' },
      { t: 'p', v: 'El borrador de aviso escrito es una plantilla hecha a partir de tu registro. Tú lo editas y tú decides si lo envías y cómo. Las normas cambian según el lugar. La app no dice qué exige la ley.' },
      { t: 'h', v: 'Tus datos y otras personas' },
      { t: 'p', v: 'Tú decides qué registrar y qué hacer con los archivos que exportas. Registra solo lo que permita la ley del lugar donde estás. Una exportación puede contener datos personales de otras personas si los escribiste. La nota de privacidad dice qué se queda en el dispositivo y qué puede enviarse.' },
      { t: 'h', v: 'Compra' },
      { t: 'p', v: 'La compra aún no está disponible en este sitio web. No se indica un precio, una regla de reembolso ni un límite de activaciones. Si una copia de la app pide una clave de licencia, esa comprobación es la de la nota de privacidad. Escribir una clave en esa pantalla no es una compra desde esta página. Un pago de prueba en otro sitio no es una venta de este sitio web.' },
      { t: 'h', v: 'Estas notas' },
      { t: 'p', v: 'Describen el código de este repositorio. No añaden una identidad de vendedor, una promesa de reembolso ni un tribunal. Si una frase de aquí es más amplia que el código, lo que hace el software es el código, y la frase debe estrecharse. No debe leerse como una promesa adicional.' }
    ]
  }
};
