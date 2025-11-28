# PRD: Fix Authentication (Sign-Up) Logic with Supabase

## 1. Introduction/Overview

The Campus Connect mobile application currently has a **critical authentication issue** where users cannot create new accounts. The sign-up process fails completely, preventing new users from accessing the app. This issue affects the React Native mobile app which shares a Supabase backend with the web application.

### Problem Statement
New users attempting to register through the mobile app encounter errors and cannot successfully create accounts. This is blocking user adoption and is classified as a critical issue requiring immediate resolution.

## 2. Goals

1. **Enable successful user registration** - Users must be able to create new accounts without errors
2. **Ensure profile creation** - User profiles must be properly created in the `profiles` table after signup
3. **Configure email verification** - Determine and implement the appropriate email verification strategy
4. **Provide clear error feedback** - Users should receive helpful, actionable error messages
5. **Maintain consistency** - Authentication should work identically across mobile and web platforms

## 3. User Stories

### US-1: New User Registration
**As a** new user,  
**I want to** create an account with my email, password, and name,  
**So that** I can access Campus Connect features.

**Acceptance Criteria:**
- User can enter name, email, and password
- Form validates all inputs before submission
- Account is created in Supabase Auth
- User profile is created in the `profiles` table
- User receives confirmation of successful registration
- User can proceed to sign in

### US-2: Registration Error Handling
**As a** user attempting to register,  
**I want to** see clear error messages when something goes wrong,  
**So that** I know how to fix the issue or try again.

**Acceptance Criteria:**
- Invalid email format shows appropriate error
- Weak password shows password requirements
- Duplicate email shows "account already exists" message
- Network errors show retry option
- All errors are user-friendly (no technical jargon)

### US-3: Email Verification (Optional)
**As an** administrator,  
**I want to** decide whether email verification is required,  
**So that** I can balance security with user experience.

**Acceptance Criteria:**
- System supports both verified and unverified signup flows
- If verification required: user is informed to check email
- If verification not required: user can sign in immediately

## 4. Functional Requirements

### 4.1 Environment Configuration
| # | Requirement |
|---|-------------|
| FR-1.1 | The `.env` file must contain valid, properly encoded Supabase credentials |
| FR-1.2 | `EXPO_PUBLIC_SUPABASE_URL` must be set to the correct Supabase project URL |
| FR-1.3 | `EXPO_PUBLIC_SUPABASE_ANON_KEY` must be set to the correct anonymous key |
| FR-1.4 | Environment variables must be accessible by the Expo app at runtime |

### 4.2 Sign-Up Process
| # | Requirement |
|---|-------------|
| FR-2.1 | The system must validate user input (name, email, password) before submission |
| FR-2.2 | Email must be validated using regex pattern for proper format |
| FR-2.3 | Password must be at least 6 characters long |
| FR-2.4 | Password confirmation must match the original password |
| FR-2.5 | The system must call `supabase.auth.signUp()` with email, password, and user metadata |
| FR-2.6 | Upon successful auth signup, the system must create a profile record in the `profiles` table |
| FR-2.7 | Profile creation should use `upsert` to handle edge cases |
| FR-2.8 | The system must handle and display appropriate error messages for all failure scenarios |

### 4.3 Profile Creation
| # | Requirement |
|---|-------------|
| FR-3.1 | Profile record must include: `id` (matching auth user id), `name`, `email`, `created_at`, `updated_at` |
| FR-3.2 | Profile creation must not block signup if it fails due to RLS policies |
| FR-3.3 | Profile creation errors should be logged but not shown to users |

### 4.4 Error Handling
| # | Requirement |
|---|-------------|
| FR-4.1 | "User already registered" errors must show user-friendly message suggesting sign-in |
| FR-4.2 | Network errors must show retry option |
| FR-4.3 | Invalid credential errors must specify what's wrong |
| FR-4.4 | All errors must be caught and handled gracefully (no app crashes) |

### 4.5 Post-Registration Flow
| # | Requirement |
|---|-------------|
| FR-5.1 | After successful signup, show success confirmation to user |
| FR-5.2 | Redirect user to login screen after acknowledgment |
| FR-5.3 | If email verification is disabled, optionally auto-sign-in the user |

