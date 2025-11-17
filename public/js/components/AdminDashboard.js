/**
 * AdminDashboard Component
 * Real-time monitoring dashboard for live auctions
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import {
  ref as rtdbRef,
  onValue,
  off
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

import { formatPrice, formatDuration } from '../utils/formatters.js';
import { useAuction, getAuctionTimeRemaining, getAuctionProgress } from '../hooks/useAuction.js';
import { PriceGraph } from './PriceGraph.js';

const { useState, useEffect } = React;

/**
 * Admin dashboard component
 * @returns {JSX.Element} Admin monitoring dashboard
 */
export function AdminDashboard() {
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [selectedAuctionId, setSelectedAuctionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch live auctions for selection
  useEffect(() => {
    if (!window.db) return;

    const liveQuery = query(
      collection(window.db, 'auctions'),
      where('status', '==', 'live'),
      orderBy('startTime', 'desc')
    );

    const unsubscribe = onSnapshot(
      liveQuery,
      (snapshot) => {
        const auctions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setLiveAuctions(auctions);

        // Auto-select first auction if none selected
        if (!selectedAuctionId && auctions.length > 0) {
          setSelectedAuctionId(auctions[0].id);
        }

        setLoading(false);
      },
      (err) => {
        console.error('[AdminDashboard] Error fetching live auctions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedAuctionId]);

  if (loading) {
    return html`
      <div class="admin-dashboard">
        <div class="loading">Loading dashboard...</div>
      </div>
    `;
  }

  if (liveAuctions.length === 0) {
    return html`
      <div class="admin-dashboard">
        <div class="dashboard-empty">
          <h2>No Live Auctions</h2>
          <p>Start an auction to see real-time monitoring data.</p>
          <a href="/admin.html" class="btn-primary">Go to Manage Auctions</a>
        </div>
      </div>
    `;
  }

  const selectedAuction = liveAuctions.find(a => a.id === selectedAuctionId);

  return html`
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h2 class="dashboard-title">Live Auction Monitor</h2>

        ${liveAuctions.length > 1 && html`
          <div class="auction-selector">
            <label for="auction-select">Select Auction:</label>
            <select
              id="auction-select"
              class="form-select"
              value=${selectedAuctionId}
              onChange=${(e) => setSelectedAuctionId(e.target.value)}
            >
              ${liveAuctions.map(auction => html`
                <option key=${auction.id} value=${auction.id}>
                  ${auction.itemName}
                </option>
              `)}
            </select>
          </div>
        `}
      </div>

      ${error && html`
        <div class="alert alert--error">${error}</div>
      `}

      ${selectedAuction && html`
        <${AuctionMonitor} auction=${selectedAuction} />
      `}
    </div>
  `;
}

/**
 * Individual auction monitor component
 * @param {Object} props - Component props
 * @param {Object} props.auction - Auction to monitor
 * @returns {JSX.Element} Auction monitor
 */
function AuctionMonitor({ auction: initialAuction }) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [algorithmLog, setAlgorithmLog] = useState([]);

  // T128-T131: Get real-time auction data and price history
  const { auction, priceHistory } = useAuction(initialAuction.id);
  const currentAuction = auction || initialAuction;

  // T129: Update timer
  useEffect(() => {
    if (!currentAuction) return;

    const updateTimer = () => {
      const remaining = getAuctionTimeRemaining(currentAuction);
      const currentProgress = getAuctionProgress(currentAuction);

      // Calculate elapsed time
      if (currentAuction.startTime) {
        const startMs = currentAuction.startTime.toMillis ?
          currentAuction.startTime.toMillis() : currentAuction.startTime;
        const elapsed = Math.floor((Date.now() - startMs) / 1000);
        setTimeElapsed(elapsed);
      }

      setTimeRemaining(remaining);
      setProgress(currentProgress);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentAuction]);

  // T134: Listen to connected users (presence)
  useEffect(() => {
    if (!window.rtdb || !currentAuction?.id) return;

    const presenceRef = rtdbRef(window.rtdb, `presence/${currentAuction.id}/live`);

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const users = [];
      snapshot.forEach((childSnapshot) => {
        users.push({
          userId: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      setConnectedUsers(users);
    });

    return () => off(presenceRef, 'value', unsubscribe);
  }, [currentAuction?.id]);

  // T132-T133: Fetch algorithm decision log
  useEffect(() => {
    if (!window.db || !currentAuction?.id) return;

    const fetchAlgorithmLog = async () => {
      try {
        const logRef = collection(window.db, 'auctions', currentAuction.id, 'algorithmLog');
        const logQuery = query(
          logRef,
          orderBy('timestamp', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(logQuery);
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setAlgorithmLog(logs);
      } catch (err) {
        console.error('[AuctionMonitor] Error fetching algorithm log:', err);
      }
    };

    // Fetch initially
    fetchAlgorithmLog();

    // Refresh every 5 seconds
    const interval = setInterval(fetchAlgorithmLog, 5000);

    return () => clearInterval(interval);
  }, [currentAuction?.id]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return html`
    <div class="auction-monitor">
      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <!-- Current Price -->
        <div class="metric-card metric-card--primary">
          <div class="metric-card__label">Current Price</div>
          <div class="metric-card__value metric-card__value--price">
            ${formatPrice(currentAuction.currentPrice)}
          </div>
          <div class="metric-card__detail">
            Floor: ${formatPrice(currentAuction.floorPrice)}
          </div>
        </div>

        <!-- Time Elapsed -->
        <div class="metric-card">
          <div class="metric-card__label">Time Elapsed</div>
          <div class="metric-card__value">
            ${formatTime(timeElapsed)}
          </div>
          <div class="metric-card__detail">
            of ${formatDuration(currentAuction.duration)}
          </div>
        </div>

        <!-- Time Remaining -->
        <div class="metric-card">
          <div class="metric-card__label">Time Remaining</div>
          <div class="metric-card__value">
            ${formatTime(timeRemaining)}
          </div>
          <div class="metric-card__detail">
            ${progress}% complete
          </div>
        </div>

        <!-- Viewers -->
        <div class="metric-card">
          <div class="metric-card__label">👁 Viewers</div>
          <div class="metric-card__value">
            ${currentAuction.viewerCount || 0}
          </div>
          <div class="metric-card__detail">
            ${connectedUsers.length} connected
          </div>
        </div>

        <!-- Open Shields -->
        <div class="metric-card">
          <div class="metric-card__label">🛡 Open Shields</div>
          <div class="metric-card__value">
            ${currentAuction.openShieldCount || 0}
          </div>
          <div class="metric-card__detail">
            Active now
          </div>
        </div>

        <!-- Pricing Mode -->
        <div class="metric-card">
          <div class="metric-card__label">Pricing Mode</div>
          <div class="metric-card__value metric-card__value--small">
            ${currentAuction.pricingMode === 'transparent' ? '📊 Transparent' : '🤖 Algorithmic'}
          </div>
          <div class="metric-card__detail">
            ${currentAuction.pricingConfig?.formula ||
              `Decay: ${currentAuction.pricingConfig?.decayRate || 'N/A'}`}
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-content">
        <!-- Price Graph -->
        <div class="dashboard-section dashboard-section--large">
          <h3 class="dashboard-section__title">Price History</h3>
          ${priceHistory && priceHistory.length > 0 ? html`
            <${PriceGraph}
              priceHistory=${priceHistory}
              currentPrice=${currentAuction.currentPrice}
              floorPrice=${currentAuction.floorPrice}
              startingPrice=${currentAuction.startingPrice}
            />
          ` : html`
            <div class="dashboard-placeholder">
              Price history will appear as auction progresses.
            </div>
          `}
        </div>

        <!-- Connected Users -->
        <div class="dashboard-section">
          <h3 class="dashboard-section__title">Connected Users</h3>
          ${connectedUsers.length === 0 ? html`
            <div class="dashboard-placeholder">
              No users connected
            </div>
          ` : html`
            <div class="user-list">
              ${connectedUsers.map((user, index) => html`
                <div key=${user.userId} class="user-item">
                  <span class="user-item__icon">👤</span>
                  <span class="user-item__name">User ${index + 1}</span>
                  <span class="user-item__id">${user.userId.substring(0, 8)}...</span>
                </div>
              `)}
            </div>
          `}
        </div>
      </div>

      <!-- Algorithm Decision Log -->
      ${currentAuction.pricingMode === 'algorithmic' && html`
        <div class="dashboard-section">
          <h3 class="dashboard-section__title">Algorithm Decision Log</h3>
          ${algorithmLog.length === 0 ? html`
            <div class="dashboard-placeholder">
              No algorithm decisions yet. Price adjustments will appear here.
            </div>
          ` : html`
            <div class="algorithm-log">
              ${algorithmLog.map(entry => html`
                <div key=${entry.id} class="log-entry">
                  <div class="log-entry__header">
                    <span class="log-entry__time">
                      ${entry.timestamp ? new Date(entry.timestamp.toMillis()).toLocaleTimeString() : 'Now'}
                    </span>
                    <span class="log-entry__decision ${entry.decision === 'decrease' ? 'log-entry__decision--decrease' : ''}">
                      ${entry.decision === 'decrease' ? '↓' : '→'} ${entry.decision}
                    </span>
                  </div>
                  <div class="log-entry__body">
                    <div class="log-entry__reason">${entry.reason || 'Price adjustment'}</div>
                    <div class="log-entry__price">
                      ${formatPrice(entry.priceBefore || 0)} → ${formatPrice(entry.priceAfter || 0)}
                    </div>
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      `}
    </div>
  `;
}
