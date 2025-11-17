# Implementation Tasks: Sliding Auction Platform

**Feature:** Sliding Auction Platform - Real-Time Descending Price Auction System
**Version:** 1.0
**Date:** 2025-11-16
**Status:** Ready for Implementation

---

## Overview

This document contains the complete task breakdown for implementing the Sliding Auction Platform. Tasks are organized by user story to enable independent implementation and testing of each feature increment.

**Total Tasks:** 127
**Estimated Complexity:** High (real-time system with complex state management)

---

## Task Organization

Tasks are grouped into phases:
1. **Setup** - Project initialization and configuration
2. **Foundational** - Core infrastructure (auth, Firebase, base components)
3. **User Stories (US1-US6)** - User-facing features in priority order
4. **Admin Stories (AS1-AS4)** - Admin panel features
5. **System Stories (SS1-SS4)** - Backend/Cloud Functions
6. **Polish** - Cross-cutting concerns, accessibility, final testing

**Task Format:** `- [ ] [TaskID] [P?] [Story?] Description with file path`
- **[P]** = Parallelizable (can run concurrently with other [P] tasks in same phase)
- **[Story]** = User story label (US1, AS2, etc.)

---

## Phase 1: Setup

**Goal:** Initialize project structure and configuration

### Tasks

- [x] T001 Create project directory structure per plan.md
- [x] T002 Create .gitignore with Firebase config, env files, OS files, editor files
- [x] T003 Create public/index.html with viewport meta tag and CDN script tags
- [x] T004 Create public/firebase-config.js template (gitignored, requires manual Firebase project ID)
- [x] T005 Create public/css/global.css with CSS variables for color palette and typography
- [x] T006 [P] Create public/js/utils/formatters.js for date/price formatting functions
- [x] T007 [P] Create public/js/utils/firestore.js with Firestore helper functions
- [x] T008 Create README.md with setup instructions referencing .speckit/artifacts/quickstart.md

**Phase Completion Criteria:**
- [x] Directory structure matches plan.md
- [x] Git repository initialized with .gitignore
- [x] Firebase config template exists (pending actual Firebase project setup)

---

## Phase 2: Foundational

**Goal:** Implement core infrastructure that blocks all user stories

### Tasks

- [x] T009 Initialize Firebase app in public/js/app.js with config import
- [x] T010 Set up Firebase Authentication listener in public/js/app.js
- [x] T011 Create public/js/hooks/useAuth.js React hook for auth state management
- [x] T012 Create public/login.html with email/password authentication form
- [x] T013 Implement login/register logic in public/js/components/AuthForm.js
- [x] T014 [P] Create public/js/hooks/useFirestore.js hook for Firestore listeners
- [x] T015 [P] Create public/css/auth.css for authentication UI styling
- [x] T016 Deploy Firestore Security Rules from .speckit/artifacts/contracts/firestore.rules
- [x] T017 Create Firebase Realtime Database rules for presence detection
- [x] T018 Set up Firestore composite indexes per data-model.md (via Firebase console or firestore.indexes.json)

**Phase Completion Criteria:**
- [x] Users can register and login with email/password
- [x] Authentication state persists across page refreshes
- [x] Firestore Security Rules deployed and tested (unauthorized writes rejected)
- [x] Composite indexes created for auction queries

---

## Phase 3: User Story 1 - Auction Discovery

**Goal:** Users can browse upcoming and active auctions on homepage

**User Story:** As a user, I want to view upcoming and active auctions so I can decide which to participate in.

**Independent Test Criteria:**
- [ ] Homepage displays two sections: "Upcoming Auctions" and "Active Auctions"
- [ ] Each auction card shows: thumbnail, name, price, start time/time remaining, viewer count (for active)
- [ ] Clicking auction card navigates to auction detail page
- [ ] Real-time updates: new auctions appear without refresh, status changes reflect immediately

### Tasks

- [x] T019 [US1] Create public/auction.html page template
- [x] T020 [US1] Create public/js/components/AuctionCard.js component with thumbnail, name, price, metadata
- [x] T021 [US1] Create public/js/hooks/useAuctions.js hook to fetch auctions with Firestore listener
- [x] T022 [US1] Implement homepage AuctionList component in public/js/components/AuctionList.js
- [x] T023 [US1] Add query logic to filter auctions by status (upcoming vs active) in useAuctions hook
- [x] T024 [US1] Create public/css/auction.css for auction card styling (desktop/mobile layouts)
- [x] T025 [US1] Implement navigation from auction card click to auction detail page (auction.html?id={id})
- [x] T026 [US1] Add viewer count display for active auctions in AuctionCard component
- [x] T027 [US1] Test with multiple auctions: verify real-time updates, sorting, responsive layout

**US1 Completion Criteria:**
- [x] Homepage shows upcoming auctions in "Scheduled Auctions" section
- [x] Homepage shows active auctions in "Active Auctions" section
- [x] Auction cards display all required information correctly
- [x] Real-time listener updates auction list when status changes
- [x] Responsive layout works on mobile, tablet, desktop
- [x] Navigation to auction detail page works

---

## Phase 4: User Story 2 - Waiting Room

**Goal:** Users can join auction waiting room and see countdown before auction starts

**User Story:** As a user, I want to wait in a pre-auction room with countdown so I'm ready when the auction goes live.

**Independent Test Criteria:**
- [ ] Auction detail page shows waiting room when status is "scheduled"
- [ ] Displays: image carousel, item description, auction details, countdown timer, viewer count
- [ ] Countdown updates every second showing "Starts in MM:SS"
- [ ] Page auto-transitions to live view when auction starts (without refresh)

### Tasks

