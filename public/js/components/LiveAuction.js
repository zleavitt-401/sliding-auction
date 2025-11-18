/**
 * LiveAuction Component
 * Main live auction view with real-time price updates and graph
 */

import { formatPrice, formatDuration } from '../utils/formatters.js';
import { useAuction, getAuctionTimeRemaining, getAuctionProgress, isAuctionEndingSoon, isPriceNearFloor } from '../hooks/useAuction.js';
import { usePresence } from '../hooks/usePresence.js';
import { useUser } from '../hooks/useUser.js';
import { PriceGraph } from './PriceGraph.js';
import { ShieldButton } from './ShieldButton.js';
import { PurchaseSuccessModal } from './PurchaseSuccessModal.js';
import { ErrorModal } from './ErrorModal.js';
import { AuctionEndedModal } from './AuctionEndedModal.js';

const { useState, useEffect } = React;

/**
 * Live auction component
 * @param {Object} props - Component props
 * @param {Object} props.auction - Auction data (passed from parent for initial load)
 * @returns {JSX.Element} Live auction view
 */
export function LiveAuction({ auction: initialAuction }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previousPrice, setPreviousPrice] = useState(null);
  const [priceJustChanged, setPriceJustChanged] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEndedModal, setShowEndedModal] = useState(false);
  const [auctionEndData, setAuctionEndData] = useState(null);

  // Get real-time auction data and price history
  const { auction, priceHistory, loading, error } = useAuction(initialAuction.id);

  // Use initial auction if real-time data hasn't loaded yet
  const currentAuction = auction || initialAuction;

  // Track presence in live auction
  const { viewerCount } = usePresence(currentAuction.id, 'live');

  // Get user balance for success modal
  const { balance } = useUser();

  // Update timer every second
  useEffect(() => {
    if (!currentAuction) return;

    const updateTimer = () => {
      const remaining = getAuctionTimeRemaining(currentAuction);
      const currentProgress = getAuctionProgress(currentAuction);

      setTimeRemaining(remaining);
      setProgress(currentProgress);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentAuction]);

  // Detect price changes for animation
  useEffect(() => {
    if (!currentAuction?.currentPrice) return;

    if (previousPrice !== null && previousPrice !== currentAuction.currentPrice) {
      setPriceJustChanged(true);
      setTimeout(() => setPriceJustChanged(false), 600);
    }

    setPreviousPrice(currentAuction.currentPrice);
  }, [currentAuction?.currentPrice, previousPrice]);

  // T079-T080: Listen to auction status changes
  useEffect(() => {
    if (!currentAuction) return;

    // Check if auction ended
    if (currentAuction.status === 'ended - sold') {
      console.log('[LiveAuction] Auction ended - sold');

      // Check if current user is the winner
      const isWinner = currentAuction.winnerId === window.currentUserId;

      if (!isWinner) {
        // Another user won - show notification
        setAuctionEndData({
          itemName: currentAuction.itemName,
          finalPrice: currentAuction.currentPrice,
          winnerName: currentAuction.winnerName || 'Another user'
        });
        setShowEndedModal(true);
      }
      // If current user is winner, success modal is already shown from purchase flow
    }
  }, [currentAuction?.status, currentAuction?.winnerId]);

  if (loading && !currentAuction) {
    return html`
      <div class="live-auction-loading">
        <div class="loading">Loading auction...</div>
      </div>
    `;
  }

  if (error) {
    return html`
      <div class="error">
        <h2>Error Loading Auction</h2>
        <p>${error}</p>
      </div>
    `;
  }

  const {
    id,
    itemName,
    currentPrice,
    startingPrice,
    floorPrice,
    openShieldCount
  } = currentAuction;

  const endingSoon = isAuctionEndingSoon(currentAuction);
  const nearFloor = isPriceNearFloor(currentAuction);

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return 'Ending...';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return html`
    <div class="live-auction">
      <!-- Back Link -->
      <a href="/" class="back-link">← Back to Auctions</a>

      <!-- Header -->
      <div class="live-auction__header">
        <div class="live-auction__title-row">
          <h1 class="live-auction__title">${itemName}</h1>
          <div class="live-auction__status">
            <span class="status-badge status-badge--live">
              🔴 LIVE
            </span>
          </div>
        </div>

        <!-- Current Price (Large, Prominent) -->
        <div class="live-auction__current-price ${priceJustChanged ? 'price-updated' : ''} ${nearFloor ? 'price-near-floor' : ''}">
          <div class="current-price-label">Current Price</div>
          <div class="current-price-value">${formatPrice(currentPrice)}</div>
          <div class="current-price-range">
            Floor: ${formatPrice(floorPrice)} • Starting: ${formatPrice(startingPrice)}
          </div>
        </div>

        <!-- Time Remaining Progress Bar -->
        <div class="time-remaining-bar ${endingSoon ? 'time-remaining-bar--warning' : ''}">
          <div class="time-remaining-bar__progress" style="width: ${progress}%"></div>
          <div class="time-remaining-bar__label">
            <span class="time-remaining-bar__icon">${endingSoon ? '⚠️' : '⏱'}</span>
            <span class="time-remaining-bar__text">
              ${endingSoon ? 'ENDING SOON:' : 'Time Remaining:'} ${formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="live-auction__content">

        <!-- Left Column: Price Graph -->
        <div class="live-auction__graph-container">
          <div class="graph-section">
            <h2 class="graph-section__title">Price History</h2>
            ${priceHistory && priceHistory.length > 0
              ? html`
                <${PriceGraph}
                  priceHistory=${priceHistory}
                  currentPrice=${currentPrice}
                  floorPrice=${floorPrice}
                  startingPrice=${startingPrice}
                />
              `
              : html`
                <div class="graph-placeholder">
                  <p>Price history will appear here as the auction progresses.</p>
                </div>
              `
            }
          </div>
        </div>

        <!-- Right Column: Auction Info & Actions -->
        <div class="live-auction__sidebar">

          <!-- Stats -->
          <div class="auction-stats-card">
            <h3 class="stats-card__title">Auction Stats</h3>

            <div class="stat-item">
              <div class="stat-item__icon">👁</div>
              <div class="stat-item__content">
                <div class="stat-item__label">Viewers</div>
                <div class="stat-item__value">${viewerCount || 0}</div>
              </div>
            </div>

            ${openShieldCount > 0 && html`
              <div class="stat-item stat-item--shields">
                <div class="stat-item__icon">🛡</div>
                <div class="stat-item__content">
                  <div class="stat-item__label">Open Shields</div>
                  <div class="stat-item__value">${openShieldCount}</div>
                </div>
              </div>
            `}

            <div class="stat-item">
              <div class="stat-item__icon">📊</div>
              <div class="stat-item__content">
                <div class="stat-item__label">Progress</div>
                <div class="stat-item__value">${progress}%</div>
              </div>
            </div>
          </div>

          <!-- Shield & Purchase Controls -->
          <div class="action-controls">
            <h3 class="action-controls__title">Purchase Controls</h3>
            <${ShieldButton}
              auctionId=${id}
              currentPrice=${currentPrice}
              onPurchase=${(result) => {
                if (result.success) {
                  // T074: Handle success - show confetti and modal
                  console.log('[LiveAuction] Purchase successful!', result);
                  setPurchaseResult({
                    itemName: itemName,
                    finalPrice: result.finalPrice,
                    newBalance: balance - result.finalPrice
                  });
                  setShowSuccessModal(true);
                } else {
                  // T077: Handle error - show specific error message
                  console.error('[LiveAuction] Purchase failed:', result.error);

                  // Map error codes to user-friendly messages
                  let message = result.error || 'An unexpected error occurred. Please try again.';

                  if (message.includes('insufficient balance')) {
                    message = 'You don\'t have enough balance to complete this purchase.';
                  } else if (message.includes('shield closed') || message.includes('shield not open')) {
                    message = 'Your shield has closed. Please open it again to purchase.';
                  } else if (message.includes('auction ended') || message.includes('already sold')) {
                    message = 'This auction has already ended. Another user may have purchased the item.';
                  } else if (message.includes('not authenticated')) {
                    message = 'You must be logged in to make a purchase.';
                  }

                  setErrorMessage(message);
                  setShowErrorModal(true);
                }
              }}
            />
          </div>

          <!-- Auction Details -->
          <div class="auction-details-card">
            <h3 class="details-card__title">Auction Details</h3>

            <dl class="detail-list-compact">
              <div class="detail-item-compact">
                <dt>Duration</dt>
                <dd>${formatDuration(currentAuction.duration)}</dd>
              </div>

              <div class="detail-item-compact">
                <dt>Pricing Mode</dt>
                <dd>${currentAuction.pricingMode === 'transparent' ? 'Transparent' : 'Algorithmic'}</dd>
              </div>

              ${currentAuction.pricingConfig?.formula && html`
                <div class="detail-item-compact">
                  <dt>Formula</dt>
                  <dd>${currentAuction.pricingConfig.formula}</dd>
                </div>
              `}
            </dl>
          </div>
        </div>
      </div>

      <!-- Purchase Success Modal -->
      ${showSuccessModal && purchaseResult && html`
        <${PurchaseSuccessModal}
          isOpen=${showSuccessModal}
          onClose=${() => setShowSuccessModal(false)}
          itemName=${purchaseResult.itemName}
          finalPrice=${purchaseResult.finalPrice}
          newBalance=${purchaseResult.newBalance}
        />
      `}

      <!-- Error Modal -->
      ${showErrorModal && html`
        <${ErrorModal}
          isOpen=${showErrorModal}
          onClose=${() => setShowErrorModal(false)}
          message=${errorMessage}
        />
      `}

      <!-- Auction Ended Modal (Another User Won) -->
      ${showEndedModal && auctionEndData && html`
        <${AuctionEndedModal}
          isOpen=${showEndedModal}
          onClose=${() => setShowEndedModal(false)}
          itemName=${auctionEndData.itemName}
          finalPrice=${auctionEndData.finalPrice}
          winnerName=${auctionEndData.winnerName}
        />
      `}
    </div>
  `;
}
