/**
 * purchaseAuction Cloud Function
 * Handles atomic purchase validation with race condition protection
 *
 * Uses Firestore transactions to ensure:
 * - Only one user can win an auction
 * - Balance is sufficient
 * - Shield is open at time of purchase
 * - Auction is still live
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * T169: HTTPS Callable Function for purchasing an auction
 * @param {Object} data - { auctionId, expectedPrice }
 * @param {Object} context - Auth context
 */
exports.purchaseAuction = functions.https.onCall(async (data, context) => {
  console.log('[purchaseAuction] Function called');

  // T170: Validate user authentication
  if (!context.auth) {
    console.error('[purchaseAuction] Unauthenticated request');
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to purchase an auction'
    );
  }

  const userId = context.auth.uid;

  // T171: Extract parameters
  const { auctionId, expectedPrice } = data;

  if (!auctionId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameter: auctionId'
    );
  }

  if (typeof expectedPrice !== 'number' || expectedPrice < 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid expectedPrice: must be a positive number'
    );
  }

  console.log(`[purchaseAuction] User ${userId} attempting to purchase auction ${auctionId}`);
  console.log(`[purchaseAuction] Expected price: $${(expectedPrice / 100).toFixed(2)}`);

  try {
    // T172-T181: Execute atomic transaction
    const result = await db.runTransaction(async (transaction) => {
      // T172: Read all necessary documents in transaction
      const auctionRef = db.collection('auctions').doc(auctionId);
      const userRef = db.collection('users').doc(userId);
      const shieldRef = db.collection('auctions').doc(auctionId)
        .collection('shields').doc(userId);

      const auctionDoc = await transaction.get(auctionRef);
      const userDoc = await transaction.get(userRef);
      const shieldDoc = await transaction.get(shieldRef);

      // Validate documents exist
      if (!auctionDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Auction not found'
        );
      }

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User account not found'
        );
      }

      const auction = auctionDoc.data();
      const user = userDoc.data();
      const shield = shieldDoc.exists ? shieldDoc.data() : null;

      // T173: Validate auction status is "live"
      if (auction.status !== 'live') {
        console.log(`[purchaseAuction] Auction ${auctionId} not live: ${auction.status}`);
        throw new functions.https.HttpsError(
          'failed-precondition',
          auction.status === 'ended - sold'
            ? 'This auction has already been won by another user'
            : `Auction is not live (status: ${auction.status})`
        );
      }

      // T174: Validate shield is open
      const now = Date.now();

      if (!shield || !shield.isOpen) {
        console.log(`[purchaseAuction] Shield not open for user ${userId}`);
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Your shield must be open to purchase. Open your shield and try again.'
        );
      }

      // Check shield timing (server-side validation)
      const openedAt = shield.openedAt?.toMillis ? shield.openedAt.toMillis() : shield.openedAt;
      const closesAt = shield.closesAt?.toMillis ? shield.closesAt.toMillis() : shield.closesAt;

      if (!openedAt || !closesAt) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Invalid shield timing data'
        );
      }

      if (now < openedAt || now > closesAt) {
        console.log(`[purchaseAuction] Shield timing invalid: now=${now}, open=${openedAt}, close=${closesAt}`);
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Your shield window has closed. Try again with a new shield.'
        );
      }

      const currentPrice = auction.currentPrice;

      // T175: Validate user balance >= auction.currentPrice
      const userBalance = user.balance || 0;

      if (userBalance < currentPrice) {
        console.log(`[purchaseAuction] Insufficient balance: ${userBalance} < ${currentPrice}`);
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Insufficient balance. You have $${(userBalance / 100).toFixed(2)}, ` +
          `but the current price is $${(currentPrice / 100).toFixed(2)}.`
        );
      }

      // T176-T177: Check price change
      if (currentPrice > expectedPrice) {
        // Price went UP - reject to protect user
        console.log(`[purchaseAuction] Price increased: ${currentPrice} > ${expectedPrice}`);
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Price has changed. Expected $${(expectedPrice / 100).toFixed(2)}, ` +
          `but current price is $${(currentPrice / 100).toFixed(2)}. ` +
          `Please try again.`
        );
      }

      // Price is same or lower - allow purchase at current price
      // If price went down, user benefits!
      const finalPrice = currentPrice;

      console.log(`[purchaseAuction] Purchase approved for user ${userId}`);
      console.log(`[purchaseAuction] Final price: $${(finalPrice / 100).toFixed(2)}`);

      // T178: Update auction - mark as ended with winner
      transaction.update(auctionRef, {
        status: 'ended - sold',
        winner: userId,
        winnerEmail: user.email || 'Unknown',
        finalPrice: finalPrice,
        endedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // T179: Deduct balance from user
      const newBalance = userBalance - finalPrice;
      transaction.update(userRef, {
        balance: newBalance
      });

      // T180: Create transaction record
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId: userId,
        type: 'purchase',
        amount: -finalPrice, // Negative because it's a deduction
        balanceAfter: newBalance,
        auctionId: auctionId,
        itemName: auction.itemName || 'Unknown Item',
        description: `Purchased: ${auction.itemName || 'auction item'}`,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Close the shield after purchase
      transaction.update(shieldRef, {
        isOpen: false,
        lastClosedAt: now
      });

      // T182: Return success data
      return {
        success: true,
        finalPrice: finalPrice,
        newBalance: newBalance,
        transactionId: transactionRef.id,
        itemName: auction.itemName
      };
    });

    // T181: Transaction committed successfully
    console.log(`[purchaseAuction] Purchase successful for user ${userId}`);
    console.log(`[purchaseAuction] Transaction ID: ${result.transactionId}`);

    return result;

  } catch (error) {
    // T183: Handle errors
    console.error('[purchaseAuction] Error during purchase:', error);

    // If it's already a functions error, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Otherwise, wrap it in a generic error
    throw new functions.https.HttpsError(
      'internal',
      `Purchase failed: ${error.message}`
    );
  }
});
