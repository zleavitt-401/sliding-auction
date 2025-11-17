# Remaining Implementation Guide

This document outlines the implementation steps for Phases 15, 16, and 18 of the Sliding Auction Platform.

**Status:** Phases 6-14 and 17 have been fully implemented. This guide covers the remaining work.

---

## Phase 15: Presence & Viewer Count (Cloud Functions)

**Goal:** Track online users and sync viewer count to Firestore

### Current State
- Client-side presence tracking is partially implemented in `usePresence.js`
- Users already write to Realtime Database `/presence/{auctionId}/live/{userId}`
- `onDisconnect()` cleanup is already configured

### Implementation Steps

#### 1. Verify usePresence Hook (T189-T191)
Check `public/js/hooks/usePresence.js` to ensure it:
- Writes `{ online: true, timestamp: ServerValue.TIMESTAMP }` to RTDB
- Sets `onDisconnect()` handler to remove presence
- Updates presence on component mount

#### 2. Create syncViewerCount Cloud Function (T192-T194)

Create `functions/syncViewerCount.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const rtdb = admin.database();

/**
 * Syncs viewer count from Realtime Database to Firestore
 * Triggered when /auctionViewerCounts/{auctionId} updates
 */
exports.syncViewerCount = functions.database
  .ref('/auctionViewerCounts/{auctionId}')
  .onUpdate(async (change, context) => {
    const auctionId = context.params.auctionId;
    const count = change.after.val() || 0;

    console.log(`[syncViewerCount] Syncing count ${count} for auction ${auctionId}`);

    try {
      await db.collection('auctions').doc(auctionId).update({
        viewerCount: count,
        lastViewerUpdate: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[syncViewerCount] Successfully synced viewer count`);
    } catch (error) {
      console.error(`[syncViewerCount] Error:`, error);
    }
  });
```

#### 3. Create aggregatePresence Cloud Function (T195-T197)

Create `functions/aggregatePresence.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const rtdb = admin.database();

/**
 * Aggregates presence count for all live auctions every 5 seconds
 */
exports.aggregatePresence = functions.pubsub
  .schedule('every 5 seconds')
  .onRun(async (context) => {
    console.log('[aggregatePresence] Starting presence aggregation...');

    try {
      // Get all live auctions
      const auctionsSnapshot = await db.collection('auctions')
        .where('status', '==', 'live')
        .get();

      if (auctionsSnapshot.empty) {
        console.log('[aggregatePresence] No live auctions');
        return null;
      }

      const updates = [];

      // For each auction, count presence
      for (const auctionDoc of auctionsSnapshot.docs) {
        const auctionId = auctionDoc.id;

        try {
          const presenceRef = rtdb.ref(`presence/${auctionId}/live`);
          const snapshot = await presenceRef.once('value');

          const count = snapshot.numChildren();

          // Write count to viewer counts
          await rtdb.ref(`auctionViewerCounts/${auctionId}`).set(count);

          console.log(`[aggregatePresence] Auction ${auctionId}: ${count} viewers`);
        } catch (error) {
          console.error(`[aggregatePresence] Error for auction ${auctionId}:`, error);
        }
      }

      console.log('[aggregatePresence] Aggregation complete');
      return null;

    } catch (error) {
      console.error('[aggregatePresence] Fatal error:', error);
      throw error;
    }
  });
```

#### 4. Update index.js

Add to `functions/index.js`:

```javascript
const syncViewerCount = require('./syncViewerCount');
const aggregatePresence = require('./aggregatePresence');

exports.syncViewerCount = syncViewerCount.syncViewerCount;
exports.aggregatePresence = aggregatePresence.aggregatePresence;
```

#### 5. Deploy and Test (T198-T200)

```bash
firebase deploy --only functions:syncViewerCount,aggregatePresence

# Test:
# 1. Open auction in 3 browser tabs
# 2. Verify viewer count shows 3 in dashboard
# 3. Close 1 tab, wait ~30 seconds
# 4. Verify viewer count shows 2
```

---

## Phase 16: Shield State Management (Cloud Functions)

**Goal:** Track open shield count and cleanup disconnected users

### Implementation Steps

#### 1. Create updateOpenShieldCount Cloud Function (T201-T203)

Create `functions/updateOpenShieldCount.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Updates open shield count for all live auctions every 5 seconds
 */
