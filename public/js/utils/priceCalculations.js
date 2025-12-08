/**
 * Price Calculations Utility
 * Client-side price interpolation for smooth price updates
 *
 * Uses shared pricing logic from ../shared/priceFormulas.js
 * This ensures client and server calculate identical prices
 */

import {
  calculateTransparentPrice as sharedCalculateTransparentPrice,
  generatePreviewPoints as sharedGeneratePreviewPoints
} from '../shared/priceFormulas.js';

/**
 * Calculate expected price at current time
 * @param {Object} auction - Auction data
 * @returns {number} Expected price in cents
 */
export function calculateExpectedPrice(auction) {
  if (!auction || auction.status !== 'live') {
    return auction?.currentPrice || 0;
  }

  const now = Date.now();
  const startTime = auction.startTime?.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const elapsedSeconds = Math.floor((now - startTime) / 1000);

  // For transparent mode, we can predict the price using the shared formula
  if (auction.pricingMode === 'transparent') {
    return sharedCalculateTransparentPrice({
      startingPrice: auction.startingPrice,
      floorPrice: auction.floorPrice,
      duration: auction.duration,
      formula: auction.pricingConfig?.formula || 'linear',
      pricingConfig: auction.pricingConfig || {}
    }, elapsedSeconds);
  }

  // For algorithmic mode, we cannot predict (depends on viewer/shield counts)
  // Fall back to last server price
  return auction.currentPrice;
}

/**
 * Generate predicted price points for visualization
 * @param {Object} auction - Auction data
 * @param {number} numPoints - Number of points to generate
 * @returns {Array} Array of {x: timestamp, y: price} points
 */
export function generatePredictedPricePoints(auction, numPoints = 100) {
  if (!auction || auction.pricingMode !== 'transparent') {
    return [];
  }

  const startTime = auction.startTime?.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const duration = auction.duration; // in seconds
  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const elapsedSeconds = Math.floor(duration * progress);
    const timestamp = startTime + (elapsedSeconds * 1000);

    const price = sharedCalculateTransparentPrice({
      startingPrice: auction.startingPrice,
      floorPrice: auction.floorPrice,
      duration: auction.duration,
      formula: auction.pricingConfig?.formula || 'linear',
      pricingConfig: auction.pricingConfig || {}
    }, elapsedSeconds);

    points.push({
      x: timestamp,
      y: price / 100 // Convert cents to dollars for display
    });
  }

  return points;
}

// Re-export shared functions for convenience
export { sharedCalculateTransparentPrice as calculateTransparentPrice };
