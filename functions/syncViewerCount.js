/**
 * syncViewerCount Cloud Function
 * Syncs viewer count from Realtime Database to Firestore
 *
 * Triggered when /auctionViewerCounts/{auctionId} updates in RTDB
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const rtdb = admin.database();

/**
 * Syncs viewer count from Realtime Database to Firestore
 * @param {DataSnapshot} change - Before and after snapshots
 * @param {EventContext} context - Event context with params
 */
exports.syncViewerCount = functions.database
  .ref('/auctionViewerCounts/{auctionId}')
  .onUpdate(async (change, context) => {
    const auctionId = context.params.auctionId;
    const count = change.after.val() || 0;

    console.log(`[syncViewerCount] Syncing count ${count} for auction ${auctionId}`);

    try {
      // Update Firestore auction document with viewer count
      await db.collection('auctions').doc(auctionId).update({
        viewerCount: count,
        lastViewerUpdate: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[syncViewerCount] Successfully synced viewer count for auction ${auctionId}`);
      return null;

    } catch (error) {
      console.error(`[syncViewerCount] Error syncing viewer count for auction ${auctionId}:`, error);
      // Don't throw - we don't want to retry this operation
      return null;
    }
  });