exports.updateOpenShieldCount = functions.pubsub
  .schedule('every 5 seconds')
  .onRun(async (context) => {
    console.log('[updateOpenShieldCount] Starting shield count update...');

    try {
      // Get all live auctions
      const auctionsSnapshot = await db.collection('auctions')
        .where('status', '==', 'live')
        .get();

      if (auctionsSnapshot.empty) {
        console.log('[updateOpenShieldCount] No live auctions');
        return null;
      }

      // For each auction, count open shields
      for (const auctionDoc of auctionsSnapshot.docs) {
        const auctionId = auctionDoc.id;

        try {
          const shieldsSnapshot = await db.collection('auctions')
            .doc(auctionId)
            .collection('shields')
            .where('isOpen', '==', true)
            .get();

          const count = shieldsSnapshot.size;

          await db.collection('auctions').doc(auctionId).update({
            openShieldCount: count,
            lastShieldUpdate: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`[updateOpenShieldCount] Auction ${auctionId}: ${count} open shields`);
        } catch (error) {
          console.error(`[updateOpenShieldCount] Error for auction ${auctionId}:`, error);
        }
      }

      console.log('[updateOpenShieldCount] Update complete');
      return null;

    } catch (error) {
      console.error('[updateOpenShieldCount] Fatal error:', error);
      throw error;
    }
  });
```

#### 2. Create cleanupShieldsOnDisconnect Cloud Function (T204-T206)

Create `functions/cleanupShieldsOnDisconnect.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Closes shields when user disconnects
 * Triggered when presence node is deleted
 */
exports.cleanupShieldsOnDisconnect = functions.database
  .ref('/presence/{auctionId}/live/{userId}')
  .onDelete(async (snapshot, context) => {
    const auctionId = context.params.auctionId;
    const userId = context.params.userId;

    console.log(`[cleanupShields] User ${userId} disconnected from auction ${auctionId}`);

    try {
      const shieldRef = db.collection('auctions')
        .doc(auctionId)
        .collection('shields')
        .doc(userId);

      const shieldDoc = await shieldRef.get();

      if (shieldDoc.exists && shieldDoc.data().isOpen) {
        await shieldRef.update({
          isOpen: false,
          lastClosedAt: Date.now(),
          closedReason: 'user_disconnected'
        });

        console.log(`[cleanupShields] Closed shield for user ${userId}`);
      }

    } catch (error) {
      console.error(`[cleanupShields] Error:`, error);
    }
  });
```

#### 3. Update index.js and Deploy (T207-T209)

```javascript
// In functions/index.js
const updateOpenShieldCount = require('./updateOpenShieldCount');
const cleanupShieldsOnDisconnect = require('./cleanupShieldsOnDisconnect');

exports.updateOpenShieldCount = updateOpenShieldCount.updateOpenShieldCount;
exports.cleanupShieldsOnDisconnect = cleanupShieldsOnDisconnect.cleanupShieldsOnDisconnect;
```

Deploy:
```bash
firebase deploy --only functions:updateOpenShieldCount,cleanupShieldsOnDisconnect
```

---

## Phase 18: Polish & Cross-Cutting Concerns

This phase covers accessibility, responsive design, error handling, performance, and security improvements.

### Accessibility (WCAG 2.1 AA) - T219-T230

#### Semantic HTML (T219)
Update all pages to use semantic elements:
```html
<main role="main">
  <nav aria-label="Main navigation">...</nav>
  <section aria-labelledby="auction-heading">
    <h2 id="auction-heading">Live Auctions</h2>
    ...
  </section>
</main>
```

#### ARIA Labels (T220-T222)
Add to interactive elements:
```javascript
// In ShieldButton.js
<button
  aria-label={
    shieldState === 'open'
      ? `Shield open for ${timeRemaining} seconds`
      : shieldState === 'cooldown'
      ? `Shield on cooldown for ${timeRemaining} seconds`
      : 'Open shield to enable purchase'
  }
  aria-live="polite"
>
```

Add to price display:
```javascript
// In AuctionView.js
<div
  className="price-display"
  aria-live="polite"
  aria-atomic="true"
  // Update only every 10 seconds to avoid screen reader spam
>
  ${formatPrice(currentPrice)}
</div>
```

#### Keyboard Navigation (T223)
Ensure all interactive elements are keyboard accessible:
- Tab order follows logical flow
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys navigate lists

Example modal keyboard handling:
```javascript
// In modal components
useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleEscape);
    // Trap focus within modal
    const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea');
    firstFocusable?.focus();
  }

  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

