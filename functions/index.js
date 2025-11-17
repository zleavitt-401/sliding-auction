/**
 * Cloud Functions for Sliding Auction Platform
 * Entry point for all Firebase Cloud Functions
 */

const updateAuctionPrice = require('./updateAuctionPrice');
const purchaseAuction = require('./purchaseAuction');
const grantCurrency = require('./grantCurrency');
const syncViewerCount = require('./syncViewerCount');
const aggregatePresence = require('./aggregatePresence');
const updateOpenShieldCount = require('./updateOpenShieldCount');
const cleanupShieldsOnDisconnect = require('./cleanupShieldsOnDisconnect');

// Export all functions
exports.updateAuctionPrice = updateAuctionPrice.updateAuctionPrice;
exports.purchaseAuction = purchaseAuction.purchaseAuction;
exports.grantCurrency = grantCurrency.grantCurrency;
exports.syncViewerCount = syncViewerCount.syncViewerCount;
exports.aggregatePresence = aggregatePresence.aggregatePresence;
exports.updateOpenShieldCount = updateOpenShieldCount.updateOpenShieldCount;
exports.cleanupShieldsOnDisconnect = cleanupShieldsOnDisconnect.cleanupShieldsOnDisconnect;
