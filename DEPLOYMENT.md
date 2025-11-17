# Deployment Guide - Sliding Auction Platform

This guide covers deploying the Sliding Auction Platform to Firebase.

## Prerequisites

1. **Firebase Project**: Create a Firebase project at https://console.firebase.google.com
2. **Billing**: Upgrade to Blaze (pay-as-you-go) plan for Cloud Functions and Cloud Scheduler
3. **Firebase CLI**: Install globally with `npm install -g firebase-tools`
4. **Node.js**: Version 18 or higher

## Initial Setup

### 1. Firebase CLI Login

```bash
firebase login
```

### 2. Initialize Firebase Project

```bash
# Link to your Firebase project
firebase use --add

# Select your project and give it an alias (e.g., "default")
```

### 3. Enable Firebase Services

In the Firebase Console, enable:
- Authentication (Email/Password provider)
- Firestore Database
- Realtime Database
- Cloud Storage
- Cloud Functions
- Cloud Scheduler (requires Blaze plan)

## Deployment Steps

### 1. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore
```

### 2. Deploy Realtime Database Rules

```bash
firebase deploy --only database
```

### 3. Deploy Storage Rules

```bash
firebase deploy --only storage
```

### 4. Deploy Cloud Functions

```bash
# Install function dependencies (if not already done)
cd functions
npm install
cd ..

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:updateAuctionPrice
```

### 5. Set Up Cloud Scheduler

The `updateAuctionPrice` function needs to run every 1 second. Set this up via:

**Option A: Firebase Console**
1. Go to Cloud Scheduler in Google Cloud Console
2. Find the job created for `updateAuctionPrice`
3. Edit the schedule to `every 1 seconds`
4. Save

**Option B: gcloud CLI**

```bash
gcloud scheduler jobs update pubsub updateAuctionPrice \
  --schedule="every 1 seconds" \
  --location=us-central1
```

### 6. Deploy Hosting (optional)

```bash
firebase deploy --only hosting
```

## Testing Cloud Functions Locally

### 1. Start Firebase Emulators

```bash
firebase emulators:start
```

This will start:
- Firestore Emulator on port 8080
- Functions Emulator on port 5001
- Auth Emulator on port 9099
- Hosting Emulator on port 5000
- Emulator UI on port 4000

### 2. Run Functions in Emulator

The pricing algorithm will run automatically every 1 second in the emulator.

### 3. Test Specific Functions

```bash
# In another terminal
firebase functions:shell

# Then call functions:
> updateAuctionPrice()
```

## Environment Configuration

### Set Firebase Config in Client

Update `public/js/config/firebase.js` with your Firebase project credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Cloud Function Costs

**updateAuctionPrice** runs every 1 second:
- Invocations: 86,400 per day (60 * 60 * 24)
- With free tier (2M invocations/month): ~$0.05/month
- Compute time: Depends on number of live auctions

**Optimization**: Consider reducing frequency to every 2-5 seconds if costs are a concern.

## Monitoring

### View Logs

```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only updateAuctionPrice

# Follow logs in real-time
firebase functions:log --only updateAuctionPrice --follow
```

### Cloud Console

Monitor function execution, errors, and metrics at:
https://console.cloud.google.com/functions

## Troubleshooting

### Function Won't Deploy

- Check Node version: `node --version` (should be 18+)
- Clear cache: `rm -rf functions/node_modules && cd functions && npm install`
- Check logs: `firebase deploy --only functions --debug`

### Scheduler Not Triggering

- Verify billing is enabled (Blaze plan required)
- Check scheduler status in Cloud Console
- Verify timezone and schedule syntax

### Functions Timing Out

- Increase timeout in function config (default 60s)
- Optimize database queries
- Use batch writes for multiple updates

## Security

### Admin Authentication

The client-side admin auth is currently a simple password check (MVP).

**Production TODO**: Implement proper admin authentication:
1. Set custom claims for admin users
2. Use Firebase Admin SDK to set claims
3. Update security rules to check `request.auth.token.admin == true`

### Set Admin Claim (Server-Side Only)

```javascript
// Using Firebase Admin SDK (Node.js)
admin.auth().setCustomUserClaims(uid, { admin: true });
```

## Next Steps

After deployment:

1. **Test End-to-End**:
   - Create test auction as admin
   - Verify price updates every second
   - Test purchase flow
   - Test balance updates

2. **Monitor Performance**:
   - Check function execution times
   - Monitor Firestore read/write counts
   - Track costs in billing dashboard

3. **Optimize**:
   - Add database indexes for common queries
   - Implement caching where appropriate
   - Consider batch operations for price updates

## Support

For Firebase-specific issues:
- Documentation: https://firebase.google.com/docs
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase

For project-specific issues:
- See README.md for architecture details
- Check firestore.rules for security rule documentation