#### Focus Indicators (T224)
Add to `global.css`:
```css
/* Visible focus indicators */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

#### Color Contrast (T225)
Verify all text meets WCAG AA (4.5:1 for normal text, 3:1 for large text):
- Use Chrome DevTools Lighthouse audit
- Check critical text: prices, buttons, error messages
- Adjust colors if needed

#### Reduced Motion (T226)
Add to global.css:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Testing (T227-T230)
1. **Screen Reader**: Test with VoiceOver (Mac) or NVDA (Windows)
   - Verify all content is readable
   - Check navigation makes sense
   - Ensure dynamic updates are announced

2. **Keyboard Only**: Unplug mouse and navigate entire app
   - Can you complete a full auction flow?
   - Are all features accessible?

3. **axe DevTools**: Install browser extension and run scan
   - Fix all critical and serious issues
   - Document and plan fixes for moderate issues

4. **Lighthouse**: Run accessibility audit
   - Target 95+ score
   - Address all flagged issues

### Responsive Design - T231-T236

#### Mobile (< 768px) - T231
- Stack layout vertically
- Touch-friendly buttons (min 44x44px)
- Larger tap targets for shield
- Single-column transaction table (use cards)

#### Tablet (768-1023px) - T232
- 2-column layout for auction lists
- Maintain touch-friendly sizes
- Adjust admin panel tabs for smaller screens

#### Desktop (>= 1024px) - T233
- 3-column layout for live auction view
- Full table displays
- Optimal spacing and typography

#### 200% Zoom (T234)
Test at browser zoom levels up to 200%:
- Layout should not break
- Content should not overflow
- Scrolling should work properly

#### Device Testing (T235)
Test on real devices:
- iPhone (Safari): Verify touch interactions, modal behavior
- Android (Chrome): Verify real-time updates, notifications
- iPad: Verify tablet layout, split-screen support

#### Viewport Meta Tag (T236)
Verify in all HTML files:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### Error Handling - T237-T245

#### Network Disconnection (T237-T238)
Add to `app.js`:
```javascript
// Detect online/offline
window.addEventListener('online', () => {
  console.log('[Network] Back online');
  showNotification('Connection restored', 'success');
  reestablishListeners();
});

window.addEventListener('offline', () => {
  console.log('[Network] Offline');
  showNotification('Connection lost. Retrying...', 'warning');
});

