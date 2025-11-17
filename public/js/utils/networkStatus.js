/**
 * Network Status Utilities
 * Handles online/offline detection and connection status
 */

/**
 * Shows a notification banner
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, warning, error)
 */
export function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existing = document.querySelector('.network-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `network-notification network-notification--${type}`;
  notification.textContent = message;
  notification.setAttribute('role', 'alert');
  notification.setAttribute('aria-live', 'polite');

  // Add to body
  document.body.appendChild(notification);

  // Auto-remove success notifications after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

/**
 * Setup online/offline event listeners
 */
export function setupNetworkListeners() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  console.log('[Network] Listeners initialized');
}

/**
 * Handle online event
 */
function handleOnline() {
  console.log('[Network] Back online');
  showNotification('Connection restored', 'success');

  // Trigger custom event for components to react
  window.dispatchEvent(new CustomEvent('networkStatusChange', {
    detail: { isOnline: true }
  }));
}

/**
 * Handle offline event
 */
function handleOffline() {
  console.log('[Network] Offline');
  showNotification('Connection lost. Retrying...', 'warning');

  // Trigger custom event for components to react
  window.dispatchEvent(new CustomEvent('networkStatusChange', {
    detail: { isOnline: false }
  }));
}

/**
 * Check if currently online
 * @returns {boolean} Online status
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Cleanup network listeners
 */
export function cleanupNetworkListeners() {
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  console.log('[Network] Listeners cleaned up');
}
