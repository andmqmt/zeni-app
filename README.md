# Moneif (Frontend)

Modern Next.js 14 app router frontend for personal finance: transactions, categories, recurring entries, and daily balance. Budgets were removed in favor of simpler KPIs computed from transactions.

## Features

- Authentication (login/register) wired to FastAPI backend
- Transactions CRUD with edit flow and category suggestion badge (AI)
- Categories CRUD
- Recurring management and materialization trigger
- Dashboard KPIs: Total Receitas, Total Despesas, Saldo final (prev.)
- Daily balance calendar and compact day list
- Privacy toggle to hide/show monetary values globally
- i18n scaffold (pt-BR default; en-US strings present)
- Tailwind UI, Page transitions, improved global loading screen

## Tech stack

- Next.js 14 (App Router), React 18
- TanStack Query 5 (data fetching/cache)
- **Native fetch** with `credentials: 'include'` for cookie-based sessions
- Tailwind CSS
- lucide-react icons
- TypeScript

## Getting started

1. Prerequisites
   - Node.js 18+
   - Backend running (see API below)

1. Install deps

```powershell
npm ci
```

1. Environment

Create `.env.local` with:

```bash
# API base URL including prefix
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

1. Run dev server

```powershell
npm run dev
```

1. Build and start

```powershell
npm run build
npm start
```

## API integration

- Base URL: `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000/api/v1`)
- Auth endpoints: `/auth/login`, `/auth/register`, `/auth/me`
- Transactions: `/transactions/` with filters `skip`, `limit`, `on_date`, `category_id`
- Daily balance: `/transactions/daily-balance?year=YYYY&month=MM`
- Categories: `/categories/`
- Recurring: `/recurring/`, `/recurring/materialize`

**Credentials & CORS:**

All requests use `credentials: 'include'` to send cookies/session. For cross-origin setups:

- Backend must respond with:
  - `Access-Control-Allow-Credentials: true`
  - `Access-Control-Allow-Origin: https://your-frontend-domain.com` (not `*`)
- Cookies must use `Secure`, `SameSite=None` for cross-site, and match domain/path.

See `src/lib/api/*.service.ts` for the client wrappers and `front-guide.md` for a deeper contract overview.

## Project structure

```text
src/
  app/              # Next.js app routes
  components/       # UI components (Tooltip, Calendar, Loading, etc.)
  contexts/         # Theme, Language, Balance visibility providers
  hooks/            # React Query hooks (transactions, categories, recurring, user)
  lib/              # API client, utils
  types/            # Shared TypeScript types
```

## Key conventions

- Date format (display): dd-MM-yyyy everywhere in the UI
- Date storage/API: ISO date string YYYY-MM-DD
- Safe local date parsing to avoid timezone off-by-one
- Currency display respects global visibility toggle

## Scripts

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm start` — start built app
- `npm run lint` — lint/type check

## Recent changes

- **Migrated from Axios to native fetch** with `credentials: 'include'` to ensure cookies are sent on every request
- Removed Budgets feature (routes, hooks, types, services)
- Dashboard now computes KPIs from transactions
- Fixed date parsing issues causing off-by-one day
- Standardized date rendering to dd-MM-yyyy
- Hardened currency masking and totals (no NaN)
- Added AI badge tooltip and improved loading screen

## Troubleshooting

- Dates showing a previous day: ensure inputs are `YYYY-MM-DD`; the app parses date-only strings in local time
- API URL wrong: set `NEXT_PUBLIC_API_BASE_URL` correctly in `.env.local`
- Values hidden: toggle the eye button in the header

## License

MIT
