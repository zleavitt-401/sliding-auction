/**
 * PricingSection Component
 * Form section for pricing configuration
 */

import { formatPrice, parsePriceToCents } from '../../utils/formatters.js';

/**
 * @param {Object} props
 * @param {string} props.startingPrice - Starting price value
 * @param {function} props.onStartingPriceChange - Starting price change handler
 * @param {string} props.floorPrice - Floor price value
 * @param {function} props.onFloorPriceChange - Floor price change handler
 * @param {string} props.duration - Duration in minutes
 * @param {function} props.onDurationChange - Duration change handler
 * @param {string} props.pricingMode - 'transparent' or 'algorithmic'
 * @param {function} props.onPricingModeChange - Pricing mode change handler
 * @param {string} props.formula - Price formula (linear, exponential, stepped)
 * @param {function} props.onFormulaChange - Formula change handler
 * @param {number} props.expSteepness - Exponential steepness (0-100)
 * @param {function} props.onExpSteepnessChange - Steepness change handler
 * @param {number} props.stepCount - Step count for stepped decay
 * @param {function} props.onStepCountChange - Step count change handler
 * @param {number|null} props.stepInterval - Manual step interval
 * @param {function} props.onStepIntervalChange - Step interval change handler
 * @param {string|null} props.stepAmount - Manual step amount
 * @param {function} props.onStepAmountChange - Step amount change handler
 * @param {boolean} props.useManualSteps - Whether to use manual step settings
 * @param {function} props.onUseManualStepsChange - Manual steps toggle handler
 * @param {Object} props.algorithmParams - Algorithm parameters (for algorithmic mode)
 * @param {function} props.onAlgorithmParamsChange - Algorithm params change handler
 * @param {Object} props.pricePreview - Preview data from usePricePreview
 * @param {Object} props.validationErrors - Validation errors by field
 */
export function PricingSection({
  startingPrice,
  onStartingPriceChange,
  floorPrice,
  onFloorPriceChange,
  duration,
  onDurationChange,
  pricingMode,
  onPricingModeChange,
  formula,
  onFormulaChange,
  expSteepness,
  onExpSteepnessChange,
  stepCount,
  onStepCountChange,
  stepInterval,
  onStepIntervalChange,
  stepAmount,
  onStepAmountChange,
  useManualSteps,
  onUseManualStepsChange,
  algorithmParams,
  onAlgorithmParamsChange,
  pricePreview,
  validationErrors
}) {
  const durationMinutes = parseInt(duration) || 30;

  return html`
    <div class="form-section">
      <h3 class="form-section__title">Pricing Configuration</h3>

      <div class="form-row">
        <!-- Starting Price -->
        <div class="form-group ${validationErrors.startingPrice ? 'form-group--error' : ''}">
          <label class="form-label" for="startingPrice">
            Starting Price <span class="required">*</span>
          </label>
          <div class="form-input-group">
            <span class="form-input-prefix">$</span>
            <input
              type="number"
              id="startingPrice"
              class="form-input"
              value=${startingPrice}
              onChange=${(e) => onStartingPriceChange(e.target.value)}
              placeholder="100.00"
              min="1"
              step="0.01"
            />
          </div>
          <small class="form-hint">Enter price in dollars (e.g., 100 for $100.00)</small>
          ${validationErrors.startingPrice && html`
            <span class="form-error">${validationErrors.startingPrice}</span>
          `}
        </div>

        <!-- Floor Price -->
        <div class="form-group ${validationErrors.floorPrice ? 'form-group--error' : ''}">
          <label class="form-label" for="floorPrice">
            Floor Price <span class="required">*</span>
          </label>
          <div class="form-input-group">
            <span class="form-input-prefix">$</span>
            <input
              type="number"
              id="floorPrice"
              class="form-input"
              value=${floorPrice}
              onChange=${(e) => onFloorPriceChange(e.target.value)}
              placeholder="50.00"
              min="1"
              step="0.01"
            />
          </div>
          <small class="form-hint">Minimum price (must be less than starting)</small>
          ${validationErrors.floorPrice && html`
            <span class="form-error">${validationErrors.floorPrice}</span>
          `}
        </div>
      </div>

      <!-- Duration -->
      <div class="form-group ${validationErrors.duration ? 'form-group--error' : ''}">
        <label class="form-label" for="duration">
          Duration <span class="required">*</span>
        </label>
        <div class="form-input-group">
          <input
            type="number"
            id="duration"
            class="form-input"
            value=${duration}
            onChange=${(e) => onDurationChange(e.target.value)}
            min="1"
            max="120"
          />
          <span class="form-input-suffix">minutes</span>
        </div>
        <small class="form-hint">Auction duration (1-120 minutes)</small>
        ${validationErrors.duration && html`
          <span class="form-error">${validationErrors.duration}</span>
        `}
      </div>

      <!-- Pricing Mode -->
      <div class="form-group">
        <label class="form-label">
          Pricing Mode <span class="required">*</span>
        </label>
        <div class="form-radio-group">
          <label class="form-radio">
            <input
              type="radio"
              name="pricingMode"
              value="transparent"
              checked=${pricingMode === 'transparent'}
              onChange=${(e) => onPricingModeChange(e.target.value)}
            />
            <span>Transparent (Formula-based)</span>
          </label>
          <label class="form-radio">
            <input
              type="radio"
              name="pricingMode"
              value="algorithmic"
              checked=${pricingMode === 'algorithmic'}
              onChange=${(e) => onPricingModeChange(e.target.value)}
            />
            <span>Algorithmic (Dynamic)</span>
          </label>
        </div>
      </div>

      <!-- Transparent Mode: Formula Selection -->
      ${pricingMode === 'transparent' && html`
        <${TransparentModeConfig}
          formula=${formula}
          onFormulaChange=${onFormulaChange}
          expSteepness=${expSteepness}
          onExpSteepnessChange=${onExpSteepnessChange}
          stepCount=${stepCount}
          onStepCountChange=${onStepCountChange}
          stepInterval=${stepInterval}
          onStepIntervalChange=${onStepIntervalChange}
          stepAmount=${stepAmount}
          onStepAmountChange=${onStepAmountChange}
          useManualSteps=${useManualSteps}
          onUseManualStepsChange=${onUseManualStepsChange}
          pricePreview=${pricePreview}
          durationMinutes=${durationMinutes}
          startingPrice=${startingPrice}
          floorPrice=${floorPrice}
        />
      `}

      <!-- Algorithmic Mode: Parameters -->
      ${pricingMode === 'algorithmic' && html`
        <${AlgorithmicModeConfig}
          params=${algorithmParams}
          onParamsChange=${onAlgorithmParamsChange}
        />
      `}
    </div>
  `;
}

