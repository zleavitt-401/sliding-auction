/**
 * AuctionForm Component
 * Form for creating new auctions with full configuration
 *
 * Refactored to use:
 * - Extracted utilities (imageUtils, auctionValidation)
 * - Shared price formulas
 * - Sub-components (ItemDetailsSection, PricingSection)
 * - usePricePreview hook
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
import { resizeImage } from '../utils/imageUtils.js';
import { validateAuctionForm, canAddImages } from '../utils/auctionValidation.js';
import { calculateExpDecayRate } from '../shared/priceFormulas.js';
import { DEFAULT_DURATION_MINUTES } from '../shared/constants.js';
import { usePricePreview } from '../hooks/usePricePreview.js';
import { ItemDetailsSection } from './auction-form/ItemDetailsSection.js';
import { PricingSection } from './auction-form/PricingSection.js';

const { useState, useCallback } = React;

/**
 * Auction form component
 * @returns {JSX.Element} Auction creation form
 */
export function AuctionForm() {
  // Form state - Item details
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // Form state - Pricing
  const [startingPrice, setStartingPrice] = useState('');
  const [floorPrice, setFloorPrice] = useState('');
  const [duration, setDuration] = useState(String(DEFAULT_DURATION_MINUTES));
  const [pricingMode, setPricingMode] = useState('transparent');
  const [formula, setFormula] = useState('linear');

  // Exponential decay settings
  const [expSteepness, setExpSteepness] = useState(50);

  // Stepped decay settings
  const [stepCount, setStepCount] = useState(10);
  const [stepInterval, setStepInterval] = useState(null);
  const [stepAmount, setStepAmount] = useState(null);
  const [useManualSteps, setUseManualSteps] = useState(false);

  // Algorithmic mode settings
  const [algorithmParams, setAlgorithmParams] = useState({
    decayRate: 0.1,
    viewerMultiplier: 0.05,
    shieldInfluence: 0.02
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Use price preview hook
  const durationMinutes = parseInt(duration) || DEFAULT_DURATION_MINUTES;
  const pricePreview = usePricePreview({
    startingPrice,
    floorPrice,
    durationMinutes,
    formula,
    expSteepness,
    stepCount,
    stepInterval,
    stepAmount,
    useManualSteps
  });

  // Handle image upload
  const handleImageChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    const { allowed, error: imageError } = canAddImages(images.length, files.length);

    if (!allowed) {
      setError(imageError);
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setImages(prev => [...prev, ...files]);
    setError(null);
  }, [images.length]);

  // Remove image
  const removeImage = useCallback((index) => {
    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviewUrls]);

  // Upload images to Firebase Storage
  const uploadImages = async (auctionId) => {
    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];

      try {
        // Generate thumbnail (200x200)
        const thumbnailBlob = await resizeImage(file, 200, 200);
        const thumbnailRef = ref(window.storage, `auctions/${auctionId}/thumbnail_${i}.jpg`);
        await uploadBytes(thumbnailRef, thumbnailBlob);
        const thumbnailUrl = await getDownloadURL(thumbnailRef);

        // Generate full size (1200px max)
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

  // Build pricing config based on mode and formula
  const buildPricingConfig = () => {
    const startingPriceCents = parsePriceToCents(startingPrice);
    const floorPriceCents = parsePriceToCents(floorPrice);
    const durationSeconds = durationMinutes * 60;

    if (pricingMode === 'transparent') {
      const config = { formula };

      if (formula === 'exponential') {
        config.decayRate = calculateExpDecayRate(
          expSteepness,
          startingPriceCents,
          floorPriceCents,
          durationSeconds
        );
        config.steepness = expSteepness;
      } else if (formula === 'stepped') {
        const { effectiveStepCount } = pricePreview;
        config.stepCount = effectiveStepCount;
        config.stepInterval = useManualSteps && stepInterval
          ? stepInterval
          : Math.floor(durationSeconds / effectiveStepCount);
        config.stepAmount = useManualSteps && stepAmount
          ? parsePriceToCents(stepAmount)
          : Math.floor((startingPriceCents - floorPriceCents) / effectiveStepCount);
      }

      return config;
    }

    // Algorithmic mode
    return {
      decayRate: parseFloat(algorithmParams.decayRate),
      viewerMultiplier: parseFloat(algorithmParams.viewerMultiplier),
      shieldInfluence: parseFloat(algorithmParams.shieldInfluence)
    };
  };

  // Reset form to initial state
  const resetForm = () => {
    setItemName('');
    setDescription('');
    setStartingPrice('');
    setFloorPrice('');
    setDuration(String(DEFAULT_DURATION_MINUTES));
    setPricingMode('transparent');
    setFormula('linear');
    setExpSteepness(50);
    setStepCount(10);
    setStepInterval(null);
    setStepAmount(null);
    setUseManualSteps(false);
    setAlgorithmParams({ decayRate: 0.1, viewerMultiplier: 0.05, shieldInfluence: 0.02 });
    setImages([]);
    setImagePreviewUrls([]);
    setValidationErrors({});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate using extracted validation
    const { valid, errors } = validateAuctionForm({
      itemName,
      description,
      startingPrice,
      floorPrice,
      duration,
      images
    });

    if (!valid) {
      setValidationErrors(errors);
      setError('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setValidationErrors({});

    try {
      console.log('[AuctionForm] Creating auction...');

      const startingPriceCents = parsePriceToCents(startingPrice);
      const floorPriceCents = parsePriceToCents(floorPrice);
      const durationSeconds = durationMinutes * 60;

      const auctionData = {
        itemName: itemName.trim(),
        itemDescription: description.trim(),
        images: [], // Will be updated after upload
        startingPrice: startingPriceCents,
        currentPrice: startingPriceCents,
        floorPrice: floorPriceCents,
        duration: durationSeconds,
        pricingMode,
        pricingConfig: buildPricingConfig(),
        status: 'scheduled',
        viewerCount: 0,
        openShieldCount: 0,
        createdAt: serverTimestamp(),
        createdBy: window.currentUserId
      };

      console.log('[AuctionForm] Auction data being sent:', JSON.stringify(auctionData, null, 2));
      const docRef = await addDoc(collection(window.db, 'auctions'), auctionData);
      console.log('[AuctionForm] Auction document created:', docRef.id);

      // Upload images
      console.log('[AuctionForm] Uploading images...');
      const uploadedImages = await uploadImages(docRef.id);

      // Update auction with image URLs
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js');
      await updateDoc(doc(window.db, 'auctions', docRef.id), {
        images: uploadedImages
      });

      console.log('[AuctionForm] Auction created successfully!');
      setSuccess(`Auction created successfully! Auction ID: ${docRef.id}`);
      resetForm();

      // Scroll to top to see success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('[AuctionForm] Error creating auction:', err);
      console.error('[AuctionForm] Error code:', err.code);
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

        <${ItemDetailsSection}
          itemName=${itemName}
          onItemNameChange=${setItemName}
          description=${description}
          onDescriptionChange=${setDescription}
          images=${images}
          imagePreviewUrls=${imagePreviewUrls}
          onImageChange=${handleImageChange}
          onRemoveImage=${removeImage}
          validationErrors=${validationErrors}
        />

        <${PricingSection}
          startingPrice=${startingPrice}
          onStartingPriceChange=${setStartingPrice}
          floorPrice=${floorPrice}
          onFloorPriceChange=${setFloorPrice}
          duration=${duration}
          onDurationChange=${setDuration}
          pricingMode=${pricingMode}
          onPricingModeChange=${setPricingMode}
          formula=${formula}
          onFormulaChange=${setFormula}
          expSteepness=${expSteepness}
          onExpSteepnessChange=${setExpSteepness}
          stepCount=${stepCount}
          onStepCountChange=${setStepCount}
          stepInterval=${stepInterval}
          onStepIntervalChange=${setStepInterval}
          stepAmount=${stepAmount}
          onStepAmountChange=${setStepAmount}
          useManualSteps=${useManualSteps}
          onUseManualStepsChange=${setUseManualSteps}
          algorithmParams=${algorithmParams}
          onAlgorithmParamsChange=${setAlgorithmParams}
          pricePreview=${pricePreview}
          validationErrors=${validationErrors}
        />

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
