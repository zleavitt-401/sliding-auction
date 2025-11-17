/**
 * useFirestore Hook
 * Provides Firestore real-time listeners and query utilities
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import { parseDoc, parseSnapshot } from '../utils/firestore.js';

const { useState, useEffect } = React;

/**
 * Subscribe to a Firestore document with real-time updates
 * @param {string} collectionName - Collection name
 * @param {string} documentId - Document ID
 * @returns {Object} Document data, loading state, and error
 */
export function useDocument(collectionName, documentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.db) {
      console.error('[useDocument] Firestore not initialized');
      setError('Firestore not initialized');
      setLoading(false);
      return;
    }

    if (!documentId) {
      setLoading(false);
      return;
    }

    console.log(`[useDocument] Subscribing to ${collectionName}/${documentId}`);

    const docRef = doc(window.db, collectionName, documentId);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        const docData = parseDoc(snapshot);
        setData(docData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[useDocument] Error subscribing to ${collectionName}/${documentId}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log(`[useDocument] Unsubscribing from ${collectionName}/${documentId}`);
      unsubscribe();
    };
  }, [collectionName, documentId]);

  return { data, loading, error };
}

/**
 * Subscribe to a Firestore collection with real-time updates
 * @param {string} collectionName - Collection name
 * @param {Array} queryConstraints - Optional query constraints
 * @returns {Object} Collection data, loading state, and error
 */
export function useCollection(collectionName, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.db) {
      console.error('[useCollection] Firestore not initialized');
      setError('Firestore not initialized');
      setLoading(false);
      return;
    }

    console.log(`[useCollection] Subscribing to ${collectionName} with ${queryConstraints.length} constraints`);

    const collectionRef = collection(window.db, collectionName);
    const q = queryConstraints.length > 0
      ? query(collectionRef, ...queryConstraints)
      : collectionRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = parseSnapshot(snapshot);
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[useCollection] Error subscribing to ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log(`[useCollection] Unsubscribing from ${collectionName}`);
      unsubscribe();
    };
  }, [collectionName, JSON.stringify(queryConstraints)]); // Stringify for dependency comparison

  return { data, loading, error };
}

/**
 * Subscribe to a Firestore subcollection with real-time updates
 * @param {string} parentCollection - Parent collection name
 * @param {string} parentId - Parent document ID
 * @param {string} subcollectionName - Subcollection name
 * @param {Array} queryConstraints - Optional query constraints
 * @returns {Object} Subcollection data, loading state, and error
 */
export function useSubcollection(parentCollection, parentId, subcollectionName, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.db) {
      console.error('[useSubcollection] Firestore not initialized');
      setError('Firestore not initialized');
      setLoading(false);
      return;
    }

    if (!parentId) {
      setLoading(false);
      return;
    }

    console.log(`[useSubcollection] Subscribing to ${parentCollection}/${parentId}/${subcollectionName}`);

    const subcollectionRef = collection(
      window.db,
      parentCollection,
      parentId,
      subcollectionName
    );

    const q = queryConstraints.length > 0
      ? query(subcollectionRef, ...queryConstraints)
      : subcollectionRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = parseSnapshot(snapshot);
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[useSubcollection] Error subscribing to subcollection:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      console.log(`[useSubcollection] Unsubscribing from ${parentCollection}/${parentId}/${subcollectionName}`);
      unsubscribe();
    };
  }, [parentCollection, parentId, subcollectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}

/**
 * Fetch a single document once (no real-time updates)
 * @param {string} collectionName - Collection name
 * @param {string} documentId - Document ID
 * @returns {Object} Document data, loading state, and error
 */
export function useFetchDocument(collectionName, documentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.db || !documentId) {
      setLoading(false);
      return;
    }

    const fetchDocument = async () => {
      try {
        const docRef = doc(window.db, collectionName, documentId);
        const snapshot = await getDoc(docRef);
        const docData = parseDoc(snapshot);
        setData(docData);
        setError(null);
      } catch (err) {
        console.error(`[useFetchDocument] Error fetching ${collectionName}/${documentId}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [collectionName, documentId]);

  return { data, loading, error };
}

/**
 * Fetch a collection once (no real-time updates)
 * @param {string} collectionName - Collection name
 * @param {Array} queryConstraints - Optional query constraints
 * @returns {Object} Collection data, loading state, and error
 */
export function useFetchCollection(collectionName, queryConstraints = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.db) {
      setLoading(false);
      return;
    }

    const fetchCollection = async () => {
      try {
        const collectionRef = collection(window.db, collectionName);
        const q = queryConstraints.length > 0
          ? query(collectionRef, ...queryConstraints)
          : collectionRef;

        const snapshot = await getDocs(q);
        const docs = parseSnapshot(snapshot);
        setData(docs);
        setError(null);
      } catch (err) {
        console.error(`[useFetchCollection] Error fetching ${collectionName}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionName, JSON.stringify(queryConstraints)]);

  return { data, loading, error };
}

/**
 * Export Firestore query builders for use with hooks
 */
export const firestoreQuery = {
  where,
  orderBy,
  limit
};