/**
 * Transparent mode configuration
 */
function TransparentModeConfig({
  formula,
  onFormulaChange,
  expSteepness,
  onExpSteepnessChange,
  stepCount,
  onStepCountChange,
  stepInterval,
  onStepIntervalChange,
  stepAmount,
  onStepAmountChange,
  useManualSteps,
  onUseManualStepsChange,
  pricePreview,
  durationMinutes,
  startingPrice,
  floorPrice
}) {
  const { effectiveStepCount, minSteps, maxSteps, steepnessLabel, steepnessDescription } = pricePreview;

  return html`
    <div class="form-group">
      <label class="form-label" for="formula">
        Price Formula
      </label>
      <select
        id="formula"
        class="form-select"
        value=${formula}
        onChange=${(e) => onFormulaChange(e.target.value)}
      >
        <option value="linear">Linear Decay</option>
        <option value="exponential">Exponential Decay</option>
        <option value="stepped">Stepped Decay</option>
      </select>
      <small class="form-hint">
        ${formula === 'linear' ? 'Price decreases steadily over time' : ''}
        ${formula === 'exponential' ? 'Price drops quickly at first, then slows' : ''}
        ${formula === 'stepped' ? 'Price drops in discrete steps' : ''}
      </small>
    </div>

    <!-- Exponential Decay: Steepness Slider -->
    ${formula === 'exponential' && html`
      <div class="decay-parameters">
        <h4 class="decay-parameters__title">Exponential Curve Settings</h4>

        <div class="form-group">
          <label class="form-label" for="expSteepness">
            Decay Curve: <span class="steepness-label">${steepnessLabel}</span>
          </label>
          <div class="steepness-slider">
            <span class="steepness-slider__label">Gentle</span>
            <input
              type="range"
              id="expSteepness"
              class="form-range"
              min="0"
              max="100"
              step="1"
              value=${expSteepness}
              onChange=${(e) => onExpSteepnessChange(parseInt(e.target.value))}
            />
            <span class="steepness-slider__label">Aggressive</span>
          </div>
          <small class="form-hint">${steepnessDescription}</small>
        </div>
      </div>
    `}

    <!-- Stepped Decay: Step Configuration -->
    ${formula === 'stepped' && html`
      <${SteppedDecayConfig}
        stepCount=${stepCount}
        onStepCountChange=${onStepCountChange}
        effectiveStepCount=${effectiveStepCount}
        minSteps=${minSteps}
        maxSteps=${maxSteps}
        stepInterval=${stepInterval}
        onStepIntervalChange=${onStepIntervalChange}
        stepAmount=${stepAmount}
        onStepAmountChange=${onStepAmountChange}
        useManualSteps=${useManualSteps}
        onUseManualStepsChange=${onUseManualStepsChange}
        durationMinutes=${durationMinutes}
        startingPrice=${startingPrice}
        floorPrice=${floorPrice}
      />
    `}
  `;
}

/**
 * Stepped decay configuration
 */
