/**
 * useUser Hook
 * Provides real-time user data including balance
 */

import {
  doc,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const { useState, useEffect } = React;

/**
 * User data hook with real-time Firestore listener
 * @returns {Object} User data and state
 */
export function useUser() {
  const [userData, setUserData] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.db || !window.currentUserId) {
      setLoading(false);
      return;
    }

    const userId = window.currentUserId;
    const userRef = doc(window.db, 'users', userId);

    // Listen to user document for real-time updates
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserData({ id: snapshot.id, ...data });
          setBalance(data.balance || 0);
          setLoading(false);
          setError(null);
        } else {
          setError('User document not found');
          setLoading(false);
        }
      },
      (err) => {
        console.error('[useUser] Error listening to user data:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    userData,
    balance,
    loading,
    error,
    hasBalance: balance > 0
  };
}
