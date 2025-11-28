# Product Requirements Document: Forget Password Functionality

## Introduction/Overview

This document outlines the requirements for implementing a "Forgot Password" feature in the Campus Connect mobile application. Currently, users who forget their password have no way to reset it, which creates a barrier to accessing their accounts. This feature will allow users to securely reset their password via email, improving user experience and reducing support burden.

**Problem Statement:** Users who forget their passwords cannot regain access to their accounts without contacting support, leading to frustration and increased support tickets.

**Goal:** Enable users to independently reset their passwords through a secure, email-based password recovery flow.

## Goals

1. Allow users to request a password reset using only their email address
2. Send a secure password reset link via email that expires after 1 hour
3. Support both mobile app deep linking and web-based password reset flows
4. Automatically invalidate previous reset links when a new request is made
5. Implement rate limiting to prevent abuse (max 3 requests per hour per email)
6. Provide clear user feedback at each step of the process
7. Redirect users to the login screen after successful password reset

## User Stories

1. **As a user who forgot my password**, I want to enter my email address and receive a password reset link, so that I can regain access to my account without contacting support.

2. **As a user who requested a password reset**, I want to click the link in my email and be taken to a password reset screen (preferably in the app, but web is acceptable), so that I can set a new password.

3. **As a user who accidentally requested multiple password resets**, I want only the most recent reset link to be valid, so that I don't get confused by multiple emails.

4. **As a user who successfully reset my password**, I want to see a confirmation message and be redirected to the login screen, so that I can sign in with my new password.

5. **As a security-conscious user**, I want the reset link to expire after a reasonable time (1 hour), so that my account remains secure if the email is compromised.

6. **As a user**, I want to be protected from abuse, so that malicious actors cannot spam password reset requests to my email address.

## Functional Requirements

### FR1: Password Reset Request Screen
1.1. The system must display a "Forgot Password?" link/button on the login screen (already exists but non-functional).
1.2. When clicked, the system must navigate to a "Forgot Password" screen.
1.3. The screen must display an email input field.
1.4. The screen must display a "Send Reset Link" or "Reset Password" button.
1.5. The system must validate that the email field is not empty.
1.6. The system must validate that the email format is correct (standard email regex).
1.7. The system must display error messages if validation fails (red text, in-page).
1.8. The system must show a loading state while processing the request.

### FR2: Password Reset Request Processing
2.1. The system must call Supabase's `auth.resetPasswordForEmail()` function with the user's email.
2.2. The system must configure the reset link to redirect to the mobile app's callback route (`/auth/callback?type=recovery`).
2.3. The system must configure a fallback web URL for users who cannot open the app link.
2.4. The system must handle the case where the email does not exist in the system (show generic success message for security).
2.5. The system must display a success message after sending the reset email, regardless of whether the email exists (for security).
2.6. The success message must instruct users to check their email inbox and spam folder.

### FR3: Email Reset Link
3.1. The reset link must expire after 1 hour from the time it was generated.
3.2. The reset link must contain a unique token that can only be used once.
3.3. The reset link must be invalidated if a new password reset is requested for the same email.
3.4. The email must contain clear instructions on how to use the link.
3.5. The email must indicate the link expiration time (1 hour).

### FR4: Password Reset Screen (Mobile App)
4.1. The system must handle deep links with `type=recovery` in the callback route (`/auth/callback`).
4.2. When a recovery link is opened, the system must extract the access token and refresh token from the URL.
4.3. The system must set the session using `supabase.auth.setSession()` with the tokens.
4.4. After setting the session, the system must navigate to a "Reset Password" screen.
4.5. The Reset Password screen must display:
   - A "New Password" input field (with secure text entry)
   - A "Confirm Password" input field (with secure text entry)
   - A "Reset Password" button
4.6. The system must validate that both password fields match.
4.7. The system must validate that the password meets minimum requirements (at least 6 characters, matching current signup validation).
4.8. The system must display validation errors if requirements are not met.

### FR5: Password Reset Processing
5.1. The system must call Supabase's `auth.updateUser()` function to update the password.
5.2. The system must handle errors gracefully (e.g., expired link, invalid token).
5.3. The system must display appropriate error messages if the reset fails.
5.4. Upon successful password reset, the system must sign out the user (clear session).
5.5. The system must display a success message confirming the password was reset.
5.6. The system must automatically redirect to the login screen after 2-3 seconds.

### FR6: Web Fallback (Optional but Recommended)
6.1. If the mobile app cannot open the deep link, users should be able to reset their password via a web page.
6.2. The web page must have the same functionality as the mobile reset screen (new password, confirm password, reset button).
6.3. The web page must redirect back to the mobile app after successful reset (if possible) or show instructions to sign in via the app.

### FR7: Rate Limiting
7.1. The system must limit password reset requests to a maximum of 3 requests per hour per email address.
7.2. The system must display an appropriate message if the rate limit is exceeded (e.g., "Too many requests. Please try again in X minutes.").
7.3. Rate limiting should be implemented on the Supabase side (via Supabase Auth settings) or client-side tracking.

### FR8: Security Measures
8.1. The system must never reveal whether an email exists in the system (show generic success message).
8.2. The system must ensure reset links expire after 1 hour (handled by Supabase).
8.3. The system must invalidate previous reset links when a new request is made (handled by Supabase).
8.4. The system must use secure tokens provided by Supabase for password reset links.

