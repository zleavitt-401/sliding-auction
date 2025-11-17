# Quickstart Guide: Sliding Auction Platform

**Version:** 1.0
**Date:** 2025-11-16
**Estimated Setup Time:** 30 minutes

This guide walks you through setting up a local development environment for the Sliding Auction Platform.

---

## Prerequisites

Before you begin, ensure you have:

- **Modern web browser:** Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Firebase account:** Free tier (Spark plan) is sufficient for development
- **Git:** For version control
- **Text editor:** VS Code, Sublime Text, or any code editor
- **Optional:** Node.js 18+ (only if using Cloud Functions locally with Firebase emulator)

**No build tools required!** This project uses vanilla JavaScript and CDN-loaded libraries.

---

## Step 1: Clone the Repository

```bash
# Clone the repo
git clone https://github.com/your-username/sliding-auction.git
cd sliding-auction

# Create .gitignore to prevent committing secrets
cat > .gitignore << EOF
# Firebase config (API keys)
public/firebase-config.js

# Environment variables
.env
.env.local

# Firebase cache
.firebase/

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Logs
*.log
EOF
```

---

## Step 2: Create Firebase Project

### 2.1 Create Project in Firebase Console

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Enter project name: `sliding-auction-mvp` (or your choice)
4. Disable Google Analytics (not needed for MVP)
5. Click **"Create project"**

### 2.2 Enable Required Services