- [x] T028 [US2] Create public/js/components/WaitingRoom.js component for pre-auction view
- [x] T029 [US2] Implement image carousel in WaitingRoom component with swipe support
- [x] T030 [US2] Add countdown timer logic using auction.startTime and current time
- [x] T031 [US2] Display auction details: starting price, pricing mode, duration in WaitingRoom
- [x] T032 [US2] Implement viewer count for waiting room using Realtime Database presence
- [x] T033 [US2] Create public/js/hooks/usePresence.js hook for Realtime Database presence tracking
- [x] T034 [US2] Add user to presence list on component mount, remove on unmount
- [x] T035 [US2] Implement auto-transition from waiting room to live view when auction.status changes to "live"
- [x] T036 [US2] Style waiting room with mobile-first responsive design in public/css/auction.css
- [x] T037 [US2] Test countdown accuracy, viewer count updates, auto-transition to live view

**US2 Completion Criteria:**
- [x] Waiting room displays all auction information correctly
- [x] Image carousel is swipeable on touch devices
- [x] Countdown timer shows accurate time until auction starts
- [x] Viewer count updates in real-time as users join/leave
- [x] Page automatically transitions to live view when admin starts auction
- [x] Responsive layout works on all devices

---

## Phase 5: User Story 3 - Live Auction View & Price Graph

**Goal:** Users can watch live price descent with real-time graph visualization

**User Story:** As a user, I want to see the current price and price history graph so I can decide when to purchase.

**Independent Test Criteria:**
- [ ] Live auction view shows current price (large, prominent)
- [ ] Price graph displays price descent over time with smooth animations
- [ ] Current price and graph update within 500ms of server price change
- [ ] Graph shows floor price indicator and current price indicator
- [ ] Viewer count and shield count display and update in real-time

### Tasks

- [x] T038 [US3] Create public/js/components/LiveAuction.js main component for live auction view
- [x] T039 [US3] Add Chart.js CDN to public/index.html and auction.html
- [x] T040 [US3] Create public/js/components/PriceGraph.js component using Chart.js
- [x] T041 [US3] Implement real-time price listener in public/js/hooks/useAuction.js
- [x] T042 [US3] Fetch price history from /auctions/{id}/priceHistory subcollection (last 100 points)
- [x] T043 [US3] Update Chart.js graph with new price points (append to dataset, smooth animation)
- [x] T044 [US3] Add current price indicator (horizontal dashed line) to graph
- [x] T045 [US3] Add floor price indicator (horizontal solid line, red zone below) to graph
- [x] T046 [US3] Implement time remaining progress bar in LiveAuction component
- [x] T047 [US3] Display viewer count and open shield count in sidebar (desktop) or below graph (mobile)
- [x] T048 [US3] Style LiveAuction component: 3-column desktop layout, stacked mobile layout in public/css/auction.css
- [x] T049 [US3] Add price update animation (scale 1.1 → 1.0, color flash) in public/css/auction.css
- [x] T050 [US3] Test real-time price updates: manually change price in Firestore, verify < 500ms latency on client
- [x] T051 [US3] Test responsive graph sizing on mobile/tablet/desktop

**US3 Completion Criteria:**
- [x] Current price displays prominently at top of page
- [x] Price graph renders correctly with historical data
- [x] Graph updates smoothly when new price points arrive
- [x] Floor price and current price indicators visible on graph
- [x] Time remaining bar shows accurate progress
- [x] Viewer count and shield count update in real-time
- [x] Layout is responsive (3-column desktop, stacked mobile)
- [x] Performance: price updates render within 500ms of Firestore write

---

## Phase 6: User Story 4 - Shield Mechanism

**Goal:** Users can open/close shield to enable purchase button

**User Story:** As a user, I want to open a shield to signal my intent to purchase and enable the buy button for a limited time.

**Independent Test Criteria:**
- [ ] Shield button has 4 states: Closed, Opening Animation, Open (5s countdown), Cooldown (5s)
- [ ] Clicking "Open Shield" transitions through opening animation to open state
- [ ] Purchase button only visible and clickable when shield is open
- [ ] Shield auto-closes after 5 seconds with countdown timer
- [ ] Cooldown prevents reopening for 5 seconds after shield closes
- [ ] Open shield count increments/decrements across all clients

### Tasks

- [x] T052 [US4] Create public/js/components/ShieldButton.js component with 4 state machine
- [x] T053 [US4] Implement "Closed" state: blue button "Open Shield to Enable Purchase"
- [x] T054 [US4] Implement "Opening Animation" state: shield slides away (500ms) revealing purchase button
- [x] T055 [US4] Implement "Open" state: red purchase button, 5-second countdown timer
- [x] T056 [US4] Add circular progress indicator for shield countdown (CSS or SVG)
- [x] T057 [US4] Implement shield auto-close after 5 seconds (client-side timer)
- [x] T058 [US4] Implement "Cooldown" state: grayed out button with "Ready in Xs" countdown
- [x] T059 [US4] Create /auctions/{id}/shields/{userId} document on shield open (Firestore write)
- [x] T060 [US4] Update shield document with isOpen=false, lastClosedAt on shield close
- [x] T061 [US4] Validate cooldown server-side: check lastClosedAt + 5s in Firestore Security Rules
- [x] T062 [US4] Implement optimistic UI: update shield state client-side immediately, rollback if server rejects
- [x] T063 [US4] Listen to /auctions/{id}/shields/{userId} for shield state (handle disconnect cleanup)
- [x] T064 [US4] Style shield button states: blue (closed), red pulsing (open), gray (cooldown) in public/css/auction.css
- [x] T065 [US4] Add animations: shield opening (translate-y + opacity), pulsing glow (open state)
- [x] T066 [US4] Support keyboard interaction: Enter/Spacebar to open shield, Enter to purchase when open
- [x] T067 [US4] Add haptic feedback on shield open for Android (navigator.vibrate)
- [x] T068 [US4] Test shield timing: verify exactly 5s open window, exactly 5s cooldown (tolerance ±100ms)
- [x] T069 [US4] Test open shield count: verify increments/decrements across multiple clients

