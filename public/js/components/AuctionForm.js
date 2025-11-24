/**
 * AuctionForm Component
 * Form for creating new auctions with full configuration
 */

import {
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

import { formatPrice, parsePriceToCents } from '../utils/formatters.js';

const { useState } = React;

/**
 * Resize image using Canvas API
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {Promise<Blob>} Resized image blob
 */
async function resizeImage(file, maxWidth, maxHeight) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, file.type, 0.9);
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Auction form component
 * @returns {JSX.Element} Auction creation form
 */
export function AuctionForm() {
  // Form state
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [floorPrice, setFloorPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [pricingMode, setPricingMode] = useState('transparent');
  const [formula, setFormula] = useState('linear');
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // Algorithm parameters (for algorithmic mode)
  const [decayRate, setDecayRate] = useState(0.1);
  const [viewerMultiplier, setViewerMultiplier] = useState(0.05);
  const [shieldInfluence, setShieldInfluence] = useState(0.02);

  // Exponential decay steepness (0 = gentle, 100 = aggressive)
  const [expSteepness, setExpSteepness] = useState(50);

  // Stepped decay parameters
  const [stepCount, setStepCount] = useState(10);
  const [stepInterval, setStepInterval] = useState(null); // null = auto-calculate
  const [stepAmount, setStepAmount] = useState(null); // null = auto-calculate
  const [useManualSteps, setUseManualSteps] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate max steps based on duration (1 step per minute minimum)
  const durationMinutes = parseInt(duration) || 30;
  const maxSteps = Math.max(20, durationMinutes);
  const minSteps = 4;

  // Ensure stepCount stays within bounds when duration changes
  const effectiveStepCount = Math.max(minSteps, Math.min(stepCount, maxSteps));

  // Calculate decay rate from steepness slider (0-100)
  // Maps to decay rates from 0.00002 (gentle) to 0.002 (aggressive)
  const calculateExpDecayRate = (steepness, startPrice, floorPriceCents, durationSec) => {
    // Use a logarithmic scale for better control
    // At steepness 0: very gentle curve (takes full duration to approach floor)
    // At steepness 100: aggressive curve (drops quickly then levels off)
    const minRate = 0.00002;
    const maxRate = 0.002;
    const normalizedSteepness = steepness / 100;
    // Exponential interpolation for more intuitive control
    return minRate * Math.pow(maxRate / minRate, normalizedSteepness);
  };

  // Calculate preview points for the decay graph
  const generatePreviewPoints = () => {
    const startPriceCents = parsePriceToCents(startingPrice) || 10000;
    const floorPriceCents = parsePriceToCents(floorPrice) || 5000;
    const durationSeconds = durationMinutes * 60;

    if (startPriceCents <= floorPriceCents) return [];

    const points = [];
    const numPoints = 50;

    for (let i = 0; i <= numPoints; i++) {
      const progress = i / numPoints;
      const elapsedSeconds = Math.floor(durationSeconds * progress);
      let price;

      if (formula === 'linear') {
        const linearRate = (startPriceCents - floorPriceCents) / durationSeconds;
        price = startPriceCents - (linearRate * elapsedSeconds);
      } else if (formula === 'exponential') {
        const expRate = calculateExpDecayRate(expSteepness, startPriceCents, floorPriceCents, durationSeconds);
        price = startPriceCents * Math.exp(-expRate * elapsedSeconds);
      } else if (formula === 'stepped') {
        const actualStepCount = effectiveStepCount;
        const actualStepInterval = useManualSteps && stepInterval ? stepInterval : Math.floor(durationSeconds / actualStepCount);
        const actualStepAmount = useManualSteps && stepAmount ? parsePriceToCents(stepAmount) : Math.floor((startPriceCents - floorPriceCents) / actualStepCount);
        const numSteps = Math.floor(elapsedSeconds / actualStepInterval);
        price = startPriceCents - (actualStepAmount * numSteps);
      }

      price = Math.max(floorPriceCents, Math.round(price));
      points.push({ x: progress * 100, y: price / 100 });
    }

    return points;
  };

  // Get steepness label for display
  const getSteepnessLabel = (value) => {
    if (value <= 20) return 'Very Gentle';
    if (value <= 40) return 'Gentle';
    if (value <= 60) return 'Moderate';
    if (value <= 80) return 'Steep';
    return 'Very Steep';
  };

  // Calculate step summary for display
  const getStepSummary = () => {
    const durationSeconds = durationMinutes * 60;
    const startPriceCents = parsePriceToCents(startingPrice) || 10000;
    const floorPriceCents = parsePriceToCents(floorPrice) || 5000;

    const actualStepCount = effectiveStepCount;
    const actualStepInterval = useManualSteps && stepInterval ? stepInterval : Math.floor(durationSeconds / actualStepCount);
    const actualStepAmount = useManualSteps && stepAmount ? parsePriceToCents(stepAmount) : Math.floor((startPriceCents - floorPriceCents) / actualStepCount);

    const intervalMinutes = Math.floor(actualStepInterval / 60);
    const intervalSeconds = actualStepInterval % 60;
    const intervalStr = intervalMinutes > 0
      ? (intervalSeconds > 0 ? `${intervalMinutes}m ${intervalSeconds}s` : `${intervalMinutes} min`)
      : `${intervalSeconds}s`;

    return {
      interval: intervalStr,
      amount: formatPrice(actualStepAmount),
      count: actualStepCount
    };
  };

  // T101: Handle image upload
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // T109: Validate image count (1-5)
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
    setImages([...images, ...files]);
    setError(null);
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);

    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  // T109: Validate form
  const validateForm = () => {
    const errors = {};

    if (!itemName.trim()) {
      errors.itemName = 'Item name is required';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    }

    const startPrice = parseFloat(startingPrice);
    const floor = parseFloat(floorPrice);

    if (!startingPrice || startPrice <= 0) {
      errors.startingPrice = 'Starting price must be greater than $0';
    }

    if (!floorPrice || floor <= 0) {
      errors.floorPrice = 'Floor price must be greater than $0';
    }

    if (startPrice && floor && floor >= startPrice) {
      errors.floorPrice = 'Floor price must be less than starting price';
    }

    // Check minimum price ($1.00 = 100 cents)
    if (startPrice && startPrice < 1) {
      errors.startingPrice = 'Starting price must be at least $1.00';
    }

    if (floor && floor < 1) {
      errors.floorPrice = 'Floor price must be at least $1.00';
    }

    const durationNum = parseInt(duration);
    if (!duration || durationNum < 1 || durationNum > 120) {
      errors.duration = 'Duration must be between 1 and 120 minutes';
    }

    if (images.length === 0) {
      errors.images = 'At least 1 image is required';
    }

    if (images.length > 5) {
      errors.images = 'Maximum 5 images allowed';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // T106-T108: Upload images to Firebase Storage
  const uploadImages = async (auctionId) => {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];

      try {
        // T108: Generate thumbnail (200x200)
        const thumbnailBlob = await resizeImage(file, 200, 200);
        const thumbnailRef = ref(window.storage, `auctions/${auctionId}/thumbnail_${i}.jpg`);
        await uploadBytes(thumbnailRef, thumbnailBlob);
        const thumbnailUrl = await getDownloadURL(thumbnailRef);

        // T108: Generate full size (1200px max)
        const fullBlob = await resizeImage(file, 1200, 1200);
        const fullRef = ref(window.storage, `auctions/${auctionId}/full_${i}.jpg`);
        await uploadBytes(fullRef, fullBlob);
        const fullUrl = await getDownloadURL(fullRef);

        uploadedImages.push({
          thumbnail: thumbnailUrl,
          full: fullUrl,
          order: i
        });

      } catch (err) {
        console.error('[AuctionForm] Error uploading image:', err);
        throw new Error(`Failed to upload image ${i + 1}: ${err.message}`);
      }
    }

    return uploadedImages;
  };

  // T110: Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[AuctionForm] Creating auction...');

      // T110: Create auction document
      const startingPriceCents = parsePriceToCents(startingPrice);
      const floorPriceCents = parsePriceToCents(floorPrice);
      const durationSeconds = parseInt(duration) * 60; // Convert minutes to seconds

      const auctionData = {
        itemName: itemName.trim(),
        itemDescription: description.trim(),
        images: [], // Will be updated after upload
        startingPrice: startingPriceCents,
        currentPrice: startingPriceCents,
        floorPrice: floorPriceCents,
        duration: durationSeconds,
        pricingMode,
        status: 'scheduled', // T111
        viewerCount: 0, // T111
        openShieldCount: 0, // T111
        createdAt: serverTimestamp(),
        createdBy: window.currentUserId
      };

      // Add pricing configuration
      if (pricingMode === 'transparent') {
        auctionData.pricingConfig = {
          formula
        };

        // Calculate proper decay rates for exponential/stepped formulas
        if (formula === 'exponential') {
          // Use steepness slider to calculate decay rate
          const expDecayRate = calculateExpDecayRate(expSteepness, startingPriceCents, floorPriceCents, durationSeconds);
          auctionData.pricingConfig.decayRate = expDecayRate;
          auctionData.pricingConfig.steepness = expSteepness; // Store for reference
        } else if (formula === 'stepped') {
          // Use user-configured step parameters
          const actualStepCount = effectiveStepCount;
          const actualStepInterval = useManualSteps && stepInterval ? stepInterval : Math.floor(durationSeconds / actualStepCount);
          const actualStepAmount = useManualSteps && stepAmount ? parsePriceToCents(stepAmount) : Math.floor((startingPriceCents - floorPriceCents) / actualStepCount);

          auctionData.pricingConfig.stepCount = actualStepCount;
          auctionData.pricingConfig.stepInterval = actualStepInterval;
          auctionData.pricingConfig.stepAmount = actualStepAmount;
        }
      } else {
        auctionData.pricingConfig = {
          decayRate: parseFloat(decayRate),
          viewerMultiplier: parseFloat(viewerMultiplier),
          shieldInfluence: parseFloat(shieldInfluence)
        };
      }

      // Create document first to get ID
      console.log('[AuctionForm] Auction data being sent:', JSON.stringify(auctionData, null, 2));
      const docRef = await addDoc(collection(window.db, 'auctions'), auctionData);
      console.log('[AuctionForm] Auction document created:', docRef.id);

      // T107: Upload images
      console.log('[AuctionForm] Uploading images...');
      const uploadedImages = await uploadImages(docRef.id);

      // Update auction with image URLs
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
      await updateDoc(doc(window.db, 'auctions', docRef.id), {
        images: uploadedImages
      });

      console.log('[AuctionForm] Auction created successfully!');

      // T112: Show success message
      setSuccess(`Auction created successfully! Auction ID: ${docRef.id}`);

      // Reset form
      setItemName('');
      setDescription('');
      setStartingPrice('');
      setFloorPrice('');
      setDuration('30');
      setPricingMode('transparent');
      setFormula('linear');
      setExpSteepness(50);
      setStepCount(10);
      setStepInterval(null);
      setStepAmount(null);
      setUseManualSteps(false);
      setImages([]);
      setImagePreviewUrls([]);
      setValidationErrors({});

      // Scroll to top to see success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('[AuctionForm] Error creating auction:', err);
      console.error('[AuctionForm] Error code:', err.code);
      console.error('[AuctionForm] Error details:', err);
      setError(`Failed to create auction: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return html`
    <div class="auction-form-container">
      <h2 class="auction-form__title">Create New Auction</h2>

      ${success && html`
        <div class="alert alert--success">
          ${success}
        </div>
      `}

      ${error && html`
        <div class="alert alert--error">
          ${error}
        </div>
      `}

      <form class="auction-form" onSubmit=${handleSubmit}>

        <!-- Item Details Section -->
        <div class="form-section">
          <h3 class="form-section__title">Item Details</h3>

          <!-- Item Name -->
          <div class="form-group ${validationErrors.itemName ? 'form-group--error' : ''}">
            <label class="form-label" for="itemName">
              Item Name <span class="required">*</span>
            </label>
            <input
              type="text"
              id="itemName"
              class="form-input"
              value=${itemName}
              onChange=${(e) => setItemName(e.target.value)}
              placeholder="e.g., Vintage Rolex Watch"
              maxLength="100"
            />
            ${validationErrors.itemName && html`
              <span class="form-error">${validationErrors.itemName}</span>
            `}
          </div>

          <!-- Description -->
          <div class="form-group ${validationErrors.description ? 'form-group--error' : ''}">
            <label class="form-label" for="description">
              Description <span class="required">*</span>
            </label>
            <textarea
              id="description"
              class="form-textarea"
              value=${description}
              onChange=${(e) => setDescription(e.target.value)}
              placeholder="Describe the item in detail..."
              rows="5"
              maxLength="2000"
            ></textarea>
            <small class="form-hint">${description.length}/2000 characters</small>
            ${validationErrors.description && html`
              <span class="form-error">${validationErrors.description}</span>
            `}
          </div>

          <!-- Images -->
          <div class="form-group ${validationErrors.images ? 'form-group--error' : ''}">
            <label class="form-label" for="images">
              Images <span class="required">*</span>
              <span class="form-hint-inline">(1-5 images, JPEG/PNG)</span>
            </label>

            <input
              type="file"
              id="images"
              class="form-file-input"
              accept="image/jpeg,image/png"
              multiple
              onChange=${handleImageChange}
              disabled=${images.length >= 5}
            />

            ${validationErrors.images && html`
              <span class="form-error">${validationErrors.images}</span>
            `}

            <!-- Image Previews -->
            ${imagePreviewUrls.length > 0 && html`
              <div class="image-preview-grid">
                ${imagePreviewUrls.map((url, index) => html`
                  <div key=${index} class="image-preview">
                    <img src=${url} alt="Preview ${index + 1}" />
                    <button
                      type="button"
                      class="image-preview__remove"
                      onClick=${() => removeImage(index)}
                      aria-label="Remove image"
                    >
                      <span dangerouslySetInnerHTML=${{ __html: '&times;' }}></span>
                    </button>
                  </div>
                `)}
              </div>
            `}
          </div>
        </div>

        <!-- Pricing Section -->
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
                  onChange=${(e) => setStartingPrice(e.target.value)}
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
                  onChange=${(e) => setFloorPrice(e.target.value)}
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
                onChange=${(e) => setDuration(e.target.value)}
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
                  onChange=${(e) => setPricingMode(e.target.value)}
                />
                <span>Transparent (Formula-based)</span>
              </label>
              <label class="form-radio">
                <input
                  type="radio"
                  name="pricingMode"
                  value="algorithmic"
                  checked=${pricingMode === 'algorithmic'}
                  onChange=${(e) => setPricingMode(e.target.value)}
                />
                <span>Algorithmic (Dynamic)</span>
              </label>
            </div>
          </div>

          <!-- Transparent Mode: Formula Selection -->
          ${pricingMode === 'transparent' && html`
            <div class="form-group">
              <label class="form-label" for="formula">
                Price Formula
              </label>
              <select
                id="formula"
                class="form-select"
                value=${formula}
                onChange=${(e) => setFormula(e.target.value)}
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
                    Decay Curve: <span class="steepness-label">${getSteepnessLabel(expSteepness)}</span>
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
                      onChange=${(e) => setExpSteepness(parseInt(e.target.value))}
                    />
                    <span class="steepness-slider__label">Aggressive</span>
                  </div>
                  <small class="form-hint">
                    ${expSteepness <= 30 ? 'Price drops slowly throughout, reaching floor near the end' : ''}
                    ${expSteepness > 30 && expSteepness <= 70 ? 'Balanced curve - moderate initial drop, gradual slowdown' : ''}
                    ${expSteepness > 70 ? 'Price drops quickly at first, then levels off near floor' : ''}
                  </small>
                </div>
              </div>
            `}

            <!-- Stepped Decay: Step Configuration -->
            ${formula === 'stepped' && html`
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
                    onChange=${(e) => setStepCount(parseInt(e.target.value))}
                  />
                  <small class="form-hint">
                    Min: ${minSteps} steps, Max: ${maxSteps} steps (based on ${durationMinutes} min duration)
                  </small>
                </div>

                <!-- Step Summary -->
                <div class="step-summary">
                  <div class="step-summary__item">
                    <span class="step-summary__label">Price drops every:</span>
                    <span class="step-summary__value">${getStepSummary().interval}</span>
                  </div>
                  <div class="step-summary__item">
                    <span class="step-summary__label">Drop amount:</span>
                    <span class="step-summary__value">${getStepSummary().amount}</span>
                  </div>
                </div>

                <!-- Manual Override Toggle -->
                <div class="form-group">
                  <label class="form-checkbox">
                    <input
                      type="checkbox"
                      checked=${useManualSteps}
                      onChange=${(e) => setUseManualSteps(e.target.checked)}
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
                        value=${stepInterval || Math.floor((durationMinutes * 60) / effectiveStepCount)}
                        onChange=${(e) => setStepInterval(parseInt(e.target.value) || null)}
                        min="1"
                        max=${durationMinutes * 60}
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
                          onChange=${(e) => setStepAmount(e.target.value || null)}
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
            `}

            <!-- Live Preview Graph -->
            ${(startingPrice && floorPrice && parseFloat(startingPrice) > parseFloat(floorPrice)) && html`
              <div class="decay-preview">
                <h4 class="decay-preview__title">Price Decay Preview</h4>
                <div class="decay-preview__graph">
                  <svg viewBox="0 0 300 150" class="decay-graph">
                    <!-- Grid lines -->
                    <line x1="40" y1="10" x2="40" y2="130" stroke="#dee2e6" stroke-width="1" />
                    <line x1="40" y1="130" x2="290" y2="130" stroke="#dee2e6" stroke-width="1" />

                    <!-- Y-axis labels -->
                    <text x="35" y="15" text-anchor="end" font-size="8" fill="#6c757d">$${parseFloat(startingPrice).toFixed(0)}</text>
                    <text x="35" y="133" text-anchor="end" font-size="8" fill="#6c757d">$${parseFloat(floorPrice).toFixed(0)}</text>

                    <!-- X-axis labels -->
                    <text x="40" y="145" text-anchor="start" font-size="8" fill="#6c757d">0</text>
                    <text x="165" y="145" text-anchor="middle" font-size="8" fill="#6c757d">${Math.floor(durationMinutes / 2)}m</text>
                    <text x="290" y="145" text-anchor="end" font-size="8" fill="#6c757d">${durationMinutes}m</text>

                    <!-- Floor price line -->
                    <line x1="40" y1="130" x2="290" y2="130" stroke="#e63946" stroke-width="1" stroke-dasharray="4,2" />

                    <!-- Price curve -->
                    <polyline
                      fill="none"
                      stroke="#457b9d"
                      stroke-width="2"
                      points="${generatePreviewPoints().map(p => {
                        const x = 40 + (p.x / 100) * 250;
                        const priceRange = parseFloat(startingPrice) - parseFloat(floorPrice);
                        const y = 10 + ((parseFloat(startingPrice) - p.y) / priceRange) * 120;
                        return `${x},${Math.max(10, Math.min(130, y))}`;
                      }).join(' ')}"
                    />
                  </svg>
                </div>
                <div class="decay-preview__legend">
                  <span class="decay-preview__legend-item">
                    <span class="decay-preview__legend-color" style="background: #457b9d;"></span>
                    Price curve
                  </span>
                  <span class="decay-preview__legend-item">
                    <span class="decay-preview__legend-color decay-preview__legend-color--dashed" style="background: #e63946;"></span>
                    Floor price
                  </span>
                </div>
              </div>
            `}
          `}

          <!-- Algorithmic Mode: Parameters -->
          ${pricingMode === 'algorithmic' && html`
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
                  onChange=${(e) => setDecayRate(e.target.value)}
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
                  onChange=${(e) => setViewerMultiplier(e.target.value)}
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
                  onChange=${(e) => setShieldInfluence(e.target.value)}
                />
                <small class="form-hint">Impact of open shields on price</small>
              </div>
            </div>
          `}
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button
            type="submit"
            class="btn-primary btn-primary--large"
            disabled=${isSubmitting}
          >
            ${isSubmitting ? 'Creating Auction...' : html`<span dangerouslySetInnerHTML=${{ __html: '&#10024;' }}></span> Create Auction`}
          </button>
        </div>
      </form>
    </div>
  `;
}
