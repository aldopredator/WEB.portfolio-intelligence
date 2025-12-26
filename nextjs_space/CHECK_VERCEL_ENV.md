# 🚨 CRITICAL: Database Connection Fix

## Root Cause
Your Prisma schema uses `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL` but this environment variable is **NOT set in Vercel**. This is why it keeps losing connection after every deployment.

## Fix Instructions

### 1. Go to Vercel Dashboard
- Open https://vercel.com/dashboard
- Select your `portfolio-intelligence` project

### 2. Add Environment Variable
1. Click **Settings** tab
2. Click **Environment Variables** in left menu
3. Click **Add New** button
4. Fill in:
   - **Name**: `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL`
   - **Value**: `postgresql://role_5ebca9571:OaDVNTRKG6CsdGs1bUYKUDjmL3Sm1Jei@db-5ebca9571.db003.hosteddb.reai.io:5432/5ebca9571?connect_timeout=15`
   - **Environments**: Check ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**

### 3. Redeploy
After adding the env var, you MUST redeploy:
- Go to **Deployments** tab
- Click the 3 dots (⋯) on the latest deployment
- Click **Redeploy**
- Select "Use existing build cache" (faster)

### 4. Verify Fix
After redeployment completes:
- Open your site
- Dashboard should show real stock data (not N/A)
- Check that statistics, earnings, and news load properly

## Why This Keeps Happening
Every time you push to GitHub:
1. Vercel triggers a new build
2. Build runs `prisma generate` which creates the Prisma Client
3. The generated client tries to read `PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL`
4. **Environment variable is missing in Vercel** ❌
5. Prisma Client can't connect → Falls back to JSON

## Alternative Solution (Not Recommended)
You could rename the env var to just `DATABASE_URL` everywhere, but that requires:
- Changing `prisma/schema.prisma` line 9
- Renaming `.env.local` variable
- Running `prisma generate` locally
- Committing and pushing

The first solution (adding env var in Vercel) is faster and safer.

## Expected Outcome
After adding the environment variable and redeploying:
- ✅ Database connection stable across all deployments
- ✅ No more fallback to JSON data
- ✅ Stock statistics, earnings, recommendations all load from database
- ✅ No more "N/A" everywhere
