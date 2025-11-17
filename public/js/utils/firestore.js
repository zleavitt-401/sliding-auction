/**
 * Firestore utility functions and helpers
 */

/**
 * Create a standardized error message from Firestore error
 * @param {Error} error - Firestore error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (!error) return 'An unknown error occurred';

  const errorMessages = {
    'permission-denied': 'You do not have permission to perform this action.',
    'unauthenticated': 'Please log in to continue.',
    'not-found': 'The requested resource was not found.',
    'already-exists': 'This resource already exists.',
    'resource-exhausted': 'Service is temporarily unavailable. Please try again later.',
    'failed-precondition': error.message || 'Operation cannot be completed at this time.',
    'aborted': 'Operation was aborted. Please try again.',
    'out-of-range': 'Invalid input value.',
    'unimplemented': 'This feature is not yet implemented.',
    'internal': 'An internal error occurred. Please try again.',
    'unavailable': 'Service is temporarily unavailable. Please try again.',
    'data-loss': 'Data loss detected. Please contact support.',
    'deadline-exceeded': 'Operation timed out. Please try again.',
  };

  // Check for Firestore error code
  if (error.code) {
    const code = error.code.replace('firestore/', '').replace('auth/', '');
    return errorMessages[code] || error.message || 'An error occurred';
  }

  return error.message || 'An error occurred';
}

/**
 * Retry a Firestore operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {number} maxAttempts - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in ms (will be exponentially increased)
 * @returns {Promise} Result of the operation
 */
export async function retryOperation(operation, maxAttempts = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      const noRetryErrors = ['permission-denied', 'unauthenticated', 'not-found', 'failed-precondition'];
      const errorCode = error.code ? error.code.replace('firestore/', '').replace('auth/', '') : '';

      if (noRetryErrors.includes(errorCode)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));

      console.log(`Retrying operation (attempt ${attempt + 1}/${maxAttempts})...`);
    }
  }

  throw lastError;
}

/**
 * Batch write operations (max 500 per batch as per Firestore limits)
 * @param {Array} operations - Array of {type: 'set'|'update'|'delete', ref, data?}
 * @param {Object} db - Firestore instance
 * @returns {Promise} Resolves when all batches are committed
 */
export async function batchWrite(operations, db) {
  const BATCH_SIZE = 500;
  const batches = [];

  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batchOps = operations.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    batchOps.forEach(op => {
      switch (op.type) {
        case 'set':
          batch.set(op.ref, op.data);
          break;
        case 'update':
          batch.update(op.ref, op.data);
          break;
        case 'delete':
          batch.delete(op.ref);
          break;
        default:
          throw new Error(`Unknown batch operation type: ${op.type}`);
      }
    });

    batches.push(batch.commit());
  }

  return Promise.all(batches);
}

/**
 * Check if user is online (for presence detection)
 * @returns {boolean} True if online
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Listen to online/offline status changes
 * @param {Function} callback - Called with boolean (true = online, false = offline)
 * @returns {Function} Cleanup function to remove listeners
 */
export function onConnectionChange(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Debounce function for rate-limiting updates
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate-limiting updates
 * @param {Function} func - Function to throttle
 * @param {number} limit - Min time between calls in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sanitize HTML to prevent XSS (basic sanitization)
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Parse Firestore document to plain object
 * @param {Object} doc - Firestore document snapshot
 * @returns {Object} Plain object with id and data
 */
export function parseDoc(doc) {
  if (!doc || !doc.exists()) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Parse Firestore query snapshot to array of plain objects
 * @param {Object} snapshot - Firestore query snapshot
 * @returns {Array} Array of plain objects
 */
export function parseSnapshot(snapshot) {
  if (!snapshot || snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(parseDoc);
}