**Firestore Database:**
1. In Firebase console, navigate to **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (we'll add security rules later)
4. Choose location: `us-central` (or closest to you)
5. Click **"Enable"**

**Realtime Database:**
1. Navigate to **"Realtime Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"**
4. Same location as Firestore
5. Click **"Enable"**

**Authentication:**
1. Navigate to **"Authentication"**
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. Enable **"Email/Password"** (not Email link)
5. Click **"Save"**

**Storage:**
1. Navigate to **"Storage"**
2. Click **"Get started"**
3. Accept default security rules
4. Same location as Firestore/Realtime DB
5. Click **"Done"**

---

## Step 3: Get Firebase Configuration

1. In Firebase console, click the gear icon ⚙️ → **"Project settings"**
2. Scroll down to **"Your apps"** section
3. Click **</> (Web)** icon to add a web app
4. Enter app nickname: `Sliding Auction Web`
5. **Do NOT check** "Also set up Firebase Hosting" (we'll use Vercel)
6. Click **"Register app"**
7. Copy the Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "sliding-auction-mvp.firebaseapp.com",
  projectId: "sliding-auction-mvp",
  storageBucket: "sliding-auction-mvp.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

8. Create `public/firebase-config.js` and paste config:

```javascript
// public/firebase-config.js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Important:** This file is gitignored. Never commit API keys to public repos.

---

## Step 4: Project Structure

Create the following directory structure:

```
sliding-auction/
├── public/
│   ├── index.html                 # Homepage (auction list)
│   ├── auction.html               # Auction detail page
│   ├── admin.html                 # Admin panel
│   ├── firebase-config.js         # Firebase config (gitignored)
│   ├── css/
│   │   ├── global.css             # Global styles
│   │   ├── auction.css            # Auction page styles
│   │   └── admin.css              # Admin panel styles
│   └── js/
│       ├── app.js                 # Main app initialization
│       ├── components/
│       │   ├── AuctionCard.js     # Auction card component
│       │   ├── PriceGraph.js      # Chart.js price graph
│       │   ├── ShieldButton.js    # Shield control component
│       │   └── AdminDashboard.js  # Admin monitoring
│       ├── hooks/
│       │   ├── useAuction.js      # Auction state hook
│       │   ├── useAuth.js         # Auth state hook
│       │   └── useShield.js       # Shield state hook
│       └── utils/
│           ├── firestore.js       # Firestore helpers
│           └── formatters.js      # Date/price formatters
├── functions/                     # Cloud Functions (Node.js)
│   ├── index.js                   # Function exports
│   ├── updateAuctionPrice.js      # Pricing algorithm
│   ├── purchaseAuction.js         # Purchase transaction
│   └── package.json               # Cloud Functions dependencies
├── .gitignore
└── README.md
```

Create directories:

```bash
mkdir -p public/{css,js/{components,hooks,utils}}
mkdir functions
```

---

## Step 5: Create index.html

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sliding Auction - Live Auctions</title>
  <link rel="stylesheet" href="/css/global.css">
</head>
<body>
  <header>
    <h1>Sliding Auction</h1>
    <div id="user-info"></div>
  </header>

  <main id="root">
    <div class="loading">Loading auctions...</div>
  </main>

  <!-- React 18 via CDN -->
  <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>

  <!-- Firebase SDK (v9 modular) -->
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
    import { getFirestore, collection, query, where, orderBy, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
    import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
    import { firebaseConfig } from './firebase-config.js';

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Make available globally
    window.firebaseApp = app;
    window.db = db;
    window.auth = auth;

    console.log('Firebase initialized successfully!');

    // Listen to auth state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User logged in:', user.email);
        document.getElementById('user-info').innerHTML = `
          <span>Balance: $0.00</span>
          <button id="logout-btn">Logout</button>
        `;
      } else {
        console.log('No user logged in');
        window.location.href = '/login.html';
      }
    });
  </script>

  <!-- HTM for JSX syntax -->
  <script type="module">
    import htm from 'https://unpkg.com/htm@3.1.1/dist/htm.mjs';
    const html = htm.bind(React.createElement);
    window.html = html;

    // Simple auction list component
    function AuctionList() {
      const [auctions, setAuctions] = React.useState([]);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const q = query(
          collection(window.db, 'auctions'),
          where('status', '==', 'live'),
          orderBy('startTime', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const auctionData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAuctions(auctionData);
          setLoading(false);
        });

        return () => unsubscribe();
      }, []);

      if (loading) {
        return html`<div class="loading">Loading auctions...</div>`;
      }

      if (auctions.length === 0) {
        return html`<div class="empty-state">No active auctions right now. Check back soon!</div>`;
      }

      return html`
        <div class="auction-list">
          ${auctions.map(auction => html`
            <div class="auction-card" key=${auction.id}>
              <img src=${auction.images.thumbnails[0]} alt=${auction.itemName} />
              <h3>${auction.itemName}</h3>
              <p class="price">$${(auction.currentPrice / 100).toFixed(2)}</p>
              <a href="/auction.html?id=${auction.id}" class="btn-primary">View Auction</a>
            </div>
          `)}
        </div>
      `;
    }

    // Render app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(html`<${AuctionList} />`);
  </script>
</body>
</html>
```

---

## Step 6: Deploy Firestore Security Rules

1. Install Firebase CLI (if using Cloud Functions):

```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- **Firestore** (rules and indexes)
- **Realtime Database** (rules)
- **Functions** (JavaScript)
- **Storage** (rules)

2. Copy security rules from `.speckit/artifacts/contracts/firestore.rules` to `firestore.rules`

3. Deploy rules:

```bash
firebase deploy --only firestore:rules
```

---

## Step 7: Run Locally

Since this is a static site (no build step), you can use any local web server:

**Option 1: Python (simplest):**
```bash
cd public
python3 -m http.server 8000
# Open http://localhost:8000
```

**Option 2: VS Code Live Server:**
1. Install "Live Server" extension
2. Right-click `public/index.html` → "Open with Live Server"

**Option 3: Firebase Hosting (emulator):**
```bash
firebase emulators:start --only hosting
# Open http://localhost:5000
```

---

## Step 8: Deploy to Vercel

### 8.1 Install Vercel CLI (optional)

```bash
npm install -g vercel
```

### 8.2 Deploy

```bash
cd public
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name? sliding-auction
# - Directory? ./
# - Override build settings? No
```

### 8.3 Add Environment Variables (if needed)

In Vercel dashboard:
1. Go to project settings → Environment Variables
2. Add `FIREBASE_API_KEY`, etc. (though public config is fine for web)

### 8.4 Automatic Deployments

Connect GitHub repo in Vercel dashboard:
1. Import Git Repository
2. Select `sliding-auction` repo
3. Set root directory to `public/`
4. Deploy

Now every push to `main` branch automatically deploys!

---

## Step 9: Set Up Cloud Functions (Optional for MVP)

If you want to run Cloud Functions locally:

```bash
cd functions
npm install

# Install dependencies
npm install firebase-admin firebase-functions

# Create index.js
cat > index.js << EOF
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.updateAuctionPrice = functions.pubsub
  .schedule('every 1 seconds')
  .onRun(async (context) => {
    console.log('Updating auction prices...');
    // TODO: Implement pricing algorithm
    return null;
  });

exports.purchaseAuction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  console.log('Purchase request:', data);
  // TODO: Implement purchase logic
  return { success: true };
});
EOF