## 5. Non-Goals (Out of Scope)

- **Social authentication** (Google, Apple, Facebook login) - not included in this fix
- **Password reset functionality** - separate feature, not part of this PRD
- **Two-factor authentication (2FA)** - future enhancement
- **Admin user management** - separate admin feature
- **Sign-in fixes** - confirmed working, not in scope
- **Web app authentication** - only mobile app is affected

## 6. Technical Considerations

### 6.1 Known Issues to Address

1. **`.env` File Encoding**
   - Current `.env` file appears to have encoding corruption
   - Must be recreated with proper UTF-8 encoding
   - Credentials must be re-entered correctly

2. **Supabase Configuration**
   - Verify Supabase project settings for email confirmation
   - Check RLS (Row Level Security) policies on `profiles` table
   - Ensure `profiles` table allows inserts for authenticated users

3. **Dependencies**
   - `@supabase/supabase-js` - Supabase client library
   - `expo-secure-store` or `@react-native-async-storage/async-storage` - Session storage

### 6.2 Files to Modify

| File | Changes Required |
|------|------------------|
| `apps/mobile/.env` | Recreate with correct Supabase credentials |
| `apps/mobile/lib/supabase.ts` | Update `auth.signUp()` to include profile creation |
| `apps/mobile/contexts/AuthContext.tsx` | Improve signup function error handling |
| `apps/mobile/app/(auth)/signup.tsx` | Enhance validation and error display |

### 6.3 Supabase Dashboard Checks

1. **Authentication Settings** (`Authentication > Settings`)
   - Check "Enable email confirmations" setting
   - Review email templates if verification is enabled

2. **Database Policies** (`Database > Tables > profiles`)
   - Ensure INSERT policy exists for authenticated users
   - Policy should allow: `auth.uid() = id`

3. **API Keys** (`Settings > API`)
   - Verify `anon` public key is correct
   - Verify project URL is correct

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Signup Success Rate | 100% for valid inputs | Monitor Supabase Auth logs |
| Profile Creation Rate | 100% after signup | Query `profiles` table vs `auth.users` |
| Error Message Clarity | No technical errors shown | User testing feedback |
| Time to Register | < 30 seconds | User flow timing |

## 8. Implementation Checklist

- [ ] Fix `.env` file encoding and verify credentials
- [ ] Update `auth.signUp()` in `lib/supabase.ts` to create profile
- [ ] Add proper error handling in `AuthContext.tsx`
- [ ] Enhance input validation in `signup.tsx`
- [ ] Add user-friendly error messages
- [ ] Test signup flow end-to-end
- [ ] Verify profile is created in database
- [ ] Test error scenarios (duplicate email, invalid input, network failure)
- [ ] Configure email verification setting in Supabase (enable/disable)

## 9. Open Questions

1. **Email Verification Decision**: Should email verification be required for new users?
   - **Option A**: Required - more secure, but adds friction
   - **Option B**: Not required - faster onboarding, less secure
   - **Recommendation**: Start with disabled for easier testing, enable for production

2. **Profile Fields**: Are there additional profile fields needed beyond name and email?
   - Current: `id`, `name`, `email`, `created_at`, `updated_at`
   - Potential additions: `avatar_url`, `major`, `year`, `bio`

3. **Rate Limiting**: Should there be rate limiting on signup attempts?
   - Supabase has built-in rate limiting, but custom limits may be needed

---

## Appendix: Error Message Reference

| Error Code/Message | User-Friendly Message |
|--------------------|----------------------|
| `User already registered` | "An account with this email already exists. Please sign in instead." |
| `Invalid email` | "Please enter a valid email address." |
| `Password should be at least 6 characters` | "Password must be at least 6 characters long." |
| `Network error` | "Unable to connect. Please check your internet connection and try again." |
| `Rate limit exceeded` | "Too many attempts. Please wait a few minutes and try again." |
| Generic/Unknown | "Something went wrong. Please try again." |





