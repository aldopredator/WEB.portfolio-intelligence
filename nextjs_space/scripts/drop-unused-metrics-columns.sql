-- Drop unused metrics columns
-- These columns are not defined in the Prisma schema

ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "bookValuePerShare";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "currentRatio";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "dividendYield";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "earningsGrowthYoY";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "eps";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "grossMargin";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "operatingMargin";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "payoutRatio";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "pegRatio";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "quickRatio";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "revenueGrowthYoY";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "volume";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "week52Return";
ALTER TABLE "Metrics" DROP COLUMN IF EXISTS "ytdReturn";
