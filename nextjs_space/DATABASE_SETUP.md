# Database Setup for Vercel Deployment

## Problem
The database cannot be accessed during the Vercel build phase, so we cannot run migrations or seed the database automatically during deployment.

## Solution
After deploying to Vercel, you need to manually run the database setup commands.

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### Step 2: Link your project
```bash
vercel link
```

### Step 3: Run database migrations
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### Step 4: Seed the database with demo user
```bash
npx prisma db seed
```

This will create:
- **Demo User**: `demo@portfolio-intelligence.co.uk` / `demo123456`
- **Test User**: `john@doe.com` / `johndoe123`

## Alternative: Manual User Creation

If you prefer to create users manually, you can use Prisma Studio or run a custom script:

```bash
# Open Prisma Studio
npx prisma studio
```

Then create a user with a bcrypt-hashed password.

## Environment Variables Required

Make sure these environment variables are set in Vercel:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your deployment URL (e.g., `https://your-app.vercel.app`)

## Notes

- The seed script is idempotent - it won't create duplicate users if they already exist
- Migrations are applied using `prisma migrate deploy` which only applies pending migrations
- The demo credentials will work once the database is seeded
