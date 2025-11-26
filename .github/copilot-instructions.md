# Copilot / AI Agent Guidance — Portfolio Intelligence

Short, actionable notes to help an AI coding agent be productive in this codebase.

1. Project overview:
   - Next.js 14 App Router project located in `nextjs_space/` (app directory uses the App Router).
   - Single-page dashboard reading JSON data from `nextjs_space/public/stock_insights_data.json`.
   - Components live under `nextjs_space/app/` and `nextjs_space/app/components/`.
   - UI primitives are in `nextjs_space/app/components/ui/` (Radix-based primitives and shadcn-style wrappers).

2. Key files and why they matter:
   - `nextjs_space/app/layout.tsx` — root layout, sets `html` class to `dark` and loads global font/styles.
   - `nextjs_space/app/page.tsx` — main dashboard page (renders the stock cards and charts).
   - `nextjs_space/public/stock_insights_data.json` — primary data source used by components; edit this file to add new stocks or test data.
   - `nextjs_space/lib/types.ts` — canonical TypeScript types for stock data objects; import these when adding logic or components.
   - `nextjs_space/lib/stock-utils.ts` — domain helpers (recommendation logic, price/percent formatting, sentiment helpers). Reuse these helpers rather than reimplementing business logic.
   - `nextjs_space/lib/utils.ts` — UI helpers such as `cn(...)` (clsx + tailwind-merge) and small formatters — use consistently for class composition.
   - `nextjs_space/package.json` — scripts: `yarn dev`, `yarn build`, `yarn start`, `yarn lint`. Prisma seed is configured under the `prisma.seed` key (run via `npx prisma db seed` after env setup).
   - `nextjs_space/prisma/schema.prisma` — DB schema and `DATABASE_URL` dependency; the project works without a DB for the local JSON-driven dashboard, but DB features require setting `DATABASE_URL`.

3. Common conventions and patterns (follow these):
   - TypeScript-first: prefer explicit types from `lib/types.ts` for props and functions.
   - Styling: Tailwind utility classes inline. Use `cn(...)` from `lib/utils.ts` when combining classes and `twMerge` to prevent conflicts.
   - Components: small, focused presentational components under `app/components/*`. Reuse `app/components/ui/*` primitives for accessibility and consistent styling.
   - Business logic: keep domain logic in `lib/stock-utils.ts` and types in `lib/types.ts`. UI components should be thin and accept typed props.
   - Data flow: most UI reads from `public/stock_insights_data.json` (synchronous JSON import/read). If you add remote data fetching, follow the App Router conventions (server components or `fetch()` with caching options).

4. Build / dev / test commands (copyable):
   - Install: `yarn install`
   - Dev server: `yarn dev` (opens at http://localhost:3000)
   - Build: `yarn build`
   - Start (production): `yarn start`
   - Lint: `yarn lint`
   - Prisma seed (if using DB): set `DATABASE_URL` then `npx prisma db seed` (package.json contains `prisma.seed` entry).

5. Integration points & external deps to watch:
   - Radix UI primitives and a number of `@radix-ui/*` packages power the `app/components/ui` primitives.
   - Charts: `recharts` and `react-plotly.js` are used; inspect `app/components/price-chart.tsx` for integration patterns.
   - Optional AWS S3 usage: `@aws-sdk/*` dependencies present — any S3-related code will need credentials and env vars.
   - Prisma + Postgres: `prisma/schema.prisma` expects `DATABASE_URL` — local JSON is used by default, but DB flows require env setup.

6. When editing code, do this first:
   - Find the component under `app/components` and `app/components/ui`.
   - Import types from `lib/types.ts` and helpers from `lib/stock-utils.ts` or `lib/utils.ts`.
   - Use `cn(...)` for class composition; follow existing tailwind utility patterns.
   - Prefer reusing existing presentational pieces (PriceCard, AnalystCard, SentimentCard) before adding new components.

7. Example quick tasks (how to implement them):
   - Add a new stock to the dashboard: add object to `public/stock_insights_data.json`, then reuse existing components in `app/page.tsx` to render it.
   - Update recommendation logic: edit `lib/stock-utils.ts::calculateRecommendation` — unit tests are not present, so keep changes small and test via `yarn dev`.

8. Pitfalls / gotchas discovered from the codebase:
   - The app is built to run without env vars using the local JSON file — don't assume a DB is present unless `DATABASE_URL` is configured.
   - Styling conflicts can appear if you concatenate classes manually; prefer `cn(...)` to prevent duplicate Tailwind classes.

9. Where to look for more detail:
   - UI patterns: `nextjs_space/app/components/ui/` (example primitives)
   - Business logic: `nextjs_space/lib/stock-utils.ts`
   - Types: `nextjs_space/lib/types.ts`
   - Data source: `nextjs_space/public/stock_insights_data.json`

If any part of the codebase looks incomplete or you want guidance tailored to a specific change (new component, DB migration, or deployment), tell me which file or feature and I'll update these instructions.
