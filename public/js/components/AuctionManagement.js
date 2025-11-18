/**
 * AuctionManagement Component
 * Admin interface for starting and stopping auctions
 */

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import { formatPrice, formatTimestamp } from '../utils/formatters.js';

const { useState, useEffect } = React;

/**
 * Auction management component
 * @returns {JSX.Element} Auction management interface
 */
export function AuctionManagement() {
  const [scheduledAuctions, setScheduledAuctions] = useState([]);
  const [liveAuctions, setLiveAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // T116: Fetch and listen to scheduled auctions
  useEffect(() => {
    if (!window.db) return;

    const scheduledQuery = query(
      collection(window.db, 'auctions'),
      where('status', '==', 'scheduled'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      scheduledQuery,
      (snapshot) => {
        const auctions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setScheduledAuctions(auctions);
        setLoading(false);
      },
      (err) => {
        console.error('[AuctionManagement] Error fetching scheduled auctions:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // T120: Fetch and listen to live auctions
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
      },
      (err) => {
        console.error('[AuctionManagement] Error fetching live auctions:', err);
        setError(err.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // T117: Show start confirmation modal
  const handleStartClick = (auction) => {
    console.log('[AuctionManagement] Start button clicked for auction:', auction.id);
    console.log('[AuctionManagement] Before state change - showStartModal:', showStartModal);
    setSelectedAuction(auction);
    setShowStartModal(true);
    console.log('[AuctionManagement] After setState calls');
    // Log on next render
    setTimeout(() => {
      console.log('[AuctionManagement] After render - showStartModal should be true');
    }, 100);
  };

  // T118-T119: Start auction
  const handleConfirmStart = async () => {
    if (!selectedAuction || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const auctionRef = doc(window.db, 'auctions', selectedAuction.id);

      // Update auction status to live
      await updateDoc(auctionRef, {
        status: 'live',
        startTime: serverTimestamp(),
        // Calculate end time based on duration
        endTime: new Date(Date.now() + (selectedAuction.duration * 1000))
      });

      console.log('[AuctionManagement] Auction started:', selectedAuction.id);

      // T124: Show success message
      alert(`Auction "${selectedAuction.itemName}" started successfully!`);

      // Close modal
      setShowStartModal(false);
      setSelectedAuction(null);

    } catch (err) {
      console.error('[AuctionManagement] Error starting auction:', err);
      setError(`Failed to start auction: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // T121: Show stop confirmation modal
  const handleStopClick = (auction) => {
    setSelectedAuction(auction);
    setShowStopModal(true);
  };

  // T122-T123: Stop auction
  const handleConfirmStop = async () => {
    if (!selectedAuction || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const auctionRef = doc(window.db, 'auctions', selectedAuction.id);

      // Update auction status to ended - admin stopped
      await updateDoc(auctionRef, {
        status: 'ended - admin stopped',
        endTime: serverTimestamp()
      });

      console.log('[AuctionManagement] Auction stopped:', selectedAuction.id);

      // T124: Show success message
      alert(`Auction "${selectedAuction.itemName}" stopped successfully!`);

      // Close modal
      setShowStopModal(false);
      setSelectedAuction(null);

    } catch (err) {
      console.error('[AuctionManagement] Error stopping auction:', err);
      setError(`Failed to stop auction: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return html`
      <div class="auction-management">
        <div class="loading">Loading auctions...</div>
      </div>
    `;
  }

  console.log('[AuctionManagement] Render - showStartModal:', showStartModal, 'selectedAuction:', selectedAuction?.id);

  return html`
    <div class="auction-management">
      <h2 class="auction-management__title">Manage Auctions</h2>

      ${error && html`
        <div class="alert alert--error">
          ${error}
        </div>
      `}

      <!-- Scheduled Auctions Section -->
      <div class="auction-section">
        <h3 class="auction-section__title">
          📅 Scheduled Auctions
          <span class="auction-section__count">(${scheduledAuctions.length})</span>
        </h3>

        ${scheduledAuctions.length === 0 ? html`
          <div class="auction-empty">
            <p>No scheduled auctions. Create a new auction to get started.</p>
          </div>
        ` : html`
          <div class="auction-grid">
            ${scheduledAuctions.map(auction => html`
              <div key=${auction.id} class="auction-card">
                <div class="auction-card__header">
                  <h4 class="auction-card__title">${auction.itemName}</h4>
                  <span class="auction-card__badge auction-card__badge--scheduled">
                    Scheduled
                  </span>
                </div>

                <div class="auction-card__body">
                  <div class="auction-card__detail">
                    <strong>Price Range:</strong>
                    ${formatPrice(auction.floorPrice)} - ${formatPrice(auction.startingPrice)}
                  </div>
                  <div class="auction-card__detail">
                    <strong>Duration:</strong>
                    ${Math.floor(auction.duration / 60)} minutes
                  </div>
                  <div class="auction-card__detail">
                    <strong>Mode:</strong>
                    ${auction.pricingMode === 'transparent' ? 'Transparent' : 'Algorithmic'}
                  </div>
                  <div class="auction-card__detail">
                    <strong>Created:</strong>
                    ${auction.createdAt ? formatTimestamp(auction.createdAt) : 'Just now'}
                  </div>
                </div>

                <div class="auction-card__actions">
                  <button
                    class="btn-primary"
                    onClick=${() => handleStartClick(auction)}
                  >
                    ▶️ Start Auction
                  </button>
                  <a
                    href="/auction.html?id=${auction.id}"
                    class="btn-secondary"
                    target="_blank"
                  >
                    👁 Preview
                  </a>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>

      <!-- Live Auctions Section -->
      <div class="auction-section">
        <h3 class="auction-section__title">
          🔴 Live Auctions
          <span class="auction-section__count">(${liveAuctions.length})</span>
        </h3>

        ${liveAuctions.length === 0 ? html`
          <div class="auction-empty">
            <p>No live auctions. Start a scheduled auction to see it here.</p>
          </div>
        ` : html`
          <div class="auction-grid">
            ${liveAuctions.map(auction => html`
              <div key=${auction.id} class="auction-card auction-card--live">
                <div class="auction-card__header">
                  <h4 class="auction-card__title">${auction.itemName}</h4>
                  <span class="auction-card__badge auction-card__badge--live">
                    🔴 Live
                  </span>
                </div>

                <div class="auction-card__body">
                  <div class="auction-card__detail">
                    <strong>Current Price:</strong>
                    <span class="auction-card__price">${formatPrice(auction.currentPrice)}</span>
                  </div>
                  <div class="auction-card__detail">
                    <strong>Viewers:</strong>
                    ${auction.viewerCount || 0}
                  </div>
                  <div class="auction-card__detail">
                    <strong>Open Shields:</strong>
                    ${auction.openShieldCount || 0}
                  </div>
                  <div class="auction-card__detail">
                    <strong>Started:</strong>
                    ${auction.startTime ? formatTimestamp(auction.startTime) : 'Just now'}
                  </div>
                </div>

                <div class="auction-card__actions">
                  <button
                    class="btn-danger"
                    onClick=${() => handleStopClick(auction)}
                  >
                    ⏹ Stop Auction
                  </button>
                  <a
                    href="/auction.html?id=${auction.id}"
                    class="btn-secondary"
                    target="_blank"
                  >
                    👁 View Live
                  </a>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>

      <!-- Start Confirmation Modal -->
      ${showStartModal && selectedAuction && html`
        <div class="modal-overlay" onClick=${() => setShowStartModal(false)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal__header">
              <h2 class="modal__title">
                <span class="modal__icon">▶️</span>
                Start Auction
              </h2>
              <button
                class="modal__close"
                onClick=${() => setShowStartModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div class="modal__body">
              <p>Are you sure you want to start this auction?</p>

              <div class="auction-confirm-details">
                <h4>${selectedAuction.itemName}</h4>
                <ul>
                  <li><strong>Starting Price:</strong> ${formatPrice(selectedAuction.startingPrice)}</li>
                  <li><strong>Floor Price:</strong> ${formatPrice(selectedAuction.floorPrice)}</li>
                  <li><strong>Duration:</strong> ${Math.floor(selectedAuction.duration / 60)} minutes</li>
                </ul>
              </div>

              <div class="alert alert--warning">
                ⚠️ Once started, all users will be able to view and participate in this auction.
              </div>
            </div>

            <div class="modal__footer">
              <button
                class="btn-secondary"
                onClick=${() => setShowStartModal(false)}
                disabled=${isProcessing}
              >
                Cancel
              </button>
              <button
                class="btn-primary"
                onClick=${handleConfirmStart}
                disabled=${isProcessing}
              >
                ${isProcessing ? 'Starting...' : 'Start Auction'}
              </button>
            </div>
          </div>
        </div>
      `}

      <!-- Stop Confirmation Modal -->
      ${showStopModal && selectedAuction && html`
        <div class="modal-overlay" onClick=${() => setShowStopModal(false)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal__header">
              <h2 class="modal__title">
                <span class="modal__icon">⏹</span>
                Stop Auction
              </h2>
              <button
                class="modal__close"
                onClick=${() => setShowStopModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div class="modal__body">
              <p>Are you sure you want to stop this auction?</p>

              <div class="auction-confirm-details">
                <h4>${selectedAuction.itemName}</h4>
                <ul>
                  <li><strong>Current Price:</strong> ${formatPrice(selectedAuction.currentPrice)}</li>
                  <li><strong>Viewers:</strong> ${selectedAuction.viewerCount || 0}</li>
                  <li><strong>Open Shields:</strong> ${selectedAuction.openShieldCount || 0}</li>
                </ul>
              </div>

              <div class="alert alert--error">
                ⚠️ <strong>Warning:</strong> Stopping the auction will immediately end it for all users.
                Open shields will be closed and no purchases can be made.
              </div>
            </div>

            <div class="modal__footer">
              <button
                class="btn-secondary"
                onClick=${() => setShowStopModal(false)}
                disabled=${isProcessing}
              >
                Cancel
              </button>
              <button
                class="btn-danger"
                onClick=${handleConfirmStop}
                disabled=${isProcessing}
              >
                ${isProcessing ? 'Stopping...' : 'Stop Auction'}
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
