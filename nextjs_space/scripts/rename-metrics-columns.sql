-- Rename unused metrics columns to UDF (User Defined Fields)
-- This preserves the columns for future use

ALTER TABLE "Metrics" RENAME COLUMN "bookValuePerShare" TO "udf1";
ALTER TABLE "Metrics" RENAME COLUMN "currentRatio" TO "udf2";
ALTER TABLE "Metrics" RENAME COLUMN "dividendYield" TO "udf3";
ALTER TABLE "Metrics" RENAME COLUMN "earningsGrowthYoY" TO "udf4";
ALTER TABLE "Metrics" RENAME COLUMN "eps" TO "udf5";
ALTER TABLE "Metrics" RENAME COLUMN "grossMargin" TO "udf6";
ALTER TABLE "Metrics" RENAME COLUMN "operatingMargin" TO "udf7";
ALTER TABLE "Metrics" RENAME COLUMN "payoutRatio" TO "udf8";
ALTER TABLE "Metrics" RENAME COLUMN "pegRatio" TO "udf9";
ALTER TABLE "Metrics" RENAME COLUMN "revenueGrowthYoY" TO "udf10";
ALTER TABLE "Metrics" RENAME COLUMN "volume" TO "udf11";
ALTER TABLE "Metrics" RENAME COLUMN "week52Return" TO "udf12";
ALTER TABLE "Metrics" RENAME COLUMN "ytdReturn" TO "udf13";

-- Note: quickRatio was not renamed as it maps to udf9 which conflicts with pegRatio
-- You may need to handle this separately
