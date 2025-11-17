/**
 * AuctionPage Component
 * Main auction detail page - shows waiting room or live auction view
 */

import { useDocument } from '../hooks/useFirestore.js';
import { WaitingRoom } from './WaitingRoom.js';
import { LiveAuction } from './LiveAuction.js';
import { formatPrice } from '../utils/formatters.js';

const { useState, useEffect } = React;

/**
 * Auction page component
 * Displays auction details based on status (waiting room, live, or ended)
 * @param {Object} props - Component props
 * @param {string} props.auctionId - Auction ID
 * @returns {JSX.Element} Auction page
 */
export function AuctionPage({ auctionId }) {
  const { data: auction, loading, error } = useDocument('auctions', auctionId);

  if (loading) {
    return html`
      <div class="auction-page-loading">
        <div class="loading">Loading auction...</div>
      </div>
    `;
  }

  if (error) {
    return html`
      <div class="error">
        <h2>Error Loading Auction</h2>
        <p>${error}</p>
        <a href="/" class="btn-primary">Back to Auctions</a>
      </div>
    `;
  }

  if (!auction) {
    return html`
      <div class="error">
        <h2>Auction Not Found</h2>
        <p>The auction you're looking for doesn't exist or has been removed.</p>
        <a href="/" class="btn-primary">Back to Auctions</a>
      </div>
    `;
  }

  const { status } = auction;

  // Render different views based on auction status
  if (status === 'scheduled') {
    return html`<${WaitingRoom} auction=${auction} />`;
  }

  if (status === 'live') {
    return html`<${LiveAuction} auction=${auction} />`;
  }

  if (status && status.startsWith('ended')) {
    return html`<${EndedAuctionPlaceholder} auction=${auction} />`;
  }

  return html`
    <div class="error">
      <h2>Unknown Auction Status</h2>
      <p>Auction status: ${status}</p>
      <a href="/" class="btn-primary">Back to Auctions</a>
    </div>
  `;
}

/**
 * Placeholder for live auction view (Phase 5)
 */
function LiveAuctionPlaceholder({ auction }) {
  return html`
    <div class="auction-page">
      <div class="auction-page__header">
        <a href="/" class="back-link">← Back to Auctions</a>
        <h1>${auction.itemName}</h1>
        <div class="auction-status auction-status--live">
          🔴 LIVE
        </div>
      </div>

      <div class="auction-page__content">
        <div class="placeholder-message">
          <h2>🔴 Live Auction</h2>
          <p>This auction is currently live!</p>
          <p class="placeholder-details">
            Live auction view will be implemented in Phase 5 (User Story 3).
          </p>
          <p class="placeholder-details">
            <strong>Features coming:</strong>
          </p>
          <ul class="placeholder-list">
            <li>Real-time price updates</li>
            <li>Price graph with Chart.js</li>
            <li>Time remaining countdown</li>
            <li>Shield controls</li>
            <li>Purchase button</li>
            <li>Viewer count</li>
          </ul>
        </div>

        <div class="auction-details-preview">
          <h3>Current State</h3>
          <dl>
            <dt>Current Price:</dt>
            <dd class="price-highlight">${formatPrice(auction.currentPrice)}</dd>
            <dt>Floor Price:</dt>
            <dd>${formatPrice(auction.floorPrice)}</dd>
            <dt>Viewers:</dt>
            <dd>${auction.viewerCount || 0}</dd>
            <dt>Open Shields:</dt>
            <dd>${auction.openShieldCount || 0}</dd>
          </dl>
        </div>
      </div>
    </div>
  `;
}

/**
 * Placeholder for ended auction view (Phase 7)
 */
function EndedAuctionPlaceholder({ auction }) {
  const isSold = auction.status === 'ended - sold';
  const hasWinner = auction.winner && auction.finalPrice;

  return html`
    <div class="auction-page">
      <div class="auction-page__header">
        <a href="/" class="back-link">← Back to Auctions</a>
        <h1>${auction.itemName}</h1>
        <div class="auction-status auction-status--ended">
          ${isSold ? '✓ Sold' : auction.status === 'ended - no winner' ? 'No Winner' : 'Stopped'}
        </div>
      </div>

      <div class="auction-page__content">
        <div class="placeholder-message">
          <h2>Auction Ended</h2>
          <p>This auction has finished.</p>
          ${hasWinner && html`
            <div class="auction-result">
              <p><strong>Final Price:</strong> ${formatPrice(auction.finalPrice)}</p>
            </div>
          `}
        </div>

        <div class="auction-details-preview">
          <h3>Auction Summary</h3>
          <dl>
            <dt>Starting Price:</dt>
            <dd>${formatPrice(auction.startingPrice)}</dd>
            <dt>Floor Price:</dt>
            <dd>${formatPrice(auction.floorPrice)}</dd>
            ${hasWinner && html`
              <>
                <dt>Final Price:</dt>
                <dd class="price-highlight">${formatPrice(auction.finalPrice)}</dd>
              </>
            `}
            <dt>Status:</dt>
            <dd>${auction.status}</dd>
          </dl>
        </div>
      </div>
    </div>
  `;
}
