# Marginlog

A dated incident log you keep in the browser: a noisy neighbour, a landlord who ignores repairs, a contractor who misses deadlines, a colleague crossing a line. Cases and photos stay in the browser (localStorage + IndexedDB). There is no account. A license check and an optional AI request can leave the device; see the privacy note. 5 languages (en, ko, ja, zh, es), installable PWA, works offline. Purchase is not offered on this website yet.

Live: https://marginlog.pages.dev

## What makes it different
- **Fingerprinted entries**: each entry is SHA-256 fingerprinted together with the previous one (hash chain). The app UI does not offer an edit of the entry text; you can annotate or void with a reason. If stored bytes no longer match the fingerprints, the report says where. Photos are hashed into the entry too. A match does not prove the words, the time (the device clock), or that someone who recalculates the fingerprints cannot rewrite the log. It is not a notarised timestamp and not legal advice.
- **Happening-now timer** (survives reload) that pre-fills start time and duration.
- **Pattern finder**: weekday x hour heat map, 8-week trend, quiet-hour breaches, longest calm stretch, "recorded late" flags (>48 h).
- **Record detail** score per entry (length, duration, witness, photo, timing, tag). A reminder of blank fields, not a legal assessment.
- **Escalation prompts** per case type (talk, written notice, complaint, mediation, authority/legal) with answer deadlines and overdue warnings. The suggestion is a rule in the app, not a legal assessment.
- **Report**: copy, print/PDF, Markdown, plain-text chronology (.txt), CSV (formula-injection safe), photos, and the seal check. The printed version drops app controls and the readiness checklist, and keeps the seal line and photo grid.
- **AI analysis panel** (Steps tab, per case): explains gaps in the log and suggests one next ladder step, in plain Korean. The built-in analysis (same readiness, detail and ladder rules, computed on the device) is always shown, with or without a key. The AI call happens only when you press "Analyse with AI". Use your own Anthropic API key (stored in this browser under `marginlog-ai-key`; sent only to api.anthropic.com, model `claude-haiku-5-5`, direct from the browser). Only counts, dates, durations, severity, which detail items are missing and step timing are sent: no case name, entry text, notes, names, addresses, phone numbers or tags, and the other party appears as "당사자 A". The output is an estimate, not a legal assessment. No key means no call to Anthropic. The separate license check is described above.
- Backup/restore (JSON incl. photos, seals re-checked on restore), search/filters, archive, delete with undo.
- Optional encrypted backup: AES-GCM with a passphrase (PBKDF2-SHA256, 310k iterations, WebCrypto). A lost passphrase cannot be recovered.
- All-cases overview: entries, last entry, overdue deadlines and evidence score per case, one tap to open. A search box filters the case list by name, type and status text.
- Timeline view: entries grouped by month, with each month's total minutes in its heading. Tap a time to open that entry in the list view. Switchable from the list view. Search, tag, severity and voided filters apply to both.
- Photo gallery per case: every photo attached to an entry, newest first, with the entry date. Opens full size inside the same dialog.
- Deadline reminders: a banner shows reply deadlines that are overdue or due within 7 days, across all active cases. It appears when the app is opened. It is not an OS notification, so nothing fires while the app is closed. The .ics export still feeds your calendar.
- Accessibility: visible focus rings, 44 px touch targets, and dark mode following the system setting.

## Paid access
- `app/config.js`: `checkoutUrl` is still the `example.com` placeholder. While it contains `example.com` the buy buttons stay hidden. Do not put a test checkout on the site or describe it as a sale. Price, refunds and activation limits are not stated because they are not confirmed here.
- `functions/api/license.js` (Cloudflare Pages Function, logic in `api/license.js`): `GET /api/license` reports whether paid access is on; `POST { key }` forwards `license_key` to `https://api.lemonsqueezy.com/v1/licenses/validate` only when `LEMONSQUEEZY_PRODUCT_ID` is set. The browser is told `{configured, valid}`. The function does not store the key.
- Paid access turns on when the Pages project has `LEMONSQUEEZY_PRODUCT_ID` set. Until then the app stays open (launch mode). When on, the app locks until a valid key is entered, rechecks it every 7 days, and keeps working offline with the last known answer.
- The lock is a client-side check. It stops casual use, not a determined one.
- Privacy and terms notes: `/privacy`, `/privacy.html`, `/terms`, `/terms.html`, and the same paths under `/ko/`, `/ja/`, `/zh/` and `/es/`. Unresolved commercial facts are marked not yet available.

## Layout
- `app/` the PWA (`core.js` pure logic, `ai.js` AI key check, anonymised facts, request/parse and the built-in analysis, `i18n.js`, `app.js` UI, `license.js` paid-access check, `config.js`, `sw.js`, `manifest.json`)
- `scripts/build-site.js` (reads `app/config.js`) generates the localized landing pages from `scripts/landing-strings.json`; `scripts/build.js` produces `dist/` for Cloudflare Pages (project `marginlog`, no server functions)
- Tests: `npm test` (`node --test test/*.test.js`: unit, AI logic and privacy checks, i18n parity, site build); `NODE_PATH=$(npm root -g) node test/e2e.js [shots-dir]` (Playwright)
- Not legal advice. AI output is an estimate, not legal advice.
- CSP (`_headers`): `connect-src` is `'self'` plus `https://api.anthropic.com`. `'self'` covers `GET`/`POST /api/license`. The Anthropic host is only for the optional AI panel.
- Fonts, images and code notices: see `NOTICES.md`. No third-party font files are shipped. This is not a legal clearance.
- Not legal advice. Evidence rules differ by country.
