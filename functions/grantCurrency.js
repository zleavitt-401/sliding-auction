/**
 * grantCurrency Cloud Function
 * Admin function to grant fictional currency to users
 *
 * Validates admin permissions and atomically updates user balance
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * T210: HTTPS Callable Function for granting currency to users
 * @param {Object} data - { userId, amount }
 * @param {Object} context - Auth context (must be admin)
 */
exports.grantCurrency = functions.https.onCall(async (data, context) => {
  console.log('[grantCurrency] Function called');

  // T211: Validate admin authentication
  // For MVP, we accept any authenticated user
  // TODO Post-MVP: Check custom claims for admin role
  if (!context.auth) {
    console.error('[grantCurrency] Unauthenticated request');
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to grant currency'
    );
  }

  const adminId = context.auth.uid;
  const adminEmail = context.auth.token.email || 'Unknown admin';

  // TODO Post-MVP: Validate admin role
  // if (!context.auth.token.admin) {
  //   throw new functions.https.HttpsError(
  //     'permission-denied',
  //     'Only admins can grant currency'
  //   );
  // }

  // T212: Extract parameters
  const { userId, amount } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameter: userId'
    );
  }

  if (typeof amount !== 'number') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid amount: must be a number'
    );
  }

  // T213: Validate amount range
  if (amount < 100 || amount > 10000000) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Amount must be between $1.00 and $100,000.00 (100 to 10000000 cents)'
    );
  }

  console.log(`[grantCurrency] Admin ${adminEmail} granting $${(amount / 100).toFixed(2)} to user ${userId}`);

  try {
    // T214-T215: Execute atomic transaction
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }

      const user = userDoc.data();
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + amount;

      // T214: Update user balance
      transaction.update(userRef, {
        balance: newBalance,
        lastGrantAt: admin.firestore.FieldValue.serverTimestamp(),
        lastGrantBy: adminId
      });

      // T215: Create transaction record
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId: userId,
        type: 'admin_grant',
        amount: amount, // Positive for grant
        balanceAfter: newBalance,
        description: `Admin grant: $${(amount / 100).toFixed(2)}`,
        grantedBy: adminId,
        grantedByEmail: adminEmail,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[grantCurrency] Granted $${(amount / 100).toFixed(2)} to ${user.email || userId}`);
      console.log(`[grantCurrency] New balance: $${(newBalance / 100).toFixed(2)}`);

      // T216: Return success response
      return {
        success: true,
        newBalance: newBalance,
        transactionId: transactionRef.id,
        userEmail: user.email || 'Unknown',
        amountGranted: amount
      };
    });

    console.log(`[grantCurrency] Transaction successful: ${result.transactionId}`);
    return result;

  } catch (error) {
    console.error('[grantCurrency] Error granting currency:', error);

    // If it's already a functions error, re-throw it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Otherwise, wrap it in a generic error
    throw new functions.https.HttpsError(
      'internal',
      `Failed to grant currency: ${error.message}`
    );
  }
});
