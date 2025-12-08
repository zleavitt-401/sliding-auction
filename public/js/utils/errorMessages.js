/**
 * Error Messages Utility
 * Centralized error message handling for user-friendly error display
 */

/**
 * Error message mappings for common error codes/messages
 */
const ERROR_MAPPINGS = [
  {
    pattern: /insufficient balance/i,
    message: "You don't have enough balance to complete this purchase."
  },
  {
    pattern: /shield closed|shield not open/i,
    message: 'Your shield has closed. Please open it again to purchase.'
  },
  {
    pattern: /auction ended|already sold/i,
    message: 'This auction has already ended. Another user may have purchased the item.'
  },
  {
    pattern: /not authenticated|must be logged in/i,
    message: 'You must be logged in to make a purchase.'
  },
  {
    pattern: /network|timeout|connection/i,
    message: 'Network error. Please check your connection and try again.'
  },
  {
    pattern: /permission denied|unauthorized/i,
    message: 'You do not have permission to perform this action.'
  },
  {
    pattern: /auction not found/i,
    message: 'This auction could not be found. It may have been removed.'
  },
  {
    pattern: /invalid price|price changed/i,
    message: 'The price has changed. Please review and try again.'
  }
];

/**
 * Convert technical error message to user-friendly message
 * @param {string|Error} error - Error message or Error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyError(error) {
  const errorString = typeof error === 'string' ? error : error?.message || '';

  // Check against known patterns
  for (const mapping of ERROR_MAPPINGS) {
    if (mapping.pattern.test(errorString)) {
      return mapping.message;
    }
  }

  // Return original message if no mapping found, or generic fallback
  return errorString || 'An unexpected error occurred. Please try again.';
}

/**
 * Get error message for purchase failures
 * @param {string|Error} error - Error from purchase attempt
 * @returns {string} User-friendly purchase error message
 */
export function getPurchaseErrorMessage(error) {
  return getUserFriendlyError(error);
}

/**
 * Get error message for form validation
 * @param {string} field - Field name that failed validation
 * @param {string} reason - Reason for validation failure
 * @returns {string} User-friendly validation message
 */
export function getValidationErrorMessage(field, reason) {
  const fieldLabels = {
    itemName: 'Item name',
    description: 'Description',
    startingPrice: 'Starting price',
    floorPrice: 'Floor price',
    duration: 'Duration',
    images: 'Images'
  };

  const label = fieldLabels[field] || field;
  return `${label}: ${reason}`;
}

/**
 * Check if error is a network-related error
 * @param {string|Error} error - Error to check
 * @returns {boolean} True if network error
 */
export function isNetworkError(error) {
  const errorString = typeof error === 'string' ? error : error?.message || '';
  return /network|timeout|connection|offline/i.test(errorString);
}

/**
 * Check if error indicates user should retry
 * @param {string|Error} error - Error to check
 * @returns {boolean} True if retry may help
 */
export function isRetryableError(error) {
  const errorString = typeof error === 'string' ? error : error?.message || '';
  return /network|timeout|unavailable|try again/i.test(errorString);
}
