# Feature Specification: Sliding Auction Platform

## Overview

**Feature Name:** Sliding Auction Platform - Real-Time Descending Price Auction System

**Version:** 1.0
**Date:** 2025-11-16
**Status:** Specification Complete

## Problem Statement

### User Need

Auction participants need an engaging, transparent way to purchase rare and unique items at fair market prices through descending price auctions. Traditional ascending auctions require extended time commitments and can result in participants overpaying due to competitive bidding dynamics. Dutch (descending price) auctions are time-efficient but lack strategic engagement and excitement.

**The Gap:** Existing auction formats force users to choose between efficiency (Dutch auctions) and engagement (traditional auctions). There's no solution that combines rapid price discovery with strategic decision-making mechanics.

### Solution

The Sliding Auction platform combines the efficiency of descending price auctions with a novel "shield" commitment mechanism that creates strategic tension while maintaining transparency and fairness. Users must actively signal their intent to purchase by opening a time-limited shield, creating visible market signals and strategic decision-making moments without the complexity of traditional bidding.

## Core Functionality

### Admin Panel

Admins have full control over auction creation, configuration, and management.

#### 1. Auction Creation
- **Input Fields:**
  - Item name (text, required, max 100 characters)
  - Item description (rich text, required, max 2000 characters)
  - Item images (upload, 1-5 images, max 5MB each, JPEG/PNG)
  - Starting price (number, required, min $1, max $1,000,000)
  - Floor price (number, required, min $1, must be < starting price)
  - Duration (number, required, 1-120 minutes)

- **Pricing Mode Selection:**
  - **Transparent Mode:** Predefined mathematical formula (visible to users)
    - Linear decay: `price = starting - (rate * timeElapsed)`
    - Exponential decay: `price = starting * e^(-rate * timeElapsed)`
    - Stepped decay: Price drops by fixed amount at fixed intervals

  - **Algorithmic Mode:** Dynamic adjustment based on real-time factors
    - Base decay rate (slider, 0.1% to 5% per second)
    - Viewer count multiplier (slider, 0x to 2x influence)
    - Shield activity influence (slider, 0x to 2x influence)
    - Time remaining adjustment (checkbox, accelerates near end)

- **Validation:**
  - Floor price must be less than starting price
  - Duration must be positive integer
  - At least one image required
  - All required fields validated before save

- **Output:** Auction created in "scheduled" state, visible in auction list

#### 2. Auction Management
- **Start Auction:** Single-click button to transition auction from "scheduled" to "live"
  - Confirms admin intent with modal: "Start [Item Name]? This cannot be undone."
  - Broadcasts start event to all connected clients
  - Begins price descent algorithm
  - Locks auction configuration (no editing once live)

- **Stop Auction:** Single-click button to manually end auction early
  - Confirms admin intent: "End auction early? No winner will be selected."
  - Broadcasts end event to all connected clients
  - Closes all open shields
  - Marks auction as "ended - no winner"

- **Monitor Dashboard:**
  - Real-time metrics display (updates every 500ms):
    - Current price (large, prominent)
    - Time elapsed / time remaining
    - Active viewer count
    - Number of shields currently open
    - Algorithm decision log (last 10 price adjustments with reasoning)
  - Live price graph (same view as users see)
  - List of connected users (anonymized, e.g., "User 1", "User 2")

#### 3. User Management
- **View Users:** Table showing all registered users
  - Columns: Email, Current Balance, Date Joined, Actions
- **Grant Currency:** Click "Grant" button for a user
  - Modal with input field: "Amount to grant" (number, min $1, max $100,000)
  - Confirms: "Grant $X to [user email]?"
  - Updates user balance immediately
  - Records transaction in user's history as "Admin Grant"

### User Experience

#### 1. Auction Discovery
- **Homepage View:**
  - Two sections: "Upcoming Auctions" and "Active Auctions"
  - Each auction card shows:
    - Primary item image (thumbnail)
    - Item name
    - Starting price (for upcoming) or current price (for active)
    - Start time (for upcoming) or time remaining (for active)
    - Viewer count (for active only)
  - Click card to enter auction detail view

