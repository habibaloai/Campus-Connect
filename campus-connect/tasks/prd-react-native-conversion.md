# Product Requirements Document: React Native Mobile App Conversion

## 1. Introduction/Overview

**Campus Connect Mobile** is a React Native mobile application that brings the full Campus Connect experience to iOS and Android devices. This project involves converting the existing Next.js web application into a native mobile app while maintaining full feature parity with all 24 feature categories.

### Problem Statement
Students currently access Campus Connect through a web browser, which lacks the native mobile experience benefits such as push notifications, offline access, faster performance, and seamless device integration. A native mobile app will provide students with instant access to their campus ecosystem directly from their phones.

### Project Scope
Convert the entire Campus Connect Next.js web application to React Native, targeting both iOS and Android platforms, while sharing the existing Supabase backend infrastructure.

---

## 2. Goals

1. **Full Feature Parity**: Implement all 24 feature categories from the web app in the mobile version
2. **Cross-Platform Support**: Single codebase that runs on both iOS and Android
3. **Native Experience**: Leverage native device capabilities (push notifications, camera, biometrics, haptics)
4. **Performance**: Achieve smooth 60fps animations and fast load times
5. **Offline Support**: Enable core features to work without internet connectivity
6. **Shared Backend**: Utilize the existing Supabase database and authentication system
7. **Maintainability**: Create a clean, modular architecture that's easy to extend

---

## 3. User Stories

### Authentication
- **US-001**: As a student, I want to sign up/login using my email so I can access my campus account
- **US-002**: As a student, I want to stay logged in so I don't have to authenticate every time
- **US-003**: As a student, I want to use biometric authentication (Face ID/fingerprint) for quick access

### Events
- **US-004**: As a student, I want to browse campus events so I can find activities to attend
- **US-005**: As a student, I want to RSVP to events so organizers know I'm attending
- **US-006**: As a student, I want to receive push notifications about upcoming events I've RSVP'd to

### Community
- **US-007**: As a student, I want to post questions and discussions so I can engage with fellow students
- **US-008**: As a student, I want to reply to posts so I can help others or continue conversations
- **US-009**: As a student, I want to search community posts to find relevant discussions

### Messaging
- **US-010**: As a student, I want to send direct messages to other students
- **US-011**: As a student, I want to receive real-time message notifications
- **US-012**: As a student, I want to participate in group chats

### Academics
- **US-013**: As a student, I want to view my courses and grades
- **US-014**: As a student, I want to track my GPA and degree progress
- **US-015**: As a student, I want to see upcoming assignments and deadlines

### Financial
- **US-016**: As a student, I want to check my tuition balance and payment status
- **US-017**: As a student, I want to view my meal plan balance
- **US-018**: As a student, I want to see my transaction history

### Dining
- **US-019**: As a student, I want to browse campus dining menus
- **US-020**: As a student, I want to see nutrition information for meals
- **US-021**: As a student, I want to find dining locations and hours

### Transportation
- **US-022**: As a student, I want to view bus routes and schedules
- **US-023**: As a student, I want to check parking availability
- **US-024**: As a student, I want to navigate around campus

### Study Spaces
- **US-025**: As a student, I want to find available study rooms
- **US-026**: As a student, I want to book study rooms
- **US-027**: As a student, I want to see library hours and availability

### AI Assistant
- **US-028**: As a student, I want to chat with an AI assistant for study help
- **US-029**: As a student, I want to get intelligent tutoring recommendations

### Career Services
- **US-030**: As a student, I want to browse job listings
- **US-031**: As a student, I want to apply to jobs through the app
- **US-032**: As a student, I want to see upcoming career fairs

### Wellness
- **US-033**: As a student, I want to track my mood and mental health
- **US-034**: As a student, I want to access mental health resources
- **US-035**: As a student, I want to find wellness services on campus

### Gamification
- **US-036**: As a student, I want to earn achievements for app engagement
- **US-037**: As a student, I want to track my points and streaks
- **US-038**: As a student, I want to see leaderboards

### Notifications
- **US-039**: As a student, I want to receive priority-based push notifications
- **US-040**: As a student, I want to customize my notification preferences

### Search
- **US-041**: As a student, I want to search across all campus resources from one place

---

## 4. Functional Requirements

### 4.1 Framework & Architecture

| Req ID | Requirement |
|--------|-------------|
| FR-001 | The app must be built using **Expo (managed workflow)** for simplified development, OTA updates, and cross-platform compatibility |
| FR-002 | The app must use **Expo Router** for file-based navigation (similar to Next.js App Router) |
| FR-003 | The app must use **TypeScript** for type safety |
| FR-004 | The app must implement a modular architecture with feature-based folder structure |
| FR-005 | The app must share business logic and types with the web app where possible |