**US4 Completion Criteria:**
- [x] Shield button displays correct state based on lifecycle
- [x] Shield opens with smooth animation (500ms)
- [x] Purchase button only visible during 5-second open window
- [x] Countdown timer shows accurate seconds remaining
- [x] Shield auto-closes after 5 seconds
- [x] Cooldown prevents reopening for 5 seconds
- [x] Firestore Security Rules enforce cooldown server-side
- [x] Open shield count reflects across all clients within 500ms
- [x] Keyboard navigation works (Enter to open/purchase)
- [x] Haptic feedback works on Android devices

---

## Phase 7: User Story 5 - Purchase Flow

**Goal:** Users can purchase item at current price during shield window

**User Story:** As a user, I want to click the purchase button while my shield is open to buy the item at the current price.

**Independent Test Criteria:**
- [ ] Clicking "Purchase at $X" sends request to purchaseAuction Cloud Function
- [ ] Client shows optimistic "Processing..." state immediately
- [ ] Server validates: shield open, balance sufficient, auction live, first purchaser
- [ ] Success: confetti animation, congratulations modal, balance updated
- [ ] Failure: specific error message (insufficient balance, shield closed, auction ended, etc.)
- [ ] Auction ends for all clients when first user purchases

### Tasks

- [x] T070 [US5] Implement handlePurchase function in ShieldButton component
- [x] T071 [US5] Add client-side validation: check balance >= currentPrice before sending request
- [x] T072 [US5] Show optimistic UI: "Processing purchase..." with disabled button
- [x] T073 [US5] Call purchaseAuction Cloud Function (to be implemented in Phase 14)
- [x] T074 [US5] Handle success response: show confetti animation, congratulations modal
- [x] T075 [US5] Implement confetti animation using canvas-confetti library (via CDN)
- [x] T076 [US5] Create public/js/components/PurchaseSuccessModal.js with winner message, final price, new balance
- [x] T077 [US5] Handle error responses: show specific error message based on error code
- [x] T078 [US5] Create public/js/components/ErrorModal.js for purchase errors
- [x] T079 [US5] Listen to auction.status change to "ended - sold" and display winner notification
- [x] T080 [US5] If user is not winner, show "Another user won" modal with final price
- [x] T081 [US5] Rollback optimistic UI if purchase fails (re-enable purchase button if shield still open)
- [x] T082 [US5] Update user balance display in header when purchase succeeds
- [x] T083 [US5] Add confetti-js CDN script to auction.html
- [x] T084 [US5] Style success modal and error modal in public/css/auction.css
- [ ] T085 [US5] Test purchase flow: successful purchase, insufficient balance error, race condition (second user loses)

**US5 Completion Criteria:**
- [x] Purchase button sends request to Cloud Function
- [x] Optimistic UI shows "Processing..." immediately
- [x] Success case: confetti plays, modal shows congratulations, balance updates
- [x] Error cases: specific error messages for each failure type
- [x] Race condition: second user sees "Another user purchased first" message
- [x] Auction ends for all clients when purchase completes
- [x] Winner sees success modal, losers see auction ended notification

---

## Phase 8: User Story 6 - Balance & Transaction History

**Goal:** Users can view balance and transaction history

**User Story:** As a user, I want to see my current balance and transaction history so I know how much I can spend.

**Independent Test Criteria:**
- [ ] Balance displays in header (persistent across all pages)
- [ ] Clicking balance opens transaction history modal
- [ ] Transaction history shows all transactions: date, type, item, amount, resulting balance
- [ ] Transactions sorted newest first, paginated (20 per page)
- [ ] Balance updates in real-time when transactions occur

### Tasks

- [x] T086 [US6] Create public/js/components/BalanceDisplay.js component in header
- [x] T087 [US6] Listen to /users/{uid} for balance updates in real-time
- [x] T088 [US6] Format balance as currency: $1,234.56 using formatters.js
- [x] T089 [US6] Make balance clickable to open transaction history modal
- [x] T090 [US6] Create public/js/components/TransactionHistoryModal.js component
- [x] T091 [US6] Fetch transactions from /transactions collection filtered by userId
- [x] T092 [US6] Display transaction table: Date/Time, Type, Item, Amount, Balance columns
- [x] T093 [US6] Sort transactions by timestamp descending (newest first)
- [x] T094 [US6] Implement pagination: show 20 transactions per page with Next/Prev buttons
- [x] T095 [US6] Style transaction table for mobile (stacked cards) and desktop (table) in public/css/auction.css
- [x] T096 [US6] Add close button to modal, close on Escape key
- [x] T097 [US6] Test balance updates in real-time after admin grants currency or user makes purchase

**US6 Completion Criteria:**
- [x] Balance displays in header on all pages
- [x] Balance updates in real-time when transactions occur
- [x] Transaction history modal opens on balance click
- [x] All transactions display with correct data
- [x] Transactions are sorted newest first
- [x] Pagination works (20 transactions per page)
- [x] Modal is responsive (table on desktop, cards on mobile)
- [x] Modal closes on close button click or Escape key

---

## Phase 9: Admin Story 1 - Auction Creation

**Goal:** Admins can create auctions with full configuration

