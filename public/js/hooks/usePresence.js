/**
 * usePresence Hook
 * Manages user presence tracking with Firebase Realtime Database
 */

import {
  ref,
  onValue,
  onDisconnect,
  set,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const { useState, useEffect } = React;

/**
 * Track user presence in an auction
 * @param {string} auctionId - Auction ID
 * @param {string} context - Context (e.g., 'waiting', 'live')
 * @returns {Object} Viewer count
 */
export function usePresence(auctionId, context = 'live') {
  const [viewerCount, setViewerCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!window.rtdb || !window.currentUserId || !auctionId) {
      console.warn('[usePresence] Missing dependencies:', {
        rtdb: !!window.rtdb,
        userId: !!window.currentUserId,
        auctionId: !!auctionId
      });
      return;
    }

    const userId = window.currentUserId;
    const presencePath = `auctionPresence/${auctionId}/${userId}`;
    const presenceRef = ref(window.rtdb, presencePath);
    const auctionPresenceRef = ref(window.rtdb, `auctionPresence/${auctionId}`);

    console.log(`[usePresence] Tracking presence for auction ${auctionId}, context: ${context}`);

    // Set user as online
    const presenceData = {
      online: true,
      lastSeen: serverTimestamp(),
      context
    };

    set(presenceRef, presenceData)
      .then(() => {
        console.log('[usePresence] User marked as online');
        setIsOnline(true);
      })
      .catch((error) => {
        console.error('[usePresence] Error setting presence:', error);
      });

    // Set up disconnect handler (remove user when they leave)
    onDisconnect(presenceRef)
      .remove()
      .then(() => {
        console.log('[usePresence] Disconnect handler set');
      })
      .catch((error) => {
        console.error('[usePresence] Error setting disconnect handler:', error);
      });

    // Listen to all users in this auction
    const unsubscribe = onValue(auctionPresenceRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        const onlineUsers = Object.values(users).filter(user => user.online === true);
        setViewerCount(onlineUsers.length);
        console.log(`[usePresence] ${onlineUsers.length} viewers in auction ${auctionId}`);
      } else {
        setViewerCount(0);
        console.log(`[usePresence] No viewers in auction ${auctionId}`);
      }
    }, (error) => {
      console.error('[usePresence] Error listening to presence:', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('[usePresence] Cleaning up presence');
      unsubscribe();

      // Remove user from presence
      set(presenceRef, null)
        .catch((error) => {
          console.error('[usePresence] Error removing presence on cleanup:', error);
        });
    };
  }, [auctionId, context]);

  return { viewerCount, isOnline };
}

/**
 * Track global user presence (not auction-specific)
 * @returns {Object} Online status
 */
export function useGlobalPresence() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!window.rtdb || !window.currentUserId) {
      console.warn('[useGlobalPresence] Missing dependencies');
      return;
    }

    const userId = window.currentUserId;
    const presenceRef = ref(window.rtdb, `presence/${userId}`);

    // Set user as online
    const presenceData = {
      online: true,
      lastSeen: serverTimestamp()
    };

    set(presenceRef, presenceData)
      .then(() => {
        console.log('[useGlobalPresence] User marked as online globally');
        setIsOnline(true);
      })
      .catch((error) => {
        console.error('[useGlobalPresence] Error setting presence:', error);
      });

    // Set up disconnect handler
    onDisconnect(presenceRef)
      .set({
        online: false,
        lastSeen: serverTimestamp()
      })
      .then(() => {
        console.log('[useGlobalPresence] Disconnect handler set');
      })
      .catch((error) => {
        console.error('[useGlobalPresence] Error setting disconnect handler:', error);
      });

    // Cleanup
    return () => {
      set(presenceRef, {
        online: false,
        lastSeen: serverTimestamp()
      }).catch((error) => {
        console.error('[useGlobalPresence] Error cleaning up presence:', error);
      });
    };
  }, []);

  return { isOnline };
}

/**
 * Monitor connection status
 * @returns {Object} Connection state
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!window.rtdb) return;

    const connectedRef = ref(window.rtdb, '.info/connected');

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      setIsConnected(connected);
      console.log('[useConnectionStatus] Connection status:', connected ? 'connected' : 'disconnected');
    });

    return () => unsubscribe();
  }, []);

  return { isConnected };
}
