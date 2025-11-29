# Expo Go Environment Variables Setup

## Problem
The app works on laptop but not on phone using Expo Go. This is usually because environment variables aren't being loaded properly in Expo Go.

## Solution

### Step 1: Create `.env` file in mobile directory

Create a file at `campus-connect/apps/mobile/.env` with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- Use `EXPO_PUBLIC_` prefix (not `NEXT_PUBLIC_`)
- File must be named `.env` (not `.env.local`)
- File must be in `apps/mobile/` directory

### Step 2: Get your Supabase credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - **Project URL** → Use as `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use as `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Restart Expo with cache clear

After creating/updating `.env` file:

```bash
cd campus-connect/apps/mobile
npx expo start -c
```

The `-c` flag clears the cache, which is important when environment variables change.

### Step 4: Verify in Expo Go

1. Scan QR code with Expo Go app
2. Check the console/logs for:
   - `✅ Loaded .env from mobile directory`
   - `🔍 Supabase Config Check:` with ✅ marks

If you see errors about missing Supabase URL/Key, the `.env` file isn't being loaded correctly.

## Troubleshooting

### Issue: Still not working after creating .env

1. **Check file location**: Must be `campus-connect/apps/mobile/.env` (not in root)
2. **Check file format**: No spaces around `=`, no quotes needed
3. **Restart Expo**: Always restart after changing `.env`
4. **Clear cache**: Use `npx expo start -c` to clear cache
5. **Check console**: Look for error messages about missing env vars

### Issue: Works on web but not Expo Go

- Web uses `NEXT_PUBLIC_` prefix
- Expo Go needs `EXPO_PUBLIC_` prefix
- Make sure both are in your `.env` file

### Issue: Environment variables not loading

The `app.config.ts` file loads environment variables in this order:
1. `apps/mobile/.env` (highest priority)
2. `campus-connect/.env.local` (fallback)
3. `process.env` (system environment)

Make sure your `.env` file is in the mobile directory.

## Example .env file

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example

# Optional: Google Maps API Key
# EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
```

## After Setup

Once the `.env` file is created and Expo is restarted:
1. The app should connect to Supabase
2. Login/signup should work
3. All features requiring Supabase should work

If issues persist, check the Expo Go console for specific error messages.

