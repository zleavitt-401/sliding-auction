/**
 * useAuctions Hook
 * Provides real-time auction data with filtering by status
 */

import { useCollection, firestoreQuery } from './useFirestore.js';

const { useState, useEffect, useMemo } = React;

/**
 * Fetch auctions with real-time updates
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status ('all', 'scheduled', 'live', or specific ended status)
 * @param {number} options.limit - Limit number of results
 * @param {string} options.orderBy - Order by field ('startTime', 'createdAt', 'currentPrice')
 * @param {string} options.orderDirection - Order direction ('asc' or 'desc')
 * @returns {Object} Auctions data, loading state, and error
 */
export function useAuctions(options = {}) {
  const {
    status = 'all',
    limit: limitCount = null,
    orderBy: orderByField = 'createdAt',
    orderDirection = 'desc'
  } = options;

  // Build query constraints based on options
  const queryConstraints = useMemo(() => {
    const constraints = [];

    // Status filter
    if (status !== 'all') {
      constraints.push(firestoreQuery.where('status', '==', status));
    }

    // Order by
    constraints.push(firestoreQuery.orderBy(orderByField, orderDirection));

    // Limit
    if (limitCount) {
      constraints.push(firestoreQuery.limit(limitCount));
    }

    return constraints;
  }, [status, limitCount, orderByField, orderDirection]);

  // Use collection hook with query constraints
  const { data, loading, error } = useCollection('auctions', queryConstraints);

  return { auctions: data, loading, error };
}

/**
 * Fetch active/live auctions only
 * @param {number} limit - Optional limit
 * @returns {Object} Active auctions, loading state, and error
 */
export function useActiveAuctions(limit = null) {
  return useAuctions({
    status: 'live',
    orderBy: 'startTime',
    orderDirection: 'desc',
    limit
  });
}

/**
 * Fetch scheduled/upcoming auctions only
 * @param {number} limit - Optional limit
 * @returns {Object} Scheduled auctions, loading state, and error
 */
export function useUpcomingAuctions(limit = null) {
  return useAuctions({
    status: 'scheduled',
    orderBy: 'createdAt',
    orderDirection: 'desc',
    limit
  });
}

/**
 * Fetch ended auctions only
 * @param {number} limit - Optional limit
 * @returns {Object} Ended auctions, loading state, and error
 */
export function useEndedAuctions(limit = null) {
  const { data, loading, error } = useCollection('auctions', [
    firestoreQuery.orderBy('endTime', 'desc'),
    ...(limit ? [firestoreQuery.limit(limit)] : [])
  ]);

  // Filter client-side for any 'ended' status
  const endedAuctions = useMemo(() => {
    return data.filter(auction => auction.status && auction.status.startsWith('ended'));
  }, [data]);

  return { auctions: endedAuctions, loading, error };
}

/**
 * Get auction statistics
 * @param {Array} auctions - Array of auction objects
 * @returns {Object} Statistics
 */
export function useAuctionStats(auctions) {
  return useMemo(() => {
    if (!auctions || auctions.length === 0) {
      return {
        total: 0,
        live: 0,
        scheduled: 0,
        ended: 0,
        totalViewers: 0
      };
    }

    return {
      total: auctions.length,
      live: auctions.filter(a => a.status === 'live').length,
      scheduled: auctions.filter(a => a.status === 'scheduled').length,
      ended: auctions.filter(a => a.status && a.status.startsWith('ended')).length,
      totalViewers: auctions
        .filter(a => a.status === 'live')
        .reduce((sum, a) => sum + (a.viewerCount || 0), 0)
    };
  }, [auctions]);
}

/**
 * Check if auction is ending soon (< 60 seconds remaining)
 * @param {Object} auction - Auction object
 * @returns {boolean} True if ending soon
 */
export function isAuctionEndingSoon(auction) {
  if (!auction || auction.status !== 'live' || !auction.startTime || !auction.duration) {
    return false;
  }

  const startTime = auction.startTime.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const endTime = startTime + (auction.duration * 1000);
  const now = Date.now();
  const timeRemaining = endTime - now;

  return timeRemaining > 0 && timeRemaining < 60000; // Less than 60 seconds
}

/**
 * Get time remaining for auction (in seconds)
 * @param {Object} auction - Auction object
 * @returns {number} Seconds remaining, or 0 if ended
 */
export function getTimeRemaining(auction) {
  if (!auction || auction.status !== 'live' || !auction.startTime || !auction.duration) {
    return 0;
  }

  const startTime = auction.startTime.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const endTime = startTime + (auction.duration * 1000);
  const now = Date.now();
  const timeRemaining = Math.max(0, Math.floor((endTime - now) / 1000));

  return timeRemaining;
}

/**
 * Get time until auction starts (in seconds)
 * @param {Object} auction - Auction object
 * @returns {number} Seconds until start, or 0 if already started
 */
export function getTimeUntilStart(auction) {
  if (!auction || auction.status !== 'scheduled' || !auction.startTime) {
    return 0;
  }

  const startTime = auction.startTime.toMillis ? auction.startTime.toMillis() : auction.startTime;
  const now = Date.now();
  const timeUntilStart = Math.max(0, Math.floor((startTime - now) / 1000));

  return timeUntilStart;
}
