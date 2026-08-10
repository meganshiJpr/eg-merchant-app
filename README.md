# EG Merchant

B2B fintech agent app for Indian shopkeepers — recharge, bill payments,
AEPS, money transfer, khaata book. Next.js frontend for an existing PHP
backend; Android/iOS ship as WebView wrappers around this app.

## Getting started

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev                  # http://localhost:3000
```

## Locked architecture decisions

- **Backend**: browser calls the PHP API directly (Bearer JWT) — no Next proxy.
- **Auth**: long-lived JWT + server-side revocation table (no refresh tokens).
  401 anywhere = revoked → session cleared → login.
- **Theming**: CSS variables under `data-preset` / `data-mode` on `<html>`.
  Tailwind colors map to the variables, so presets and dark mode are runtime
  switches. Dark mode uses brighter, more saturated brand variants.
- **Layout**: fixed 420px centered shell; mobile-app look on any screen.
- **Fonts**: Sora (display) · IBM Plex Sans (body) · IBM Plex Mono (amounts/IDs).

## Structure

```
src/
  app/          routes (App Router)
  components/   shell (Header, BottomNav, AppShell) + ui primitives
  features/     one folder per business module (home, recharge, ...)
  lib/          api client, auth store
```

## Design reference

`eg-merchant-app.html` (the approved prototype) is the UI spec. Port
screens faithfully; visual changes remain easy — tokens live in
`src/app/globals.css`, and each screen is an isolated component.

## Milestones

1. ✅ Scaffold: shell, tokens, auth plumbing, home grid
2. ✅ Recharge module (suggestions → plans → payment → receipt)
3. ✅ Route groups: (app) tabbed chrome vs (flow) focused screens
4. ✅ Billers + dynamic BBPS form engine (DTH/electricity/water/gas/FASTag)
5. ✅ Shared payment engine (plan + bill) — wallet toggle, inline UPI, MPIN, 4-status receipt
6. ✅ Reports suite: Transactions, Wallet Ledger, Deposits, Manual Deposits, Disputes, Commission
7. ✅ Discount Chart · Wallet add-money
8. ⏳ Login/OTP + auth guard + KYC flow
9. ⏳ AEPS / DMT / Aadhaar Pay · Khaata · Scan & Pay
10. ⏳ Wire all screens to the PHP API (replace demo data + `/* Production */` stubs)
11. ⏳ PWA (next-pwa) + WebView wrapper handoff

## Working routes (demo data)

Home grid is fully navigable. Try:
- `/recharge` — full flow to `/recharge/receipt`
- `/billers?cat=1` — JVVNL fetch → editable/fixed amount → pay → receipt
- `/reports` → Transactions, Ledger, Deposits, Manual Deposits, Disputes, Commission
- `/discount`, `/wallet`

Demo payment control: the **last MPIN digit** sets the receipt status
(1-5 success · 6-7 processing · 8 failed · 9/0 refunded). BSNL (number
starting 7) demonstrates the wallet-blocked, UPI-only operator path.

## Shared architecture (why new modules are now fast to add)

- `features/payment/PayScreen` — one payment engine for every module. A screen
  builds a `PayRequest` (amount rules, wallet flag, fetched rows, receipt rows)
  and hands it over; wallet toggle, inline UPI top-up, MPIN and receipt are shared.
- `components/ui` — `Pill`, `DateChips`, `SearchInput`, `Select`, `SubHeader`,
  `Sheet` are reused across bills and every report.
- `features/billers/data` — BBPS biller config (fields, button type, amount rules).
  Adding a biller is a data edit, no component changes.
# eg-merchat-app