#### 2. Auction Detail View (Pre-Start)
- **Waiting Room:**
  - Large item image carousel (swipe/click through all images)
  - Item name and full description
  - Auction details:
    - Starts at: [timestamp in user's timezone]
    - Starting price: $X
    - Pricing mode: "Transparent - Linear Decay" or "Algorithmic"
    - Duration: X minutes
  - "Waiting for auction to start..." message
  - Real-time countdown: "Starts in 5:23"
  - Viewer count: "12 people waiting"

#### 3. Auction Detail View (Live)
- **Layout:**
  - Top: Current price (large, bold, updates in real-time)
  - Below price: Time remaining bar (visual countdown)
  - Center: Live price graph
    - X-axis: Time elapsed (0 to duration)
    - Y-axis: Price (starting to floor)
    - Real-time line showing price descent
    - Updates every 500ms with smooth animation
  - Right sidebar (desktop) / below graph (mobile):
    - Viewer count: "23 active viewers"
    - Open shields: "5 shields open"
  - Bottom: Shield and purchase controls

- **Shield Mechanism:**
  - **Closed State (Default):**
    - Button shows: "Open Shield to Enable Purchase"
    - Click to open shield

  - **Opening Animation:**
    - Shield cover slides/fades away (500ms animation)
    - Reveals red purchase button underneath
    - Starts 5-second countdown timer (circular progress indicator)

  - **Open State:**
    - Red "Purchase at $X" button visible and clickable
    - Countdown shows seconds remaining: "4s", "3s", "2s", "1s"
    - Visual urgency (pulsing glow, etc.)

  - **Closing:**
    - At 0 seconds, shield cover slides back (500ms animation)
    - Covers purchase button again
    - Shows "Cooldown: 5s" with countdown

  - **Cooldown State:**
    - "Open Shield" button disabled and grayed out
    - Countdown shows: "Ready in 3s"
    - After cooldown, returns to Closed State

- **Purchase Flow:**
  - User clicks "Purchase at $X" while shield is open
  - Immediate optimistic UI: "Processing purchase..."
  - Server validates:
    - Shield is actually open (server-side timestamp check)
    - User has sufficient balance
    - Auction is still active
    - No other purchase completed first
  - **Success:**
    - Confetti/celebration animation
    - Modal: "Congratulations! You won [Item Name] for $X"
    - Shows new balance: "New balance: $Y"
    - "View Transaction History" button
  - **Failure:**
    - Error message explains reason:
      - "Insufficient balance. You need $X but have $Y."
      - "Someone else purchased first. Auction has ended."
      - "Shield was not open. Please try again."
    - Returns to auction view (if still active)

#### 4. Auction End (User Did Not Win)
- **Notification:**
  - Modal overlay: "[Winner's anonymous ID] won this auction!"
  - Shows final price: "Sold for $X"
  - "View Other Auctions" button redirects to homepage

#### 5. Currency Balance & History
- **Balance Display:**
  - Persistent header element: "Balance: $X"
  - Click to open transaction history modal

- **Transaction History:**
  - Table showing all transactions:
    - Date/Time
    - Type ("Admin Grant", "Auction Purchase", "Refund")
    - Item name (for purchases)
    - Amount (+ for grants, - for purchases)
    - Resulting balance
  - Sorted newest first
  - Paginated (20 per page)

## User Flows

### Admin Creating and Running Auction

```
1. Admin logs into admin panel (email/password)
   ↓
2. Navigates to "Auctions" section
   ↓
3. Clicks "Create New Auction" button
   ↓
4. Fills out auction form:
   - Enters item name: "Rare Vintage Watch"
   - Writes description with rich text editor
   - Uploads 3 images (drag-and-drop or file picker)
   - Sets starting price: $10,000
   - Sets floor price: $5,000
   - Sets duration: 15 minutes
   ↓
5. Selects pricing mode: "Algorithmic"
   ↓
6. Configures algorithm parameters:
   - Base decay rate: 2% per second (slider)
   - Viewer count multiplier: 1.5x (slider)
   - Shield activity influence: 1.2x (slider)
   - Time remaining adjustment: enabled (checkbox)
   ↓
7. Clicks "Save Auction"
   - Validation runs (all required fields present, floor < starting)
   - Success: "Auction created successfully!"
   - Auction appears in "Scheduled Auctions" list
   ↓
8. When ready to start, clicks "Start Auction" button
   ↓
9. Confirmation modal: "Start 'Rare Vintage Watch'? This cannot be undone."
   - Clicks "Confirm"
   ↓
10. Auction transitions to "Live" state
    - Broadcasts to all connected users
    - Price descent begins
    - Admin sees real-time monitoring dashboard
    ↓
11. Admin monitors auction:
    - Watches current price: "$9,234"
    - Sees viewer count: 47
    - Sees open shields: 8
    - Reviews algorithm log:
      "10:23:45 - Price adjusted -$50 (high shield activity)"
      "10:23:50 - Price adjusted -$30 (base decay)"
      "10:23:55 - Price adjusted -$80 (viewer surge detected)"
    ↓
12. Auction ends when:
    - User purchases (winner declared), OR
    - Time expires at floor price (no winner), OR
    - Admin clicks "Stop Auction" (no winner)
    ↓
13. Admin reviews results:
    - Winner (if any) and final price
    - Total viewers
    - Shield activity graph
    - Price descent visualization
```

### User Participating in Auction

```
1. User browses homepage
   - Sees "Upcoming Auctions" section
   - Sees auction card: "Rare Vintage Watch - Starts in 5 minutes"
   ↓
2. Clicks on auction card
   ↓
3. Enters auction detail view (waiting room):
   - Views item images in carousel (swipes through 3 photos)
   - Reads full description
   - Reviews auction details:
     * Starts at: 2:30 PM EST
     * Starting price: $10,000
     * Pricing: Algorithmic
     * Duration: 15 minutes
   - Sees countdown: "Starts in 4:32"
   - Sees viewer count: "12 people waiting"
   ↓
4. Waits for auction to start (keeps browser tab open)
   ↓
5. Auction goes live at 2:30 PM:
   - Page automatically transitions to live view
   - Price graph appears and begins updating
   - Current price shows: "$10,000" and immediately starts descending
   - Shield control appears at bottom
   ↓
6. User watches price descend:
   - 2:30:30 - Price: $9,700 (decides too high)
   - 2:31:00 - Price: $9,200 (still waiting)
   - Monitors viewer count: 23 → 31 → 28 (fluctuating)
   - Sees shield count: 3 → 7 → 5 (other users signaling interest)
   ↓
7. At 2:33:00, price reaches $7,500 (acceptable to user)
   ↓
8. User clicks "Open Shield" button
   - Shield cover slides away (animation)
   - Red "Purchase at $7,500" button appears
   - 5-second countdown begins: "5s"
   ↓
9. User hesitates, thinking...
   - Countdown: "4s"... "3s"... "2s"
   - Price updates to $7,450 (drops $50 during open shield)
   - Decides to wait for lower price
   - Countdown: "1s"... "0s"
   ↓
10. Shield auto-closes
    - Shield cover slides back
    - "Cooldown: 5s" appears
    - Countdown: "4s"... "3s"... "2s"... "1s"... "Ready"
    ↓
11. Cooldown ends, user can reopen shield
    - Price now at $7,100
    - User clicks "Open Shield" again
    ↓
12. Shield opens (5-second window starts)
    - "Purchase at $7,100" button visible
    - Countdown: "5s"
    - Price drops to $7,080 during shield window
    ↓
13. At "3s" remaining, user decides to purchase
    - Clicks "Purchase at $7,080" button
    ↓
14. Optimistic UI: "Processing purchase..."
    - Shield remains open, button disabled
    ↓
15. Server validates purchase:
    - Checks shield was open (server timestamp confirms)
    - Checks user balance: $10,000 (sufficient)
    - Checks no other purchase completed first (user is first)
    - Deducts $7,080 from user balance
    - Marks auction as "ended - sold"
    - Records transaction
    ↓
16. Success response received:
    - Confetti animation
    - Modal: "Congratulations! You won Rare Vintage Watch for $7,080"
    - Shows new balance: "New balance: $2,920"
    - "View Transaction History" button
    ↓
17. User clicks "View Transaction History"
    - Modal shows recent transaction:
      | Date/Time | Type | Item | Amount | Balance |
      | 2:33:15 PM | Purchase | Rare Vintage Watch | -$7,080 | $2,920 |
      | Yesterday | Admin Grant | — | +$10,000 | $10,000 |
    ↓
18. User closes modal and returns to homepage
    - Sees "Active Auctions" section (now empty)
    - Sees "Upcoming Auctions" for future opportunities
```

### Edge Case: Multiple Users Click Purchase Simultaneously

```
User A and User B both have shields open at 2:33:15.234 PM

User A clicks "Purchase at $7,080" at 2:33:15.567 PM (client time)
User B clicks "Purchase at $7,080" at 2:33:15.571 PM (client time)

Both requests sent to Firebase:
↓
Firebase receives User A's request at server time: 2:33:15.589 PM
Firebase receives User B's request at server time: 2:33:15.593 PM
↓
User A's transaction processed:
- Shield open? YES (opened at 2:33:10.234, closes at 2:33:15.234, purchase at 2:33:15.589 is valid)
- Balance sufficient? YES ($10,000 >= $7,080)
- Auction active? YES
- First purchaser? YES (no other completed purchases)
- ✅ PURCHASE APPROVED
- Mark auction as "ended - sold to User A"
- Deduct $7,080 from User A balance
↓
User B's transaction processed (4ms later):
- Shield open? YES (opened at 2:33:11.001, closes at 2:33:16.001, purchase at 2:33:15.593 is valid)
- Balance sufficient? YES ($8,500 >= $7,080)
- Auction active? NO (marked "ended" by User A's purchase)
- ❌ PURCHASE REJECTED
- Return error: "Auction has ended. Another user purchased first."
↓
User A sees: "Congratulations! You won Rare Vintage Watch for $7,080"
User B sees: "Someone else purchased first. Auction has ended."
↓
All other users see: "User A won this auction! Sold for $7,080"
```

## Success Criteria

### Functional Requirements

| Requirement | Success Metric | Test Method |
|------------|----------------|-------------|
| Real-time price sync | All users see price updates within 500ms of server change | Open auction on 5 devices, log timestamp of price updates, verify max delta < 500ms |
| Real-time shield sync | Shield count updates on all clients within 500ms | One user opens shield, verify count increments on other clients within 500ms |
| Purchase fairness | First user to submit valid purchase wins (no duplicate winners) | Simulate simultaneous purchases from 10 users, verify exactly 1 winner |
| Shield timing accuracy | Shield opens for exactly 5 seconds, cooldown is exactly 5 seconds | Automated test with timestamp logging, verify 5000ms ± 100ms tolerance |
| Balance validation | Users cannot purchase if balance insufficient | Attempt purchase with balance < price, verify rejection and error message |
| Mobile usability | All functionality works on mobile devices with touch | Manual testing on iPhone, Android phone, tablet - verify all buttons/gestures work |
| Accessibility | Keyboard navigation and screen reader support | Test with keyboard only (no mouse), test with VoiceOver/NVDA |
| Concurrent user handling | 50 concurrent users can participate without crashes | Load test with 50 simulated users watching live auction |

### User Experience Requirements

| Requirement | Success Metric | Test Method |
|------------|----------------|-------------|
| Engagement | Users report shield mechanism creates strategic decision-making | Post-prototype survey (n=10 users): "Did the shield mechanic influence your purchase timing decision?" >= 80% "Yes" |
| Transparency (Transparent Mode) | Users understand pricing formula | Show transparent auction to 10 users, ask them to predict next price - >= 70% accuracy |
| Transparency (Algorithmic Mode) | Admins can understand algorithm decisions | Admin reviews algorithm log, asks "Why did price drop $80 at 10:23:55?" - log provides clear answer |
| Error clarity | Users understand what went wrong when errors occur | Trigger 5 common errors (insufficient balance, shield closed, auction ended, network error, cooldown active), users explain error in own words - >= 90% accuracy |
| Performance perception | Users perceive system as responsive, not laggy | Post-prototype survey: "Did the auction feel smooth and responsive?" >= 85% "Yes" |

### Technical Requirements

| Requirement | Success Metric | Test Method |
|------------|----------------|-------------|
| No data inconsistencies | Auction state is consistent across all clients at all times | Randomly sample 100 state snapshots across 10 clients, verify 100% match |
| No race condition duplicates | Exactly one winner per auction, always | Run 100 test auctions with simulated concurrent purchases, verify 100 auctions = 100 winners (no duplicates, no missing winners) |
| Graceful disconnection | Users who lose connection can rejoin and see current state | Disconnect client mid-auction, wait 30s, reconnect - verify current price/state displayed correctly |
| Firebase security | Users cannot manipulate auction state directly via Firestore console | Attempt direct Firestore writes (e.g., change price, change balance) - verify all rejected by security rules |
| Transaction atomicity | Balance deductions and auction end states are atomic | Simulate server crash during purchase - verify either (balance deducted AND auction ended) OR (balance unchanged AND auction active) - never partial state |

## Scope

### In Scope (MVP Prototype)

**Core Auction Mechanics:**
- ✅ Single auction at a time (no concurrent auctions)
- ✅ Descending price algorithm (transparent and algorithmic modes)
- ✅ Real-time price updates (< 500ms latency)
- ✅ Shield mechanism (5s open, 5s cooldown)
- ✅ Purchase functionality (first valid purchase wins)
- ✅ Auction end conditions (purchased, time expired, manual stop)

**User Features:**
- ✅ User authentication (email/password via Firebase Auth)
- ✅ Fictional currency system (balances, transactions)
- ✅ Auction discovery (upcoming and active views)
- ✅ Live auction participation (watch price, open shield, purchase)
- ✅ Transaction history
- ✅ Real-time viewer count
- ✅ Real-time open shield count

**Admin Features:**
- ✅ Auction creation (item details, pricing configuration)
- ✅ Manual auction start/stop controls
- ✅ Real-time monitoring dashboard
- ✅ User management (view users, grant currency)
- ✅ Algorithm parameter configuration (per-auction)

**Technical Infrastructure:**
- ✅ Firebase Firestore (real-time database)
- ✅ Firebase Authentication
- ✅ Firebase Security Rules (enforce business logic)
- ✅ React via CDN (no build tools)
- ✅ Vanilla JavaScript (ES6+ modules)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessibility (WCAG 2.1 AA)

**Edge Case Handling:**
- ✅ Simultaneous purchase attempts (server timestamp arbitration)
- ✅ Network disconnection/reconnection
- ✅ Admin stops auction while shields open
- ✅ Purchase at floor price
- ✅ Shield opened in final seconds

### Out of Scope (Future Phases)

**Payment & Monetization:**
- ❌ Real payment integration (Stripe, PayPal, etc.)
  - *Note: Data models prepared for future integration (transaction records, balance ledger)*
- ❌ Payment processing fees
- ❌ Refund workflows
- ❌ Tax reporting

**Advanced Auction Features:**
- ❌ Multiple concurrent auctions
- ❌ Automated auction scheduling (start at specific future time)
- ❌ Recurring auctions (same item, weekly schedule)
- ❌ Reserve prices (hidden floor below which item won't sell)
- ❌ Bulk auction creation (CSV import)
- ❌ Auction templates (save/reuse configurations)

**User Engagement:**
- ❌ User profiles with avatars
- ❌ Following specific items/categories
- ❌ Watchlists
- ❌ Email notifications (auction starting, price threshold reached)
- ❌ Push notifications (mobile)
- ❌ Social sharing (share auction on Twitter, etc.)
- ❌ Leaderboards (most purchases, best deals)

**Analytics & Reporting:**
- ❌ Historical auction archive (browse past auctions)
- ❌ Search and filter past auctions
- ❌ Advanced analytics dashboard (conversion rates, average sale price, etc.)
- ❌ Export auction data (CSV, PDF reports)
- ❌ A/B testing framework (compare pricing algorithms)

**Platform Expansion:**
- ❌ Mobile native apps (iOS, Android)
- ❌ API for third-party integrations
- ❌ Webhook support
- ❌ Multi-language support (i18n)
- ❌ Multi-currency support

**Admin Tools:**
- ❌ Role-based admin permissions (super admin, moderator, etc.)
- ❌ Admin activity logs
- ❌ Automated fraud detection
- ❌ User banning/suspension

## Assumptions

### Business Logic Assumptions

1. **Single Auction Constraint:** Only one auction can be active at a time. This simplifies the MVP UI and reduces complexity. *Future: Support concurrent auctions with categorization.*

2. **Fictional Currency Only:** All transactions use fictional currency (no real money). Admins manually grant currency to users for testing. *Future: Integrate Stripe for real payments.*

3. **Trusted Admins:** Admin users are trusted and do not require authentication for the MVP. Admin panel is password-protected (single shared password) but does not track which admin performed which action. *Future: Admin user accounts with role-based permissions and audit logs.*

4. **No Auction Restart:** Once an auction ends (purchased, expired, or manually stopped), it cannot be restarted. Admins must create a new auction instead. *Rationale: Prevents confusion about auction state history.*

5. **Floor Price Behavior:** When the price reaches the floor price, it remains at the floor for 1 minute, then the auction automatically ends with no winner (if no purchase occurred). *Rationale: Gives users a final opportunity at the minimum price.*

6. **Participation Lockout:** Users who join after an auction has started cannot participate (cannot open shields or purchase). *Rationale: Prevents users from gaining unfair advantage by observing price descent pattern before joining. Future: Allow late joins with clear disclaimer about missed price range.*

7. **Pricing Mode Immutability:** Once an auction is created, its pricing mode (transparent vs. algorithmic) and parameters cannot be changed. *Rationale: Ensures fairness - users who joined early see the same rules as users who join later.*

8. **Algorithm Parameter Defaults:** Each auction has custom algorithm parameters (no global defaults). *Future: Add global defaults with per-auction override capability.*

### Technical Assumptions

9. **Modern Browsers Only:** Targets Chrome, Firefox, Safari, Edge (last 2 major versions). No polyfills for older browsers (IE11, etc.). *Rationale: Simplifies development, aligns with target user base (tech-savvy early adopters).*

10. **Responsive Web Only:** No native mobile apps. Responsive web design works on desktop, tablet, and mobile browsers. *Future: Native apps for better offline support and push notifications.*

11. **Server Time Authority:** Firebase server timestamps are authoritative for all time-sensitive operations (shield open/close, purchase validation, auction end). *Rationale: Prevents client-side clock manipulation. Accepts that network latency differences between users are unavoidable.*

12. **Real-Time Graph Data:** The price graph shows actual historical price points (as recorded in Firestore), not a projected/estimated curve. *Rationale: Transparency - users see exactly what happened. Future: Add projected curve for transparent mode.*

13. **Viewer Count Granularity:** Viewer count updates every 5 seconds (batched), not on every individual user join/leave event. *Rationale: Reduces Firestore write costs and client update frequency. 5-second staleness is acceptable for non-critical metric.*

14. **No Offline Support:** Application requires active internet connection. No offline mode or service worker caching (beyond browser defaults). *Future: Progressive Web App with offline auction browsing.*

15. **CDN Availability:** Assumes CDN services (for React, Firebase SDK) are available and performant. No fallback to local copies. *Rationale: CDN downtime is rare, and local fallbacks add complexity without significant reliability benefit.*

### User Behavior Assumptions

16. **Active Participation:** Users keep the browser tab active and visible during auctions (no background tab expectation). *Note: Real-time updates still work in background tabs, but users should actively monitor to make timely decisions.*

17. **Sufficient Currency:** Users understand they need sufficient fictional currency balance before participating. No "credit" or "negative balance" support. *Future: Show warning if balance < starting price when entering auction.*

18. **Intentional Purchases:** Users understand that clicking "Purchase" is final and cannot be undone. No purchase confirmation step (to maintain urgency). *Rationale: Shield mechanism already provides decision-making window.*

19. **Strategic Shield Use:** Users will experiment with shield timing (open early to signal interest, wait for lower price, etc.). The 5-second window is long enough to make a decision but short enough to create urgency. *Validation: User testing during prototype phase.*

20. **English Language:** All UI text is in English. Users are expected to read and understand English. *Future: Multi-language support via i18n.*

### Data & Security Assumptions

21. **Firebase Security Rules Sufficiency:** Firebase Security Rules are sufficient to enforce all business logic for the MVP. No Cloud Functions required for auction logic (used only for complex algorithms if needed). *Future: Move complex algorithm logic to Cloud Functions for better performance.*

22. **No PII Sensitivity:** User email addresses are not considered highly sensitive PII (used for authentication only). No additional encryption beyond Firebase's default. *Future: GDPR compliance features (data export, deletion requests) if expanding to EU.*

23. **Transaction Integrity:** Firestore transactions guarantee that exactly one purchase succeeds in race conditions (no duplicate winners). *Validation: Load testing required to confirm.*

24. **Image Storage:** Auction item images are stored in Firebase Storage with public read access. No sensitive images expected. *Future: Add moderation workflow if opening to public auction creation.*

## Edge Cases & Error Handling

### 1. Multiple Users Click Purchase Simultaneously

**Scenario:** Two or more users have shields open and click "Purchase" at nearly the same time (within milliseconds).

**Handling:**
- All purchase requests are sent to Firebase
- Firebase processes requests sequentially based on server-received timestamp (not client timestamp)
- First request to arrive:
  - Validates shield is open (server-side timestamp check)
  - Validates balance is sufficient
  - Validates auction is still active
  - If all valid: Completes purchase, marks auction as "ended - sold", deducts balance
- Second and subsequent requests:
  - Validate auction status
  - Auction is already "ended" (changed by first purchase)
  - Reject with error: "Auction has ended. Another user purchased first."
- All clients receive real-time update that auction ended
- Winner sees success message
- Losers see "Someone else purchased first" message

**Implementation Note:** Use Firestore transaction or server-side Cloud Function to ensure atomic check-and-set of auction status.

### 2. User Loses Network Connection During Auction

**Scenario:** User is watching a live auction, has shield open, then loses internet connection (WiFi drops, mobile data cuts out, etc.).

**Handling:**
- Firestore listener detects disconnection
- UI shows banner: "Connection lost. Reconnecting..." (non-blocking, at top of screen)
- Shield state is frozen (countdown pauses, user cannot click purchase)
- Price graph stops updating
- When connection restored:
  - Firestore listener re-establishes automatically
  - UI fetches current auction state
  - Price graph jumps to current price (with animation)
  - Shield state resets based on server state:
    - If shield was open when disconnected and 5+ seconds elapsed: Shield is now closed
    - User must reopen shield (cooldown may apply if recent)
  - Banner changes to "Reconnected!" (auto-dismisses after 2 seconds)
- If auction ended during disconnection:
  - Show "Auction ended" message with winner info

**User Impact:** User may miss price drops during disconnection. This is acceptable (network reliability is user's responsibility). No automatic compensation or price hold.

### 3. Admin Stops Auction While Users Have Shields Open

**Scenario:** Admin clicks "Stop Auction" button while 5 users currently have shields open (some mid-countdown).

**Handling:**
- Admin confirmation modal: "End auction early? No winner will be selected. X users currently have shields open."
- Admin confirms
- Auction status immediately changes to "ended - no winner"
- All Firestore listeners trigger on all clients
- Users with shields open:
  - Shield immediately closes (animation)
  - Red purchase button becomes disabled
  - Modal appears: "Auction ended by admin. No winner selected."
- Users without shields open:
  - See same modal: "Auction ended by admin. No winner selected."
- If user clicks "Purchase" button during the few milliseconds between admin stopping and UI updating:
  - Request rejected by server: "Auction is not active."
  - Error message: "Auction has ended. No purchases allowed."

**Admin Dashboard:** Shows confirmation that auction was stopped successfully and timestamp.

### 4. Price Descent Reaches Floor Exactly When User Clicks Purchase

**Scenario:** Price is $5,001 (floor is $5,000). User has shield open. In the same moment:
- Algorithm decreases price from $5,001 → $5,000 (floor reached)
- User clicks "Purchase at $5,001" button

**Handling:**
- User's purchase request sent with price expectation: $5,001
- Server receives purchase request
- Server checks current price: $5,000 (floor)
- Server validates:
  - Shield is open? ✅ Yes
  - Balance sufficient for $5,001? ✅ Yes (user has $10,000)
  - Auction active? ✅ Yes (floor price behavior: stays at floor for 1 minute)
  - Price changed since button click? ⚠️ Yes ($5,001 → $5,000)
- **Decision:** Allow purchase at current price ($5,000), not displayed price ($5,001)
- **Rationale:** User benefits from price drop (pays less than expected). This is better UX than rejecting purchase.
- Success message: "Congratulations! You won [Item] for $5,000" (shows actual paid price)

**Alternative Scenario (Price Increases):** If price somehow increased (shouldn't happen in descending auction, but algorithmic mode could have bugs):
- Reject purchase with error: "Price changed during purchase. Please try again."
- User must reopen shield and purchase at new price

**Implementation Note:** Purchase request includes expected price. Server compares expected vs. actual. Allow if actual <= expected (user benefits). Reject if actual > expected (user would pay more than they saw).

### 5. User Opens Shield in Final Seconds of Auction

**Scenario:** Auction duration is 15 minutes. At 14:58 (2 seconds before end), user opens shield.

**Handling:**
- Shield opens normally
- 5-second countdown begins: "5s"... "4s"... "3s"
- At 15:00 (auction end time), auction expires
- **Shield does NOT extend auction time**
- Auction status changes to "ended - no winner" (if no purchase occurred)
- User's shield immediately closes
- Modal: "Auction has ended. Time expired."
- If user clicked "Purchase" at 14:59:59 (1 second before end):
  - Server timestamp validates purchase occurred before 15:00:00 end time
  - Purchase succeeds (user wins)
- If user clicked "Purchase" at 15:00:01 (1 second after end):
  - Server timestamp validates purchase occurred after end time
  - Purchase rejected: "Auction has ended. Time expired."

**Implementation Note:** All time validation uses server timestamps. Client countdowns are visual only (not authoritative).

### 6. User Has Insufficient Balance

**Scenario:** User has $3,000 balance. Current auction price is $7,080. User opens shield and clicks "Purchase".

**Handling:**
- User clicks "Purchase at $7,080"
- Client-side validation (pre-check before sending to server):
  - Checks balance: $3,000 < $7,080
  - Shows error immediately (no server round-trip): "Insufficient balance. You need $7,080 but have $3,000."
  - Error is non-blocking (user can close error and continue watching auction)
- If client-side check somehow fails and request reaches server:
  - Server validates balance: $3,000 < $7,080
  - Rejects purchase
  - Returns error: "Insufficient balance."

**UX Enhancement:** Before user enters auction, show warning if balance < starting price:
- Banner at top of auction page: "Your balance ($3,000) is less than the starting price ($10,000). You may not be able to purchase this item."
- User can still watch auction (educational value, may have enough for floor price)

### 7. Rapid Shield Open/Close Spam

**Scenario:** User rapidly clicks "Open Shield" button repeatedly, trying to spam or exploit the system.

**Handling:**
- First click: Shield opens, cooldown starts
- Second click (during open state): Ignored (shield already open)
- After shield closes, cooldown begins (5 seconds)
- During cooldown: Button is disabled (grayed out, no-op if clicked)
- After cooldown: Button re-enables, user can open shield again

**Rate Limiting:** Client-side state prevents rapid clicks. Server-side, Firestore security rules enforce:
- User can only open shield if:
  - Auction is active, AND
  - User's last shield close timestamp is > 5 seconds ago (cooldown enforced)
- If user bypasses client-side checks (e.g., via browser console):
  - Firestore rejects write with permission denied
  - Client shows error: "Please wait for cooldown to end."

**Open Shield Count Impact:** Each shield open/close correctly increments/decrements the global open shield count. Rapid spam doesn't create negative counts (Firestore transaction ensures atomicity).

### 8. Algorithm Sets Price Below Floor

**Scenario:** Algorithmic pricing mode calculates next price as $4,800, but floor price is $5,000.

**Handling:**
- Algorithm runs calculation: `newPrice = $4,800`
- Server-side validation before writing to Firestore:
  - `if (newPrice < floorPrice) { newPrice = floorPrice; startFloorTimer(); }`
- Price is clamped to floor: $5,000
- Floor timer starts (1 minute countdown)
- After 1 minute at floor:
  - If no purchase: Auction ends with no winner
  - If purchase occurred: Normal purchase flow (winner declared)

**Algorithm Parameter Constraint:** When admin configures algorithmic parameters, provide real-time preview showing "time to floor" estimate. Warn if parameters would reach floor in < 25% of duration (e.g., reaching floor in 3 minutes of a 15-minute auction suggests over-aggressive decay).

### 9. User Closes Browser Tab Mid-Auction

**Scenario:** User is watching auction, then closes browser tab (or computer crashes, battery dies, etc.).

**Handling:**
- Firestore listener detects user disconnection (after ~30 second timeout)
- Viewer count decrements: 23 → 22
- If user had shield open:
  - Shield auto-closes (server-side cleanup after disconnect timeout)
  - Open shield count decrements: 5 → 4
- When user reopens browser and navigates back to auction:
  - If auction still active: Sees current state (current price, time remaining)
  - If auction ended: Sees end result (winner + final price, or "no winner")
- No penalty for disconnecting (user just misses opportunity to purchase during disconnection)

**Implementation Note:** Use Firebase's presence detection (`onDisconnect()`) to clean up user state (viewer count, open shields).

### 10. Admin Deletes User Account Mid-Auction

**Scenario:** User is participating in active auction. Admin opens admin panel and deletes user's account.

**MVP Handling:** Out of scope - admin cannot delete user accounts in MVP (only view and grant currency).

**Future Handling (if feature added):**
- Admin attempts to delete user who is currently in active auction
- System shows warning: "User is currently participating in an active auction. Delete anyway?"
- If admin confirms:
  - User account is marked as "deleted" (soft delete, not hard delete)
  - User's authentication session is immediately invalidated
  - User's browser shows error: "Your account has been disabled. Please contact support."
  - User is logged out and redirected to homepage
  - Viewer count decrements
  - Open shields (if any) close

### 11. Firestore Write Fails (Quota Exceeded, Permission Denied, etc.)

**Scenario:** User clicks "Purchase" button, but Firestore write fails (could be quota exceeded, security rule bug, network error, etc.).

**Handling:**
- Client sends purchase request to Firestore
- Firestore returns error (e.g., "Permission denied", "Quota exceeded")
- Client catches error in promise rejection handler
- Show error message to user:
  - Generic error: "Purchase failed. Please try again."
  - Specific error (if known): "You do not have permission to purchase this item." or "Service temporarily unavailable. Please try again."
- Optimistic UI update is rolled back:
  - If "Processing purchase..." was shown, revert to normal auction view
  - Shield state is restored based on server state
- User can retry by opening shield and clicking purchase again

**Admin Notification:** If quota exceeded or other systemic errors, log to admin dashboard (future feature) or email alert (out of scope for MVP).

### 12. Two Admins Simultaneously Start/Stop Same Auction

**Scenario:** Two admins have admin panel open. Auction is in "scheduled" state. Both admins click "Start Auction" at the same time.

**MVP Handling:** Admin panel is single-password-protected (no individual admin accounts). Unlikely scenario, but possible.

**Handling:**
- Both admins click "Start Auction"
- Both confirmations sent to Firestore
- Firestore processes first request:
  - Updates auction status: "scheduled" → "live"
  - Sets start timestamp
- Firestore processes second request (milliseconds later):
  - Attempts to update auction status: "live" → "live" (no-op)
  - Or, if using transaction: Transaction fails because auction is already "live"
  - Returns error: "Auction is already live."
- First admin sees: "Auction started successfully!"
- Second admin sees: "Auction is already live." (error message)

**Future:** Individual admin accounts with optimistic locking (version numbers) prevent conflicts.

## Data Models

### Auction Document (Firestore)

```javascript
// Collection: auctions
// Document ID: auto-generated
{
  id: "auction123",
  itemName: "Rare Vintage Watch",
  itemDescription: "<p>This is a <strong>rare</strong> vintage watch...</p>", // Rich text HTML
  images: [
    "https://firebasestorage.googleapis.com/.../image1.jpg",
    "https://firebasestorage.googleapis.com/.../image2.jpg",
    "https://firebasestorage.googleapis.com/.../image3.jpg"
  ],
  startingPrice: 10000, // Cents (or currency units)
  floorPrice: 5000,
  currentPrice: 7080, // Updated in real-time
  duration: 900, // Seconds (15 minutes)
  pricingMode: "algorithmic", // "transparent" or "algorithmic"
  pricingConfig: {
    // For transparent mode:
    formula: "linear", // "linear", "exponential", "stepped"
    decayRate: 10, // Units per second (transparent linear)

    // For algorithmic mode:
    baseDecayRate: 0.02, // 2% per second
    viewerMultiplier: 1.5,
    shieldInfluence: 1.2,
    timeRemaining Adjustment: true
  },
  status: "live", // "scheduled", "live", "ended - sold", "ended - no winner", "ended - admin stopped"
  startTime: Timestamp, // Firebase server timestamp (when auction went live)
  endTime: Timestamp | null, // When auction ended (null if still active)
  winner: "user456" | null, // User ID of winner (null if no winner)
  finalPrice: 7080 | null, // Price at which item sold (null if not sold)
  viewerCount: 23, // Real-time count of connected users
  openShieldCount: 5, // Real-time count of users with shields open
  floorReachedAt: Timestamp | null, // When price reached floor (starts 1-min timer)
  createdAt: Timestamp,
  createdBy: "admin", // Future: individual admin ID
}
```

### User Document (Firestore)

```javascript
// Collection: users
// Document ID: Firebase Auth UID
{
  uid: "user456",
  email: "user@example.com",
  balance: 2920, // Fictional currency (cents or units)
  createdAt: Timestamp,
  lastLogin: Timestamp,
}
```

### Transaction Document (Firestore)

```javascript
// Collection: transactions
// Document ID: auto-generated
{
  id: "txn789",
  userId: "user456",
  type: "purchase", // "purchase", "admin_grant", "refund"
  amount: -7080, // Negative for deduction, positive for grant
  balanceAfter: 2920,
  auctionId: "auction123" | null, // Null for admin grants
  itemName: "Rare Vintage Watch" | null,
  timestamp: Timestamp,
  description: "Purchased Rare Vintage Watch" // Human-readable
}
```

### User Shield State (Firestore Subcollection)

```javascript
// Collection: auctions/{auctionId}/shields
// Document ID: User UID
{
  userId: "user456",
  isOpen: true,
  openedAt: Timestamp, // Server timestamp when shield opened
  closesAt: Timestamp, // Server timestamp when shield will auto-close (openedAt + 5s)
  lastClosedAt: Timestamp | null, // When shield last closed (for cooldown calculation)
}
```

### Price History (Firestore Subcollection)

```javascript
// Collection: auctions/{auctionId}/priceHistory
// Document ID: auto-generated timestamp
{
  price: 7080,
  timestamp: Timestamp,
  reason: "base decay" | "viewer surge" | "shield activity" | "time adjustment" | "floor reached"
  // For algorithmic mode, stores reason for each price change
}
```

### Algorithm Decision Log (Firestore Subcollection - Admin Only)

```javascript
// Collection: auctions/{auctionId}/algorithmLog
// Document ID: auto-generated timestamp
{
  timestamp: Timestamp,
  decision: "Price adjusted -$50",
  reason: "High shield activity detected (8 shields open, threshold is 5)",
  priceBeforе: 7130,
  priceAfter: 7080,
  factors: {
    viewerCount: 23,
    openShields: 8,
    timeRemaining: 720, // Seconds
    baseDecay: -30,
    viewerAdjustment: -10,
    shieldAdjustment: -10
  }
}
```

## User Interface Specifications

### Color Palette

**Primary Colors:**
- **Auction Red:** `#E63946` (purchase button, urgent states, countdown warnings)
- **Shield Blue:** `#457B9D` (shield closed state, informational elements)
- **Success Green:** `#06D6A0` (confirmation messages, balance increases)
- **Warning Yellow:** `#FFB703` (warnings, caution states)

**Neutral Colors:**
- **Background:** `#F8F9FA` (light gray, main background)
- **Surface:** `#FFFFFF` (white, cards, modals)
- **Text Primary:** `#212529` (dark gray, primary text)
- **Text Secondary:** `#6C757D` (medium gray, secondary text)
- **Border:** `#DEE2E6` (light gray, dividers, borders)

**State Colors:**
- **Active:** `#28A745` (green, auction is live)
- **Scheduled:** `#FFC107` (yellow, auction upcoming)
- **Ended:** `#6C757D` (gray, auction finished)

### Typography

**Font Family:** System font stack for performance
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
```

**Font Sizes:**
- **Extra Large (Price Display):** 48px / 3rem (desktop), 36px / 2.25rem (mobile)
- **Large (Headings):** 32px / 2rem (desktop), 24px / 1.5rem (mobile)
- **Medium (Subheadings):** 20px / 1.25rem
- **Base (Body Text):** 16px / 1rem
- **Small (Captions, Metadata):** 14px / 0.875rem

**Font Weights:**
- **Bold:** 700 (headings, current price, CTAs)
- **Semi-Bold:** 600 (subheadings, labels)
- **Regular:** 400 (body text)

### Layout & Spacing

**Breakpoints:**
- **Mobile:** < 768px
- **Tablet:** 768px - 1023px
- **Desktop:** >= 1024px

**Container Max Width:** 1200px (centered)

**Spacing Scale (rem):**
- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 1rem (16px)
- **lg:** 1.5rem (24px)
- **xl:** 2rem (32px)
- **2xl:** 3rem (48px)

### Component Specifications

#### Auction Card (Homepage)

**Desktop Layout:**
```
┌─────────────────────────────────┐
│  [Image Thumbnail]              │
│  200px x 200px                  │
├─────────────────────────────────┤
│  Item Name                      │ ← Bold, 20px
│  Starting Price: $10,000        │ ← Semi-bold, 16px
│  Starts in 5:23                 │ ← Regular, 14px, gray
│  👁 12 viewers                   │ ← Regular, 14px, gray
└─────────────────────────────────┘
```

**Hover State:** Subtle shadow, scale 1.02 transform

**Mobile Layout:** Same structure, full width (no columns)

#### Live Auction View

**Desktop Layout (3-column):**
```
┌─────────┬───────────────────────────┬─────────────┐
│ Item    │  Current Price: $7,080    │  Viewers: 23│ ← Top bar
│ Image   │  (48px, bold, red)        │  Shields: 5 │
│ Gallery ├───────────────────────────┴─────────────┤
│         │  Time Remaining: ▓▓▓▓▓▓░░░ 10:32       │ ← Progress bar
│ (400px) ├───────────────────────────┬─────────────┤
│         │                           │             │
│         │  Price Graph              │  Sidebar    │
│         │  (600px wide)             │  - Viewer   │
│         │                           │    count    │
│         │  Y: Price                 │  - Shield   │
│         │  X: Time                  │    count    │
│         │                           │  - Stats    │
│         │                           │             │
│         ├───────────────────────────┴─────────────┤
│         │  Shield Control                         │
│         │  [Open Shield to Enable Purchase]      │ ← Button
│         │  or                                     │
│         │  [Purchase at $7,080] (5s countdown)   │ ← Red button
└─────────┴─────────────────────────────────────────┘
```

**Mobile Layout (Stacked):**
```
┌─────────────────────────────┐
│  Current Price: $7,080      │ ← Sticky header
│  Time: ▓▓▓▓▓▓░░ 10:32       │
├─────────────────────────────┤
│  [Image Gallery]            │
│  Swipeable                  │
├─────────────────────────────┤
│  Price Graph                │
│  (Full width)               │
├─────────────────────────────┤
│  Viewers: 23 | Shields: 5   │ ← Stats row
├─────────────────────────────┤
│  [Shield Control]           │ ← Fixed bottom
│  [Purchase at $7,080]       │
└─────────────────────────────┘
```

#### Shield Button States

**State 1: Closed (Default)**
```
┌─────────────────────────────┐
│  🛡️ Open Shield to Enable   │ ← Blue, 56px tall
│     Purchase                │    (Touch-friendly)
└─────────────────────────────┘
```

**State 2: Opening Animation (500ms)**
- Shield icon slides up and fades out
- Button background color transitions blue → red
- Purchase button fades in from below

**State 3: Open (5-second window)**
```
┌─────────────────────────────┐
│  🔴 Purchase at $7,080      │ ← Red, pulsing glow
│     3s remaining            │    56px tall
│  ⏱️ ●●●○○ (countdown dots)   │
└─────────────────────────────┘
```

**State 4: Cooldown (5 seconds)**
```
┌─────────────────────────────┐
│  🛡️ Shield Cooldown         │ ← Gray, disabled
│     Ready in 3s             │    56px tall
└─────────────────────────────┘
```

#### Price Graph

**Axes:**
- **X-axis:** Time elapsed (0:00 to duration, e.g., 15:00)
- **Y-axis:** Price ($5,000 to $10,000)

**Line:**
- **Color:** Shield Blue (#457B9D)
- **Thickness:** 3px
- **Style:** Smooth curve (not jagged steps)
- **Animation:** New points fade in with 300ms transition

**Current Price Indicator:**
- Horizontal dashed line at current price
- Label on right axis: "$7,080 (current)"

**Floor Price Indicator:**
- Horizontal solid line at floor price
- Label: "$5,000 (floor)"
- Red zone below floor (cross-hatched pattern)

**Responsive:**
- Desktop: 600px wide x 400px tall
- Tablet: Full width x 350px tall
- Mobile: Full width x 250px tall

### Accessibility Specifications

#### Keyboard Navigation

**Tab Order:**
1. Skip to main content (skip nav)
2. Balance display (opens transaction modal on Enter)
3. Auction card 1 (opens auction on Enter)
4. Auction card 2 ...
5. (In auction view) Shield button (opens shield on Enter, purchases on Enter if open)

**Keyboard Shortcuts (in auction view):**
- **Spacebar:** Open shield (if closed), Purchase (if open and focused)
- **Escape:** Close any open modal

#### Screen Reader Support

**ARIA Labels:**
- Auction card: `aria-label="Rare Vintage Watch auction, starting price $10,000, starts in 5 minutes, 12 viewers"`
- Price display: `aria-live="polite" aria-atomic="true"` (announces price changes, but not on every update - debounced to every 10 seconds)
- Shield button:
  - Closed: `aria-label="Open shield to enable purchase"`
  - Open: `aria-label="Purchase item at $7,080, 3 seconds remaining"`
  - Cooldown: `aria-label="Shield on cooldown, ready in 3 seconds"`
- Time remaining: `aria-live="off"` (too frequent, not useful for screen readers)

**Semantic HTML:**
- Use `<button>` for all interactive elements (not `<div onclick>`)
- Use `<main>`, `<nav>`, `<section>`, `<article>` for structure
- Use `<h1>`, `<h2>`, `<h3>` in logical hierarchy

#### Visual Accessibility

**Color Contrast:**
- All text meets WCAG AA: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- Purchase button (white text on #E63946 red): 6.2:1 ✅
- Price display (dark gray on white): 12.6:1 ✅

**Focus Indicators:**
- All interactive elements have visible focus ring: 2px solid #457B9D (shield blue)
- Focus ring offset: 2px from element edge

**Motion:**
- Respect `prefers-reduced-motion` media query:
  - If enabled: Disable shield opening animation, price graph animations, confetti
  - Instant state transitions instead of animations

**Text Scaling:**
- All text uses relative units (rem, em)
- Layout does not break at 200% browser zoom (WCAG AA requirement)

### Animation Specifications

**Shield Opening (500ms):**
```
Frame 0ms: Shield cover at 100% opacity, y: 0
Frame 250ms: Shield cover at 50% opacity, y: -30px
Frame 500ms: Shield cover at 0% opacity, y: -60px (display: none)
           Purchase button at 100% opacity, y: 0 (display: block)
```
Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design standard easing)

**Confetti (Purchase Success, 3 seconds):**
- Particle count: 50
- Colors: Success green, auction red, shield blue, warning yellow (random)
- Physics: Gravity + air resistance simulation
- Fade out: Last 1 second

**Price Update (300ms):**
- New price fades in with scale transform: `scale(1.1) → scale(1.0)`
- Color flash: red → normal (if significant drop)

**Modal Fade In/Out (200ms):**
- Backdrop: `opacity: 0 → 0.5` (black background)
- Modal: `opacity: 0, scale(0.9) → opacity: 1, scale(1.0)`

## Technical Implementation Notes

### Firebase Security Rules (Partial Example)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Auctions: Admins can write, users can read
    match /auctions/{auctionId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;

      // Shield state: Users can only modify their own
      match /shields/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId
                     && request.resource.data.openedAt > resource.data.lastClosedAt + duration.value(5, 's') // Cooldown enforced
                     && get(/databases/$(database)/documents/auctions/$(auctionId)).data.status == 'live';
      }
    }

    // Users: Users can read their own data
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // Only Cloud Functions can modify balance
    }

    // Transactions: Users can read their own
    match /transactions/{txnId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if false; // Only Cloud Functions create transactions
    }
  }
}
```

### Real-Time Sync Strategy

**Firestore Listeners:**
- **Auction State:** All clients listen to `/auctions/{auctionId}` document
  - Updates: `currentPrice`, `status`, `viewerCount`, `openShieldCount`, `endTime`, `winner`
- **Price History:** Admin dashboard listens to `/auctions/{auctionId}/priceHistory` collection (last 100 points)
- **Shield State:** Each user listens to their own `/auctions/{auctionId}/shields/{userId}` document
- **User Balance:** Each user listens to `/users/{userId}` document

**Update Frequency:**
- **Price:** Every 500ms (algorithmic recalculation) or per formula interval (transparent mode)
- **Viewer Count:** Every 5 seconds (batched using presence detection)
- **Shield Count:** Immediate (on shield open/close)

**Optimistic UI:**
- Shield open/close: Update client-side immediately, rollback if server rejects
- Purchase: Show "Processing..." immediately, show result when server responds
- Balance: Do not update client-side until server confirms (prevent misleading user)

### Client-Side State Management (React Hooks)

```javascript
// Custom hook for auction state
function useAuction(auctionId) {
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore.collection('auctions').doc(auctionId)
      .onSnapshot(
        (doc) => {
          setAuction({ id: doc.id, ...doc.data() });
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [auctionId]);

  return { auction, loading, error };
}
```

### Performance Optimizations

1. **Image Optimization:**
   - Generate thumbnails (200x200px) for auction cards
   - Use responsive images (`<img srcset>`) for different screen sizes
   - Lazy load images below the fold

2. **Firestore Read Optimization:**
   - Cache auction list locally (5-minute TTL)
   - Use Firestore snapshots (long-lived listeners) instead of polling
   - Limit price history to last 100 points (pagination for admin view)

3. **React Rendering:**
   - Memoize components that don't depend on real-time data
   - Use `React.memo()` for auction cards
   - Debounce screen reader announcements (price updates every 10s, not 500ms)

## Open Questions & Future Decisions

1. **Q: Should users be able to see who else is viewing the auction (beyond just count)?**
   - *Deferred:* MVP shows count only. Future: Avatars or anonymous labels ("User 1", "User 2")

2. **Q: Should there be a minimum bid increment (e.g., price must drop at least $10 per update)?**
   - *Deferred:* MVP allows any price changes (algorithm controls this). Monitor for spam/noise.

3. **Q: Should admins be able to pause/resume auctions (not just stop)?**
   - *Deferred:* MVP only supports stop (no winner). Pause/resume adds complexity around time calculations.

4. **Q: Should users receive notifications when auctions they're watching are about to start?**
   - *Out of Scope:* No notification system in MVP. Future: Email/push notifications.

5. **Q: Should there be a "Buy It Now" option at starting price (skip the auction)?**
   - *Out of Scope:* Contradicts descending price mechanic. If needed, use fixed-price sales (different feature).

6. **Q: Should algorithmic mode pricing parameters be visible to users, or hidden?**
   - *Decision TBD:* Affects transparency. Current spec assumes parameters are visible in auction details (same transparency as formula mode, but users may not understand them). User testing will inform.

7. **Q: Should admins be able to test auctions in a sandbox mode before going live?**
   - *Deferred:* MVP requires manual testing in production. Future: Add "test mode" flag.

## Success Metrics (Post-Launch)

*Note: These metrics are for evaluation after prototype testing, not implementation requirements.*

**Engagement Metrics:**
- Average shields opened per user per auction
- Average time spent watching auction (session duration)
- Percentage of users who open shield at least once
- Percentage of auctions that result in a sale (vs. no winner)

**Fairness Metrics:**
- Distribution of purchase prices (how many at floor vs. starting vs. midpoint)
- Frequency of "someone else purchased first" errors
- User feedback on perceived fairness (survey)

**Technical Metrics:**
- Real-time sync latency (p50, p95, p99)
- Firestore read/write costs per auction
- Client-side error rate
- Uptime during auctions

---

**Last Updated:** 2025-11-16
**Status:** Specification Complete - Ready for Planning Phase
**Next Step:** Use `/plan` command to generate implementation plan
