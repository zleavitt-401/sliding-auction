/**
 * cleanupShieldsOnDisconnect Cloud Function
 * Closes shields when user disconnects from presence tracking
 *
 * Triggered when /presence/{auctionId}/live/{userId} is deleted in RTDB
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Closes open shields when user disconnects
 * @param {DataSnapshot} snapshot - The deleted presence snapshot
 * @param {EventContext} context - Event context with params
 */
exports.cleanupShieldsOnDisconnect = functions.database
  .ref('/presence/{auctionId}/live/{userId}')
  .onDelete(async (snapshot, context) => {
    const auctionId = context.params.auctionId;
    const userId = context.params.userId;

    console.log(`[cleanupShields] User ${userId} disconnected from auction ${auctionId}`);

    try {
      // Get shield document for this user
      const shieldRef = db.collection('auctions')
        .doc(auctionId)
        .collection('shields')
        .doc(userId);

      const shieldDoc = await shieldRef.get();

      if (!shieldDoc.exists) {
        console.log(`[cleanupShields] No shield found for user ${userId} in auction ${auctionId}`);
        return null;
      }

      const shield = shieldDoc.data();

      // Only close if shield is currently open
      if (shield.isOpen) {
        await shieldRef.update({
          isOpen: false,
          lastClosedAt: Date.now(),
          closedReason: 'user_disconnected'
        });

        console.log(`[cleanupShields] Closed shield for user ${userId} in auction ${auctionId}`);
      } else {
        console.log(`[cleanupShields] Shield for user ${userId} was already closed`);
      }

      return null;

    } catch (error) {
      console.error(`[cleanupShields] Error closing shield for user ${userId}:`, error);
      // Don't throw - we don't want to retry this operation
      return null;
    }
  });
