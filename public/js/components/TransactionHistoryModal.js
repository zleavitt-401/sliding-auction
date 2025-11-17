/**
 * TransactionHistoryModal Component
 * Modal showing user's transaction history with pagination
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import { formatPrice, formatTimestamp } from '../utils/formatters.js';

const { useState, useEffect } = React;

const TRANSACTIONS_PER_PAGE = 20;

/**
 * Transaction history modal
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {string} props.userId - User ID to fetch transactions for
 * @param {number} props.currentBalance - Current user balance
 * @returns {JSX.Element} Transaction history modal
 */
export function TransactionHistoryModal({
  isOpen,
  onClose,
  userId,
  currentBalance
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  // T091-T093: Fetch transactions
  useEffect(() => {
    if (!isOpen || !userId || !window.db) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const transactionsRef = collection(window.db, 'transactions');

        // Query transactions for this user, sorted by timestamp descending
        let q = query(
          transactionsRef,
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(TRANSACTIONS_PER_PAGE + 1) // Fetch one extra to check if there's more
        );

        // For pagination: start after last document
        if (page > 1 && lastDoc) {
          q = query(
            transactionsRef,
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            startAfter(lastDoc),
            limit(TRANSACTIONS_PER_PAGE + 1)
          );
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        // Check if there are more transactions
        setHasMore(docs.length > TRANSACTIONS_PER_PAGE);

        // Take only the requested number of transactions
        const transactionDocs = docs.slice(0, TRANSACTIONS_PER_PAGE);

        const transactionData = transactionDocs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTransactions(transactionData);

        // Store last document for pagination
        if (transactionDocs.length > 0) {
          setLastDoc(transactionDocs[transactionDocs.length - 1]);
        }

        setLoading(false);

      } catch (err) {
        console.error('[TransactionHistoryModal] Error fetching transactions:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [isOpen, userId, page]);

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

  // Reset page when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPage(1);
      setLastDoc(null);
    }
  }, [isOpen]);

  // Format transaction type
  const formatType = (type) => {
    const typeMap = {
      'admin_grant': 'Admin Grant',
      'purchase': 'Purchase',
      'refund': 'Refund',
      'adjustment': 'Adjustment'
    };
    return typeMap[type] || type;
  };

  // Get type-specific styling
  const getTypeClass = (type) => {
    if (type === 'admin_grant' || type === 'refund') {
      return 'transaction-type--positive';
    } else if (type === 'purchase') {
      return 'transaction-type--negative';
    }
    return '';
  };

  if (!isOpen) return null;

  return html`
    <div class="modal-overlay" onClick=${onClose}>
      <div class="modal modal--large" onClick=${(e) => e.stopPropagation()}>
        <div class="modal__header">
          <h2 class="modal__title">
            <span class="modal__icon">💰</span>
            Transaction History
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
          <!-- Current Balance Display -->
          <div class="balance-summary">
            <div class="balance-summary__label">Current Balance</div>
            <div class="balance-summary__value">${formatPrice(currentBalance)}</div>
          </div>

          <!-- Loading State -->
          ${loading && html`
            <div class="transaction-loading">
              <div class="loading">Loading transactions...</div>
            </div>
          `}

          <!-- Error State -->
          ${error && html`
            <div class="transaction-error">
              <p>Error loading transactions: ${error}</p>
            </div>
          `}

          <!-- Transactions List -->
          ${!loading && !error && html`
            ${transactions.length === 0 ? html`
              <div class="transaction-empty">
                <p>No transactions yet.</p>
                <p class="transaction-empty__hint">
                  Your purchase history and balance changes will appear here.
                </p>
              </div>
            ` : html`
              <!-- Desktop Table View -->
              <div class="transaction-table-wrapper">
                <table class="transaction-table">
                  <thead>
                    <tr>
                      <th>Date/Time</th>
                      <th>Type</th>
                      <th>Item</th>
                      <th>Amount</th>
                      <th>Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactions.map(tx => html`
                      <tr key=${tx.id}>
                        <td class="transaction-date">
                          ${formatTimestamp(tx.timestamp)}
                        </td>
                        <td class="transaction-type">
                          <span class="transaction-type-badge ${getTypeClass(tx.type)}">
                            ${formatType(tx.type)}
                          </span>
                        </td>
                        <td class="transaction-item">
                          ${tx.itemName || tx.description || '—'}
                        </td>
                        <td class="transaction-amount ${tx.amount > 0 ? 'amount--positive' : 'amount--negative'}">
                          ${tx.amount > 0 ? '+' : ''}${formatPrice(tx.amount)}
                        </td>
                        <td class="transaction-balance">
                          ${formatPrice(tx.balanceAfter)}
                        </td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>

              <!-- Mobile Card View -->
              <div class="transaction-cards">
                ${transactions.map(tx => html`
                  <div key=${tx.id} class="transaction-card">
                    <div class="transaction-card__header">
                      <span class="transaction-type-badge ${getTypeClass(tx.type)}">
                        ${formatType(tx.type)}
                      </span>
                      <span class="transaction-card__date">
                        ${formatTimestamp(tx.timestamp)}
                      </span>
                    </div>
                    <div class="transaction-card__body">
                      ${tx.itemName || tx.description ? html`
                        <div class="transaction-card__item">
                          ${tx.itemName || tx.description}
                        </div>
                      ` : ''}
                      <div class="transaction-card__amounts">
                        <div class="transaction-card__amount ${tx.amount > 0 ? 'amount--positive' : 'amount--negative'}">
                          ${tx.amount > 0 ? '+' : ''}${formatPrice(tx.amount)}
                        </div>
                        <div class="transaction-card__balance">
                          Balance: ${formatPrice(tx.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  </div>
                `)}
              </div>

              <!-- T094: Pagination -->
              ${(page > 1 || hasMore) && html`
                <div class="transaction-pagination">
                  <button
                    class="btn-secondary"
                    onClick=${() => setPage(p => p - 1)}
                    disabled=${page === 1}
                  >
                    ← Previous
                  </button>
                  <span class="transaction-pagination__page">
                    Page ${page}
                  </span>
                  <button
                    class="btn-secondary"
                    onClick=${() => setPage(p => p + 1)}
                    disabled=${!hasMore}
                  >
                    Next →
                  </button>
                </div>
              `}
            `}
          `}
        </div>

        <div class="modal__footer">
          <button class="btn-secondary" onClick=${onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}
