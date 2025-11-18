# Firebase Troubleshooting Guide

A comprehensive guide to common Firebase issues encountered during deployment and development, with solutions and prevention strategies.

---

## Table of Contents

1. [Initial Setup & Deployment](#initial-setup--deployment)
2. [Firestore Security Rules Issues](#firestore-security-rules-issues)
3. [Storage Security Rules Issues](#storage-security-rules-issues)
4. [Realtime Database Security Rules Issues](#realtime-database-security-rules-issues)
5. [Cloud Functions Issues](#cloud-functions-issues)
6. [React & Frontend Issues](#react--frontend-issues)
7. [Prevention Checklist](#prevention-checklist)

---

## Initial Setup & Deployment

### Problem: "Firebase CLI not found"
**Error:** `command not found: firebase`

**Solution:**
```bash
npm install -g firebase-tools
firebase --version  # Verify installation
```

**Prevention:** Always verify Firebase CLI is installed before starting Firebase projects.

---

### Problem: "Not logged in to Firebase"
**Error:** `Failed to authenticate, have you run firebase login?`

**Solution:**
```bash
firebase login
# Opens browser for authentication
# Follow prompts to log in
```

**Note:** In non-interactive environments (like CI/CD), use `firebase login:ci` to generate a token.

---

### Problem: "Realtime Database instance not created"
**Error:** `It looks like you haven't created a Realtime Database instance`

**Solution:**
1. Go to Firebase Console → Build → Realtime Database
2. Click "Create Database"
3. Choose location (same as Firestore for consistency)
4. Select security mode (start in locked mode)
5. Click "Enable"

**Prevention:** Create all required Firebase services (Firestore, Realtime Database, Storage, Authentication) before deploying.

---

### Problem: "Storage not set up"
**Error:** `Firebase Storage has not been set up on project`

**Solution:**
1. Go to Firebase Console → Build → Storage
2. Click "Get Started"
3. Choose security mode
4. Select same location as other services
5. Click "Done"

**Prevention:** Enable all services through Firebase Console UI before first deployment.

---

## Firestore Security Rules Issues

### Problem: "Missing or insufficient permissions" when creating documents
**Error:** `FirebaseError: Missing or insufficient permissions`

**Root Cause:** Security rules require fields that aren't being sent, or field validation is too strict.

**Diagnostic Steps:**
1. Add logging to see exactly what data is being sent:
```javascript
console.log('[Component] Data being sent:', JSON.stringify(data, null, 2));
```

2. Check Firestore Rules tab in Firebase Console for which rule failed

3. Common mismatches:
   - Field name mismatch (e.g., `description` vs `itemDescription`)
   - Missing required fields
   - Wrong data types
   - Field structure mismatch (e.g., empty array `[]` vs object with arrays)

**Solution Example:**
```javascript
// ❌ WRONG - Rules expect 'itemDescription', code sends 'description'
const data = {
  itemName: "Item",
  description: "Desc",  // Wrong field name
  images: []
};

// ✅ CORRECT - Field names match rules
const data = {
  itemName: "Item",
  itemDescription: "Desc",  // Matches rules
  images: []
};
```

**Prevention:**
1. Keep a reference document listing all required fields
2. Use TypeScript or JSDoc for type safety
3. Test with Firebase Emulator before deploying rules
4. Add detailed comments in security rules explaining requirements

---

### Problem: "Images validation failing on creation"
**Error:** Permission denied when creating auction with empty images array

**Root Cause:** Rules expected images structure `{full: [], thumbnails: []}` but code sent `[]`

**Solution:**
```javascript
// In firestore.rules - Allow list type instead of specific structure
allow create: if request.resource.data.images is list;  // ✅ Flexible

// Instead of:
allow create: if request.resource.data.images.full.size() >= 1;  // ❌ Too strict
```

**Pattern:** When fields are populated after creation, allow flexible types on create and enforce structure on update.

---

### Problem: "Update blocked by status transition rules"
**Error:** Permission denied when updating auction that stays in same status

**Root Cause:** Rules only allowed status changes (scheduled→live), not same-status updates (scheduled→scheduled)

**Solution:**
```javascript
// ✅ Allow same-status updates for image uploads
allow update: if
  (resource.data.status == 'scheduled' && request.resource.data.status == 'scheduled')
  || (resource.data.status == 'scheduled' && request.resource.data.status == 'live')
  || ...
```

**Prevention:** Design rules to allow same-status updates when certain fields change (like images, metadata).

---

## Storage Security Rules Issues

### Problem: "User does not have permission to access storage"
**Error:** `Firebase Storage: User does not have permission to access 'auctions/...'`

**Root Cause:** Storage rules required admin custom claim: `request.auth.token.admin == true`

**Solution:**
```javascript
// storage.rules
match /auctions/{auctionId}/{allPaths=**} {
  allow read: if true;
  // ❌ TOO STRICT - requires custom claim
  // allow write: if request.auth.token.admin == true;

  // ✅ MVP SOLUTION - any authenticated user
  allow write: if request.auth != null;
}
```

**Production Fix:** Set up Firebase Admin SDK to add custom claims:
```javascript
// Cloud Function or Admin SDK
await admin.auth().setCustomUserClaims(userId, { admin: true });
```

**Prevention:** Start with flexible rules for MVP, tighten for production. Document which rules need custom claims.

---

## Realtime Database Security Rules Issues

### Problem: "Permission denied at /auctionPresence/"
**Error:** `permission_denied at /auctionPresence/{auctionId}`

**Root Cause:** Path mismatch - code used `/auctionPresence/` but rules defined `/presence/`

**Solution:**
```json
// database.rules.json
{
  "rules": {
    // ✅ Match the path your code actually uses
    "auctionPresence": {
      "$auctionId": {
        "$userId": {
          ".read": true,
          ".write": "auth != null && $userId === auth.uid"
        }
      }
    }
  }
}
```

**Prevention:**
1. Search codebase for all RTDB paths: `grep -r "ref(.*rtdb" public/`
2. Document paths in a central location
3. Use constants for paths: `const PRESENCE_PATH = 'auctionPresence';`

---

### Problem: "Validation rules blocking writes"
**Error:** Permission denied even with write permission

**Root Cause:** `.validate` rules were too strict about data structure

**Solution:**
```json
// ❌ TOO STRICT - requires exact structure
".validate": "newData.hasChildren(['online', 'timestamp'])"

// ✅ FLEXIBLE - just check auth
".write": "auth != null && $userId === auth.uid"
// Remove overly strict validation for MVP
```

**Prevention:** Start with simple auth rules, add validation incrementally as needed.

---

## Cloud Functions Issues

### Problem: "Node.js 18 decommissioned"
**Error:** `Runtime Node.js 18 was decommissioned on 2025-10-30`

**Solution:**
```json
// functions/package.json
{
  "engines": {
    "node": "20"  // Update to supported version
  }
}
```

**Check supported versions:** https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version

**Prevention:** Subscribe to Firebase release notes, update Node versions proactively.

---

### Problem: "Schedule syntax invalid"
**Error:** `The provided schedule or timezone are invalid`

**Root Cause:** Cloud Scheduler doesn't support intervals less than 1 minute

**Solution:**
```javascript
// ❌ INVALID - too frequent
exports.myFunction = functions.pubsub
  .schedule('every 5 seconds')

// ✅ VALID - minimum 1 minute
exports.myFunction = functions.pubsub
  .schedule('every 1 minutes')
```

**Valid formats:**
- `every 1 minutes`
- `every 5 minutes`
- `0 0 * * *` (cron syntax)
- `*/15 * * * *` (every 15 minutes)

**Prevention:** Use cron syntax validator, check Cloud Scheduler docs for limits.

---

### Problem: "Functions deployed but schedules failed"
**Error:** `Failed to create scheduler job ... HTTP Error: 400`

**Diagnosis:**
```bash
firebase functions:list  # Check which functions deployed
firebase functions:log   # Check for errors
```

**Solution:** Fix schedule syntax and redeploy:
```bash
firebase deploy --only functions
```

---

## React & Frontend Issues

### Problem: "React error #62 - Maximum update depth exceeded"
**Error:** `Minified React error #62`

**Root Cause:** useEffect calling setState without proper dependencies, creating infinite loop

**Example Problem:**
```javascript
// ❌ INFINITE LOOP
const [price, setPrice] = useState(0);

useEffect(() => {
  setPrice(auction.currentPrice);  // Missing dependency!
}, [auction.currentPrice]);  // setPrice causes re-render → infinite loop
```

**Solution:**
```javascript
// ✅ CORRECT - Include all dependencies
useEffect(() => {
  if (previousPrice !== auction.currentPrice) {
    setPrice(auction.currentPrice);
  }
}, [auction.currentPrice, previousPrice]);  // All dependencies listed
```

**Prevention:**
1. Enable ESLint React Hooks plugin
2. Always include all dependencies in useEffect
3. Use `useCallback` and `useMemo` for complex dependencies

---

### Problem: "Modal renders but is invisible"
**Error:** No error, but modal doesn't appear visually

**Root Cause:** CSS not loaded - modal HTML renders but has no styles

**Diagnosis:**
```javascript
// Add logging to verify state
console.log('showModal:', showModal);  // Check if true

// Check DOM
// Open DevTools → Elements → Search for "modal-overlay"
// If found but invisible, CSS is missing
```

**Solution:**
```css
/* Ensure modal CSS is in the correct file */
/* admin.html needs modal CSS in admin.css, not auction.css */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 9999;
  /* ... */
}
```

**Prevention:**
1. Keep shared styles in global.css
2. Import all necessary CSS files in HTML
3. Test modals on every page they're used

---

### Problem: "Price inputs restricted to multiples of 100"
**Error:** Can't enter prices ending in other digits

**Root Cause:** HTML input `step` attribute set incorrectly for dollar amounts

**Solution:**
```html
<!-- ❌ WRONG - step=100 for cents, but user enters dollars -->
<input type="number" step="100" placeholder="10000" />

<!-- ✅ CORRECT - step=0.01 for dollar cents -->
<input type="number" step="0.01" placeholder="100.00" />
```

```javascript
// Convert dollars to cents before saving
const priceInCents = parsePriceToCents(userInputDollars);
```

**Prevention:** Always consider the unit users see vs. unit you store. Add conversion utilities.

---

## Prevention Checklist

### Before Deploying to Firebase

- [ ] All Firebase services enabled in Console (Firestore, RTDB, Storage, Auth)
- [ ] Firebase CLI installed and logged in
- [ ] `firebase.json` configured correctly
- [ ] All security rules files exist: `firestore.rules`, `storage.rules`, `database.rules.json`
- [ ] Node.js version in `functions/package.json` is supported
- [ ] Cloud Function schedules use valid syntax (>= 1 minute)
- [ ] Test with Firebase Emulators locally first

### Code Quality Checks

- [ ] Add debug logging before all Firebase operations
- [ ] Log exact data being sent to Firestore/Storage/RTDB
- [ ] Use constants for collection/path names
- [ ] Include all dependencies in React useEffect
- [ ] Verify CSS is loaded on all pages using components
- [ ] Test security rules with different user roles
- [ ] Handle all Firebase error codes gracefully

### Security Rules Best Practices

- [ ] Start permissive for MVP (authenticated users), tighten for production
- [ ] Document all required fields in rules with comments
- [ ] Allow flexible types on create, enforce structure on update
- [ ] Test rules with Firebase Emulator
- [ ] Keep client-side and server-side field names consistent
- [ ] Use TypeScript or JSDoc to enforce data shapes

### Debugging Workflow

1. **Check browser console** - Look for red errors
2. **Add detailed logging** - Log data before Firebase calls
3. **Check Firebase Console** - Look at Firestore/RTDB/Storage tabs for actual data
4. **Check security rules** - Rules Playground in Firebase Console
5. **Check Cloud Function logs** - `firebase functions:log`
6. **Use Firebase Emulator** - Test locally before deploying
7. **Deploy incrementally** - Deploy one service at a time to isolate issues

---

## Common Error Messages & Quick Fixes

| Error | Quick Fix |
|-------|-----------|
| `Missing or insufficient permissions` | Check field names match rules exactly |
| `command not found: firebase` | Run `npm install -g firebase-tools` |
| `permission_denied` (RTDB) | Verify path in code matches path in rules |
| `unauthorized` (Storage) | Check auth and rules: `allow write: if request.auth != null` |
| `Node.js X decommissioned` | Update `engines.node` in `functions/package.json` |
| `schedule or timezone invalid` | Use `every 1 minutes` or cron syntax |
| `React error #62` | Add missing dependencies to `useEffect` |
| `Firebase Storage has not been set up` | Enable Storage in Firebase Console |
| `Modal not showing` | Check CSS is loaded, verify state with `console.log` |

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules Reference](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Cloud Functions Cron Syntax](https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules)
- [React Hooks Rules](https://react.dev/reference/react/hooks#rules-of-hooks)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## Version History

- **v1.0** - Initial guide based on sliding-auction platform deployment (Nov 2025)
- Covers Firebase 9.22.0, Cloud Functions Gen 1, Node.js 20

---

## Contributing to This Guide

When encountering new Firebase issues:

1. Document the error message exactly
2. Note what data was being sent (use console.log)
3. Document the root cause
4. Provide the solution with code examples
5. Add prevention strategy
6. Update this guide