### 4.2 Authentication

| Req ID | Requirement |
|--------|-------------|
| FR-010 | The system must integrate with existing Supabase Auth |
| FR-011 | The system must support email/password authentication |
| FR-012 | The system must persist authentication state using secure storage |
| FR-013 | The system must support biometric authentication (Face ID, Touch ID, fingerprint) |
| FR-014 | The system must handle OAuth callback deep links |
| FR-015 | The system must implement automatic token refresh |

### 4.3 Navigation

| Req ID | Requirement |
|--------|-------------|
| FR-020 | The app must implement a bottom tab navigator with main sections |
| FR-021 | The app must use stack navigation within each tab |
| FR-022 | The app must support deep linking to specific screens |
| FR-023 | The app must maintain navigation state across app restarts |
| FR-024 | The app must implement smooth screen transitions |

### 4.4 Dashboard & Home

| Req ID | Requirement |
|--------|-------------|
| FR-030 | The dashboard must display a personalized welcome message |
| FR-031 | The dashboard must show quick access cards to all 24 feature categories |
| FR-032 | The dashboard must display recent notifications |
| FR-033 | The dashboard must support pull-to-refresh |

### 4.5 Events Module

| Req ID | Requirement |
|--------|-------------|
| FR-040 | The system must display a list/calendar view of campus events |
| FR-041 | The system must show event details (title, description, date, location, attendees) |
| FR-042 | The system must allow users to RSVP to events |
| FR-043 | The system must track and display attendance count |
| FR-044 | The system must support event filtering and search |
| FR-045 | The system must integrate with device calendar for event reminders |

### 4.6 Community Module

| Req ID | Requirement |
|--------|-------------|
| FR-050 | The system must display community posts in a feed format |
| FR-051 | The system must allow users to create new posts |
| FR-052 | The system must support replies to posts |
| FR-053 | The system must support post categories/tags |
| FR-054 | The system must implement search within community |
| FR-055 | The system must support post voting/reactions |

### 4.7 Messaging Module

| Req ID | Requirement |
|--------|-------------|
| FR-060 | The system must display a list of conversations |
| FR-061 | The system must support real-time messaging using Supabase Realtime |
| FR-062 | The system must support direct messages (1:1) |
| FR-063 | The system must support group chats |
| FR-064 | The system must show read receipts and typing indicators |
| FR-065 | The system must support message search |
| FR-066 | The system must allow image/file sharing in messages |

### 4.8 Academics Module

| Req ID | Requirement |
|--------|-------------|
| FR-070 | The system must display enrolled courses |
| FR-071 | The system must show grades and GPA |
| FR-072 | The system must display assignments with due dates |
| FR-073 | The system must show degree progress/requirements |
| FR-074 | The system must support assignment reminders |

### 4.9 Financial Module

| Req ID | Requirement |
|--------|-------------|
| FR-080 | The system must display tuition balance |
| FR-081 | The system must show wallet/meal plan balance |
| FR-082 | The system must display transaction history |
| FR-083 | The system must show payment due dates |

### 4.10 Dining Module

| Req ID | Requirement |
|--------|-------------|
| FR-090 | The system must display dining locations with hours |
| FR-091 | The system must show daily/weekly menus |
| FR-092 | The system must display nutrition information |
| FR-093 | The system must support dietary filters (vegetarian, vegan, allergens) |

### 4.11 Transportation Module

| Req ID | Requirement |
|--------|-------------|
| FR-100 | The system must display bus routes and schedules |
| FR-101 | The system must show real-time bus locations (if available) |
| FR-102 | The system must display parking lot availability |
| FR-103 | The system must integrate with maps for navigation |

### 4.12 Study Spaces Module

| Req ID | Requirement |
|--------|-------------|
| FR-110 | The system must display available study rooms |
| FR-111 | The system must allow room booking |
| FR-112 | The system must show library hours and capacity |
| FR-113 | The system must support booking modifications/cancellations |

### 4.13 AI Assistant Module

| Req ID | Requirement |
|--------|-------------|
| FR-120 | The system must provide a chat interface for AI assistance |
| FR-121 | The system must support study-related queries |
| FR-122 | The system must maintain conversation history |

### 4.14 Career Module

| Req ID | Requirement |
|--------|-------------|
| FR-130 | The system must display job listings |
| FR-131 | The system must allow job applications |
| FR-132 | The system must show career fair schedules |
| FR-133 | The system must support job search and filters |

### 4.15 Wellness Module

| Req ID | Requirement |
|--------|-------------|
| FR-140 | The system must support mood tracking |
| FR-141 | The system must display mental health resources |
| FR-142 | The system must show wellness service locations |

