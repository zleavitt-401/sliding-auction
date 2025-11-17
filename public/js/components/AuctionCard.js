/**
 * AuctionCard Component
 * Displays auction information in a card format
 */

import { formatPrice, formatDateTime, formatCountdown } from '../utils/formatters.js';
import { getTimeRemaining, getTimeUntilStart, isAuctionEndingSoon } from '../hooks/useAuctions.js';

const { useState, useEffect } = React;

/**
 * Auction card component
 * @param {Object} props - Component props
 * @param {Object} props.auction - Auction data
 * @param {Function} props.onClick - Optional click handler
 * @returns {JSX.Element} Auction card
 */
export function AuctionCard({ auction, onClick }) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeUntilStart, setTimeUntilStart] = useState(0);

  // Update countdown timers every second
  useEffect(() => {
    if (!auction) return;

    const updateTimers = () => {
      if (auction.status === 'live') {
        setTimeRemaining(getTimeRemaining(auction));
      } else if (auction.status === 'scheduled') {
        setTimeUntilStart(getTimeUntilStart(auction));
      }
    };

    // Initial update
    updateTimers();

    // Update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  if (!auction) {
    return null;
  }

  const {
    id,
    itemName,
    images,
    currentPrice,
    startingPrice,
    floorPrice,
    status,
    viewerCount,
    openShieldCount,
    startTime,
    createdAt
  } = auction;

  const isLive = status === 'live';
  const isScheduled = status === 'scheduled';
  const isEnded = status && status.startsWith('ended');
  const endingSoon = isAuctionEndingSoon(auction);

  // Determine which image to show (thumbnail or fallback)
  const thumbnailUrl = images?.thumbnails?.[0] || images?.full?.[0] || 'https://via.placeholder.com/200x200?text=No+Image';

  // Handle card click
  const handleClick = () => {
    if (onClick) {
      onClick(auction);
    } else {
      // Default behavior: navigate to auction detail page
      window.location.href = `/auction.html?id=${id}`;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return html`
    <div
      class="auction-card ${isLive ? 'auction-card--live' : ''} ${endingSoon ? 'auction-card--ending-soon' : ''}"
      onClick=${handleClick}
      onKeyDown=${handleKeyDown}
      tabIndex="0"
      role="button"
      aria-label="View auction for ${itemName}"
    >
      <!-- Status Badge -->
      <div class="auction-card__badge auction-card__badge--${status}">
        ${isLive ? 'LIVE' : isScheduled ? 'UPCOMING' : 'ENDED'}
      </div>

      <!-- Image -->
      <div class="auction-card__image">
        <img src=${thumbnailUrl} alt=${itemName} loading="lazy" />
      </div>

      <!-- Content -->
      <div class="auction-card__content">
        <!-- Item Name -->
        <h3 class="auction-card__title">${itemName}</h3>

        <!-- Price -->
        <div class="auction-card__price">
          ${isLive || isEnded
            ? html`
              <span class="auction-card__current-price">${formatPrice(currentPrice)}</span>
              ${isLive && html`
                <span class="auction-card__price-range">
                  ${formatPrice(floorPrice)} - ${formatPrice(startingPrice)}
                </span>
              `}
            `
            : html`
              <span class="auction-card__starting-price">
                Starting at ${formatPrice(startingPrice)}
              </span>
            `
          }
        </div>

        <!-- Metadata -->
        <div class="auction-card__metadata">
          ${isLive && html`
            <div class="auction-card__timer ${endingSoon ? 'auction-card__timer--warning' : ''}">
              <span class="icon">⏱</span>
              <span>${timeRemaining > 0 ? formatCountdown(new Date(Date.now() + timeRemaining * 1000)) : 'Ending...'}</span>
            </div>
          `}

          ${isScheduled && html`
            <div class="auction-card__timer">
              <span class="icon">📅</span>
              <span>
                ${startTime
                  ? `Starts in ${formatCountdown(startTime)}`
                  : 'Scheduled'
                }
              </span>
            </div>
          `}

          ${isEnded && html`
            <div class="auction-card__ended">
              <span class="icon">✓</span>
              <span>
                ${status === 'ended - sold' ? 'Sold' : status === 'ended - no winner' ? 'No Winner' : 'Stopped'}
              </span>
            </div>
          `}

          ${isLive && viewerCount !== undefined && html`
            <div class="auction-card__viewers">
              <span class="icon">👁</span>
              <span>${viewerCount} ${viewerCount === 1 ? 'viewer' : 'viewers'}</span>
            </div>
          `}

          ${isLive && openShieldCount !== undefined && openShieldCount > 0 && html`
            <div class="auction-card__shields">
              <span class="icon">🛡</span>
              <span>${openShieldCount} ${openShieldCount === 1 ? 'shield' : 'shields'}</span>
            </div>
          `}
        </div>

        <!-- CTA Button -->
        <div class="auction-card__cta">
          ${isLive && html`<span class="btn-primary">Join Auction</span>`}
          ${isScheduled && html`<span class="btn-secondary">View Details</span>`}
          ${isEnded && html`<span class="btn-secondary">View Results</span>`}
        </div>
      </div>
    </div>
  `;
}

/**
 * Auction card skeleton loader
 * @returns {JSX.Element} Loading skeleton
 */
export function AuctionCardSkeleton() {
  return html`
    <div class="auction-card auction-card--skeleton">
      <div class="auction-card__image skeleton"></div>
      <div class="auction-card__content">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--price"></div>
        <div class="skeleton skeleton--metadata"></div>
      </div>
    </div>
  `;
}
