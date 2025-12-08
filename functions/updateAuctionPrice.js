/**
 * updateAuctionPrice Cloud Function
 * Scheduled function that runs every 1 second to update auction prices
 *
 * Supports two pricing modes:
 * 1. Transparent: Formula-based pricing (linear, exponential, stepped)
 * 2. Algorithmic: AI-driven pricing with viewer/shield/time adjustments
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Shared modules - keep in sync with client-side versions
const { calculateTransparentPrice } = require('./shared/priceFormulas');
const { FLOOR_TIMER_DURATION, ALGORITHMIC_DEFAULTS } = require('./shared/constants');

// Initialize Firebase Admin (only once across all functions)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const rtdb = admin.database();

/**
 * Scheduled function triggered every 1 second via Cloud Scheduler
 * T150: Create scheduled function
 */
exports.updateAuctionPrice = functions.pubsub
  .schedule('every 1 minutes')
  .onRun(async (context) => {
    console.log('[updateAuctionPrice] Starting price update cycle...');

    try {
      // T151: Fetch all live auctions
      const auctionsSnapshot = await db.collection('auctions')
        .where('status', '==', 'live')
        .get();

      if (auctionsSnapshot.empty) {
        console.log('[updateAuctionPrice] No live auctions to update');
        return null;
      }

      console.log(`[updateAuctionPrice] Updating ${auctionsSnapshot.size} live auctions`);

      // Process each auction
      const updatePromises = auctionsSnapshot.docs.map(async (auctionDoc) => {
        const auction = { id: auctionDoc.id, ...auctionDoc.data() };

        try {
          await updateSingleAuction(auction);
        } catch (error) {
          console.error(`[updateAuctionPrice] Error updating auction ${auction.id}:`, error);
        }
      });

      await Promise.all(updatePromises);

      console.log('[updateAuctionPrice] Price update cycle complete');
      return null;

    } catch (error) {
      console.error('[updateAuctionPrice] Fatal error in price update:', error);
      throw error;
    }
  });

/**
 * Update price for a single auction
 * @param {Object} auction - Auction document data
 */
