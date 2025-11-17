/**
 * AuctionList Component
 * Displays lists of auctions grouped by status
 */

import { useActiveAuctions, useUpcomingAuctions, useAuctionStats } from '../hooks/useAuctions.js';
import { AuctionCard, AuctionCardSkeleton } from './AuctionCard.js';
import { formatPrice } from '../utils/formatters.js';

const { useState, useEffect } = React;

/**
 * Main auction list component for homepage
 * Shows both active and upcoming auctions
 * @returns {JSX.Element} Auction list
 */
export function AuctionList() {
  const { auctions: activeAuctions, loading: loadingActive, error: errorActive } = useActiveAuctions();
  const { auctions: upcomingAuctions, loading: loadingUpcoming, error: errorUpcoming } = useUpcomingAuctions();

  const loading = loadingActive || loadingUpcoming;
  const error = errorActive || errorUpcoming;

  // Calculate stats
  const stats = useAuctionStats([...activeAuctions, ...upcomingAuctions]);

  return html`
    <div class="auction-list-container">
      <!-- Header with Stats -->
      <div class="auction-list-header">
        <h1>Live Auctions</h1>
        ${!loading && html`
          <div class="auction-stats">
            <span class="stat">
              <strong>${stats.live}</strong> Live
            </span>
            <span class="stat">
              <strong>${stats.scheduled}</strong> Upcoming
            </span>
            ${stats.totalViewers > 0 && html`
              <span class="stat">
                <strong>${stats.totalViewers}</strong> Active ${stats.totalViewers === 1 ? 'Viewer' : 'Viewers'}
              </span>
            `}
          </div>
        `}
      </div>

      ${error && html`
        <div class="error">
          <h2>Error Loading Auctions</h2>
          <p>${error}</p>
        </div>
      `}

      <!-- Active Auctions Section -->
      <section class="auction-section">
        <h2 class="section-title">
          <span class="status-indicator status-indicator--live"></span>
          Active Auctions
        </h2>

        ${loadingActive && html`
          <div class="auction-grid">
            ${[1, 2, 3].map(i => html`<${AuctionCardSkeleton} key=${i} />`)}
          </div>
        `}

        ${!loadingActive && activeAuctions.length === 0 && html`
          <div class="empty-state">
            <p>No active auctions right now.</p>
            <p class="empty-state__subtitle">Check back soon or view upcoming auctions below!</p>
          </div>
        `}

        ${!loadingActive && activeAuctions.length > 0 && html`
          <div class="auction-grid">
            ${activeAuctions.map(auction => html`
              <${AuctionCard} key=${auction.id} auction=${auction} />
            `)}
          </div>
        `}
      </section>

      <!-- Upcoming Auctions Section -->
      <section class="auction-section">
        <h2 class="section-title">
          <span class="status-indicator status-indicator--scheduled"></span>
          Upcoming Auctions
        </h2>

        ${loadingUpcoming && html`
          <div class="auction-grid">
            ${[1, 2, 3].map(i => html`<${AuctionCardSkeleton} key=${i} />`)}
          </div>
        `}

        ${!loadingUpcoming && upcomingAuctions.length === 0 && html`
          <div class="empty-state">
            <p>No upcoming auctions scheduled.</p>
            <p class="empty-state__subtitle">New auctions will appear here when they're added.</p>
          </div>
        `}

        ${!loadingUpcoming && upcomingAuctions.length > 0 && html`
          <div class="auction-grid">
            ${upcomingAuctions.map(auction => html`
              <${AuctionCard} key=${auction.id} auction=${auction} />
            `)}
          </div>
        `}
      </section>
    </div>
  `;
}

/**
 * Compact auction list (for sidebars, etc.)
 * @param {Object} props - Component props
 * @param {string} props.status - Filter by status
 * @param {number} props.limit - Max number of auctions to show
 * @param {string} props.title - Section title
 * @returns {JSX.Element} Compact auction list
 */
export function CompactAuctionList({ status = 'live', limit = 5, title = 'Auctions' }) {
  const { auctions, loading, error } = useActiveAuctions(limit);

  if (loading) {
    return html`<div class="loading">Loading ${title.toLowerCase()}...</div>`;
  }

  if (error) {
    return html`<div class="error">Error loading ${title.toLowerCase()}</div>`;
  }

  if (auctions.length === 0) {
    return html`<div class="empty-state">No ${title.toLowerCase()} available</div>`;
  }

  return html`
    <div class="compact-auction-list">
      <h3>${title}</h3>
      <ul class="compact-auction-list__items">
        ${auctions.map(auction => html`
          <li key=${auction.id}>
            <a href="/auction.html?id=${auction.id}" class="compact-auction-item">
              <img
                src=${auction.images?.thumbnails?.[0] || 'https://via.placeholder.com/50x50'}
                alt=${auction.itemName}
                class="compact-auction-item__image"
              />
              <div class="compact-auction-item__info">
                <span class="compact-auction-item__name">${auction.itemName}</span>
                <span class="compact-auction-item__price">${formatPrice(auction.currentPrice)}</span>
              </div>
            </a>
          </li>
        `)}
      </ul>
    </div>
  `;
}
