# Sliding Auction Platform

A real-time descending price auction platform built with a zero-build architecture. Watch as prices slide down in real-time, deploy shields to protect your purchase window, and compete for rare items with fictional currency.

## Key Features

- **Real-Time Descending Auctions**: Prices automatically decrease over time with multiple pricing algorithms (linear, exponential, stepped)
- **Shield Mechanism**: Deploy shields to secure a 5-second purchase window with strategic cooldown mechanics
- **Live Synchronization**: Sub-500ms updates across all connected clients using Firestore real-time listeners
- **Admin Panel**: Full auction management, user oversight, and real-time monitoring dashboard
- **Mobile-First Design**: Responsive UI optimized for touch interactions and small screens
- **Zero-Build Architecture**: No webpack, no npm build step - just edit and refresh

## Tech Stack

This project follows a zero-build philosophy for rapid development:

- **Frontend**: React 18 (UMD via CDN), HTM for JSX-like syntax, ES6 modules
- **Backend**: Firebase (Firestore, Authentication, Storage, Cloud Functions)
- **Styling**: Vanilla CSS with CSS variables and mobile-first responsive design
- **Charts**: Chart.js 4.x for price history visualization
- **Deployment**: Vercel for static hosting, Firebase for backend services

No bundlers, no transpilers, no build step. Just open `public/index.html` in a browser and start coding.

## Quick Start

**Estimated setup time: 30 minutes**

For detailed setup instructions, see [.speckit/artifacts/quickstart.md](.speckit/artifacts/quickstart.md)

### Prerequisites

- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Firebase account (free Spark plan)
- Git
- Text editor (VS Code recommended)
- Optional: Node.js 18+ (only for Cloud Functions)

### Basic Setup

1. **Clone and configure**:
   ```bash
   git clone https://github.com/your-username/sliding-auction.git
   cd sliding-auction
   ```

2. **Create Firebase project**:
   - Go to https://console.firebase.google.com/
   - Create new project
   - Enable Firestore, Authentication (Email/Password), Storage, and Realtime Database

3. **Add Firebase config**:
   ```bash
   cp public/firebase-config.js.template public/firebase-config.js
   # Edit public/firebase-config.js with your Firebase project credentials
   ```

4. **Run locally**:
   ```bash
   cd public
   python3 -m http.server 8000
   # Open http://localhost:8000
   ```

5. **Deploy**:
   ```bash
   vercel  # Deploy to production
   ```

See [quickstart.md](.speckit/artifacts/quickstart.md) for complete step-by-step instructions.

## Project Structure

```
sliding-auction/
├── public/                          # Static web files (served by Vercel)
│   ├── index.html                   # Main auction list page
│   ├── auction.html                 # Auction detail page (coming soon)
│   ├── admin.html                   # Admin panel (coming soon)
│   ├── firebase-config.js           # Firebase config (gitignored)
│   ├── firebase-config.js.template  # Config template
│   ├── css/
│   │   └── global.css               # Design system and global styles
│   └── js/
│       ├── app.js                   # App initialization (coming soon)
│       ├── components/              # React components
│       ├── hooks/                   # Custom React hooks
│       └── utils/
│           ├── firestore.js         # Firestore helper functions
│           └── formatters.js        # Price/date/time formatters
├── functions/                       # Cloud Functions (Node.js)
│   ├── index.js                     # Function exports (coming soon)
│   ├── updateAuctionPrice.js        # Pricing algorithm (coming soon)
│   └── purchaseAuction.js           # Purchase transaction (coming soon)
├── .speckit/
│   ├── constitution.md              # Project principles
│   ├── spec.md                      # Feature specification
│   ├── plan.md                      # Implementation plan
│   ├── tasks.md                     # Task breakdown (266 tasks)
│   └── artifacts/
│       ├── quickstart.md            # Setup guide
│       ├── data-model.md            # Database schema
│       ├── research.md              # Technical research
│       └── contracts/
│           ├── firestore.rules      # Security rules
│           └── cloud-functions-api.yaml  # API specification
├── .gitignore
└── README.md                        # This file
```

## Documentation

- **[Quickstart Guide](.speckit/artifacts/quickstart.md)**: Step-by-step setup (30 minutes)
- **[Feature Specification](.speckit/spec.md)**: Complete feature documentation
- **[Implementation Plan](.speckit/plan.md)**: Architecture and technical decisions
- **[Data Model](.speckit/artifacts/data-model.md)**: Firestore schema and indexes
- **[Tasks](.speckit/tasks.md)**: 266 implementation tasks across 18 phases
- **[Constitution](.speckit/constitution.md)**: 10 core project principles

## Development Workflow

### Local Development

```bash
# Start local server (from public/ directory)
python3 -m http.server 8000

# Or use VS Code Live Server extension
# Right-click public/index.html -> "Open with Live Server"
```

### Firebase

```bash
# Install Firebase CLI (one-time setup)
npm install -g firebase-tools
firebase login
firebase init

# Deploy Security Rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions

# View logs
firebase functions:log
```

### Deployment

```bash
# Deploy to Vercel (from project root)
cd public
vercel

# Automatic deployments via GitHub integration
# Push to main branch -> auto-deploy to production
```

## Key Principles

This project follows 10 core principles (see [constitution.md](.speckit/constitution.md)):

1. **Zero-Build Simplicity**: No webpack, no npm scripts, no transpilation
2. **Real-Time First**: Sub-500ms synchronization across all clients
3. **Server-Authoritative Truth**: Critical logic runs on Cloud Functions
4. **Transparent UX**: Users see exactly what's happening (no hidden timers)
5. **Mobile-First Design**: Touch-friendly, responsive, works on any device
6. **Accessible by Default**: WCAG 2.1 AA compliance from day one
7. **Graceful Failure Handling**: Network issues don't break the experience
8. **Security & Data Integrity**: Firestore Security Rules enforce all business logic
9. **Version Control Discipline**: Clear git history, no secrets in repo
10. **Testing in Real Conditions**: Multi-device, real Firebase, realistic latency

## Current Status

**Phase 1: Setup - Complete ✓**

- [x] Directory structure created
- [x] .gitignore configured
- [x] Firebase config template created
- [x] Global CSS design system implemented
- [x] Utility functions (formatters, Firestore helpers)
- [x] README.md

**Next: Phase 2 - Foundational** (Firebase initialization, authentication, Security Rules)

See [tasks.md](.speckit/tasks.md) for complete task breakdown.

## Contributing

This is currently a solo project following a structured implementation plan. See [tasks.md](.speckit/tasks.md) for the roadmap.

## License

MIT License - see LICENSE file for details

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Hooks Reference](https://react.dev/reference/react)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [HTM (Hyperscript Tagged Markup)](https://github.com/developit/htm)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)

---

**Ready to start?** See [quickstart.md](.speckit/artifacts/quickstart.md) for detailed setup instructions.