async function updateSingleAuction(auction) {
  const now = Date.now();
  const startTime = auction.startTime?.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const endTime = auction.endTime?.toMillis ? auction.endTime.toMillis() : auction.endTime;

  // Check if auction has ended
  if (now >= endTime) {
    console.log(`[updateAuctionPrice] Auction ${auction.id} time expired, ending...`);
    await db.collection('auctions').doc(auction.id).update({
      status: 'ended - no winner',
      endedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return;
  }

  const elapsedSeconds = Math.floor((now - startTime) / 1000);
  const totalDuration = auction.duration; // in seconds
  const timeRemaining = Math.max(0, totalDuration - elapsedSeconds);
  const progressPercent = Math.min(100, Math.floor((elapsedSeconds / totalDuration) * 100));

  let newPrice;
  let algorithmDecision = null;

  // Calculate new price based on pricing mode
  if (auction.pricingMode === 'transparent') {
    // T152-T154: Use shared transparent mode formulas
    newPrice = calculateTransparentPrice({
      startingPrice: auction.startingPrice,
      floorPrice: auction.floorPrice,
      duration: auction.duration,
      formula: auction.pricingConfig?.formula || 'linear',
      pricingConfig: auction.pricingConfig || {}
    }, elapsedSeconds);
  } else {
    // T155-T158: Implement algorithmic mode
    const result = await calculateAlgorithmicPrice(auction, elapsedSeconds, progressPercent);
    newPrice = result.price;
    algorithmDecision = result.decision;
  }

  // T159: Clamp price to floor
  const floorPrice = auction.floorPrice;
  const reachedFloor = newPrice <= floorPrice;

  if (reachedFloor) {
    newPrice = floorPrice;

    // T160: Check floor timer (60 seconds at floor = auction ends)
    if (!auction.floorTimerStart) {
      // First time reaching floor - start timer
      await db.collection('auctions').doc(auction.id).update({
        floorTimerStart: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[updateAuctionPrice] Auction ${auction.id} reached floor, starting 60s timer`);
    } else {
      // Check if 60 seconds have elapsed at floor
      const floorTimerStart = auction.floorTimerStart?.toMillis ?
        auction.floorTimerStart.toMillis() : auction.floorTimerStart;
      const timeAtFloor = Math.floor((now - floorTimerStart) / 1000);

      if (timeAtFloor >= FLOOR_TIMER_DURATION) {
        console.log(`[updateAuctionPrice] Auction ${auction.id} at floor for ${timeAtFloor}s, ending...`);
        await db.collection('auctions').doc(auction.id).update({
          status: 'ended - no winner',
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          currentPrice: newPrice
        });
        return;
      }
    }
  } else if (auction.floorTimerStart) {
    // Price rose above floor - reset timer
    await db.collection('auctions').doc(auction.id).update({
      floorTimerStart: admin.firestore.FieldValue.deleteField()
    });
  }

  // T161: Write new price to auction
  await db.collection('auctions').doc(auction.id).update({
    currentPrice: newPrice,
    lastPriceUpdate: admin.firestore.FieldValue.serverTimestamp()
  });

  // T162: Create price history point
  await db.collection('auctions').doc(auction.id)
    .collection('priceHistory')
    .add({
      price: newPrice,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      elapsedSeconds: elapsedSeconds
    });

  // T163: For algorithmic mode, create algorithm log entry
  if (auction.pricingMode === 'algorithmic' && algorithmDecision) {
    await db.collection('auctions').doc(auction.id)
      .collection('algorithmLog')
      .add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        decision: algorithmDecision.action,
        reason: algorithmDecision.reason,
        priceBefore: auction.currentPrice,
        priceAfter: newPrice,
        factors: algorithmDecision.factors
      });
  }

  console.log(`[updateAuctionPrice] Auction ${auction.id}: $${(newPrice / 100).toFixed(2)}`);
}

// NOTE: calculateTransparentPrice is now imported from ./shared/priceFormulas.js
// This ensures client and server use identical pricing logic

/**
 * T155-T158: Calculate price for algorithmic mode
 * @param {Object} auction - Auction data
 * @param {number} elapsedSeconds - Time elapsed since start
 * @param {number} progressPercent - Auction progress percentage
 * @returns {Object} { price, decision } - New price and decision details
 */
async function calculateAlgorithmicPrice(auction, elapsedSeconds, progressPercent) {
  const { currentPrice, floorPrice, pricingConfig } = auction;

  // T155: Base decay rate - use shared defaults
  const baseDecayRate = pricingConfig?.baseDecay || ALGORITHMIC_DEFAULTS.BASE_DECAY;
  let decayMultiplier = 1 - baseDecayRate;

  const factors = {
    baseDecay: baseDecayRate,
    viewerAdjustment: 0,
    shieldAdjustment: 0,
    timeAdjustment: 0
  };

  // T156: Viewer count adjustment
  const viewerCount = auction.viewerCount || 0;
  const viewerMultiplier = pricingConfig?.viewerInfluence || ALGORITHMIC_DEFAULTS.VIEWER_INFLUENCE;
  const viewerAdjustment = viewerMultiplier * (viewerCount / 50);
  decayMultiplier *= (1 - viewerAdjustment);
  factors.viewerAdjustment = viewerAdjustment;

  // T157: Shield activity adjustment
  const openShields = auction.openShieldCount || 0;
  const shieldInfluence = pricingConfig?.shieldInfluence || ALGORITHMIC_DEFAULTS.SHIELD_INFLUENCE;
  const shieldAdjustment = shieldInfluence * (openShields / 10);
  decayMultiplier *= (1 - shieldAdjustment);
  factors.shieldAdjustment = shieldAdjustment;

  // T158: Time remaining adjustment (accelerate if past threshold)
  if (progressPercent > ALGORITHMIC_DEFAULTS.TIME_PRESSURE_THRESHOLD) {
    const timeAccelerator = pricingConfig?.timeAccelerator || ALGORITHMIC_DEFAULTS.TIME_ACCELERATOR;
    decayMultiplier *= (1 / timeAccelerator); // Faster decay
    factors.timeAdjustment = timeAccelerator;
  }

  // Calculate new price
  let newPrice = Math.round(currentPrice * decayMultiplier);

  // Ensure we don't go below floor
  newPrice = Math.max(floorPrice, newPrice);

  // Determine decision type
  const priceChange = currentPrice - newPrice;
  let action, reason;

  if (newPrice === floorPrice && currentPrice > floorPrice) {
    action = 'decrease';
    reason = 'Reached floor price';
  } else if (priceChange > 0) {
    action = 'decrease';
    const reasons = [];
    if (factors.baseDecay > 0) reasons.push('base decay');
    if (factors.viewerAdjustment > 0) reasons.push(`${viewerCount} viewers`);
    if (factors.shieldAdjustment > 0) reasons.push(`${openShields} shields`);
    if (factors.timeAdjustment > 0) reasons.push('time pressure');
    reason = `Price decreased due to: ${reasons.join(', ')}`;
  } else {
    action = 'maintain';
    reason = 'Price at floor, no change';
  }

  return {
    price: newPrice,
    decision: {
      action,
      reason,
      factors
    }
  };
}