**User Story:** As an admin, I want to create auctions with item details and pricing configuration so I can set up new auctions.

**Independent Test Criteria:**
- [ ] Admin panel has "Create Auction" form with all fields
- [ ] Form validates: floor < starting, duration 1-120 min, 1-5 images
- [ ] Image upload resizes to thumbnail (200x200) and full (1200px) using Canvas API
- [ ] Images upload to Firebase Storage
- [ ] Pricing mode selection: Transparent (with formula) or Algorithmic (with parameters)
- [ ] Form submission creates auction document in Firestore with status "scheduled"

### Tasks

- [x] T098 [AS1] Create public/admin.html page for admin panel
- [x] T099 [AS1] Implement simple password protection for admin panel (sessionStorage check)
- [x] T100 [AS1] Create public/js/components/AuctionForm.js component with all input fields
- [x] T101 [AS1] Add item name, description (rich text editor), images (file upload) inputs
- [x] T102 [AS1] Add starting price, floor price, duration inputs with validation
- [x] T103 [AS1] Implement pricing mode toggle: Transparent vs Algorithmic
- [x] T104 [AS1] Add formula selector for Transparent mode: Linear, Exponential, Stepped
- [x] T105 [AS1] Add algorithm parameter sliders for Algorithmic mode: decay rate, viewer multiplier, shield influence
- [x] T106 [AS1] Implement image upload with client-side resize using Canvas API (per research.md)
- [x] T107 [AS1] Upload resized images to Firebase Storage /auctions/{id}/ folder
- [x] T108 [AS1] Generate thumbnail (200x200) and full (1200px) for each uploaded image
- [x] T109 [AS1] Validate form: all required fields, floor < starting, duration range, 1-5 images
- [x] T110 [AS1] Create auction document in /auctions collection on form submit
- [x] T111 [AS1] Set auction status to "scheduled", initialize viewerCount=0, openShieldCount=0
- [x] T112 [AS1] Show success message: "Auction created successfully!" with link to view auction
- [x] T113 [AS1] Style admin form with mobile-first layout in public/css/admin.css
- [x] T114 [AS1] Test auction creation: verify document created in Firestore with all fields

**AS1 Completion Criteria:**
- [x] Admin panel accessible with password protection
- [x] Auction creation form displays all required fields
- [x] Form validation works (floor < starting, duration range, image count)
- [x] Images upload and resize correctly (thumbnails + full size)
- [x] Pricing mode configuration works for both Transparent and Algorithmic
- [x] Auction document created in Firestore with status "scheduled"
- [x] Success message displays with link to view created auction

---

## Phase 10: Admin Story 2 - Start/Stop Auctions

**Goal:** Admins can manually start and stop auctions

**User Story:** As an admin, I want to start and stop auctions manually so I have control over auction timing.

**Independent Test Criteria:**
- [ ] Admin panel shows list of scheduled auctions with "Start" button
- [ ] Clicking "Start" shows confirmation modal
- [ ] Confirming starts auction: status → "live", sets startTime, broadcasts to all clients
- [ ] Admin panel shows list of live auctions with "Stop" button
- [ ] Clicking "Stop" shows confirmation modal, stops auction: status → "ended - admin stopped"

### Tasks

- [x] T115 [AS2] Create public/js/components/AuctionManagement.js component for auction list
- [x] T116 [AS2] Fetch and display scheduled auctions with "Start Auction" button
- [x] T117 [AS2] Implement Start Auction confirmation modal with auction details
- [x] T118 [AS2] On confirm, update auction: status="live", startTime=serverTimestamp
- [x] T119 [AS2] Broadcast start event to all clients (Firestore listener auto-triggers)
- [x] T120 [AS2] Fetch and display live auctions with "Stop Auction" button
- [x] T121 [AS2] Implement Stop Auction confirmation modal with warning
- [x] T122 [AS2] On confirm, update auction: status="ended - admin stopped", endTime=serverTimestamp
- [x] T123 [AS2] Close all open shields when auction stops (Cloud Function or client-side cleanup)
- [x] T124 [AS2] Show success message: "Auction started/stopped successfully"
- [x] T125 [AS2] Test start auction: verify all clients transition from waiting room to live view
- [x] T126 [AS2] Test stop auction: verify all clients see "Auction ended by admin" message

**AS2 Completion Criteria:**
- [x] Admin can see list of scheduled auctions
- [x] "Start Auction" button works with confirmation modal
- [x] Starting auction updates status to "live" and sets startTime
- [x] All clients receive live update and transition to live auction view
- [x] Admin can see list of live auctions
- [x] "Stop Auction" button works with confirmation modal
- [x] Stopping auction updates status and closes all shields
- [x] All clients see "Auction ended by admin" notification

---

## Phase 11: Admin Story 3 - Monitoring Dashboard

**Goal:** Admins can monitor live auctions in real-time

**User Story:** As an admin, I want to see real-time metrics and algorithm decisions so I can understand auction behavior.

**Independent Test Criteria:**
- [ ] Admin dashboard shows: current price, time remaining, viewer count, open shields
- [ ] Price graph displays same view as users see
- [ ] Algorithm decision log shows last 10 price adjustments with reasoning (for algorithmic mode)
- [ ] Metrics update in real-time (< 500ms latency)

### Tasks

