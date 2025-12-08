/**
 * usePricePreview Hook
 * Handles price preview calculations for auction form
 */

import {
  calculateExpDecayRate,
  generatePreviewPoints
} from '../shared/priceFormulas.js';

import {
  getSteepnessLabel,
  getSteepnessDescription,
  MIN_STEPS
} from '../shared/constants.js';

import { parsePriceToCents, formatPrice } from '../utils/formatters.js';

const { useMemo } = React;

/**
 * Hook for calculating price preview data
 * @param {Object} params - Preview parameters
 * @param {string} params.startingPrice - Starting price (dollar string)
 * @param {string} params.floorPrice - Floor price (dollar string)
 * @param {number} params.durationMinutes - Duration in minutes
 * @param {string} params.formula - Price formula (linear, exponential, stepped)
 * @param {number} params.expSteepness - Exponential steepness (0-100)
 * @param {number} params.stepCount - Number of steps for stepped decay
 * @param {number|null} params.stepInterval - Manual step interval (seconds)
 * @param {string|null} params.stepAmount - Manual step amount (dollar string)
 * @param {boolean} params.useManualSteps - Whether to use manual step settings
 * @returns {Object} Preview data
 */
export function usePricePreview({
  startingPrice,
  floorPrice,
  durationMinutes,
  formula,
  expSteepness,
  stepCount,
  stepInterval,
  stepAmount,
  useManualSteps
}) {
  // Parse prices to cents
  const startPriceCents = useMemo(
    () => parsePriceToCents(startingPrice),
    [startingPrice]
  );

  const floorPriceCents = useMemo(
    () => parsePriceToCents(floorPrice),
    [floorPrice]
  );

  const durationSeconds = durationMinutes * 60;

  // Calculate max steps based on duration
  const maxSteps = useMemo(
    () => Math.max(20, durationMinutes),
    [durationMinutes]
  );

  // Ensure stepCount stays within bounds
  const effectiveStepCount = useMemo(
    () => Math.max(MIN_STEPS, Math.min(stepCount, maxSteps)),
    [stepCount, maxSteps]
  );

  // Calculate preview points for the decay graph
  const previewPoints = useMemo(() => {
    if (!startPriceCents || !floorPriceCents || startPriceCents <= floorPriceCents) {
      return [];
    }

    const pricingConfig = {};

    if (formula === 'exponential') {
      pricingConfig.decayRate = calculateExpDecayRate(
        expSteepness,
        startPriceCents,
        floorPriceCents,
        durationSeconds
      );
    } else if (formula === 'stepped') {
      pricingConfig.stepCount = effectiveStepCount;
      pricingConfig.stepInterval = useManualSteps && stepInterval
        ? stepInterval
        : Math.floor(durationSeconds / effectiveStepCount);
      pricingConfig.stepAmount = useManualSteps && stepAmount
        ? parsePriceToCents(stepAmount)
        : Math.floor((startPriceCents - floorPriceCents) / effectiveStepCount);
    }

    return generatePreviewPoints({
      startingPrice: startPriceCents,
      floorPrice: floorPriceCents,
      duration: durationSeconds,
      formula,
      pricingConfig
    });
  }, [
    startPriceCents,
    floorPriceCents,
    durationSeconds,
    formula,
    expSteepness,
    effectiveStepCount,
    stepInterval,
    stepAmount,
    useManualSteps
  ]);

  // Calculate step summary for stepped decay
  const stepSummary = useMemo(() => {
    if (!startPriceCents || !floorPriceCents || startPriceCents <= floorPriceCents) {
      return {
        interval: '--',
        amount: '--',
        count: effectiveStepCount
      };
    }

    const actualStepInterval = useManualSteps && stepInterval
      ? stepInterval
      : Math.floor(durationSeconds / effectiveStepCount);

    const actualStepAmount = useManualSteps && stepAmount
      ? parsePriceToCents(stepAmount)
      : Math.floor((startPriceCents - floorPriceCents) / effectiveStepCount);

    if (!actualStepAmount || actualStepAmount <= 0) {
      return {
        interval: '--',
        amount: '--',
        count: effectiveStepCount
      };
    }

    const intervalMinutes = Math.floor(actualStepInterval / 60);
    const intervalSeconds = actualStepInterval % 60;
    const intervalStr = intervalMinutes > 0
      ? (intervalSeconds > 0 ? `${intervalMinutes}m ${intervalSeconds}s` : `${intervalMinutes} min`)
      : `${intervalSeconds}s`;

    return {
      interval: intervalStr,
      amount: formatPrice(actualStepAmount),
      count: effectiveStepCount
    };
  }, [
    startPriceCents,
    floorPriceCents,
    durationSeconds,
    effectiveStepCount,
    stepInterval,
    stepAmount,
    useManualSteps
  ]);

  // Calculate decay rate for storage
  const calculatedDecayRate = useMemo(() => {
    if (formula !== 'exponential' || !startPriceCents || !floorPriceCents) {
      return null;
    }
    return calculateExpDecayRate(expSteepness, startPriceCents, floorPriceCents, durationSeconds);
  }, [formula, expSteepness, startPriceCents, floorPriceCents, durationSeconds]);

  // Steepness labels
  const steepnessLabel = useMemo(
    () => getSteepnessLabel(expSteepness),
    [expSteepness]
  );

  const steepnessDescription = useMemo(
    () => getSteepnessDescription(expSteepness),
    [expSteepness]
  );

  return {
    previewPoints,
    stepSummary,
    effectiveStepCount,
    maxSteps,
    minSteps: MIN_STEPS,
    calculatedDecayRate,
    steepnessLabel,
    steepnessDescription,
    startPriceCents,
    floorPriceCents,
    durationSeconds
  };
}