function reestablishListeners() {
  // Re-setup Firestore listeners
  // Client-side listeners auto-reconnect, but verify state
}
```

Add connection indicator to header:
```javascript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Show banner when offline
{!isOnline && (
  <div className="offline-banner">
    ⚠️ No internet connection. Reconnecting...
  </div>
)}
```

#### Firestore Error Handling (T239-T241)
Wrap all Firestore operations:
```javascript
try {
  const docRef = await addDoc(collection(db, 'auctions'), data);
} catch (error) {
  if (error.code === 'permission-denied') {
    showError('You do not have permission to perform this action');
  } else if (error.code === 'unavailable') {
    showError('Service temporarily unavailable. Please try again.');
  } else {
    showError('An error occurred. Please try again later.');
  }
  console.error('Firestore error:', error);
}
```

#### Cloud Function Error Handling (T242-T243)
```javascript
try {
  const result = await purchaseFunction({ auctionId, expectedPrice });
} catch (error) {
  // Firebase Functions errors have .code and .message
  if (error.code === 'failed-precondition') {
    showError(error.message); // User-friendly message from function
  } else if (error.code === 'unauthenticated') {
    showError('Please log in to continue');
    redirectToLogin();
  } else {
    showError('Purchase failed. Please try again.');
  }
  console.error('Purchase error:', error);
}
```

#### Form Validation (T244-T245)
Add comprehensive validation to all forms:
```javascript
// Example: AuctionForm validation
const validateForm = () => {
  const errors = {};

  if (!itemName || itemName.trim().length < 3) {
    errors.itemName = 'Item name must be at least 3 characters';
  }

  if (startingPrice < floorPrice) {
    errors.startingPrice = 'Starting price must be greater than floor price';
  }

  if (images.length === 0) {
    errors.images = 'At least one image is required';
  }

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### Performance - T246-T252

#### Image Optimization (T246-T247)
- Already implemented: Canvas resizing to 200x200 (thumbnail) and 1200px (full)
- Add lazy loading:
```html
<img src={thumbnailUrl} loading="lazy" alt={itemName} />
```

#### Code Splitting (T248)
Since we're using CDN-based React (no webpack), code splitting is limited. Consider:
- Lazy load admin components only when needed
- Use dynamic imports for heavy libraries

#### Firestore Query Optimization (T249-T250)
- Create composite indexes for common queries
- Already defined in `firestore.indexes.json`
- Monitor query performance in Firebase Console

#### Debounce/Throttle (T251)
Add to frequently updating UI:
```javascript
// Debounce price updates for screen readers
const [debouncedPrice, setDebouncedPrice] = useState(currentPrice);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedPrice(currentPrice);
  }, 10000); // Update aria-live price every 10 seconds

  return () => clearTimeout(timer);
}, [currentPrice]);
```

#### Bundle Size (T252)
Monitor CDN script sizes:
- React UMD: ~140KB (gzipped)
- Firebase SDKs: ~200KB total (gzipped)
- Keep total < 500KB for good mobile performance

### Security - T253-T258

#### Firestore Security Rules (T253-T254)
Already implemented in `firestore.rules`. Verify:
- Users can only read/write their own data
- Shields have 5-second cooldown enforcement
- Admins have elevated permissions
- Sensitive fields are protected

Test rules:
```bash
firebase emulators:start --only firestore
# Run test suite against rules
```

#### Input Sanitization (T255)
Add to all user inputs:
```javascript
const sanitizeInput = (input) => {
  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '');
};

const sanitizedName = sanitizeInput(itemName);
```

#### XSS Prevention (T256)
React automatically escapes content, but be careful with:
- `dangerouslySetInnerHTML` (avoid if possible)
- User-generated URLs (validate before using)
- External data sources

#### HTTPS Only (T257)
Firebase Hosting enforces HTTPS by default. Verify in `firebase.json`:
```json
{
  "hosting": {
    "headers": [{
      "source": "**",
      "headers": [{
        "key": "Strict-Transport-Security",
        "value": "max-age=31536000; includeSubDomains"
      }]
    }]
  }
}
```

#### Rate Limiting (T258)
Consider adding to Cloud Functions:
```javascript
// Using firebase-functions v2
const {onCall} = require('firebase-functions/v2/https');

exports.purchaseAuction = onCall({
  rateLimit: {
    maxConcurrentExecutions: 100,
    maxConcurrentPerUser: 5
  }
}, async (request) => {
  // Function logic
});
```

### Testing - T259-T266

#### Unit Tests
Create tests for utility functions:
```javascript
// tests/formatters.test.js
import { formatPrice, formatDuration } from '../public/js/utils/formatters.js';

describe('formatPrice', () => {
  test('formats cents to dollars', () => {
    expect(formatPrice(10000)).toBe('$100.00');
  });
});
```

#### Integration Tests
Test critical flows:
1. User registration → grant currency → view auctions
2. Create auction → start auction → price updates
3. Open shield → purchase → verify winner

#### End-to-End Tests
Consider using Playwright or Cypress:
```javascript
// Example Cypress test
describe('Purchase Flow', () => {
  it('allows user to purchase auction with shield', () => {
    cy.visit('/auction.html?id=test-auction');
    cy.get('[data-testid="shield-button"]').click();
    cy.wait(5000); // Shield opens
    cy.get('[data-testid="purchase-button"]').click();
    cy.get('[data-testid="success-modal"]').should('be.visible');
  });
});
```

#### Performance Testing
Use Lighthouse:
```bash
npx lighthouse http://localhost:5000 --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Documentation - T267-T269

#### README Updates
Ensure README.md includes:
- Complete setup instructions
- Environment variables
- Deployment steps
- Architecture overview
- API documentation

#### Code Comments
Add JSDoc comments to all functions:
```javascript
/**
 * Purchases an auction with shield protection
 * @param {string} auctionId - The auction ID
 * @param {number} expectedPrice - Expected price in cents
 * @returns {Promise<Object>} Purchase result with finalPrice, transactionId
 * @throws {Error} If shield not open, insufficient balance, or auction ended
 */
async function purchaseAuction(auctionId, expectedPrice) {
  // Implementation
}
```

#### Deployment Guide
Already created in `DEPLOYMENT.md`. Ensure it's complete and tested.

---

## Summary of Remaining Work

### Fully Implemented
- ✅ Phases 6-14: All client-side features, admin panel, pricing algorithm, purchase validation
- ✅ Phase 17: Grant currency Cloud Function

### Requires Implementation
- ⚠️ Phase 15: Presence aggregation Cloud Functions (2 functions)
- ⚠️ Phase 16: Shield management Cloud Functions (2 functions)
- ⚠️ Phase 18: Polish & testing (30+ tasks)

### Estimated Effort
- Phase 15: 2-3 hours
- Phase 16: 2-3 hours
- Phase 18: 8-12 hours (accessibility, testing, polish)

**Total: ~15-20 hours** to complete remaining work

### Priority Order
1. **Phase 18 - Critical items**: Error handling, security validation, basic accessibility
2. **Phase 15**: Viewer count aggregation (improves UX)
3. **Phase 16**: Shield cleanup (prevents stale data)
4. **Phase 18 - Polish**: Full accessibility audit, comprehensive testing, performance optimization

---

## Next Steps

1. **Deploy Existing Functions**
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   firebase deploy --only firestore,storage,hosting
   ```

2. **Test Core Functionality**
   - Create test auction
   - Grant currency to test users
   - Test purchase flow end-to-end

3. **Implement Phase 15 & 16 Functions**
   - Follow guides above
   - Test with real users

4. **Complete Phase 18 Priorities**
   - Start with critical security/error handling
   - Add basic accessibility features
   - Run Lighthouse audit
   - Fix critical issues

5. **Production Readiness**
   - Set up monitoring and alerts
   - Configure proper admin authentication
   - Review and tighten security rules
   - Load test with multiple concurrent users
