/**
 * Price Calculations Utility
 * Client-side price interpolation for smooth price updates
 *
 * Mirrors server-side pricing logic from updateAuctionPrice.js
 */

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

  // For transparent mode, we can predict the price using the formula
  if (auction.pricingMode === 'transparent') {
    return calculateTransparentPrice(auction, elapsedSeconds);
  }

  // For algorithmic mode, we cannot predict (depends on viewer/shield counts)
  // Fall back to last server price
  return auction.currentPrice;
}

/**
 * Calculate transparent mode price
 * Mirrors logic from updateAuctionPrice.js lines 181-211
 * @param {Object} auction - Auction data
 * @param {number} elapsedSeconds - Time elapsed since start
 * @returns {number} Price in cents
 */
function calculateTransparentPrice(auction, elapsedSeconds) {
  const { startingPrice, floorPrice, duration, pricingConfig } = auction;
  const formula = pricingConfig?.formula || 'linear';

  let price;

  switch (formula) {
    case 'linear':
      // Linear decay: starting - (rate * elapsed)
      const linearRate = (startingPrice - floorPrice) / duration;
      price = startingPrice - (linearRate * elapsedSeconds);
      break;

    case 'exponential':
      // Exponential decay: starting * e^(-rate * elapsed)
      const expRate = pricingConfig.decayRate || 0.0001;
      price = startingPrice * Math.exp(-expRate * elapsedSeconds);
      break;

    case 'stepped':
      // Stepped decay: drop by fixed amount at intervals
      const stepInterval = pricingConfig.stepInterval || 30;
      const stepAmount = pricingConfig.stepAmount || Math.floor((startingPrice - floorPrice) / 10);
      const numSteps = Math.floor(elapsedSeconds / stepInterval);
      price = startingPrice - (stepAmount * numSteps);
      break;

    default:
      console.warn(`[calculateTransparentPrice] Unknown formula: ${formula}, using linear`);
      const defaultRate = (startingPrice - floorPrice) / duration;
      price = startingPrice - (defaultRate * elapsedSeconds);
  }

  // Clamp to floor price
  return Math.max(floorPrice, Math.round(price));
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
    const price = calculateTransparentPrice(auction, elapsedSeconds);

    points.push({
      x: timestamp,
      y: price / 100 // Convert cents to dollars for display
    });
  }

  return points;
}
