/**
 * Main application initialization
 * Handles Firebase setup, authentication state, and app bootstrapping
 */

// Firebase SDK v9 modular imports from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import {
  getFirestore,
  connectFirestoreEmulator
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import {
  getAuth,
  onAuthStateChanged,
  connectAuthEmulator
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import {
  getStorage,
  connectStorageEmulator
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
import {
  getDatabase,
  connectDatabaseEmulator
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Import Firebase configuration
import { firebaseConfig } from '../firebase-config.js';

// Import utilities
import { getErrorMessage } from './utils/firestore.js';
import { formatPrice } from './utils/formatters.js';

/**
 * Initialize Firebase services
 * @returns {Object} Firebase app and service instances
 */
function initializeFirebase() {
  console.log('[App] Initializing Firebase...');

  try {
    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    console.log('[App] Firebase app initialized');

    // Initialize Firestore
    const db = getFirestore(app);
    console.log('[App] Firestore initialized');

    // Initialize Authentication
    const auth = getAuth(app);
    console.log('[App] Authentication initialized');

    // Initialize Storage
    const storage = getStorage(app);
    console.log('[App] Storage initialized');

    // Initialize Realtime Database (for presence detection)
    const rtdb = getDatabase(app);
    console.log('[App] Realtime Database initialized');

    // Connect to emulators if in development (optional)
    // Uncomment these lines if you want to use Firebase emulators
    // const useEmulators = window.location.hostname === 'localhost';
    // if (useEmulators) {
    //   console.log('[App] Connecting to Firebase emulators...');
    //   connectFirestoreEmulator(db, 'localhost', 8080);
    //   connectAuthEmulator(auth, 'http://localhost:9099');
    //   connectStorageEmulator(storage, 'localhost', 9199);
    //   connectDatabaseEmulator(rtdb, 'localhost', 9000);
    // }

    return { app, db, auth, storage, rtdb };
  } catch (error) {
    console.error('[App] Firebase initialization error:', error);
    throw error;
  }
}

/**
 * Set up authentication state listener
 * @param {Object} auth - Firebase Auth instance
 */
function setupAuthListener(auth, db) {
  console.log('[App] Setting up auth state listener...');

  onAuthStateChanged(auth, async (user) => {
    const userInfoElement = document.getElementById('user-info');

    // Clean up previous listener if exists
    if (window.balanceUnsubscribe) {
      window.balanceUnsubscribe();
      window.balanceUnsubscribe = null;
    }

    if (user) {
      console.log('[App] User authenticated:', user.email);

      // T082: Set up real-time balance listener
      try {
        const { doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
        const userDocRef = doc(db, 'users', user.uid);

        // Listen to user document for real-time balance updates
        const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
          const balance = snapshot.exists() ? snapshot.data().balance || 0 : 0;

          // Update balance display in header
          const balanceElement = document.getElementById('user-balance');
          if (balanceElement) {
            balanceElement.textContent = formatPrice(balance);
          } else if (userInfoElement) {
            // Initial render of user info
            userInfoElement.innerHTML = `
              <div class="user-info-container">
                <button class="user-balance" id="user-balance" aria-label="View transaction history">
                  ${formatPrice(balance)}
                </button>
                <span class="user-email">${user.email}</span>
                <button id="logout-btn" class="btn-secondary">Logout</button>
              </div>
            `;

            // T089: Make balance clickable to open transaction history
            document.getElementById('user-balance').addEventListener('click', () => {
              console.log('[App] Opening transaction history modal');
              // Dispatch event that React components can listen to
              window.dispatchEvent(new CustomEvent('show-transaction-history', {
                detail: { userId: user.uid, balance }
              }));
            });

            // Attach logout handler
            document.getElementById('logout-btn').addEventListener('click', async () => {
              try {
                const { signOut } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js');
                await signOut(auth);
                console.log('[App] User signed out');
                window.location.href = '/login.html';
              } catch (error) {
                console.error('[App] Logout error:', error);
                alert(getErrorMessage(error));
              }
            });
          }

          console.log('[App] Balance updated:', formatPrice(balance));
        }, (error) => {
          console.error('[App] Error listening to user data:', error);
        });

        // Store unsubscribe function for cleanup
        window.balanceUnsubscribe = unsubscribe;

        // Store user ID globally for convenience
        window.currentUser = user;
        window.currentUserId = user.uid;

        // Dispatch custom event for components that need to react to auth state
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { user }
        }));

      } catch (error) {
        console.error('[App] Error setting up user listener:', error);

        if (userInfoElement) {
          userInfoElement.innerHTML = `
            <div class="user-info-container">
              <span class="user-balance">$0.00</span>
              <span class="user-email">${user.email}</span>
              <button id="logout-btn" class="btn-secondary">Logout</button>
            </div>
          `;
        }
      }

    } else {
      console.log('[App] No user authenticated');

      // Clear global user references
      window.currentUser = null;
      window.currentUserId = null;

      // Redirect to login if not on public pages
      const publicPages = ['/login.html', '/register.html'];
      const currentPage = window.location.pathname;

      if (!publicPages.includes(currentPage)) {
        console.log('[App] Redirecting to login...');
        window.location.href = '/login.html';
      }

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { user: null, balance: 0 }
      }));
    }
  });
}

/**
 * Initialize the application
 */
async function initApp() {
  console.log('[App] Starting application...');

  try {
    // Initialize Firebase
    const { app, db, auth, storage, rtdb } = initializeFirebase();

    // Make Firebase instances available globally
    window.firebaseApp = app;
    window.db = db;
    window.auth = auth;
    window.storage = storage;
    window.rtdb = rtdb;

    console.log('[App] Firebase instances available globally (window.db, window.auth, etc.)');

    // Set up authentication listener
    setupAuthListener(auth, db);

    console.log('[App] Application initialized successfully');

  } catch (error) {
    console.error('[App] Application initialization failed:', error);

    // Display error to user
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div class="error">
          <h2>Initialization Error</h2>
          <p>${getErrorMessage(error)}</p>
          <p>Please check the console for more details.</p>
        </div>
      `;
    }
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for use in other modules if needed
export { initApp };
