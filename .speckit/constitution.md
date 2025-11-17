# Sliding Auction Platform - Project Constitution

## Project Vision

The Sliding Auction platform is a real-time descending price auction system for rare and unique items with novel engagement mechanics. We prioritize transparent user experiences, real-time synchronization, and secure auction mechanics.

## Core Principles

### 1. Zero-Build Simplicity
**Principle:** Keep the development workflow simple by avoiding build tools and bundlers.

**Guidelines:**
- Use vanilla JavaScript with ES6+ modules exclusively
- Load all external libraries (React, Firebase, etc.) via CDN
- No npm dependencies, no webpack, no build steps
- Direct deployment without compilation or bundling
- Keep the barrier to development as low as possible

**Rationale:** This reduces complexity, eliminates build-time errors, and enables rapid iteration without tooling overhead.

### 2. Real-Time First
**Principle:** Real-time synchronization is a core feature, not an afterthought.

**Guidelines:**
- Price updates must propagate to all users within 500ms
- Shield state changes must sync within 500ms
- Viewer count updates every 5 seconds (batched to manage latency)
- Use Firebase Firestore listeners for live data streaming
- All auction state changes must be atomic and consistent
- Test real-time behavior with multiple concurrent users

**Rationale:** The auction experience depends on all participants seeing the same state simultaneously. Delayed updates break trust and auction fairness.

### 3. Server-Authoritative Truth
**Principle:** Never trust the client for critical auction logic.

**Guidelines:**
- All auction state (price, time, shield counts) enforced server-side
- Firebase Security Rules prevent direct state manipulation
- Use Firebase transactions for race condition handling
- Pricing calculations happen server-side only
- Currency balances managed exclusively by backend logic
- Client UI reflects server state, never dictates it

**Rationale:** Auction integrity requires tamper-proof logic. Client-side validation is UX; server-side validation is security.

### 4. Transparent User Experience
**Principle:** Users should understand how the auction works without hidden mechanics.

**Guidelines:**
- No deceptive dark patterns or hidden fees
- Clear visual feedback for every user action
- Explain mechanics before users commit resources
- Show loading states for all async operations
- Display error messages in plain, actionable language
- Make auction rules visible and accessible

**Rationale:** Trust is essential for auction platforms. Transparency builds user confidence and long-term engagement.

### 5. Mobile-First Responsive Design
**Principle:** The platform must work seamlessly on any device.

**Guidelines:**
- Design for mobile screens first, scale up to desktop
- Touch-friendly interactive elements (min 44x44px tap targets)
- Test on actual mobile devices, not just browser emulation
- Responsive typography and spacing
- Optimize for varying network conditions (mobile data vs. wifi)

**Rationale:** Most users will access the platform on mobile devices. Desktop-first designs fail mobile users.

### 6. Accessible by Default
**Principle:** Accessibility is not optional.

**Guidelines:**
- WCAG 2.1 AA compliance minimum
- Full keyboard navigation support
- Screen reader compatibility (semantic HTML, ARIA labels)
- Sufficient color contrast ratios (4.5:1 for text)
- No reliance on color alone to convey information
- Focus indicators on all interactive elements

**Rationale:** Inclusive design expands our user base and is the right thing to do.

### 7. Graceful Failure Handling
**Principle:** The system should degrade gracefully when things go wrong.

**Guidelines:**
- Every async operation has error handling with user-friendly messages
- Detect and handle loss of real-time connection
- Optimistic UI updates with rollback on server rejection
- Retry logic for transient failures
- Prevent users from taking actions during degraded states
- Log errors for debugging without exposing technical details to users

**Rationale:** Networks fail, servers hiccup, and users lose connectivity. Graceful degradation maintains trust during failures.

### 8. Security & Data Integrity
**Principle:** Protect user data and auction integrity at all costs.

**Guidelines:**
- Firebase Security Rules enforce all business logic constraints
- Prevent price manipulation via client-side tampering
- Prevent shield state manipulation
- Prevent currency balance manipulation
- Validate all inputs on both client and server
- Use Firebase transactions for concurrent write safety
- Authentication required for all auction participation

**Rationale:** Security breaches destroy user trust and platform credibility. Prevention is cheaper than remediation.

### 9. Version Control Discipline
**Principle:** Code history should tell a clear story.

**Guidelines:**
- Commit often with meaningful, descriptive commit messages
- Use conventional commit format (feat:, fix:, refactor:, etc.)
- Each commit should represent a logical unit of work
- Review changes before committing (git diff)
- Never commit sensitive credentials or API keys

**Rationale:** Clear git history enables debugging, collaboration, and understanding of how the codebase evolved.

### 10. Testing in Real Conditions
**Principle:** Test features under realistic multi-user scenarios.

**Guidelines:**
- Test real-time sync with multiple browsers/devices open simultaneously
- Verify behavior under poor network conditions (throttling)
- Test race conditions (multiple users acting at the same moment)
- Verify Firebase Security Rules prevent unauthorized actions
- Manual testing required before marking features complete

**Rationale:** Automated tests can't catch real-time synchronization bugs. Manual multi-device testing is essential.

## Technical Architecture Commitments

### Technology Stack
- **Frontend:** Vanilla JavaScript (ES6+ modules), React via CDN
- **Database:** Firebase Firestore (real-time document database)
- **Authentication:** Firebase Authentication
- **Hosting:** Firebase Hosting or Vercel
- **External Libraries:** CDN-loaded only (no npm packages)

### Architectural Patterns
- Single-page application (SPA) architecture
- Real-time synchronization via Firestore listeners
- Client-side state management using React hooks
- Server-authoritative time and pricing
- Zero-build deployment workflow

### Data Flow
1. User actions trigger client-side validation
2. Valid actions sent to Firebase (Firestore writes or Cloud Function calls)
3. Firebase Security Rules/Cloud Functions validate and execute
4. Firestore document updates trigger listeners on all connected clients
5. Clients update UI to reflect new server state

## Quality Standards

### Code Quality
- Error handling required for all user-facing features
- Loading states for all async operations
- Input validation on client and server
- Comments for complex logic (not obvious code)
- Consistent code formatting (2-space indentation, semicolons)

### Performance Targets
- Initial page load < 3 seconds on 3G connection
- Real-time price updates < 500ms latency
- Real-time shield state updates < 500ms latency
- Viewer count updates every 5 seconds (batched)

### Browser Support
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- iOS Safari (latest 2 major versions)
- Chrome on Android (latest version)

## Deployment Process

1. Develop features locally with Firebase emulator (optional)
2. Test changes manually with multiple browsers/devices
3. Commit to git with meaningful commit message
4. Push to repository (triggers automatic deployment to Vercel preview)
5. Verify preview deployment works correctly
6. Merge to main branch for production deployment

## Decision-Making Framework

When making technical decisions, prioritize in this order:

1. **Security & Data Integrity** - Never compromise on security
2. **Real-Time Performance** - Auction experience depends on synchronization
3. **User Experience** - Transparent, accessible, mobile-friendly
4. **Simplicity** - Prefer simple solutions over complex ones
5. **Maintainability** - Code should be readable and debuggable

## Success Criteria

A feature is considered complete when:

- [ ] It works on mobile, tablet, and desktop
- [ ] It has proper error handling with user-friendly messages
- [ ] It shows loading states during async operations
- [ ] It has been tested with multiple concurrent users
- [ ] Firebase Security Rules prevent unauthorized manipulation
- [ ] It meets WCAG 2.1 AA accessibility standards
- [ ] It has been manually tested and verified
- [ ] Code is committed with a clear commit message

---

**Last Updated:** 2025-11-16
**Version:** 1.0