### 4.16 Achievements/Gamification Module

| Req ID | Requirement |
|--------|-------------|
| FR-150 | The system must display user achievements |
| FR-151 | The system must track points and streaks |
| FR-152 | The system must show progress toward achievements |
| FR-153 | The system must display leaderboards |

### 4.17 Notifications Module

| Req ID | Requirement |
|--------|-------------|
| FR-160 | The system must support push notifications via Expo Push |
| FR-161 | The system must display in-app notification center |
| FR-162 | The system must support notification preferences |
| FR-163 | The system must implement priority-based notification display |
| FR-164 | The system must support notification grouping |

### 4.18 Search Module

| Req ID | Requirement |
|--------|-------------|
| FR-170 | The system must provide universal search across all modules |
| FR-171 | The system must support search suggestions |
| FR-172 | The system must display categorized search results |

### 4.19 Offline Support

| Req ID | Requirement |
|--------|-------------|
| FR-180 | The system must cache essential data for offline access |
| FR-181 | The system must queue actions taken offline and sync when online |
| FR-182 | The system must display offline status indicator |

### 4.20 UI/UX Requirements

| Req ID | Requirement |
|--------|-------------|
| FR-190 | The app must match the blue & white professional theme of the web app |
| FR-191 | The app must implement smooth animations using React Native Reanimated |
| FR-192 | The app must support dark mode |
| FR-193 | The app must follow platform-specific design guidelines (iOS/Android) |
| FR-194 | The app must be accessible (screen reader support, proper contrast) |
| FR-195 | The app must support Lottie animations |

---

## 5. Non-Goals (Out of Scope)

1. **Web App Modifications**: The existing Next.js web app will remain unchanged
2. **New Backend Features**: No new Supabase tables or APIs will be created (use existing)
3. **Payment Processing**: In-app payments for tuition or services
4. **Social Media Integration**: Sharing to external social platforms
5. **Wearable Support**: Apple Watch or Android Wear apps
6. **Tablet-Optimized UI**: While the app will work on tablets, no tablet-specific layouts
7. **Widget Support**: Home screen widgets (can be added in future phases)
8. **Backend Admin Panel**: Admin features for managing content

---

## 6. Design Considerations

### Visual Design
- Maintain consistency with the web app's blue & white professional theme
- Use the existing color palette defined in `globals.css`
- Adapt CSS Module styles to React Native StyleSheet/NativeWind

### Component Library Recommendations
- **NativeWind** (TailwindCSS for React Native) or **Tamagui** for styling
- **React Native Paper** or custom components matching web design
- **Lucide React Native** for icons (same as web)
- **Lottie React Native** for animations (same as web)
- **React Native Reanimated** for smooth animations (replacement for Framer Motion)

### Navigation Structure
```
├── (auth)
│   ├── login
│   └── signup
├── (tabs)
│   ├── home (dashboard)
│   ├── events
│   ├── community
│   ├── messages
│   └── profile
├── academics/
├── financial/
├── dining/
├── transport/
├── study/
├── ai/
├── career/
├── wellness/
├── achievements/
├── notifications/
└── search/
```

### Screen Mockup References
- Reference existing web app screens at `src/app/dashboard/`
- Adapt layouts for mobile viewport
- Use native mobile patterns (bottom sheets, swipe gestures, pull-to-refresh)

---

## 7. Technical Considerations

### Recommended Tech Stack

| Category | Technology | Reason |
|----------|------------|--------|
| Framework | Expo SDK 52+ (managed) | Simplified development, OTA updates, excellent DX |
| Navigation | Expo Router v4 | File-based routing similar to Next.js App Router |
| State Management | React Context + Tanstack Query | Match existing web patterns, excellent caching |
| Backend | Supabase JS Client | Same as web app |
| Realtime | Supabase Realtime | Same as web for messaging |
| Styling | NativeWind (Tailwind) | Consistent with modern RN practices |
| Animations | React Native Reanimated 3 | 60fps animations, gesture support |
| Icons | Lucide React Native | Same icon set as web |
| Storage | Expo SecureStore | Secure token storage |
| Push Notifications | Expo Notifications | Integrated push notification service |

### Shared Code Strategy
```
campus-connect/
├── packages/
│   └── shared/           # Shared TypeScript types, utils, constants
│       ├── types/
│       ├── utils/
│       └── constants/
├── apps/
│   ├── web/              # Existing Next.js app (moved)
│   └── mobile/           # New React Native app
└── package.json          # Monorepo configuration
```