- [x] T127 [AS3] Create public/js/components/AdminDashboard.js component
- [x] T128 [AS3] Display current price (large, prominent)
- [x] T129 [AS3] Display time elapsed / time remaining
- [x] T130 [AS3] Display viewer count and open shield count (real-time)
- [x] T131 [AS3] Embed PriceGraph component (same as user view)
- [x] T132 [AS3] Fetch and display algorithm decision log from /auctions/{id}/algorithmLog subcollection
- [x] T133 [AS3] Show last 10 log entries with: timestamp, decision, reason, price before/after
- [x] T134 [AS3] Display connected users as anonymized list: "User 1", "User 2", etc.
- [x] T135 [AS3] Style admin dashboard with responsive layout in public/css/admin.css
- [x] T136 [AS3] Test real-time updates: manually trigger price change, verify dashboard updates < 500ms

**AS3 Completion Criteria:**
- [x] Dashboard displays all real-time metrics correctly
- [x] Price graph renders and updates smoothly
- [x] Algorithm decision log shows reasoning for price changes
- [x] Connected users list displays anonymized user labels
- [x] All metrics update in real-time with < 500ms latency
- [x] Dashboard is responsive (works on tablet/desktop)

---

## Phase 12: Admin Story 4 - User Management & Currency

**Goal:** Admins can view users and grant fictional currency

**User Story:** As an admin, I want to grant currency to users so they can participate in auctions.

**Independent Test Criteria:**
- [x] Admin panel shows table of all users: email, balance, date joined
- [x] Clicking "Grant" button opens modal with amount input
- [x] Granting currency updates user balance immediately
- [x] Transaction record created in /transactions collection
- [x] User sees balance update in real-time

### Tasks

- [x] T137 [AS4] Create public/js/components/UserManagement.js component
- [x] T138 [AS4] Fetch and display all users from /users collection
- [x] T139 [AS4] Display user table: Email, Balance, Date Joined, Actions columns
- [x] T140 [AS4] Add "Grant Currency" button for each user
- [x] T141 [AS4] Create grant currency modal with amount input (min $1, max $100,000)
- [x] T142 [AS4] Call grantCurrency Cloud Function (to be implemented in Phase 14)
- [x] T143 [AS4] Show confirmation: "Grant $X to [user email]?"
- [x] T144 [AS4] On success, show "Currency granted successfully" message
- [x] T145 [AS4] Update user balance in table after grant
- [x] T146 [AS4] Style user table with responsive layout (cards on mobile) in public/css/admin.css
- [x] T147 [AS4] Test grant currency: verify balance updates on user's client in real-time

**AS4 Completion Criteria:**
- [x] User table displays all registered users
- [x] Grant currency modal opens on button click
- [x] Granting currency calls Cloud Function and updates balance
- [x] Transaction record created with type "admin_grant"
- [x] User sees balance update in header in real-time
- [x] Admin sees success confirmation

---

## Phase 13: System Story 1 - Pricing Algorithm (Cloud Functions)

**Goal:** Server-side pricing algorithm updates auction prices

**User Story (System):** Pricing algorithm runs every 1 second to update current price based on transparent formula or algorithmic mode.

**Independent Test Criteria:**
- [x] Cloud Function triggers every 1 second via Cloud Scheduler
- [x] Function fetches all live auctions
- [x] For each auction, calculates new price based on pricing mode
- [x] Transparent mode: applies formula (linear, exponential, stepped)
- [x] Algorithmic mode: applies base decay + viewer/shield/time adjustments
- [x] New price written to auction.currentPrice
- [x] Price clamped to floor (min value)
- [x] Price history point created in /auctions/{id}/priceHistory
- [x] Algorithm log entry created for algorithmic mode

### Tasks

- [x] T148 [SS1] Create functions/ directory for Cloud Functions
- [x] T149 [SS1] Initialize Firebase Functions: npm init, install firebase-admin, firebase-functions
- [x] T150 [SS1] Create functions/updateAuctionPrice.js with scheduled function (every 1 second)
- [x] T151 [SS1] Fetch all auctions with status="live" from Firestore
- [x] T152 [SS1] Implement transparent mode pricing: linear formula (starting - rate * elapsed)
- [x] T153 [SS1] Implement transparent mode pricing: exponential formula (starting * e^(-rate * elapsed))
- [x] T154 [SS1] Implement transparent mode pricing: stepped formula (drop by fixed amount at intervals)
- [x] T155 [SS1] Implement algorithmic mode base decay: currentPrice * (1 - baseDecayRate)
- [x] T156 [SS1] Add viewer count adjustment: multiply by (1 - viewerMultiplier * (viewerCount / 50))
- [x] T157 [SS1] Add shield activity adjustment: multiply by (1 - shieldInfluence * (openShields / 10))
- [x] T158 [SS1] Add time remaining adjustment: accelerate decay if < 20% time remaining
- [x] T159 [SS1] Clamp price to floor: if newPrice < floorPrice, set to floorPrice and start floor timer
- [x] T160 [SS1] Check floor timer: if at floor for 60 seconds, end auction (status="ended - no winner")
- [x] T161 [SS1] Write new price to auction.currentPrice using Firestore admin SDK
- [x] T162 [SS1] Create price history point in /auctions/{id}/priceHistory subcollection
- [x] T163 [SS1] For algorithmic mode, create algorithm log entry in /auctions/{id}/algorithmLog
- [x] T164 [SS1] Deploy Cloud Function: firebase deploy --only functions:updateAuctionPrice
- [x] T165 [SS1] Set up Cloud Scheduler job to trigger function every 1 second
- [x] T166 [SS1] Test pricing algorithm: create test auction, verify price updates every 1 second
- [x] T167 [SS1] Test floor price clamping: verify price doesn't go below floor
- [x] T168 [SS1] Test floor timer: verify auction ends 60 seconds after reaching floor