## Non-Goals (Out of Scope)

1. **SMS-based password reset** - This feature will only support email-based reset.
2. **Security questions** - Users will not be required to answer security questions.
3. **Password strength meter** - Basic validation only (minimum 6 characters, matching current signup).
4. **Password history** - Users can reuse previous passwords (not preventing reuse of last N passwords).
5. **Two-factor authentication integration** - Password reset will not require 2FA verification.
6. **Account recovery for deleted accounts** - Only active accounts can reset passwords.
7. **Bulk password reset for admins** - This is a user-facing feature only.

## Design Considerations

### UI/UX Requirements

1. **Forgot Password Link:**
   - Location: Below the password field on the login screen (already exists at line 172-174 in `login.tsx`)
   - Style: Blue text, medium font weight, centered
   - Should match existing design patterns

2. **Forgot Password Screen:**
   - Layout: Similar to login/signup screens (centered form, consistent styling)
   - Input: Email field with Mail icon (matching login screen style)
   - Button: Primary blue button with loading state
   - Error/Success messages: In-page messages (red for errors, green for success) matching signup screen pattern

3. **Reset Password Screen:**
   - Layout: Similar to signup screen password fields
   - Inputs: Two password fields (New Password, Confirm Password) with Lock icons
   - Button: Primary blue "Reset Password" button
   - Validation: Real-time validation feedback

4. **Success/Error States:**
   - Use the same in-page message pattern as signup screen (not Alert.alert())
   - Success: Green text, clear confirmation message
   - Error: Red text, specific error message

### Navigation Flow

```
Login Screen
  ↓ (click "Forgot Password?")
Forgot Password Screen
  ↓ (enter email, click "Send Reset Link")
Success Message (check email)
  ↓ (user clicks link in email)
Auth Callback Screen (handles token)
  ↓ (if type=recovery)
Reset Password Screen
  ↓ (enter new password, click "Reset Password")
Success Message
  ↓ (auto redirect after 2-3 seconds)
Login Screen
```

## Technical Considerations

### Dependencies

1. **Supabase Auth:** Already integrated, provides `resetPasswordForEmail()` and `updateUser()` functions.
2. **Expo Router:** Already in use for navigation and deep linking.
3. **Existing Auth Context:** Should extend the existing `useAuth` hook or `auth` helper in `lib/supabase.ts`.

### Implementation Notes

1. **Supabase Configuration:**
   - Configure Supabase email templates for password reset (in Supabase dashboard).
   - Set redirect URL to: `exp://localhost:8081/auth/callback?type=recovery` (for development) or deep link URL for production.
   - Configure fallback web URL if needed.

2. **Deep Linking:**
   - The existing `/auth/callback` route already handles `type=recovery` (line 20 in `callback.tsx`).
   - Need to add logic to navigate to reset password screen after setting session.

3. **Rate Limiting:**
   - Supabase Auth has built-in rate limiting, but may need to configure thresholds.
   - Alternatively, implement client-side tracking using AsyncStorage (track requests per email with timestamp).

4. **File Structure:**
   - Create new screen: `app/(auth)/forgot-password.tsx`
   - Create new screen: `app/(auth)/reset-password.tsx`
   - Extend `lib/supabase.ts` with `resetPassword` and `updatePassword` functions.
   - Update `login.tsx` to navigate to forgot password screen.

5. **Error Handling:**
   - Handle network errors gracefully.
   - Handle expired/invalid tokens with clear error messages.
   - Never reveal if an email exists in the system.

### API Functions to Add

```typescript
// In lib/supabase.ts
resetPassword: async (email: string) => {
  // Call supabase.auth.resetPasswordForEmail()
  // Configure redirectTo URL
}

updatePassword: async (newPassword: string) => {
  // Call supabase.auth.updateUser({ password: newPassword })
}
```

## Success Metrics

1. **User Adoption:**
   - 80% of users who forget their password successfully complete the reset flow within 24 hours of requesting it.

2. **Support Ticket Reduction:**
   - 50% reduction in password-related support tickets within 3 months of launch.

3. **Completion Rate:**
   - 70% of password reset requests result in successful password changes.

4. **User Satisfaction:**
   - Users can complete the entire password reset flow in under 5 minutes.

5. **Security:**
   - Zero successful password reset attacks or account takeovers via this feature.
   - Rate limiting prevents more than 3 requests per hour per email in 99% of cases.

## Open Questions

1. **Email Template Customization:** Should we customize the Supabase email template with Campus Connect branding, or use the default template initially?

2. **Link Expiration:** Is 1 hour the optimal expiration time, or should we consider 24 hours for better user experience? (Currently set to 1 hour per requirement 4C)

3. **Rate Limiting Implementation:** Should we rely solely on Supabase's built-in rate limiting, or implement additional client-side tracking for better control?

4. **Web Fallback Priority:** How important is the web fallback? Should it be implemented in the initial version or added later?

5. **Password Requirements:** Should we enforce stronger password requirements during reset (e.g., 8+ characters, special characters) or keep it consistent with signup (6+ characters)?

6. **Analytics:** Should we track password reset requests, completion rates, and failure reasons for future improvements?

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** AI Assistant  
**Status:** Ready for Implementation


