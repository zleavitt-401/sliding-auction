/**
 * ShieldButton Component
 * Shield control with 4-state machine and animations
 */

import { useShield, SHIELD_STATES } from '../hooks/useShield.js';
import { useUser } from '../hooks/useUser.js';
import { formatPrice } from '../utils/formatters.js';
import {
  httpsCallable
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-functions.js';

const { useState, useEffect } = React;

/**
 * Shield button component
 * @param {Object} props - Component props
 * @param {string} props.auctionId - Auction ID
 * @param {number} props.currentPrice - Current auction price
 * @param {Function} props.onPurchase - Purchase callback
 * @returns {JSX.Element} Shield button
 */
export function ShieldButton({ auctionId, currentPrice, onPurchase }) {
  const {
    shieldState,
    timeRemaining,
    error,
    isProcessing,
    openShield,
    isOpen,
    isOpening,
    isCooldown,
    isClosed
  } = useShield(auctionId);

  const { balance, loading: userLoading } = useUser();

  const [progress, setProgress] = useState(100);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);

  // Calculate progress for circular indicator
  useEffect(() => {
    if (isOpen) {
      const percentage = (timeRemaining / 5) * 100;
      setProgress(percentage);
    } else if (isCooldown) {
      const percentage = ((5 - timeRemaining) / 5) * 100;
      setProgress(percentage);
    } else {
      setProgress(100);
    }
  }, [timeRemaining, isOpen, isCooldown]);

  // Handle shield button click
  const handleShieldClick = () => {
    if (isClosed && !isProcessing) {
      openShield();
    }
  };

  // Handle purchase button click
  const handlePurchase = async () => {
    if (!isOpen || isPurchasing) {
      return;
    }

    // T071: Client-side validation - check balance
    if (balance < currentPrice) {
      setPurchaseError(`Insufficient balance. You have ${formatPrice(balance)}, but need ${formatPrice(currentPrice)}.`);
      return;
    }

    try {
      // T072: Optimistic UI - show processing state
      setIsPurchasing(true);
      setPurchaseError(null);

      console.log('[ShieldButton] Initiating purchase...');
      console.log('[ShieldButton] Auction:', auctionId);
      console.log('[ShieldButton] Price:', formatPrice(currentPrice));
      console.log('[ShieldButton] Balance:', formatPrice(balance));

      // T073: Call purchaseAuction Cloud Function (Phase 14) - v9 modular API
      const purchaseFunction = httpsCallable(window.functions, 'purchaseAuction');

      // Send timestamp so server can calculate expected price using same formula
      // This avoids price mismatch between client interpolation and server updates
      const result = await purchaseFunction({
        auctionId: auctionId,
        expectedPrice: currentPrice, // Still send for client-side validation
        purchaseTimestamp: Date.now() // Server will use this to calculate accurate price
      });

      console.log('[ShieldButton] Purchase successful:', result.data);
      setIsPurchasing(false);

      // Call parent callback with success
      if (onPurchase) {
        onPurchase({
          success: true,
          finalPrice: result.data.finalPrice,
          auctionId,
          transactionId: result.data.transactionId,
          newBalance: result.data.newBalance,
          itemName: result.data.itemName
        });
      }

    } catch (err) {
      console.error('[ShieldButton] Purchase error:', err);
      setPurchaseError(err.message || 'Purchase failed. Please try again.');
      setIsPurchasing(false);

      // Call parent callback with error
      if (onPurchase) {
        onPurchase({
          success: false,
          error: err.message
        });
      }
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();

      if (isClosed) {
        handleShieldClick();
      } else if (isOpen) {
        handlePurchase();
      }
    }
  };

  return html`
    <div class="shield-control">
      ${error && html`
        <div class="shield-error">
          <small>${error}</small>
        </div>
      `}

      ${purchaseError && html`
        <div class="shield-error">
          <small>${purchaseError}</small>
        </div>
      `}

      <div class="shield-button-container">

        <!-- Closed State: Shield Button -->
        ${isClosed && html`
          <button
            class="shield-btn shield-btn--closed"
            onClick=${handleShieldClick}
            onKeyDown=${handleKeyDown}
            disabled=${isProcessing}
            aria-label="Open shield to enable purchase"
          >
            <span class="shield-btn__icon">🛡</span>
            <span class="shield-btn__text">
              ${isProcessing ? 'Opening...' : 'Open Shield to Purchase'}
            </span>
          </button>
        `}

        <!-- Opening State: Animation -->
        ${isOpening && html`
          <div class="shield-opening">
            <div class="shield-opening__animation">
              <span class="shield-icon-large">🛡</span>
              <div class="shield-opening__text">Opening Shield...</div>
            </div>
          </div>
        `}

        <!-- Open State: Purchase Button + Shield Countdown -->
        ${isOpen && html`
          <div class="shield-open-container">
            <!-- Shield Countdown Indicator -->
            <div class="shield-countdown" role="timer" aria-live="polite" aria-atomic="true">
              <svg class="shield-countdown__svg" width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
                <!-- Background circle -->
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#E0E0E0"
                  strokeWidth="4"
                />
                <!-- Progress circle -->
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#457B9D"
                  strokeWidth="4"
                  strokeDasharray=${2 * Math.PI * 36}
                  strokeDashoffset=${2 * Math.PI * 36 * (1 - progress / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                  class="shield-countdown__progress"
                />
              </svg>
              <div class="shield-countdown__time">
                <span class="shield-countdown__number">${timeRemaining}</span>
                <span class="shield-countdown__label">sec</span>
              </div>
            </div>

            <!-- Purchase Button -->
            <button
              class="purchase-btn ${isPurchasing ? 'purchase-btn--processing' : 'purchase-btn--active'}"
              onClick=${handlePurchase}
              onKeyDown=${handleKeyDown}
              disabled=${isPurchasing}
              aria-label=${isPurchasing ? 'Processing purchase...' : 'Purchase item at current price'}
            >
              <span class="purchase-btn__icon">${isPurchasing ? '⏳' : '💰'}</span>
              <span class="purchase-btn__text">
                ${isPurchasing ? 'Processing Purchase...' : `Purchase at ${formatPrice(currentPrice)}`}
              </span>
            </button>

            <!-- Info Text -->
            <div class="shield-open-info">
              Shield active for ${timeRemaining} ${timeRemaining === 1 ? 'second' : 'seconds'}
            </div>
          </div>
        `}

        <!-- Cooldown State: Disabled Button -->
        ${isCooldown && html`
          <div class="shield-cooldown-container">
            <button
              class="shield-btn shield-btn--cooldown"
              disabled
              aria-label="Shield cooldown in progress"
            >
              <span class="shield-btn__icon">⏱</span>
              <span class="shield-btn__text">
                Shield Cooldown: ${timeRemaining}s
              </span>
            </button>

            <!-- Cooldown Progress Bar -->
            <div class="cooldown-progress">
              <div
                class="cooldown-progress__bar"
                style=${{ width: `${progress}%` }}
              ></div>
            </div>

            <div class="shield-cooldown-info">
              You can reopen your shield in ${timeRemaining} ${timeRemaining === 1 ? 'second' : 'seconds'}
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}
