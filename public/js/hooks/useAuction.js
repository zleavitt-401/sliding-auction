/**
 * useAuction Hook
 * Provides real-time auction data including price history
 */

import { useDocument, useSubcollection, firestoreQuery } from './useFirestore.js';

const { useState, useEffect, useMemo } = React;

/**
 * Get real-time auction data with price history
 * @param {string} auctionId - Auction ID
 * @returns {Object} Auction data, price history, loading states, and errors
 */
export function useAuction(auctionId) {
  // Get auction document with real-time updates
  const { data: auction, loading: loadingAuction, error: errorAuction } = useDocument('auctions', auctionId);

  // Get price history (last 100 points, ordered by timestamp)
  const { data: priceHistory, loading: loadingHistory, error: errorHistory } = useSubcollection(
    'auctions',
    auctionId,
    'priceHistory',
    [
      firestoreQuery.orderBy('timestamp', 'asc'),
      firestoreQuery.limit(100)
    ]
  );

  const loading = loadingAuction || loadingHistory;
  const error = errorAuction || errorHistory;

  return {
    auction,
    priceHistory,
    loading,
    error
  };
}

/**
 * Get time remaining in auction (in seconds)
 * @param {Object} auction - Auction object
 * @returns {number} Seconds remaining
 */
export function getAuctionTimeRemaining(auction) {
  if (!auction || auction.status !== 'live' || !auction.startTime || !auction.duration) {
    return 0;
  }

  const startTime = auction.startTime.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const endTime = startTime + (auction.duration * 1000);
  const now = Date.now();

  return Math.max(0, Math.floor((endTime - now) / 1000));
}

/**
 * Get auction progress percentage (0-100)
 * @param {Object} auction - Auction object
 * @returns {number} Progress percentage
 */
export function getAuctionProgress(auction) {
  if (!auction || auction.status !== 'live' || !auction.startTime || !auction.duration) {
    return 0;
  }

  const startTime = auction.startTime.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const now = Date.now();
  const elapsed = now - startTime;
  const totalDuration = auction.duration * 1000;

  const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

  return Math.round(progress);
}

/**
 * Get price progress percentage (how far price has dropped)
 * @param {Object} auction - Auction object
 * @returns {number} Price drop percentage (0-100)
 */
export function getPriceProgress(auction) {
  if (!auction || !auction.currentPrice || !auction.startingPrice || !auction.floorPrice) {
    return 0;
  }

  const { currentPrice, startingPrice, floorPrice } = auction;
  const totalDrop = startingPrice - floorPrice;
  const currentDrop = startingPrice - currentPrice;

  if (totalDrop === 0) return 0;

  const progress = (currentDrop / totalDrop) * 100;

  return Math.min(100, Math.max(0, Math.round(progress)));
}

/**
 * Check if auction is ending soon (< 60 seconds)
 * @param {Object} auction - Auction object
 * @returns {boolean} True if ending soon
 */
export function isAuctionEndingSoon(auction) {
  const remaining = getAuctionTimeRemaining(auction);
  return remaining > 0 && remaining < 60;
}

/**
 * Check if price is near floor (within 10%)
 * @param {Object} auction - Auction object
 * @returns {boolean} True if near floor
 */
export function isPriceNearFloor(auction) {
  if (!auction || !auction.currentPrice || !auction.startingPrice || !auction.floorPrice) {
    return false;
  }

  const { currentPrice, startingPrice, floorPrice } = auction;
  const priceRange = startingPrice - floorPrice;
  const distanceFromFloor = currentPrice - floorPrice;

  return (distanceFromFloor / priceRange) < 0.1; // Within 10% of floor
}