### Key Dependencies (Mobile App)
```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react-native": "0.76.x",
    "@supabase/supabase-js": "^2.39.1",
    "react-native-reanimated": "~3.16.0",
    "nativewind": "^4.0.0",
    "lottie-react-native": "^6.0.0",
    "lucide-react-native": "^0.303.0",
    "@tanstack/react-query": "^5.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-notifications": "~0.29.0",
    "expo-local-authentication": "~15.0.0"
  }
}
```

### Environment Configuration
- Use the same Supabase project (shared backend)
- Configure Expo environment variables for Supabase URL and anon key
- Set up EAS Build for app store deployments

### Performance Considerations
- Implement virtualized lists for long scrolling content (FlashList)
- Use image caching and optimization
- Implement proper loading states and skeletons
- Minimize re-renders with proper memoization

---

## 8. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Feature Parity | 100% | All 24 web features functional in mobile |
| App Store Rating | ≥ 4.5 stars | App Store / Play Store reviews |
| Crash-Free Rate | ≥ 99.5% | Expo/Sentry crash reporting |
| App Launch Time | < 2 seconds | Performance monitoring |
| User Adoption | 50% of web users within 3 months | Analytics comparison |
| Push Notification Opt-in | ≥ 70% | Notification permission analytics |
| Daily Active Users | Match or exceed web DAU | Analytics dashboard |
| Session Duration | ≥ Web average | Analytics comparison |

---

## 9. Open Questions

1. **App Store Accounts**: Are Apple Developer ($99/year) and Google Play Developer ($25 one-time) accounts already set up?

2. **Push Notification Server**: Will push notifications be triggered from Supabase Edge Functions, or is a separate notification server needed?

3. **Offline Data Scope**: Which specific data should be cached for offline access? (e.g., last N events, all courses, recent messages)

4. **Deep Linking Domain**: What domain will be used for universal/app links (e.g., `campusconnect.app`)?

5. **Analytics Platform**: Which analytics service should be integrated? (e.g., Mixpanel, Amplitude, PostHog, Expo Analytics)

6. **Beta Testing**: Will TestFlight (iOS) and Google Play Internal Testing be used for beta distribution?

7. **Existing User Migration**: Should there be a campaign to encourage web users to download the mobile app?

8. **Branding Assets**: Are high-resolution app icons and splash screen designs available, or need to be created?

---

## 10. Implementation Phases (Recommended)

### Phase 1: Foundation (Weeks 1-3)
- Project setup with Expo
- Authentication flow
- Navigation structure
- Shared component library
- Supabase integration

### Phase 2: Core Features (Weeks 4-7)
- Dashboard/Home
- Events module
- Community module
- Messaging with realtime
- Notifications

### Phase 3: Extended Features (Weeks 8-11)
- Academics
- Financial
- Dining
- Transportation
- Study Spaces

### Phase 4: Remaining Features (Weeks 12-14)
- AI Assistant
- Career Services
- Wellness
- Achievements/Gamification
- Universal Search

### Phase 5: Polish & Launch (Weeks 15-16)
- Performance optimization
- Bug fixes
- App store submission
- Beta testing
- Production launch

---

## Appendix A: File Structure Mapping

| Web (Next.js) | Mobile (Expo Router) |
|---------------|---------------------|
| `src/app/page.tsx` | `app/(auth)/login.tsx` |
| `src/app/dashboard/page.tsx` | `app/(tabs)/home.tsx` |
| `src/app/dashboard/events/page.tsx` | `app/(tabs)/events/index.tsx` |
| `src/app/dashboard/community/page.tsx` | `app/(tabs)/community/index.tsx` |
| `src/app/dashboard/messages/page.tsx` | `app/(tabs)/messages/index.tsx` |
| `src/app/dashboard/messages/[id]/page.tsx` | `app/(tabs)/messages/[id].tsx` |
| `src/context/AuthContext.tsx` | `contexts/AuthContext.tsx` |
| `src/lib/supabase.ts` | `lib/supabase.ts` |
| `src/hooks/useSupabase.ts` | `hooks/useSupabase.ts` |
| `src/components/*.tsx` | `components/*.tsx` |

---

## Appendix B: Supabase Tables (Existing)

The mobile app will use all existing tables:
- `profiles`
- `courses` & `enrollments`
- `assignments`
- `events` & `event_attendees`
- `posts` & `post_replies`
- `faqs`
- `transactions` & `financial_summary`
- `study_rooms` & `room_bookings`
- `jobs` & `job_applications`
- `notifications`
- `achievements` & `user_stats`
- `conversations` & `messages`

No schema changes required. All RLS policies remain in effect.

---

*Document Version: 1.0*  
*Created: November 27, 2025*  
*Status: Draft - Pending Review*










