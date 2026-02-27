# Client Monitoring Portal (Client-Side Scope)

This app is intentionally narrowed to the client side only.

## What it does

- Shows client-facing case monitoring reports
- Lets clients stop monitoring
- Detects likely case end and stops/adjusts monitoring policy
- Generates digest content (self-help materials, check-ins, surveys, redirect suggestions)
- Flags MB-side when a vendor appears to be performing poorly
- Accepts MB-side client/vendor sync payloads for later integration

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Simulate case email lifecycle

You can generate a full 9-step case conversation across two inboxes (vendor + test) with deterministic timing and proper email thread headers.

1) Add simulator OAuth values to `.env` (see `.env.example` keys prefixed with `SIM_`).
   - Uses your existing `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - For Microsoft sender, you can use dedicated simulator creds:
     - `SIM_MICROSOFT_CLIENT_ID`
     - `SIM_MICROSOFT_CLIENT_SECRET`
     - `SIM_MICROSOFT_TENANT_ID`
   - If `SIM_MICROSOFT_*` values are missing, it falls back to `MICROSOFT_ENTRA_ID_*`
   - Requires refresh tokens for both sender accounts:
     - `SIM_TEST_GOOGLE_REFRESH_TOKEN`
     - `SIM_VENDOR_MICROSOFT_REFRESH_TOKEN`
   - Microsoft sender now uses Graph `Mail.Send` (not Exchange SMTP auth)

2) Dry run to validate schedule and message flow:

```bash
npm run simulate:email-case -- --dry-run --case-id MB-CASE-2026-0001 --interval-ms 20000
```

3) Send real messages:

```bash
npm run simulate:email-case -- --case-id MB-CASE-2026-0001 --interval-ms 20000
```

### Optional timing controls

- `--start-at 2026-02-27T18:00:00.000Z` uses an exact schedule start.
- `--lead-in-ms 10000` waits before the first message (default 3000 ms).
- `--interval-ms 20000` time between each message (default 20000 ms).

## Main routes

- `/` - dashboard
- `/client/client-001` - client view
- `/api/health`
- `/api/client/profile?clientId=client-001`
- `/api/client/report?clientId=client-001`
- `/api/client/digest?clientId=client-001`
- `/api/client/stop` (POST)
- `/api/monitor/run` (GET/POST)
- `/api/mb/client-sync` (POST)
- `/api/mb/flags` (GET)

## Integration notes

- MB side should push client profile + vendor assignment into `/api/mb/client-sync`.
- Client-side monitor emits vendor quality flags that MB side can fetch from `/api/mb/flags`.
- Persistence is currently in-memory for fast prototyping; replace `lib/store.js` with DB-backed storage during integration.
