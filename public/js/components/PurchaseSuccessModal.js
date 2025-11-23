/**
 * PurchaseSuccessModal Component
 * Modal shown when user successfully purchases an item
 */

import { formatPrice } from '../utils/formatters.js';

const { useEffect } = React;

/**
 * Purchase success modal
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {string} props.itemName - Item name
 * @param {number} props.finalPrice - Final purchase price
 * @param {number} props.newBalance - User's new balance after purchase
 * @returns {JSX.Element} Success modal
 */
export function PurchaseSuccessModal({
  isOpen,
  onClose,
  itemName,
  finalPrice,
  newBalance
}) {
  // Sanitize itemName to prevent DOMException from invalid characters
  const safeItemName = itemName ? String(itemName).replace(/[^\w\s\-.,!?'"]/g, '') : 'Unknown Item';
  // Trigger confetti animation when modal opens
  useEffect(() => {
    if (isOpen && window.confetti) {
      // Fire confetti from both sides
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 10000
      };

      function fire(particleRatio, opts) {
        window.confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      // Fire confetti burst
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isOpen]);

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
      <div class="modal modal--success" onClick=${(e) => e.stopPropagation()}>
        <div class="modal__header">
          <h2 class="modal__title">
            <span class="modal__icon">🎉</span>
            Congratulations!
          </h2>
          <button
            class="modal__close"
            onClick=${onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div class="modal__body">
          <div class="success-message">
            <p class="success-message__primary">
              You've successfully purchased <strong>${safeItemName}</strong>!
            </p>

            <div class="purchase-details">
              <div class="purchase-detail-item">
                <span class="purchase-detail-item__label">Final Price</span>
                <span class="purchase-detail-item__value purchase-detail-item__value--price">
                  ${formatPrice(finalPrice)}
                </span>
              </div>

              <div class="purchase-detail-item">
                <span class="purchase-detail-item__label">New Balance</span>
                <span class="purchase-detail-item__value">
                  ${formatPrice(newBalance)}
                </span>
              </div>
            </div>

            <p class="success-message__secondary">
              Your purchase has been confirmed and the auction has ended.
              Check your transaction history for details.
            </p>
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn-primary" onClick=${onClose}>
            View My Auctions
          </button>
          <a href="/" class="btn-secondary">
            Browse More Auctions
          </a>
        </div>
      </div>
    </div>
  `;
}
