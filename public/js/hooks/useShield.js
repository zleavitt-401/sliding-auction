/**
 * useShield Hook
 * Manages shield state for an auction
 */

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const { useState, useEffect, useCallback } = React;

// Shield states
export const SHIELD_STATES = {
  CLOSED: 'closed',
  OPENING: 'opening',
  OPEN: 'open',
  COOLDOWN: 'cooldown'
};

const SHIELD_DURATION = 5; // 5 seconds
const COOLDOWN_DURATION = 5; // 5 seconds

/**
 * Shield management hook
 * @param {string} auctionId - Auction ID
 * @returns {Object} Shield state and controls
 */
export function useShield(auctionId) {
  const [shieldState, setShieldState] = useState(SHIELD_STATES.CLOSED);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Listen to shield document for this user
  useEffect(() => {
    if (!window.db || !window.currentUserId || !auctionId) {
      return;
    }

    const userId = window.currentUserId;
    const shieldRef = doc(window.db, 'auctions', auctionId, 'shields', userId);

    const unsubscribe = onSnapshot(shieldRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();

        if (data.isOpen) {
          // Shield is open - calculate time remaining
          const closesAt = data.closesAt?.toMillis ? data.closesAt.toMillis() : data.closesAt;
          const now = Date.now();
          const remaining = Math.max(0, Math.floor((closesAt - now) / 1000));

          if (remaining > 0) {
            setShieldState(SHIELD_STATES.OPEN);
            setTimeRemaining(remaining);
          } else {
            // Shield should have closed
            closeShield();
          }
        } else if (data.lastClosedAt) {
          // Shield is closed - check if in cooldown
          const lastClosed = data.lastClosedAt?.toMillis ? data.lastClosedAt.toMillis() : data.lastClosedAt;
          const now = Date.now();
          const timeSinceClosed = (now - lastClosed) / 1000;

          if (timeSinceClosed < COOLDOWN_DURATION) {
            setShieldState(SHIELD_STATES.COOLDOWN);
            setTimeRemaining(Math.ceil(COOLDOWN_DURATION - timeSinceClosed));
          } else {
            setShieldState(SHIELD_STATES.CLOSED);
            setTimeRemaining(0);
          }
        } else {
          setShieldState(SHIELD_STATES.CLOSED);
          setTimeRemaining(0);
        }
      } else {
        setShieldState(SHIELD_STATES.CLOSED);
        setTimeRemaining(0);
      }
    }, (err) => {
      console.error('[useShield] Error listening to shield:', err);
      setError(err.message);
    });

    return () => unsubscribe();
  }, [auctionId]);

  // Timer for countdown
  useEffect(() => {
    if (shieldState === SHIELD_STATES.OPEN || shieldState === SHIELD_STATES.COOLDOWN) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (shieldState === SHIELD_STATES.OPEN) {
              // Auto-close shield when time runs out
              closeShield();
            } else if (shieldState === SHIELD_STATES.COOLDOWN) {
              setShieldState(SHIELD_STATES.CLOSED);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [shieldState]);

  /**
   * Open the shield
   */
  const openShield = useCallback(async () => {
    if (!window.db || !window.currentUserId || !auctionId) {
      setError('Not authenticated');
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Optimistic update
      setShieldState(SHIELD_STATES.OPENING);

      const userId = window.currentUserId;
      const shieldRef = doc(window.db, 'auctions', auctionId, 'shields', userId);

      // Calculate open and close times
      const now = Date.now();
      const closesAt = new Date(now + SHIELD_DURATION * 1000);

      // Write to Firestore
      await setDoc(shieldRef, {
        userId,
        isOpen: true,
        openedAt: serverTimestamp(),
        closesAt,
        lastClosedAt: null
      }, { merge: true });

      console.log('[useShield] Shield opened successfully');

      // Transition to open state after animation
      setTimeout(() => {
        setShieldState(SHIELD_STATES.OPEN);
        setTimeRemaining(SHIELD_DURATION);
      }, 500); // Match opening animation duration

      // Haptic feedback (Android)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

    } catch (err) {
      console.error('[useShield] Error opening shield:', err);
      setError(err.message);
      setShieldState(SHIELD_STATES.CLOSED);
    } finally {
      setIsProcessing(false);
    }
  }, [auctionId, isProcessing]);

  /**
   * Close the shield
   */
  const closeShield = useCallback(async () => {
    if (!window.db || !window.currentUserId || !auctionId) {
      return;
    }

    try {
      const userId = window.currentUserId;
      const shieldRef = doc(window.db, 'auctions', auctionId, 'shields', userId);

      // Write to Firestore
      await setDoc(shieldRef, {
        userId,
        isOpen: false,
        openedAt: null,
        closesAt: null,
        lastClosedAt: serverTimestamp()
      }, { merge: true });

      console.log('[useShield] Shield closed');

      // Set cooldown state
      setShieldState(SHIELD_STATES.COOLDOWN);
      setTimeRemaining(COOLDOWN_DURATION);

    } catch (err) {
      console.error('[useShield] Error closing shield:', err);
      setError(err.message);
    }
  }, [auctionId]);

  /**
   * Check if user can open shield (not in cooldown)
   */
  const canOpenShield = useCallback(async () => {
    if (!window.db || !window.currentUserId || !auctionId) {
      return false;
    }

    if (shieldState !== SHIELD_STATES.CLOSED) {
      return false;
    }

    const userId = window.currentUserId;
    const shieldRef = doc(window.db, 'auctions', auctionId, 'shields', userId);

    try {
      const snapshot = await getDoc(shieldRef);

      if (!snapshot.exists()) {
        return true; // First time opening
      }

      const data = snapshot.data();

      if (!data.lastClosedAt) {
        return true;
      }

      const lastClosed = data.lastClosedAt?.toMillis ? data.lastClosedAt.toMillis() : data.lastClosedAt;
      const now = Date.now();
      const timeSinceClosed = (now - lastClosed) / 1000;

      return timeSinceClosed >= COOLDOWN_DURATION;
    } catch (err) {
      console.error('[useShield] Error checking cooldown:', err);
      return false;
    }
  }, [auctionId, shieldState]);

  return {
    shieldState,
    timeRemaining,
    error,
    isProcessing,
    openShield,
    closeShield,
    canOpenShield,
    isOpen: shieldState === SHIELD_STATES.OPEN,
    isOpening: shieldState === SHIELD_STATES.OPENING,
    isCooldown: shieldState === SHIELD_STATES.COOLDOWN,
    isClosed: shieldState === SHIELD_STATES.CLOSED
  };
}