function SteppedDecayConfig({
  stepCount,
  onStepCountChange,
  effectiveStepCount,
  minSteps,
  maxSteps,
  stepInterval,
  onStepIntervalChange,
  stepAmount,
  onStepAmountChange,
  useManualSteps,
  onUseManualStepsChange,
  durationMinutes,
  startingPrice,
  floorPrice
}) {
  const durationSeconds = durationMinutes * 60;
  const startPriceCents = parsePriceToCents(startingPrice);
  const floorPriceCents = parsePriceToCents(floorPrice);
  const validPrices = startPriceCents && floorPriceCents && startPriceCents > floorPriceCents;

  // Calculate display values for step summary
  const intervalSeconds = validPrices ? Math.floor(durationSeconds / effectiveStepCount) : 0;
  const intervalMinutes = Math.floor(intervalSeconds / 60);
  const intervalDisplay = validPrices
    ? (intervalMinutes > 0 ? `${intervalMinutes}m` : `${intervalSeconds}s`)
    : '--';

  const dropAmount = validPrices
    ? '$' + (Math.floor((startPriceCents - floorPriceCents) / effectiveStepCount) / 100).toFixed(2)
    : '--';

  return html`
    <div class="decay-parameters">
      <h4 class="decay-parameters__title">Step Configuration</h4>

      <div class="form-group">
        <label class="form-label" for="stepCount">
          Number of Steps: ${effectiveStepCount}
        </label>
        <input
          type="range"
          id="stepCount"
          class="form-range"
          min=${minSteps}
          max=${maxSteps}
          step="1"
          value=${effectiveStepCount}
          onChange=${(e) => onStepCountChange(parseInt(e.target.value))}
        />
        <small class="form-hint">
          Min: ${minSteps} steps, Max: ${maxSteps} steps (based on ${durationMinutes} min duration)
        </small>
      </div>

      <!-- Step Summary (auto-calculated) -->
      <div class="step-summary">
        <div class="step-summary__item">
          <span class="step-summary__label">Price drops every:</span>
          <span class="step-summary__value">${intervalDisplay}</span>
        </div>
        <div class="step-summary__item">
          <span class="step-summary__label">Drop amount:</span>
          <span class="step-summary__value">${dropAmount}</span>
        </div>
      </div>

      <!-- Manual Override Toggle -->
      <div class="form-group">
        <label class="form-checkbox">
          <input
            type="checkbox"
            checked=${useManualSteps}
            onChange=${(e) => onUseManualStepsChange(e.target.checked)}
          />
          <span>Customize step interval and amount manually</span>
        </label>
      </div>

      <!-- Manual Step Controls -->
      ${useManualSteps && html`
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="stepInterval">
              Step Interval (seconds)
            </label>
            <input
              type="number"
              id="stepInterval"
              class="form-input"
              value=${stepInterval || Math.floor(durationSeconds / effectiveStepCount)}
              onChange=${(e) => onStepIntervalChange(parseInt(e.target.value) || null)}
              min="1"
              max=${durationSeconds}
            />
            <small class="form-hint">How often price drops</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="stepAmount">
              Step Amount ($)
            </label>
            <div class="form-input-group">
              <span class="form-input-prefix">$</span>
              <input
                type="number"
                id="stepAmount"
                class="form-input"
                value=${stepAmount || ''}
                onChange=${(e) => onStepAmountChange(e.target.value || null)}
                placeholder="Auto"
                min="0.01"
                step="0.01"
              />
            </div>
            <small class="form-hint">How much price drops each step</small>
          </div>
        </div>
      `}
    </div>
  `;
}

/**
 * Algorithmic mode configuration
 */
function AlgorithmicModeConfig({ params, onParamsChange }) {
  const { decayRate, viewerMultiplier, shieldInfluence } = params;

  return html`
    <div class="algorithm-parameters">
      <h4 class="algorithm-parameters__title">Algorithm Parameters</h4>

      <div class="form-group">
        <label class="form-label" for="decayRate">
          Base Decay Rate: ${decayRate}
        </label>
        <input
          type="range"
          id="decayRate"
          class="form-range"
          min="0.01"
          max="0.5"
          step="0.01"
          value=${decayRate}
          onChange=${(e) => onParamsChange({ ...params, decayRate: e.target.value })}
        />
        <small class="form-hint">How fast price drops naturally</small>
      </div>

      <div class="form-group">
        <label class="form-label" for="viewerMultiplier">
          Viewer Multiplier: ${viewerMultiplier}
        </label>
        <input
          type="range"
          id="viewerMultiplier"
          class="form-range"
          min="0"
          max="0.2"
          step="0.01"
          value=${viewerMultiplier}
          onChange=${(e) => onParamsChange({ ...params, viewerMultiplier: e.target.value })}
        />
        <small class="form-hint">Impact of viewer count on price</small>
      </div>

      <div class="form-group">
        <label class="form-label" for="shieldInfluence">
          Shield Influence: ${shieldInfluence}
        </label>
        <input
          type="range"
          id="shieldInfluence"
          class="form-range"
          min="0"
          max="0.1"
          step="0.01"
          value=${shieldInfluence}
          onChange=${(e) => onParamsChange({ ...params, shieldInfluence: e.target.value })}
        />
        <small class="form-hint">Impact of open shields on price</small>
      </div>
    </div>
  `;
}
