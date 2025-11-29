# Campus Connect Mobile App 🎓📱

A comprehensive student community mobile app built with React Native (Expo) and Supabase.

## ✨ Features

- 🔐 **Authentication** - Secure login/signup with Supabase Auth
- 📅 **Events** - Browse and join campus events with RSVP tracking, event chat, and photo galleries
- 👥 **Community** - Post questions, share discussions, and help fellow students
- 💬 **Messaging** - Direct messages and group chats with real-time updates
- 🎓 **Academic Management** - Grades, courses, GPA tracking, degree planning
- 💰 **Financial Services** - Tuition, wallet, transactions, meal plan balance
- 🍽️ **Campus Dining** - Menus, nutrition info, dining locations
- 🚌 **Transportation** - Bus routes, parking, campus navigation
- 📚 **Study Spaces** - Library rooms, booking, availability
- 🤖 **AI Assistant** - Intelligent tutoring and study help
- 💼 **Career Services** - Job listings, applications, career fairs
- 🧘 **Wellness** - Mood tracking, mental health resources
- 🏆 **Gamification** - Achievements, points, streaks
- 🔔 **Smart Notifications** - Priority-based alerts
- 🔍 **Universal Search** - Find anything on campus

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo Go app installed on your phone (iOS/Android)

### Installation

```bash
# Install dependencies
npm install

# Navigate to mobile app directory
cd apps/mobile

# Start Expo development server
npm start
# or
npx expo start
```

Scan the QR code with Expo Go app to run the app on your device.

## 🔑 Environment Variables Setup

**IMPORTANT:** You need to create **TWO** `.env` files for the mobile app to work properly.

### Step 1: Create First .env File (Mobile Directory)

Create a file called `.env` in the **mobile app directory** (`campus-connect/apps/mobile/.env`):

```env
# Supabase Configuration
# Paste This
EXPO_PUBLIC_SUPABASE_URL=https://ojmkhimriptucfsulfzv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbWtoaW1yaXB0dWNmc3VsZnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjE4MjYsImV4cCI6MjA3OTczNzgyNn0.Nu_-N1xZQBD9yzavMyzxAWC2dPp4UKM3tt6402kzGjs

# Site URL (optional)
EXPO_PUBLIC_SITE_URL=http://localhost:3001
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCtI_PNpHLV7HRT1hI0lVpgMuA1B6kPImk





```

**Important Notes:**
- File must be named `.env` (not `.env.local`)
- File must be in `apps/mobile/` directory
- This is the **primary** environment file (highest priority)

### Step 2: Create Second .env File (Root Directory)

Create a file called `.env.local` in the **root directory** (`campus-connect/.env.local`):

```env
# Supabase Configuration
# Paste This
EEXPO_PUBLIC_SUPABASE_URL=https://ojmkhimriptucfsulfzv.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbWtoaW1yaXB0dWNmc3VsZnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjE4MjYsImV4cCI6MjA3OTczNzgyNn0.Nu_-N1xZQBD9yzavMyzxAWC2dPp4UKM3tt6402kzGjs

# Site URL (optional)
EXPO_PUBLIC_SITE_URL=http://localhost:3001
EXPO_PUBLIC_SUPABASE_URL=https://ojmkhimriptucfsulfzv.supabase.coEXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbWtoaW1yaXB0dWNmc3VsZnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjE4MjYsImV4cCI6MjA3OTczNzgyNn0.Nu_-N1xZQBD9yzavMyzxAWC2dPp4UKM3tt6402kzGjsEXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCtI_PNpHLV7HRT1hI0lVpgMuA1B6kPImk
```

**Important Notes:**
- This file is used as a **fallback** if the mobile `.env` file is missing
- File must be named `.env.local`
- File must be in `campus-connect/` root directory

### Step 3: Restart Expo with Cache Clear

After creating/updating `.env` files:

```bash
cd apps/mobile
npx expo start -c
```

The `-c` flag clears the cache, which is **essential** when environment variables change.

### Step 4: Verify Setup

1. Scan QR code with Expo Go app
2. Check the console/logs for:
   - `✅ Loaded .env from mobile directory`
   - `🔍 Supabase Config Check:` with ✅ marks

If you see errors about missing Supabase URL/Key, check your `.env` files.


## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native
- **Language**: TypeScript

## 📁 Project Structure

```
campus-connect/
├── apps/
│   └── mobile/              # Mobile app (React Native/Expo)
│       ├── app/             # App screens and routes
│       ├── lib/             # Supabase client & API functions
│       ├── components/      # Reusable components
│       └── .env            # Mobile environment variables (PRIMARY)
├── supabase-schema.sql      # Main database schema
├── supabase-migrations/     # Database migration files
├── .env.local              # Root environment variables (FALLBACK)
└── README.md               # This file
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Secure authentication with Supabase Auth
- Private data protected per-user
- Safe client-side API keys (anon keys only)

## 🐛 Troubleshooting

### Issue: App not connecting to Supabase

1. **Verify both .env files exist:**
   - `campus-connect/apps/mobile/.env` (primary)
   - `campus-connect/.env.local` (fallback)
   - change the .env.local to .env

2. **Check file format:**
   - No spaces around `=`
   - No quotes needed around values
   - Make sure all required variables are present

3. **Restart Expo with cache clear:**
   ```bash
   cd apps/mobile
   npx expo start -c
   ```

4. **Check console logs:**
   - Look for `✅ Loaded .env from mobile directory`
   - Check for error messages about missing env vars

### Issue: Environment variables not loading

The `app.config.ts` file loads environment variables in this order:
1. `apps/mobile/.env` (highest priority)
2. `campus-connect/.env.local` (fallback)
3. `process.env` (system environment)

Make sure your `.env` file is in the correct location.

### Issue: Database errors

1. Make sure you've run `supabase-schema.sql`
2. Check that all migrations have been applied
3. Verify RLS policies are enabled
4. Check Supabase dashboard for any error messages

## 📚 Additional Documentation

- [apps/mobile/EXPO_GO_ENV_SETUP.md](./apps/mobile/EXPO_GO_ENV_SETUP.md) - Detailed mobile environment setup guide
- [apps/mobile/README.md](./apps/mobile/README.md) - Mobile app specific documentation

## 📱 Design

- Blue & white professional theme
- Mobile-first responsive design
- Smooth animations and transitions
- Accessible UI components

## License

MIT
