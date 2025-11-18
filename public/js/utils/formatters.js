/**
 * Utility functions for formatting dates, prices, and time values
 */

/**
 * Format price in cents to dollar string
 * @param {number} cents - Price in cents
 * @returns {string} Formatted price (e.g., "$1,234.56")
 */
export function formatPrice(cents) {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return '$0.00';
  }

  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

/**
 * Format timestamp to human-readable date/time
 * @param {Date|number|{toMillis: Function}} timestamp - Firebase timestamp or Date object
 * @param {string} format - Format type: 'full', 'date', 'time', 'relative'
 * @returns {string} Formatted date/time string
 */
export function formatDateTime(timestamp, format = 'full') {
  if (!timestamp) return '';

  // Handle Firebase Timestamp
  let date;
  if (timestamp.toMillis && typeof timestamp.toMillis === 'function') {
    date = new Date(timestamp.toMillis());
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return '';
  }

  const options = {
    full: {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    date: {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  };

  if (format === 'relative') {
    return formatRelativeTime(date);
  }

  return new Intl.DateTimeFormat('en-US', options[format] || options.full).format(date);
}

/**
 * Format relative time (e.g., "2 minutes ago", "in 5 hours")
 * @param {Date} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (Math.abs(diffDay) > 0) {
    return diffDay > 0 ? `in ${diffDay} day${diffDay > 1 ? 's' : ''}` : `${Math.abs(diffDay)} day${Math.abs(diffDay) > 1 ? 's' : ''} ago`;
  }
  if (Math.abs(diffHour) > 0) {
    return diffHour > 0 ? `in ${diffHour} hour${diffHour > 1 ? 's' : ''}` : `${Math.abs(diffHour)} hour${Math.abs(diffHour) > 1 ? 's' : ''} ago`;
  }
  if (Math.abs(diffMin) > 0) {
    return diffMin > 0 ? `in ${diffMin} minute${diffMin > 1 ? 's' : ''}` : `${Math.abs(diffMin)} minute${Math.abs(diffMin) > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "05:23")
 */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format countdown timer (e.g., "Starts in 5:23")
 * @param {Date|number} targetDate - Target date/time
 * @returns {string} Countdown string
 */
export function formatCountdown(targetDate) {
  if (!targetDate) return '';

  let target;
  if (targetDate.toMillis && typeof targetDate.toMillis === 'function') {
    target = new Date(targetDate.toMillis());
  } else if (targetDate instanceof Date) {
    target = targetDate;
  } else if (typeof targetDate === 'number') {
    target = new Date(targetDate);
  } else {
    return '';
  }

  const now = new Date();
  const diffMs = target - now;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec <= 0) {
    return '00:00';
  }

  const hours = Math.floor(diffSec / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format transaction amount with + or - prefix
 * @param {number} amount - Amount in cents (negative for deductions)
 * @returns {string} Formatted amount (e.g., "+$100.00", "-$50.00")
 */
export function formatTransactionAmount(amount) {
  const formatted = formatPrice(Math.abs(amount));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Parse user input price to cents
 * @param {string|number} input - User input (e.g., "123.45" or 123.45)
 * @returns {number|null} Price in cents, or null if invalid
 */
export function parsePriceToCents(input) {
  if (typeof input === 'number') {
    return Math.round(input * 100);
  }

  if (typeof input === 'string') {
    const cleaned = input.replace(/[$,]/g, '').trim();
    const parsed = parseFloat(cleaned);

    if (isNaN(parsed)) {
      return null;
    }

    return Math.round(parsed * 100);
  }

  return null;
}

/**
 * Alias for formatDateTime for backward compatibility
 * @deprecated Use formatDateTime instead
 */
export const formatTimestamp = formatDateTime;
