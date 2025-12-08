/**
 * ItemDetailsSection Component
 * Form section for item name, description, and images
 */

/**
 * @param {Object} props
 * @param {string} props.itemName - Item name value
 * @param {function} props.onItemNameChange - Item name change handler
 * @param {string} props.description - Description value
 * @param {function} props.onDescriptionChange - Description change handler
 * @param {File[]} props.images - Array of image files
 * @param {string[]} props.imagePreviewUrls - Array of preview URLs
 * @param {function} props.onImageChange - Image input change handler
 * @param {function} props.onRemoveImage - Remove image handler
 * @param {Object} props.validationErrors - Validation errors by field
 */
export function ItemDetailsSection({
  itemName,
  onItemNameChange,
  description,
  onDescriptionChange,
  images,
  imagePreviewUrls,
  onImageChange,
  onRemoveImage,
  validationErrors
}) {
  return html`
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
          onChange=${(e) => onItemNameChange(e.target.value)}
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
          onChange=${(e) => onDescriptionChange(e.target.value)}
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
          onChange=${onImageChange}
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
                  onClick=${() => onRemoveImage(index)}
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
  `;
}
