/**
 * ErrorModal Component
 * Modal shown when an error occurs (e.g., purchase failure)
 */

const { useEffect } = React;

/**
 * Error modal
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {string} props.title - Error title
 * @param {string} props.message - Error message
 * @param {string} props.icon - Error icon (default: ⚠️)
 * @returns {JSX.Element} Error modal
 */
export function ErrorModal({
  isOpen,
  onClose,
  title = 'Purchase Failed',
  message,
  icon = null // Don't use emoji as default
}) {
  // Default icon as HTML entity (warning sign)
  const iconHtml = icon || '&#9888;';
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return html`
    <div class="modal-overlay" onClick=${onClose}>
      <div class="modal modal--error" onClick=${(e) => e.stopPropagation()}>
        <div class="modal__header">
          <h2 class="modal__title">
            <span class="modal__icon" dangerouslySetInnerHTML=${{ __html: iconHtml }}></span>
            ${title}
          </h2>
          <button
            class="modal__close"
            onClick=${onClose}
            aria-label="Close modal"
          >
            <span dangerouslySetInnerHTML=${{ __html: '&times;' }}></span>
          </button>
        </div>

        <div class="modal__body">
          <div class="error-message">
            <p class="error-message__text">${message}</p>
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn-primary" onClick=${onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}
