# Copilot / AI Agent Guidance — Portfolio Intelligence

Essential knowledge for AI agents working in this Next.js 14 portfolio intelligence platform with Prisma, Postgres, and real-time financial data from multiple APIs.

## 🎯 Architecture Overview

**Database-first design**: This is NOT a simple JSON dashboard. The app uses Prisma + PostgreSQL as the single source of truth. `lib/stock-data.ts::getStockData()` fetches from DB and orchestrates all data enrichment. Legacy JSON file (`public/stock_insights_data.json`) is obsolete.

**Multi-portfolio support**: Core pattern is Portfolio → Stocks → StockData/PriceHistory/Metrics. Server components fetch filtered data based on `?portfolio=<id>` query param passed from layout and filter at DB level.

**API-driven enrichment**: Stock data is enriched from Polygon, Yahoo Finance, and Finnhub APIs using a tiered fallback approach. Cache system in `lib/cache.ts` and `lib/polygon-cache.ts` provides stale-while-revalidate semantics for rate-limited APIs.

## 🗂️ Critical File Map

| File | Purpose | Why It Matters |
|------|---------|----------------|
| `lib/stock-data.ts` | **Data orchestration hub** | Fetches stocks from DB, enriches with API data, formats for UI. Only place that constructs `StockInsightsData`. All pages import `getStockData()`. |
| `prisma/schema.prisma` | Database schema | Defines Portfolio, Stock, StockData, PriceHistory, AnalystRecommendation, SocialSentiment, News, Metrics models. Uses `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL` env var. |
| `lib/types.ts` | TypeScript contracts | `StockInsightsData`, `StockData`, `AnalystData` - import these for all data handling. 174 lines of detailed field definitions. |
| `lib/polygon.ts` | Polygon API client | Fetches real-time stats (volume, market cap, shares outstanding). Rate-limited (5 calls/min free tier). Uses `POLYGON_API_KEY`. |
| `lib/yahoo-finance.ts` | Yahoo Finance client | Fallback for price history, statistics, company profile when Polygon fails. Can be disabled with `ENABLE_YAHOO_FINANCE=false`. |
| `lib/finnhub-metrics.ts` | Finnhub API client | Fetches financial metrics, analyst recommendations, balance sheets, earnings. Uses `FINNHUB_API_KEY`. |
| `lib/cache.ts` | File-based cache | TTL-based caching in `.cache/` directory. Critical pattern: returns stale data on expiry rather than null (for serverless reliability). |
| `app/page.tsx` | Main dashboard | Server component that calls `getStockData(portfolioId)`, fetches ratings from DB, passes to `DashboardClient` (client component). Uses `export const dynamic = 'force-dynamic'`. |
| `app/layout.tsx` | Root layout | Dark mode enforced with `<html className="dark">`. Wraps in `PortfolioProvider` for client-side portfolio state. Includes `GlobalHeader` and `SidebarNavigation`. |
| `app/api/add-ticker/route.ts` | Add stock API | POST endpoint to add new ticker: validates existence, fetches Yahoo data for price history, creates Stock + StockData + PriceHistory records. |

## 🔧 Developer Workflows

### Build & Run (Database Required)
```bash
yarn install
yarn build  # Runs: prisma generate → prisma db push → next build
yarn dev    # Port 3000
```

**Critical**: Build process runs `prisma db push --accept-data-loss` automatically. Set `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL` before building or you'll get Prisma connection errors.

### Database Operations
```bash
npx prisma generate          # Generate Prisma client after schema changes
npx prisma db push           # Push schema to DB (dev only)
npx prisma migrate dev       # Create and apply migration (production-ready)
npx prisma db seed           # Run scripts/seed.ts (uses tsx + dotenv)
```

Seed pattern: `package.json` has `prisma.seed` pointing to seed script. Use `tsx --require dotenv/config` for all Prisma scripts.

### Testing
```bash
yarn test              # Run all Playwright tests
yarn test:ui           # Interactive UI mode
yarn test:headed       # Visible browser
yarn test:report       # Open HTML report
```

Tests in `tests/*.spec.ts` cover navigation, criteria, screening, dashboard. All tests expect dev server running on localhost:3000.

### Cache Management
```bash
yarn clear-cache       # Runs scripts/clear-cache.ps1 (PowerShell)
```

Cache is stored in `.cache/` (local) or `/tmp/.cache/` (Vercel). Polygon cache tracks round-robin ticker fetching to respect rate limits.

