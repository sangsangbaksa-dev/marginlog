# Marginlog

A paid, sealed incident log for disputes you may have to prove later: a noisy neighbour, a landlord who ignores repairs, a contractor who misses deadlines, a colleague crossing a line. One-time purchase, no subscription. Data stays in the browser (localStorage + IndexedDB for photos); no account. 5 languages (en, ko, ja, zh, es), installable PWA, works offline.

Live: https://marginlog.pages.dev

## What makes it different
- **Sealed entries**: each entry is SHA-256 fingerprinted together with the previous one (hash chain). Entries cannot be edited, only annotated or voided with a reason. Editing stored data outside the app breaks the chain and the report says where. Photos are hashed into the entry too. This shows the log was not rewritten; it is not a notarised timestamp.
- **Happening-now timer** (survives reload) that pre-fills start time and duration.
- **Pattern finder**: weekday x hour heat map, 8-week trend, quiet-hour breaches, longest calm stretch, "recorded late" flags (>48 h).
- **Evidence strength** score per entry with concrete tips.
- **Escalation ladder** per case type (talk, written notice, complaint, mediation, authority/legal) with answer deadlines and overdue warnings.
- **Report**: copy, print/PDF, Markdown, plain-text chronology (.txt), CSV (formula-injection safe), photos, and the seal check. The printed version drops app controls and the readiness checklist, and keeps the seal line and photo grid.
- **AI analysis panel** (Steps tab, per case): explains the evidence gaps and the next escalation step in plain Korean. The built-in analysis (same readiness, evidence and ladder rules, computed on the device) is always shown, with or without a key. The AI call happens only when you press "Analyse with AI". Use your own Anthropic API key (stored in this browser under `marginlog-ai-key`; sent only to api.anthropic.com, model `claude-haiku-5-5`, direct from the browser). Only counts, dates, durations, severity, evidence flags and step timing are sent: no case name, entry text, notes, names, addresses, phone numbers or tags, and the other party appears as "당사자 A". The output is an estimate, not legal advice. No key means no network call.
- Backup/restore (JSON incl. photos, seals re-checked on restore), search/filters, archive, delete with undo.
- Optional encrypted backup: AES-GCM with a passphrase (PBKDF2-SHA256, 310k iterations, WebCrypto). A lost passphrase cannot be recovered.
- All-cases overview: entries, last entry, overdue deadlines and evidence score per case, one tap to open. A search box filters the case list by name, type and status text.
- Timeline view: entries grouped by month, with each month's total minutes in its heading. Tap a time to open that entry in the list view. Switchable from the list view. Search, tag, severity and voided filters apply to both.
- Photo gallery per case: every photo attached to an entry, newest first, with the entry date. Opens full size inside the same dialog.
- Deadline reminders: a banner shows reply deadlines that are overdue or due within 7 days, across all active cases. It appears when the app is opened. It is not an OS notification, so nothing fires while the app is closed. The .ics export still feeds your calendar.
- Accessibility: visible focus rings, 44 px touch targets, and dark mode following the system setting.

## Paid access
- `app/config.js`: `checkoutUrl` (Lemon Squeezy checkout). While it contains `example.com` the buy buttons stay hidden.
- `functions/api/license.js` (Cloudflare Pages Function, logic in `api/license.js`): `GET /api/license` reports whether paid access is on; `POST { key }` validates a key with the Lemon Squeezy License API.
- Paid access turns on when the Pages project has `LEMONSQUEEZY_PRODUCT_ID` set. Until then the app stays open (launch mode). When on, the app locks until a valid key is entered, rechecks it every 7 days, and keeps working offline with the last known answer.
- The lock is a client-side check, the same model as the sister apps. It stops casual use, not a determined one.

## Layout
- `app/` the PWA (`core.js` pure logic, `ai.js` AI key check, anonymised facts, request/parse and the built-in analysis, `i18n.js`, `app.js` UI, `license.js` paid-access check, `config.js`, `sw.js`, `manifest.json`)
- `scripts/build-site.js` (reads `app/config.js`) generates the localized landing pages from `scripts/landing-strings.json`; `scripts/build.js` produces `dist/` for Cloudflare Pages (project `marginlog`, no server functions)
- Tests: `npm test` (`node --test test/*.test.js`: unit, AI logic and privacy checks, i18n parity, site build); `NODE_PATH=$(npm root -g) node test/e2e.js [shots-dir]` (Playwright)
- Not legal advice. AI output is an estimate, not legal advice.
- CSP (`_headers`): `connect-src` allows `https://api.anthropic.com` only, for the optional AI panel.
- Not legal advice. Evidence rules differ by country.
