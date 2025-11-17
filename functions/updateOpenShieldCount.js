/**
 * updateOpenShieldCount Cloud Function
 * Updates open shield count for all live auctions every 5 seconds
 *
 * Counts shields with isOpen=true and updates auction documents
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Updates open shield count for all live auctions
 * Scheduled to run every 5 seconds via Cloud Scheduler
 */
exports.updateOpenShieldCount = functions.pubsub
  .schedule('every 5 seconds')
  .onRun(async (context) => {
    console.log('[updateOpenShieldCount] Starting shield count update...');

    try {
      // Get all live auctions from Firestore
      const auctionsSnapshot = await db.collection('auctions')
        .where('status', '==', 'live')
        .get();

      if (auctionsSnapshot.empty) {
        console.log('[updateOpenShieldCount] No live auctions found');
        return null;
      }

      console.log(`[updateOpenShieldCount] Found ${auctionsSnapshot.size} live auctions`);

      // For each live auction, count open shields
      for (const auctionDoc of auctionsSnapshot.docs) {
        const auctionId = auctionDoc.id;

        try {
          // Query shields subcollection for open shields
          const shieldsSnapshot = await db.collection('auctions')
            .doc(auctionId)
            .collection('shields')
            .where('isOpen', '==', true)
            .get();

          const count = shieldsSnapshot.size;

          // Update auction document with open shield count
          await db.collection('auctions').doc(auctionId).update({
            openShieldCount: count,
            lastShieldUpdate: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`[updateOpenShieldCount] Auction ${auctionId}: ${count} open shields`);

        } catch (error) {
          console.error(`[updateOpenShieldCount] Error counting shields for auction ${auctionId}:`, error);
          // Continue with next auction
        }
      }

      console.log('[updateOpenShieldCount] Shield count update complete');
      return null;

    } catch (error) {
      console.error('[updateOpenShieldCount] Fatal error during shield count update:', error);
      // Don't throw - we want the schedule to continue
      return null;
    }
  });
