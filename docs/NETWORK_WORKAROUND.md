# Alternative Supabase Setup - Network Issues Workaround

Since you're experiencing network connectivity issues to PostgreSQL port 5432, here's an alternative approach:

## Method 1: Use Supabase SQL Editor (Recommended)

### Step 1: Generate SQL Migration
1. Run this command to generate the SQL migration:
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > setup-database.sql
```

### Step 2: Execute via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Create a new query
4. Copy and paste the content from `setup-database.sql`
5. Click **Run** to execute the migration

### Step 3: Create Sample Data
1. Copy the content from `prisma/seed.ts` 
2. Convert it to SQL INSERT statements
3. Run in Supabase SQL Editor

## Method 2: Use Vercel Environment (Recommended Alternative)

Since Vercel can connect to Supabase, you can deploy first and let the production environment handle the migration:

### Step 1: Deploy to Vercel
1. Push your code to GitHub
2. Deploy to Vercel with environment variables
3. The app will create tables on first connection

### Step 2: Add Migration Endpoint
Create an API endpoint that runs the migration when called.

## Method 3: VPN/Network Solution

The connection issue is likely:
- **Firewall**: Your firewall blocks port 5432
- **ISP**: Some ISPs block database ports for security
- **Corporate Network**: Company networks often block external DB connections

Solutions:
1. **Try from different network** (mobile hotspot, different WiFi)
2. **Use VPN** to bypass ISP restrictions
3. **Use SSH tunnel** through a server that can connect

## Method 4: Local Development with Remote Deploy

1. **Skip local migration** for now
2. **Deploy to Vercel** with the environment variables
3. **Use Vercel's environment** to run migrations
4. **Access via Supabase dashboard** for data management

Would you like me to help you with any of these approaches?
