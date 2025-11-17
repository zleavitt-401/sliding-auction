/**
 * aggregatePresence Cloud Function
 * Aggregates presence count for all live auctions every 5 seconds
 *
 * Counts users in /presence/{auctionId}/live and writes to /auctionViewerCounts
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const rtdb = admin.database();

/**
 * Aggregates presence count for all live auctions
 * Scheduled to run every 5 seconds via Cloud Scheduler
 */
exports.aggregatePresence = functions.pubsub
  .schedule('every 5 seconds')
  .onRun(async (context) => {
    console.log('[aggregatePresence] Starting presence aggregation...');

    try {
      // Get all live auctions from Firestore
      const auctionsSnapshot = await db.collection('auctions')
        .where('status', '==', 'live')
        .get();

      if (auctionsSnapshot.empty) {
        console.log('[aggregatePresence] No live auctions found');
        return null;
      }

      console.log(`[aggregatePresence] Found ${auctionsSnapshot.size} live auctions`);

      const updates = [];

      // For each live auction, count presence in RTDB
      for (const auctionDoc of auctionsSnapshot.docs) {
        const auctionId = auctionDoc.id;

        try {
          // Get presence count from Realtime Database
          const presenceRef = rtdb.ref(`presence/${auctionId}/live`);
          const snapshot = await presenceRef.once('value');

          // Count number of children (online users)
          const count = snapshot.numChildren();

          // Write count to auctionViewerCounts
          // This will trigger syncViewerCount function
          await rtdb.ref(`auctionViewerCounts/${auctionId}`).set(count);

          console.log(`[aggregatePresence] Auction ${auctionId}: ${count} viewers`);

        } catch (error) {
          console.error(`[aggregatePresence] Error counting viewers for auction ${auctionId}:`, error);
          // Continue with next auction
        }
      }

      console.log('[aggregatePresence] Aggregation complete');
      return null;

    } catch (error) {
      console.error('[aggregatePresence] Fatal error during aggregation:', error);
      // Don't throw - we want the schedule to continue
      return null;
    }
  });
