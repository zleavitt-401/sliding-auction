/**
 * Auction Validation Utilities
 * Form validation logic for auction creation and editing
 */

import {
  MIN_DURATION_MINUTES,
  MAX_DURATION_MINUTES
} from '../shared/constants.js';

/**
 * Minimum price in dollars
 */
const MIN_PRICE_DOLLARS = 1;

/**
 * Maximum images allowed
 */
const MAX_IMAGES = 5;
const MIN_IMAGES = 1;

/**
 * Validate auction form data
 * @param {Object} formData - Form data to validate
 * @param {string} formData.itemName - Item name
 * @param {string} formData.description - Item description
 * @param {string|number} formData.startingPrice - Starting price
 * @param {string|number} formData.floorPrice - Floor price
 * @param {string|number} formData.duration - Duration in minutes
 * @param {File[]} formData.images - Array of image files
 * @returns {{ valid: boolean, errors: Object }} Validation result with errors by field
 */
export function validateAuctionForm(formData) {
  const errors = {};

  // Item name validation
  if (!formData.itemName?.trim()) {
    errors.itemName = 'Item name is required';
  } else if (formData.itemName.trim().length > 100) {
    errors.itemName = 'Item name must be 100 characters or less';
  }

  // Description validation
  if (!formData.description?.trim()) {
    errors.description = 'Description is required';
  } else if (formData.description.trim().length > 2000) {
    errors.description = 'Description must be 2000 characters or less';
  }

  // Price validations
  const startPrice = parseFloat(formData.startingPrice);
  const floor = parseFloat(formData.floorPrice);

  if (!formData.startingPrice || isNaN(startPrice) || startPrice <= 0) {
    errors.startingPrice = 'Starting price must be greater than $0';
  } else if (startPrice < MIN_PRICE_DOLLARS) {
    errors.startingPrice = `Starting price must be at least $${MIN_PRICE_DOLLARS}.00`;
  }

  if (!formData.floorPrice || isNaN(floor) || floor <= 0) {
    errors.floorPrice = 'Floor price must be greater than $0';
  } else if (floor < MIN_PRICE_DOLLARS) {
    errors.floorPrice = `Floor price must be at least $${MIN_PRICE_DOLLARS}.00`;
  }

  if (startPrice && floor && floor >= startPrice) {
    errors.floorPrice = 'Floor price must be less than starting price';
  }

  // Duration validation
  const durationNum = parseInt(formData.duration);
  if (!formData.duration || isNaN(durationNum)) {
    errors.duration = 'Duration is required';
  } else if (durationNum < MIN_DURATION_MINUTES || durationNum > MAX_DURATION_MINUTES) {
    errors.duration = `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes`;
  }

  // Images validation
  const imageCount = formData.images?.length || 0;
  if (imageCount < MIN_IMAGES) {
    errors.images = `At least ${MIN_IMAGES} image is required`;
  } else if (imageCount > MAX_IMAGES) {
    errors.images = `Maximum ${MAX_IMAGES} images allowed`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate a single field
 * @param {string} field - Field name
 * @param {any} value - Field value
 * @param {Object} context - Additional context (other field values for cross-validation)
 * @returns {string|null} Error message or null if valid
 */
export function validateField(field, value, context = {}) {
  switch (field) {
    case 'itemName':
      if (!value?.trim()) return 'Item name is required';
      if (value.trim().length > 100) return 'Item name must be 100 characters or less';
      return null;

    case 'description':
      if (!value?.trim()) return 'Description is required';
      if (value.trim().length > 2000) return 'Description must be 2000 characters or less';
      return null;

    case 'startingPrice': {
      const price = parseFloat(value);
      if (!value || isNaN(price) || price <= 0) return 'Starting price must be greater than $0';
      if (price < MIN_PRICE_DOLLARS) return `Starting price must be at least $${MIN_PRICE_DOLLARS}.00`;
      return null;
    }

    case 'floorPrice': {
      const floor = parseFloat(value);
      if (!value || isNaN(floor) || floor <= 0) return 'Floor price must be greater than $0';
      if (floor < MIN_PRICE_DOLLARS) return `Floor price must be at least $${MIN_PRICE_DOLLARS}.00`;
      if (context.startingPrice) {
        const startPrice = parseFloat(context.startingPrice);
        if (floor >= startPrice) return 'Floor price must be less than starting price';
      }
      return null;
    }

    case 'duration': {
      const duration = parseInt(value);
      if (!value || isNaN(duration)) return 'Duration is required';
      if (duration < MIN_DURATION_MINUTES || duration > MAX_DURATION_MINUTES) {
        return `Duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes`;
      }
      return null;
    }

    case 'images': {
      const count = Array.isArray(value) ? value.length : 0;
      if (count < MIN_IMAGES) return `At least ${MIN_IMAGES} image is required`;
      if (count > MAX_IMAGES) return `Maximum ${MAX_IMAGES} images allowed`;
      return null;
    }

    default:
      return null;
  }
}

/**
 * Check if adding more images is allowed
 * @param {number} currentCount - Current number of images
 * @param {number} toAdd - Number of images to add
 * @returns {{ allowed: boolean, error?: string }}
 */
export function canAddImages(currentCount, toAdd = 1) {
  if (currentCount + toAdd > MAX_IMAGES) {
    return {
      allowed: false,
      error: `Maximum ${MAX_IMAGES} images allowed`
    };
  }
  return { allowed: true };
}

/**
 * Get validation constraints for display
 * @returns {Object} Validation constraints
 */
export function getValidationConstraints() {
  return {
    itemName: { maxLength: 100 },
    description: { maxLength: 2000 },
    price: { min: MIN_PRICE_DOLLARS },
    duration: { min: MIN_DURATION_MINUTES, max: MAX_DURATION_MINUTES },
    images: { min: MIN_IMAGES, max: MAX_IMAGES }
  };
}