## 📐 Coding Conventions

### Data Fetching Pattern
```typescript
// Server Component (app/*/page.tsx)
import { getStockData } from '@/lib/stock-data';

export default async function Page({ searchParams }: { searchParams: { portfolio?: string } }) {
  const stockData = await getStockData(searchParams.portfolio);
  return <ClientComponent initialData={stockData} />;
}
```

Always use `getStockData()` for stock data - it's the orchestrator. Never query Prisma directly in page components unless you need something `getStockData` doesn't provide.

### API Route Pattern
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // ... DB operations with prisma
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

All API routes use `export const dynamic = 'force-dynamic'` to disable caching. Instantiate Prisma client at top of file (not using singleton pattern in route handlers).

### Component Styling
```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes text-slate-300",
  condition && "conditional-class",
  customClassName
)}>
```

**Always** use `cn()` from `lib/utils.ts` for class composition. It merges Tailwind classes intelligently (uses `twMerge` + `clsx`). Never concatenate class strings manually.

### TypeScript Imports
```typescript
import type { StockInsightsData, StockData } from '@/lib/types';
import { formatPrice, formatPercent } from '@/lib/stock-utils';
```

Use absolute imports with `@/` alias (configured in `tsconfig.json`). Import types with `type` keyword for clarity.

## 🔗 External API Integration

### Environment Variables (Required)
```env
PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL=postgresql://...
POLYGON_API_KEY=your_key               # Free tier: 5 calls/min
FINNHUB_API_KEY=your_key               # For metrics/recommendations
ENABLE_YAHOO_FINANCE=true              # Default true, can disable
SENTIMENT_CACHE_TTL_MS=1800000         # 30 min default
ADMIN_TOKEN=secret                     # For /api/clear-cache
```

### API Rate Limits & Fallback Strategy
1. **Polygon** (preferred): Real-time data, but rate-limited. `lib/polygon-cache.ts` implements round-robin ticker selection to stay within limits.
2. **Yahoo Finance** (fallback): Scrapes data from Yahoo Finance API. No rate limits documented, but can be disabled via env var.
3. **Finnhub** (supplemental): Financial metrics only. Free tier is sufficient for most use cases.

Cache system ensures **stale data is returned on cache expiry** rather than failing. This is critical for serverless environments where API calls may timeout.

## 🎨 UI Architecture

**Dark theme enforced**: `layout.tsx` sets `<html className="dark">`. Tailwind configured for dark mode. Color scheme: slate-950/900 backgrounds, blue/violet accents.

**Component structure**:
- `app/components/ui/*` - Radix UI primitives (Dialog, Dropdown, Select, etc.)
- `app/components/*` - Business components (PriceCard, AnalystCard, SentimentCard)
- `components/*` - Shared layout components (GlobalHeader, SidebarNavigation)

**State management**: React Context (`lib/portfolio-context.tsx`) for portfolio selection. Server state via Next.js Server Components. Client interactivity via `'use client'` boundaries.

## 🚨 Common Pitfalls

1. **Don't bypass `getStockData()`**: It orchestrates DB fetch + API enrichment + error handling. Direct Prisma queries in pages miss enrichment logic.

2. **Prisma client instantiation**: In API routes, use `new PrismaClient()` at top. In lib files, use singleton pattern from `lib/prisma.ts` to prevent connection exhaustion.

3. **Cache assumptions**: Cache returns stale data rather than `null` on expiry (see `lib/cache.ts:46`). Don't assume fresh data - check timestamps if critical.

4. **Dynamic rendering**: Most pages use `export const dynamic = 'force-dynamic'` because they fetch from DB or external APIs. Don't remove this unless you understand caching implications.

5. **Portfolio filtering**: `getStockData(portfolioId)` filters at DB level. If you add custom queries, ensure you respect `portfolioId` parameter to maintain filter consistency.

6. **PowerShell scripts**: This project runs on Windows. Cache clearing and diagnostics use `.ps1` scripts. When adding scripts, use PowerShell or add cross-platform alternatives.

## 📚 Documentation

- `DESIGN_SPECIFICATION.md` - MUI design system (330 lines)
- `docs/finnhub-metrics-mapping.md` - Finnhub API field mappings
- `docs/data-sources.md` - Data source strategy
- `tests/README.md` - Playwright test documentation

When unclear about a feature, check these docs before asking. They contain architecture decisions and rationale.