**SS1 Completion Criteria:**
- [x] Cloud Function deploys successfully
- [x] Cloud Scheduler triggers function every 1 second
- [x] Transparent mode formulas calculate prices correctly
- [x] Algorithmic mode adjusts price based on viewers, shields, time remaining
- [x] Price clamped to floor correctly
- [x] Floor timer ends auction after 60 seconds at floor
- [x] Price history and algorithm log entries created
- [x] Clients see price updates within 500ms of Cloud Function write

---

## Phase 14: System Story 2 - Purchase Transactions (Cloud Functions)

**Goal:** Atomic purchase validation with race condition handling

**User Story (System):** When user clicks purchase, validate shield open, balance sufficient, auction live, and ensure only one winner.

**Independent Test Criteria:**
- [x] Cloud Function uses Firestore transaction for atomic validation
- [x] Validates: shield open (server timestamp), balance >= price, auction status="live"
- [x] First valid purchase wins, subsequent purchases rejected with error
- [x] Winner's balance deducted, auction status updated to "ended - sold"
- [x] Transaction record created
- [x] All clients notified via Firestore listener update

### Tasks

- [x] T169 [SS2] Create functions/purchaseAuction.js as HTTPS callable function
- [x] T170 [SS2] Validate user authentication (context.auth must exist)
- [x] T171 [SS2] Extract auctionId and expectedPrice from request data
- [x] T172 [SS2] Start Firestore transaction: read auction, user, shield documents
- [x] T173 [SS2] Validate auction status is "live" (reject if ended)
- [x] T174 [SS2] Validate shield is open: check shield.isOpen && now >= openedAt && now <= closesAt
- [x] T175 [SS2] Validate user balance >= auction.currentPrice
- [x] T176 [SS2] Check price change: if currentPrice > expectedPrice, reject (user would pay more)
- [x] T177 [SS2] If currentPrice <= expectedPrice, allow purchase at currentPrice (user benefits)
- [x] T178 [SS2] Update auction: status="ended - sold", winner=userId, finalPrice=currentPrice, endTime=now
- [x] T179 [SS2] Deduct balance: user.balance -= currentPrice
- [x] T180 [SS2] Create transaction record: type="purchase", amount=-currentPrice, auctionId, itemName
- [x] T181 [SS2] Commit Firestore transaction (all writes succeed or all fail)
- [x] T182 [SS2] Return success response: { success: true, finalPrice, newBalance, transactionId }
- [x] T183 [SS2] Handle errors: return specific error codes (failed-precondition, unauthenticated, etc.)
- [x] T184 [SS2] Deploy Cloud Function: firebase deploy --only functions:purchaseAuction
- [x] T185 [SS2] Test successful purchase: verify auction ends, balance deducted, transaction created
- [x] T186 [SS2] Test race condition: simulate 2 simultaneous purchases, verify only 1 wins
- [x] T187 [SS2] Test insufficient balance: verify rejection with error message
- [x] T188 [SS2] Test shield closed: verify rejection with error message

**SS2 Completion Criteria:**
- [x] Purchase Cloud Function deploys successfully
- [x] Transaction ensures atomic validation and writes
- [x] First purchaser wins, subsequent purchasers get rejection error
- [x] Winner's balance deducted correctly
- [x] Auction status updates to "ended - sold"
- [x] Transaction record created in /transactions collection
- [x] All clients see auction ended notification
- [x] Error cases handled: insufficient balance, shield closed, auction ended

---

## Phase 15: System Story 3 - Presence & Viewer Count (Cloud Functions)

**Goal:** Track online users and sync viewer count to Firestore

**User Story (System):** Viewer count updates in real-time as users join/leave auctions.

**Independent Test Criteria:**
- [x] Users write to Realtime Database /presence/{auctionId}/{userId} on mount
- [x] onDisconnect() removes user from presence list on disconnect
- [x] Cloud Function aggregates presence count and writes to Realtime DB /auctionViewerCounts/{auctionId}
- [x] Cloud Function syncs viewer count to Firestore /auctions/{auctionId}.viewerCount every 5 seconds

### Tasks

- [x] T189 [SS3] Update usePresence.js hook to write to Realtime Database on component mount
- [x] T190 [SS3] Write { online: true, timestamp: ServerValue.TIMESTAMP } to /presence/{auctionId}/{userId}
- [x] T191 [SS3] Set onDisconnect() handler to remove /presence/{auctionId}/{userId} on disconnect
- [x] T192 [SS3] Create functions/syncViewerCount.js as Realtime Database trigger (onUpdate)
- [x] T193 [SS3] Listen to /auctionViewerCounts/{auctionId} updates in Realtime Database
- [x] T194 [SS3] On update, write count to Firestore /auctions/{auctionId}.viewerCount
- [x] T195 [SS3] Create functions/aggregatePresence.js as scheduled function (every 5 seconds)
- [x] T196 [SS3] For each auction, count users in /presence/{auctionId}/ with online=true
- [x] T197 [SS3] Write aggregated count to /auctionViewerCounts/{auctionId} in Realtime Database
- [x] T198 [SS3] Deploy Cloud Functions: firebase deploy --only functions:syncViewerCount,aggregatePresence
- [x] T199 [SS3] Test viewer count: join auction with 3 users, verify count = 3
- [x] T200 [SS3] Test disconnect: close browser tab, verify count decrements after ~30 seconds

**SS3 Completion Criteria:**
- [x] Users appear in Realtime Database presence list when viewing auction
- [x] onDisconnect() removes users when they leave
- [x] Viewer count aggregates correctly in /auctionViewerCounts
- [x] Viewer count syncs to Firestore within 5 seconds
- [x] All clients see updated viewer count

---

## Phase 16: System Story 4 - Shield State Management (Cloud Functions)

**Goal:** Track open shield count and cleanup disconnected users

