/**
 * useAuth Hook
 * Provides authentication state and methods
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import { getErrorMessage } from '../utils/firestore.js';

const { useState, useEffect } = React;

/**
 * Authentication hook
 * @returns {Object} Auth state and methods
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    if (!window.auth) {
      console.error('[useAuth] Firebase auth not initialized');
      setLoading(false);
      return;
    }

    // Listen to custom auth state changed event from app.js
    const handleAuthChange = (event) => {
      setUser(event.detail.user);
      setLoading(false);
    };

    window.addEventListener('auth-state-changed', handleAuthChange);

    // Set initial state if already available
    if (window.currentUser) {
      setUser(window.currentUser);
      setLoading(false);
    } else {
      setLoading(false);
    }

    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChange);
    };
  }, []);

  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User credential
   */
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        window.auth,
        email,
        password
      );

      console.log('[useAuth] Login successful:', userCredential.user.email);
      return userCredential;

    } catch (err) {
      console.error('[useAuth] Login error:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} displayName - Optional display name
   * @returns {Promise<Object>} User credential
   */
  const register = async (email, password, displayName = null) => {
    try {
      setError(null);
      setLoading(true);

      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        window.auth,
        email,
        password
      );

      const user = userCredential.user;
      console.log('[useAuth] Registration successful:', user.email);

      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user document in Firestore
      const userDoc = doc(window.db, 'users', user.uid);
      await setDoc(userDoc, {
        email: user.email,
        displayName: displayName || user.email.split('@')[0],
        balance: 100000, // Starting balance: $1,000.00 in cents
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });

      console.log('[useAuth] User document created with starting balance');

      return userCredential;

    } catch (err) {
      console.error('[useAuth] Registration error:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout current user
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);

      await signOut(window.auth);
      console.log('[useAuth] Logout successful');

    } catch (err) {
      console.error('[useAuth] Logout error:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);

      await sendPasswordResetEmail(window.auth, email);
      console.log('[useAuth] Password reset email sent to:', email);

    } catch (err) {
      console.error('[useAuth] Password reset error:', err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  /**
   * Get current user's Firestore data
   * @returns {Promise<Object|null>} User data or null
   */
  const getUserData = async () => {
    if (!user) return null;

    try {
      const userDoc = doc(window.db, 'users', user.uid);
      const snapshot = await getDoc(userDoc);

      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }

      return null;

    } catch (err) {
      console.error('[useAuth] Error fetching user data:', err);
      return null;
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
    getUserData
  };
}
