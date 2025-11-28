# Campus Connect Mobile App

A React Native mobile application built with Expo for the Campus Connect platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for development)

### Installation

1. Navigate to the mobile app directory:
```bash
cd campus-connect/apps/mobile
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_APP_NAME=Campus Connect
EXPO_PUBLIC_APP_VERSION=1.0.0
```

4. Start the development server:
```bash
npx expo start
```

5. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## 📱 Features

### Core Features
- **Authentication**: Email/password login with Supabase
- **Dashboard**: Personalized home screen with quick access
- **Events**: Campus events with RSVP functionality
- **Community**: Discussion forums and posts
- **Messaging**: Real-time chat with Supabase Realtime

### Extended Features
- **Academics**: Course tracking, GPA, assignments
- **Financial**: Tuition balance, wallet, transactions
- **Dining**: Menus, locations, dietary filters
- **Transportation**: Bus routes, parking availability
- **Study Spaces**: Room booking system
- **AI Assistant**: Study help chat interface
- **Career Services**: Job listings, career events
- **Wellness**: Mental health resources
- **Achievements**: Gamification system

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (TailwindCSS)
- **State Management**: React Context + TanStack Query
- **Backend**: Supabase (Auth, Database, Realtime)
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native

## 📁 Project Structure

```
apps/mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   ├── academics/         # Academic module
│   ├── ai/                # AI assistant
│   ├── career/            # Career services
│   ├── dining/            # Dining information
│   ├── financial/         # Financial management
│   ├── notifications/     # Notification center
│   ├── search/            # Universal search
│   ├── study/             # Study spaces
│   ├── transport/         # Transportation
│   ├── wellness/          # Wellness resources
│   └── achievements/      # Gamification
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   ├── events/           # Event components
│   ├── community/        # Community components
│   ├── messages/         # Messaging components
│   └── home/             # Home screen components
├── contexts/             # React Context providers
├── hooks/                # Custom hooks
├── lib/                  # Utilities and services
├── providers/            # App providers
├── constants/            # Theme and constants
├── types/                # TypeScript types
└── assets/               # Images and fonts
```

## 🏗️ Building

### Development Build
```bash
npx eas build --profile development --platform ios
npx eas build --profile development --platform android
```

### Preview Build
```bash
npx eas build --profile preview --platform all
```

### Production Build
```bash
npx eas build --profile production --platform all
```

## 📤 Submitting to App Stores

### iOS (App Store)
```bash
npx eas submit --platform ios --latest
```

### Android (Google Play)
```bash
npx eas submit --platform android --latest
```

## 🔧 Configuration

### Environment Variables
See `.env.example` for required environment variables.

### EAS Build
Configure `eas.json` for build profiles and submission settings.

### App Config
Modify `app.config.ts` for app metadata, permissions, and plugins.

## 📝 Scripts

```bash
npm start          # Start Expo development server
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start web version
npm run lint       # Run ESLint
npm run test       # Run tests
npm run clean      # Clean node_modules and cache
```

## 🧪 Testing

```bash
npm test           # Run Jest tests
npm run test:watch # Run tests in watch mode
```

## 🐛 Debugging

Press `j` in the terminal to open Chrome DevTools for debugging.

For React Native specific debugging, use:
- Expo DevTools
- React Native Debugger
- Flipper

## 📚 Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Supabase Documentation](https://supabase.com/docs)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.