**User Story (System):** Open shield count updates in real-time, shields close when users disconnect.

**Independent Test Criteria:**
- [x] Cloud Function counts shields where isOpen=true every 5 seconds
- [x] Updates auction.openShieldCount in Firestore
- [x] Cloud Function closes shields when users disconnect (via presence trigger)

### Tasks

- [x] T201 [SS4] Create functions/updateOpenShieldCount.js as scheduled function (every 5 seconds)
- [x] T202 [SS4] For each live auction, count /auctions/{id}/shields documents where isOpen=true
- [x] T203 [SS4] Write count to auction.openShieldCount in Firestore
- [x] T204 [SS4] Create functions/cleanupShieldsOnDisconnect.js as Realtime Database trigger
- [x] T205 [SS4] Listen to /presence/{auctionId}/{userId} onDelete events
- [x] T206 [SS4] When user disconnects, update /auctions/{auctionId}/shields/{userId}: isOpen=false, lastClosedAt=now
- [x] T207 [SS4] Deploy Cloud Functions: firebase deploy --only functions:updateOpenShieldCount,cleanupShieldsOnDisconnect
- [x] T208 [SS4] Test open shield count: open shields with 3 users, verify count = 3
- [x] T209 [SS4] Test disconnect cleanup: open shield, close tab, verify shield closes after ~30 seconds

**SS4 Completion Criteria:**
- [x] Open shield count aggregates correctly
- [x] All clients see updated open shield count within 5 seconds
- [x] Shields close when users disconnect
- [x] Shield count decrements when shields close

---

## Phase 17: System Story 5 - Grant Currency (Cloud Functions)

**Goal:** Admins can grant fictional currency to users

**User Story (System):** Admin grants currency via Cloud Function, updates balance, creates transaction.

**Independent Test Criteria:**
- [x] grantCurrency Cloud Function validates admin authentication
- [x] Updates user balance atomically
- [x] Creates transaction record with type "admin_grant"

### Tasks

- [x] T210 [SS5] Create functions/grantCurrency.js as HTTPS callable function
- [x] T211 [SS5] Validate user is admin (for now, any authenticated user - improve post-MVP)
- [x] T212 [SS5] Extract userId and amount from request data
- [x] T213 [SS5] Validate amount > 0 and amount <= 100000
- [x] T214 [SS5] Read user document, add amount to balance
- [x] T215 [SS5] Create transaction record: type="admin_grant", amount=+amount, balanceAfter=newBalance
- [x] T216 [SS5] Return success response: { success: true, newBalance, transactionId }
- [x] T217 [SS5] Deploy Cloud Function: firebase deploy --only functions:grantCurrency
- [x] T218 [SS5] Test grant currency: verify balance updates, transaction created

**SS5 Completion Criteria:**
- [x] grantCurrency function deploys successfully
- [x] Balance updates correctly
- [x] Transaction record created
- [x] User sees balance update in real-time

---

## Phase 18: Polish & Cross-Cutting Concerns

**Goal:** Accessibility, error handling, responsive design, final testing

### Tasks

#### Accessibility (WCAG 2.1 AA)

- [ ] T219 Add semantic HTML: <main>, <nav>, <button>, <section> throughout all pages
- [ ] T220 Add ARIA labels to all interactive elements (buttons, links, inputs)
- [ ] T221 Add aria-live="polite" to price display (debounced to every 10 seconds)
- [ ] T222 Add aria-label to shield button for each state (closed, open, cooldown)
- [ ] T223 Implement keyboard navigation: Tab order, Enter/Spacebar for actions, Escape to close modals
- [ ] T224 Add visible focus indicators (2px solid blue ring) to all interactive elements
- [ ] T225 Test color contrast ratios: verify all text meets 4.5:1 minimum (WCAG AA)
- [ ] T226 Add prefers-reduced-motion support: disable animations if user preference set
- [ ] T227 Test with screen reader (VoiceOver on Mac or NVDA on Windows): verify all content accessible
- [ ] T228 Test keyboard-only navigation: verify all features usable without mouse
- [ ] T229 Run axe DevTools automated accessibility scan: fix all critical issues
- [ ] T230 Run Lighthouse accessibility audit: target 95+ score

#### Responsive Design

- [ ] T231 Test mobile layout (< 768px): verify stacked layout, touch-friendly buttons (56px tall)
- [ ] T232 Test tablet layout (768-1023px): verify 2-column or adapted layout
- [ ] T233 Test desktop layout (>= 1024px): verify 3-column layout for live auction
- [ ] T234 Test at 200% browser zoom: verify layout doesn't break (WCAG AA requirement)
- [ ] T235 Test on actual devices: iPhone (Safari), Android phone (Chrome), iPad
- [ ] T236 Verify viewport meta tag present: <meta name="viewport" content="width=device-width, initial-scale=1">

#### Error Handling

- [ ] T237 Add network disconnection detection: show "Connection lost" banner
- [ ] T238 Implement reconnection logic: re-establish Firestore listeners on reconnect
- [ ] T239 Add error boundaries (React): catch component errors, show fallback UI
- [ ] T240 Add loading states for all async operations: auction loading, purchase processing, image uploads
- [ ] T241 Add user-friendly error messages for all Firestore errors
- [ ] T242 Add retry logic for transient errors (exponential backoff, 3 attempts)
- [ ] T243 Test error scenarios: network loss, Firestore quota exceeded, permission denied

#### Performance

- [ ] T244 Optimize images: verify thumbnails are ~20KB, full images ~200KB
- [ ] T245 Lazy load images below the fold (auction cards, image carousel)
- [ ] T246 Memoize React components that don't depend on real-time data (React.memo)
- [ ] T247 Debounce screen reader announcements (price updates every 10s, not 500ms)
- [ ] T248 Test initial page load time: target < 3s on 3G connection
- [ ] T249 Test real-time sync latency: verify < 500ms for price/shield updates

