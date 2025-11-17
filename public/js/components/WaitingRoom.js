/**
 * WaitingRoom Component
 * Pre-auction waiting area with countdown, images, and details
 */

import { formatPrice, formatDuration, formatDateTime } from '../utils/formatters.js';
import { ImageCarousel } from './ImageCarousel.js';
import { usePresence } from '../hooks/usePresence.js';

const { useState, useEffect } = React;

/**
 * Waiting room component for scheduled auctions
 * @param {Object} props - Component props
 * @param {Object} props.auction - Auction data
 * @returns {JSX.Element} Waiting room
 */
export function WaitingRoom({ auction }) {
  const [timeUntilStart, setTimeUntilStart] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Track presence in waiting room
  const { viewerCount } = usePresence(auction.id, 'waiting');

  // Calculate countdown timer
  useEffect(() => {
    if (!auction.startTime) {
      setTimeUntilStart(0);
      return;
    }

    const updateCountdown = () => {
      const startTime = auction.startTime.toMillis
        ? auction.startTime.toMillis()
        : auction.startTime;
      const now = Date.now();
      const diff = startTime - now;

      if (diff <= 0) {
        setTimeUntilStart(0);
        setHasStarted(true);
      } else {
        setTimeUntilStart(Math.floor(diff / 1000));
        setHasStarted(false);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [auction.startTime]);

  // Format countdown display
  const formatCountdown = (seconds) => {
    if (seconds <= 0) return 'Starting...';

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const {
    itemName,
    itemDescription,
    images,
    startingPrice,
    floorPrice,
    duration,
    pricingMode,
    pricingConfig,
    startTime,
    createdAt
  } = auction;

  const isStartingSoon = timeUntilStart > 0 && timeUntilStart <= 60; // Less than 1 minute

  return html`
    <div class="waiting-room">
      <!-- Back Link -->
      <a href="/" class="back-link">← Back to Auctions</a>

      <!-- Header -->
      <div class="waiting-room__header">
        <h1 class="waiting-room__title">${itemName}</h1>

        <div class="waiting-room__status">
          <span class="status-badge status-badge--scheduled">
            Waiting Room
          </span>
          ${viewerCount > 0 && html`
            <span class="viewer-count">
              <span class="icon">👁</span>
              <span>${viewerCount} ${viewerCount === 1 ? 'viewer' : 'viewers'} waiting</span>
            </span>
          `}
        </div>
      </div>

      <!-- Countdown Timer (Large) -->
      <div class="waiting-room__countdown ${isStartingSoon ? 'waiting-room__countdown--soon' : ''}">
        <div class="countdown-label">
          ${hasStarted ? 'Auction Starting' : 'Starts in'}
        </div>
        <div class="countdown-timer">
          ${formatCountdown(timeUntilStart)}
        </div>
        ${startTime && !hasStarted && html`
          <div class="countdown-subtitle">
            ${formatDateTime(startTime, 'full')}
          </div>
        `}
        ${hasStarted && html`
          <div class="countdown-message">
            Please wait while the auction begins...
          </div>
        `}
      </div>

      <!-- Main Content Grid -->
      <div class="waiting-room__content">

        <!-- Left Column: Images -->
        <div class="waiting-room__images">
          ${images && (images.full || images.thumbnails) && html`
            <${ImageCarousel} images=${images.full || images.thumbnails} alt=${itemName} />
          `}
        </div>

        <!-- Right Column: Details -->
        <div class="waiting-room__details">

          <!-- Item Description -->
          <section class="detail-section">
            <h2 class="detail-section__title">About This Item</h2>
            <div
              class="item-description"
              dangerouslySetInnerHTML=${{ __html: itemDescription }}
            ></div>
          </section>

          <!-- Auction Details -->
          <section class="detail-section">
            <h2 class="detail-section__title">Auction Details</h2>

            <dl class="detail-list">
              <div class="detail-item">
                <dt>Starting Price</dt>
                <dd class="detail-value detail-value--price">
                  ${formatPrice(startingPrice)}
                </dd>
              </div>

              <div class="detail-item">
                <dt>Floor Price</dt>
                <dd class="detail-value">
                  ${formatPrice(floorPrice)}
                </dd>
              </div>

              <div class="detail-item">
                <dt>Price Range</dt>
                <dd class="detail-value detail-value--range">
                  ${formatPrice(floorPrice)} - ${formatPrice(startingPrice)}
                </dd>
              </div>

              <div class="detail-item">
                <dt>Duration</dt>
                <dd class="detail-value">
                  ${formatDuration(duration)}
                </dd>
              </div>

              <div class="detail-item">
                <dt>Pricing Mode</dt>
                <dd class="detail-value">
                  ${pricingMode === 'transparent' ? 'Transparent (Formula Visible)' : 'Algorithmic (Adaptive)'}
                </dd>
              </div>

              ${pricingMode === 'transparent' && pricingConfig?.formula && html`
                <div class="detail-item">
                  <dt>Price Formula</dt>
                  <dd class="detail-value">
                    ${pricingConfig.formula.charAt(0).toUpperCase() + pricingConfig.formula.slice(1)} Decay
                  </dd>
                </div>
              `}

              ${pricingMode === 'transparent' && pricingConfig?.decayRate && html`
                <div class="detail-item">
                  <dt>Decay Rate</dt>
                  <dd class="detail-value">
                    ${pricingConfig.decayRate} per second
                  </dd>
                </div>
              `}
            </dl>
          </section>

          <!-- How It Works -->
          <section class="detail-section">
            <h2 class="detail-section__title">How It Works</h2>
            <ol class="how-it-works-list">
              <li>The auction starts at <strong>${formatPrice(startingPrice)}</strong></li>
              <li>The price decreases over time until it reaches <strong>${formatPrice(floorPrice)}</strong></li>
              <li>Deploy your shield to secure a 5-second purchase window</li>
              <li>Click "Purchase" during your window to win the item</li>
              <li>First person to purchase wins at the current price</li>
            </ol>
          </section>

          <!-- Shield Info -->
          <section class="detail-section detail-section--info">
            <div class="info-box">
              <div class="info-box__icon">🛡</div>
              <div class="info-box__content">
                <h3>About Shields</h3>
                <p>
                  Shields give you a 5-second exclusive window to purchase.
                  Once your shield opens, you have 5 seconds to click "Purchase"
                  before it closes. After closing, there's a 5-second cooldown before
                  you can reopen your shield.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `;
}
