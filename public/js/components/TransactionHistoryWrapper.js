/**
 * TransactionHistoryWrapper Component
 * Listens for global events to show transaction history modal
 */

import { TransactionHistoryModal } from './TransactionHistoryModal.js';

const { useState, useEffect } = React;

/**
 * Wrapper component for transaction history modal
 * Listens to window events to control modal visibility
 * @returns {JSX.Element} Transaction history modal wrapper
 */
export function TransactionHistoryWrapper() {
  const [showModal, setShowModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [balance, setBalance] = useState(0);

  // Listen for show-transaction-history event
  useEffect(() => {
    const handleShowModal = (event) => {
      setUserId(event.detail.userId);
      setBalance(event.detail.balance);
      setShowModal(true);
    };

    window.addEventListener('show-transaction-history', handleShowModal);

    return () => {
      window.removeEventListener('show-transaction-history', handleShowModal);
    };
  }, []);

  if (!showModal || !userId) {
    return null;
  }

  return html`
    <${TransactionHistoryModal}
      isOpen=${showModal}
      onClose=${() => setShowModal(false)}
      userId=${userId}
      currentBalance=${balance}
    />
  `;
}
