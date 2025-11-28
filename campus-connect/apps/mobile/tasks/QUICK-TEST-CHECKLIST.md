# Quick Test Checklist - Essential Features Only

## ⚡ 5-Minute Smoke Test

### Critical Paths (Must Work)

- [ ] **Sign Up** → Create account → Success
- [ ] **Sign In** → Login → Navigate to Home
- [ ] **Forgot Password** → Request reset → Click link → Reset password → Login works
- [ ] **Duplicate Signup** → Try existing email → Error message appears
- [ ] **Create Event** → Fill form → Submit → Event appears
- [ ] **Send Message** → Type message → Send → Message appears
- [ ] **Real-Time** → Receive message → Appears automatically (no refresh)

---

## 🎯 15-Minute Core Test

### Authentication
- [ ] Sign up new user
- [ ] Sign in
- [ ] Forgot password (full flow)
- [ ] Duplicate signup prevention
- [ ] Sign out

### Messaging
- [ ] Send message
- [ ] Receive message (real-time)
- [ ] See online status
- [ ] See message status (sent/delivered/read)
- [ ] See typing indicator
- [ ] Badge updates

### Events
- [ ] Create event
- [ ] View events list
- [ ] Join event
- [ ] Leave event
- [ ] View event details

### Community
- [ ] View posts
- [ ] Filter by category
- [ ] Reply to post (if not own post)

---

## ✅ Pass/Fail Criteria

**PASS**: All critical paths work, no crashes, no console errors

**FAIL**: Any critical path broken, crashes, or major errors

---

**Use the full `COMPREHENSIVE-TEST-GUIDE.md` for detailed testing!**



