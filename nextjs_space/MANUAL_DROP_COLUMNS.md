# Drop Unused Metrics Columns

The database has firewall restrictions. You need to run the SQL manually.

## Option 1: Use psql command line

```bash
psql "postgresql://role_5ebca9571:OaDVNTRKG6CsdGs1bUYKUDjmL3Sm1Jei@db-5ebca9571.db003.hosteddb.reai.io:5432/5ebca9571?connect_timeout=15" -f scripts/drop-unused-metrics-columns.sql
```

## Option 2: Copy/paste in any PostgreSQL client

If you have access to pgAdmin, DBeaver, or any PostgreSQL client, connect and run:

```sql
ALTER TABLE "Metrics" 
DROP COLUMN IF EXISTS "bookValuePerShare",
DROP COLUMN IF EXISTS "currentRatio",
DROP COLUMN IF EXISTS "dividendYield",
DROP COLUMN IF EXISTS "earningsGrowthYoY",
DROP COLUMN IF EXISTS "eps",
DROP COLUMN IF EXISTS "grossMargin",
DROP COLUMN IF EXISTS "operatingMargin",
DROP COLUMN IF EXISTS "payoutRatio",
DROP COLUMN IF EXISTS "pegRatio",
DROP COLUMN IF EXISTS "quickRatio",
DROP COLUMN IF EXISTS "revenueGrowthYoY",
DROP COLUMN IF EXISTS "volume",
DROP COLUMN IF EXISTS "week52Return",
DROP COLUMN IF EXISTS "ytdReturn";
```

## Option 3: Check if your database provider has a web console

Some hosting providers (like Supabase, Railway, Neon) have web-based SQL editors where you can paste and run the SQL.

## After running the SQL

Verify the columns are gone:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Metrics' 
ORDER BY ordinal_position;
```

You should see 25 columns instead of 39.
