/**
 * Shared Price Formulas (CommonJS version for Cloud Functions)
 * Core pricing logic used by both client and server
 *
 * CRITICAL: This file must stay in sync with public/js/shared/priceFormulas.js
 * Any changes here MUST be mirrored to the client version to prevent
 * price display mismatches.
 */

/**
 * Calculate price for transparent mode auctions
 * @param {Object} params - Pricing parameters
 * @param {number} params.startingPrice - Starting price in cents
 * @param {number} params.floorPrice - Floor price in cents
 * @param {number} params.duration - Total duration in seconds
 * @param {string} params.formula - 'linear', 'exponential', or 'stepped'
 * @param {Object} params.pricingConfig - Additional config (decayRate, stepCount, etc.)
 * @param {number} elapsedSeconds - Time elapsed since auction start
 * @returns {number} Calculated price in cents
 */
function calculateTransparentPrice(params, elapsedSeconds) {
  const { startingPrice, floorPrice, duration, formula = 'linear', pricingConfig = {} } = params;

  let price;

  switch (formula) {
    case 'linear':
      price = calculateLinearPrice(startingPrice, floorPrice, duration, elapsedSeconds);
      break;

    case 'exponential':
      price = calculateExponentialPrice(startingPrice, floorPrice, pricingConfig.decayRate, elapsedSeconds);
      break;

    case 'stepped':
      price = calculateSteppedPrice(startingPrice, floorPrice, duration, pricingConfig, elapsedSeconds);
      break;

    default:
      console.warn(`[priceFormulas] Unknown formula: ${formula}, using linear`);
      price = calculateLinearPrice(startingPrice, floorPrice, duration, elapsedSeconds);
  }

  // Clamp to floor price
  return Math.max(floorPrice, Math.round(price));
}

/**
 * Linear decay: price decreases at a constant rate
 * @param {number} startingPrice - Starting price in cents
 * @param {number} floorPrice - Floor price in cents
 * @param {number} duration - Total duration in seconds
 * @param {number} elapsedSeconds - Time elapsed
 * @returns {number} Price in cents
 */
function calculateLinearPrice(startingPrice, floorPrice, duration, elapsedSeconds) {
  const rate = (startingPrice - floorPrice) / duration;
  return startingPrice - (rate * elapsedSeconds);
}

/**
 * Exponential decay: price drops quickly at first, then slows
 * Formula: startingPrice * e^(-rate * elapsed)
 * @param {number} startingPrice - Starting price in cents
 * @param {number} floorPrice - Floor price in cents (used for clamping)
 * @param {number} decayRate - Decay rate constant
 * @param {number} elapsedSeconds - Time elapsed
 * @returns {number} Price in cents
 */
function calculateExponentialPrice(startingPrice, floorPrice, decayRate, elapsedSeconds) {
  const rate = decayRate || 0.0001;
  return startingPrice * Math.exp(-rate * elapsedSeconds);
}

/**
 * Stepped decay: price drops in discrete steps at intervals
 * @param {number} startingPrice - Starting price in cents
 * @param {number} floorPrice - Floor price in cents
 * @param {number} duration - Total duration in seconds
 * @param {Object} config - Step configuration
 * @param {number} config.stepCount - Number of steps
 * @param {number} config.stepInterval - Seconds between steps
 * @param {number} config.stepAmount - Price drop per step in cents
 * @param {number} elapsedSeconds - Time elapsed
 * @returns {number} Price in cents
 */
function calculateSteppedPrice(startingPrice, floorPrice, duration, config, elapsedSeconds) {
  const stepCount = config.stepCount || 10;
  const stepInterval = config.stepInterval || Math.floor(duration / stepCount);
  const stepAmount = config.stepAmount || Math.floor((startingPrice - floorPrice) / stepCount);
  const numSteps = Math.floor(elapsedSeconds / stepInterval);
  return startingPrice - (stepAmount * numSteps);
}

/**
 * Calculate exponential decay rate from steepness slider value
 * This ensures the price reaches the floor at (or near) the auction end
 *
 * @param {number} steepness - Steepness value (0-100)
 * @param {number} startingPrice - Starting price in cents
 * @param {number} floorPrice - Floor price in cents
 * @param {number} durationSeconds - Total duration in seconds
 * @returns {number} Decay rate for exponential formula
 */
function calculateExpDecayRate(steepness, startingPrice, floorPrice, durationSeconds) {
  // Calculate the base rate that would reach exactly the floor at duration end
  const priceRatio = floorPrice / startingPrice;
  const baseRate = -Math.log(priceRatio) / durationSeconds;

  // Adjust based on steepness to control the SHAPE of the curve:
  // - Lower rates = more linear (gentle)
  // - Higher rates = more exponential (aggressive early drop)
  const normalizedSteepness = steepness / 100;

  let targetTimeMultiplier;
  if (normalizedSteepness <= 0.5) {
    // Gentle to Moderate: 1.4x down to 1.0x
    targetTimeMultiplier = 1.4 - (normalizedSteepness / 0.5) * 0.4;
  } else {
    // Moderate to Aggressive: 1.0x down to 0.8x
    targetTimeMultiplier = 1.0 - ((normalizedSteepness - 0.5) / 0.5) * 0.2;
  }

  // Calculate rate for the adjusted target time
  const adjustedDuration = durationSeconds * targetTimeMultiplier;
  return -Math.log(priceRatio) / adjustedDuration;
}

/**
 * Generate preview points for price graph visualization
 * @param {Object} params - Auction parameters
 * @param {number} numPoints - Number of points to generate
 * @returns {Array} Array of {x: progress%, y: priceInDollars} points
 */
function generatePreviewPoints(params, numPoints = 50) {
  const { startingPrice, floorPrice, duration, formula, pricingConfig } = params;

  // Return empty if prices aren't valid
  if (!startingPrice || !floorPrice || startingPrice <= floorPrice) {
    return [];
  }

  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const elapsedSeconds = Math.floor(duration * progress);
    const price = calculateTransparentPrice(params, elapsedSeconds);

    points.push({
      x: progress * 100,
      y: price / 100 // Convert cents to dollars
    });
  }

  return points;
}

module.exports = {
  calculateTransparentPrice,
  calculateLinearPrice,
  calculateExponentialPrice,
  calculateSteppedPrice,
  calculateExpDecayRate,
  generatePreviewPoints
};
