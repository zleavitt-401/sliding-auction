/**
 * Shared Constants (CommonJS version for Cloud Functions)
 * Central location for all application constants
 *
 * NOTE: This file must stay in sync with public/js/shared/constants.js
 */

// Auction timing
const FLOOR_TIMER_DURATION = 60; // seconds at floor before auction ends

// Stepped decay constraints
const MIN_STEPS = 4;
const MAX_STEPS_DEFAULT = 20;

// Steepness thresholds for exponential decay labels
const STEEPNESS = {
  VERY_GENTLE: 20,
  GENTLE: 40,
  MODERATE: 60,
  STEEP: 80
};

/**
 * Get steepness label from numeric value
 * @param {number} value - Steepness value (0-100)
 * @returns {string} Human-readable label
 */
function getSteepnessLabel(value) {
  if (value <= STEEPNESS.VERY_GENTLE) return 'Very Gentle';
  if (value <= STEEPNESS.GENTLE) return 'Gentle';
  if (value <= STEEPNESS.MODERATE) return 'Moderate';
  if (value <= STEEPNESS.STEEP) return 'Steep';
  return 'Very Steep';
}

/**
 * Get steepness description for UI hints
 * @param {number} value - Steepness value (0-100)
 * @returns {string} Description of the decay behavior
 */
function getSteepnessDescription(value) {
  if (value <= 30) return 'Price drops slowly throughout, reaching floor near the end';
  if (value <= 70) return 'Balanced curve - moderate initial drop, gradual slowdown';
  return 'Price drops quickly at first, then levels off near floor';
}

// Default pricing parameters
const DEFAULT_DURATION_MINUTES = 30;
const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 120;

// Algorithmic mode defaults
const ALGORITHMIC_DEFAULTS = {
  BASE_DECAY: 0.001,
  VIEWER_INFLUENCE: 0.002,
  SHIELD_INFLUENCE: 0.003,
  TIME_ACCELERATOR: 1.5,
  TIME_PRESSURE_THRESHOLD: 80 // percent progress
};

module.exports = {
  FLOOR_TIMER_DURATION,
  MIN_STEPS,
  MAX_STEPS_DEFAULT,
  STEEPNESS,
  getSteepnessLabel,
  getSteepnessDescription,
  DEFAULT_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  MAX_DURATION_MINUTES,
  ALGORITHMIC_DEFAULTS
};