# Run emulator
firebase emulators:start --only functions
```

Deploy to production:

```bash
firebase deploy --only functions
```

---

## Step 10: Create Test Data

### 10.1 Create Admin User

1. Go to Firebase console → Authentication
2. Click **"Add user"**
3. Email: `admin@example.com`
4. Password: `admin123` (change in production!)
5. Click **"Add user"**

### 10.2 Create Test Auction (via Firestore Console)

1. Go to Firestore Database
2. Click **"Start collection"**: `auctions`
3. Document ID: (auto-generate)
4. Add fields:

```json
{
  "itemName": "Test Auction Item",
  "itemDescription": "<p>This is a test auction for development.</p>",
  "images": {
    "full": ["https://via.placeholder.com/1200"],
    "thumbnails": ["https://via.placeholder.com/200"]
  },
  "startingPrice": 10000,
  "floorPrice": 5000,
  "currentPrice": 10000,
  "duration": 900,
  "pricingMode": "transparent",
  "pricingConfig": {
    "formula": "linear",
    "decayRate": 10
  },
  "status": "scheduled",
  "viewerCount": 0,
  "openShieldCount": 0,
  "startTime": null,
  "endTime": null,
  "winner": null,
  "finalPrice": null,
  "floorReachedAt": null,
  "createdAt": (use Firestore timestamp),
  "createdBy": "admin"
}
```

5. Click **"Save"**

---

## Step 11: Test the Application

### 11.1 Login

1. Open http://localhost:8000 (or your Vercel URL)
2. You should be redirected to login page
3. Login with `admin@example.com` / `admin123`

### 11.2 View Auctions

1. Homepage should show "No active auctions" (status is "scheduled")
2. Change auction status to "live" in Firestore console
3. Refresh homepage → auction should appear

### 11.3 Test Real-Time Updates

1. Open auction detail page
2. In another browser tab, open Firestore console
3. Manually change `currentPrice` to 9000
4. Auction page should update automatically (within 500ms)

---

## Troubleshooting

### "Firebase is not defined"

- Check that `firebase-config.js` exists in `public/`
- Verify CDN URLs are loading (check browser Console → Network tab)

### "Permission denied" errors

- Firestore Security Rules may be too restrictive
- Check rules allow `read: if request.auth != null;`
- Verify user is logged in (check `auth.currentUser` in console)

### Auctions not appearing

- Check Firestore console: Does `/auctions` collection exist?
- Check query: `where('status', '==', 'live')` matches auction status
- Check browser console for errors

### Real-time updates not working

- Verify Firestore listener is attached (check console logs)
- Check network tab: Should see WebSocket connection to Firestore
- Try refreshing page (listener may have disconnected)

---

## Next Steps

Now that you have a basic setup:

1. **Build out components:** Create `AuctionCard.js`, `PriceGraph.js`, `ShieldButton.js`
2. **Implement pricing algorithm:** Complete `updateAuctionPrice` Cloud Function
3. **Implement purchase flow:** Complete `purchaseAuction` Cloud Function
4. **Add admin panel:** Build admin UI in `admin.html`
5. **Style the app:** Create comprehensive CSS (see spec for design system)
6. **Test multi-device:** Open auction on phone + desktop simultaneously

---

## Useful Commands

```bash
# Start local dev server
python3 -m http.server 8000  # From public/ directory

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy to Vercel
vercel  # From public/ directory

# View Firebase logs
firebase functions:log

# Open Firestore console
open https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore

# Open Vercel dashboard
vercel open
```

---

## Resources

- **Firebase Docs:** https://firebase.google.com/docs
- **Firestore Queries:** https://firebase.google.com/docs/firestore/query-data/queries
- **React Hooks:** https://react.dev/reference/react
- **Chart.js Docs:** https://www.chartjs.org/docs/latest/
- **HTM Docs:** https://github.com/developit/htm

---

**Setup complete!** You're ready to start building. 🚀

For detailed implementation guidance, see:
- `.speckit/spec.md` - Feature specification
- `.speckit/plan.md` - Implementation plan
- `.speckit/artifacts/data-model.md` - Database schema