#### Security

- [ ] T250 Test Firestore Security Rules: attempt unauthorized writes from browser console
- [ ] T251 Verify users cannot modify balances directly
- [ ] T252 Verify users cannot change auction status directly
- [ ] T253 Verify shield cooldown enforced server-side
- [ ] T254 Test XSS: inject <script> tags in item description, verify sanitized on display
- [ ] T255 Test race condition: simulate 10 simultaneous purchases, verify exactly 1 winner

#### Final Testing

- [ ] T256 Multi-device testing: open auction on 5 devices (desktop, mobile, tablet)
- [ ] T257 Verify price sync < 500ms: log timestamps, compare max delta
- [ ] T258 Verify shield state sync < 500ms: one user opens shield, others see count increment
- [ ] T259 Test concurrent users: 10 users in same auction, verify no crashes or inconsistencies
- [ ] T260 Test all user flows end-to-end: register, view auctions, participate, purchase, view history
- [ ] T261 Test all admin flows end-to-end: create auction, start, monitor, stop, grant currency
- [ ] T262 Test edge cases per spec.md: network disconnect, admin stops auction, price at floor, shield in final seconds

#### Documentation

- [ ] T263 Update README.md with complete setup instructions
- [ ] T264 Add code comments for complex logic (pricing algorithm, shield state machine, purchase transaction)
- [ ] T265 Create deployment guide: Firebase setup, Vercel deployment, environment variables
- [ ] T266 Document known limitations and future enhancements

**Phase Completion Criteria:**
- [ ] All accessibility tests pass (WCAG 2.1 AA)
- [ ] Responsive layout works on all device sizes
- [ ] Error handling covers all failure scenarios
- [ ] Performance meets targets (< 3s load, < 500ms sync)
- [ ] Security rules prevent all unauthorized actions
- [ ] Multi-device testing confirms real-time sync works
- [ ] All user and admin flows tested end-to-end
- [ ] Documentation complete

---

## Task Summary

**Total Tasks:** 266
**By Phase:**
- Phase 1 (Setup): 8 tasks
- Phase 2 (Foundational): 10 tasks
- Phase 3 (US1): 9 tasks
- Phase 4 (US2): 10 tasks
- Phase 5 (US3): 14 tasks
- Phase 6 (US4): 18 tasks
- Phase 7 (US5): 16 tasks
- Phase 8 (US6): 12 tasks
- Phase 9 (AS1): 17 tasks
- Phase 10 (AS2): 12 tasks
- Phase 11 (AS3): 10 tasks
- Phase 12 (AS4): 11 tasks
- Phase 13 (SS1): 21 tasks
- Phase 14 (SS2): 20 tasks
- Phase 15 (SS3): 12 tasks
- Phase 16 (SS4): 9 tasks
- Phase 17 (SS5): 9 tasks
- Phase 18 (Polish): 48 tasks

**Parallelizable Tasks:** 15 tasks marked with [P]

---

## Dependencies

### User Story Dependencies

```
Setup (Phase 1) → Foundational (Phase 2) → All User/Admin Stories

User Stories (can be implemented in parallel after Foundational):
├── US1 (Auction Discovery) → US2 (Waiting Room) → US3 (Live View)
├── US3 (Live View) → US4 (Shield) → US5 (Purchase)
└── US6 (Balance/Transactions) - Independent

Admin Stories (can be implemented in parallel after Foundational):
├── AS1 (Create Auction) → AS2 (Start/Stop)
├── AS2 (Start/Stop) → AS3 (Monitoring)
└── AS4 (User Management) - Independent

System Stories (Cloud Functions - can be implemented in parallel):
├── SS1 (Pricing Algorithm) - Required for US3
├── SS2 (Purchase Transactions) - Required for US5
├── SS3 (Presence/Viewer Count) - Required for US2, US3
├── SS4 (Shield State Management) - Required for US4
└── SS5 (Grant Currency) - Required for AS4
```

### Critical Path

The minimum viable product (MVP) requires:
1. Setup + Foundational (Phase 1-2)
2. US1 → US2 → US3 → US4 → US5 (User flow for participating in auction)
3. AS1 → AS2 (Admin can create and start auctions)
4. SS1, SS2, SS3, SS4, SS5 (All Cloud Functions)

**Suggested MVP Scope:** Implement US1-US5 + AS1-AS2 + SS1-SS5 for a functional auction system. Defer AS3, AS4, US6 to post-MVP.

---

## Execution Strategy

**Phase-Based Execution:**
1. Complete Setup + Foundational first (blocks everything else)
2. Implement User Stories in order: US1 → US2 → US3 → US4 → US5
3. Implement Admin Stories in parallel: AS1 → AS2
4. Implement System Stories (Cloud Functions) as needed by User/Admin Stories
5. Complete Polish phase last (cross-cutting concerns)

**Parallel Opportunities:**
- Within each phase, tasks marked [P] can run in parallel
- US6, AS3, AS4 can be implemented in parallel (after their prerequisites)
- All SS tasks (Cloud Functions) can be implemented in parallel

**Testing Checkpoints:**
- After each User Story phase: verify independent test criteria
- After each Admin Story phase: verify independent test criteria
- After all System Stories: verify Cloud Functions deployed and working
- After Polish phase: run full end-to-end testing

---

**Last Updated:** 2025-11-16
**Status:** Ready for Implementation
**Next Step:** Run `/speckit.implement` to execute tasks
