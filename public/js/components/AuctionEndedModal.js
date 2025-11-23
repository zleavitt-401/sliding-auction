/**
 * AuctionEndedModal Component
 * Modal shown when auction ends (either user won or another user won)
 */

import { formatPrice } from '../utils/formatters.js';

const { useEffect } = React;

/**
 * Auction ended modal
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {string} props.itemName - Item name
 * @param {number} props.finalPrice - Final auction price
 * @param {string} props.winnerName - Winner's display name (if not current user)
 * @returns {JSX.Element} Auction ended modal
 */
export function AuctionEndedModal({
  isOpen,
  onClose,
  itemName,
  finalPrice,
  winnerName = null
}) {
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
      <div class="modal modal--ended" onClick=${(e) => e.stopPropagation()}>
        <div class="modal__header">
          <h2 class="modal__title">
            <span class="modal__icon" dangerouslySetInnerHTML=${{ __html: '&#127937;' }}></span>
            Auction Ended
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
          <div class="ended-message">
            ${winnerName ? html`
              <p class="ended-message__primary">
                <strong>${winnerName}</strong> won the auction for <strong>${itemName}</strong>
              </p>

              <div class="auction-final-details">
                <div class="auction-final-detail">
                  <span class="auction-final-detail__label">Final Price</span>
                  <span class="auction-final-detail__value">
                    ${formatPrice(finalPrice)}
                  </span>
                </div>
              </div>

              <p class="ended-message__secondary">
                Better luck next time! Check out other live auctions.
              </p>
            ` : html`
              <p class="ended-message__primary">
                The auction for <strong>${itemName}</strong> has ended.
              </p>

              <div class="auction-final-details">
                <div class="auction-final-detail">
                  <span class="auction-final-detail__label">Final Price</span>
                  <span class="auction-final-detail__value">
                    ${formatPrice(finalPrice)}
                  </span>
                </div>
              </div>

              <p class="ended-message__secondary">
                The item was purchased by another user.
              </p>
            `}
          </div>
        </div>

        <div class="modal__footer">
          <a href="/" class="btn-primary">
            Browse Other Auctions
          </a>
        </div>
      </div>
    </div>
  `;
}
