/**
 * UserManagement Component
 * Admin interface for viewing users and granting currency
 */

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  increment
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

import { formatPrice, formatTimestamp } from '../utils/formatters.js';

const { useState, useEffect } = React;

/**
 * User management component
 * @returns {JSX.Element} User management interface
 */
export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [grantAmount, setGrantAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(null);

  // T138: Fetch and listen to all users
  useEffect(() => {
    if (!window.db) return;

    const usersQuery = query(
      collection(window.db, 'users'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const userData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUsers(userData);
        setLoading(false);
      },
      (err) => {
        console.error('[UserManagement] Error fetching users:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // T140: Handle grant currency click
  const handleGrantClick = (user) => {
    setSelectedUser(user);
    setGrantAmount('');
    setShowGrantModal(true);
    setError(null);
    setSuccess(null);
  };

  // T142-T145: Grant currency to user
  const handleGrantCurrency = async () => {
    if (!selectedUser || !grantAmount || isProcessing) return;

    const amount = parseInt(grantAmount);

    // Validate amount
    if (isNaN(amount) || amount < 100 || amount > 10000000) {
      setError('Amount must be between $1.00 and $100,000.00');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('[UserManagement] Granting currency...');
      console.log('[UserManagement] User:', selectedUser.email);
      console.log('[UserManagement] Amount:', formatPrice(amount));

      // T142: Call grantCurrency Cloud Function (Phase 17)
      const grantFunction = window.firebase.functions().httpsCallable('grantCurrency');

      const result = await grantFunction({
        userId: selectedUser.id,
        amount: amount
      });

      console.log('[UserManagement] Currency granted via Cloud Function:', result.data);

      // T144: Show success message
      setSuccess(`Successfully granted ${formatPrice(amount)} to ${selectedUser.email}`);

      // Close modal after short delay
      setTimeout(() => {
        setShowGrantModal(false);
        setSelectedUser(null);
        setGrantAmount('');
        setSuccess(null);
      }, 2000);

    } catch (err) {
      console.error('[UserManagement] Error granting currency:', err);
      setError(`Failed to grant currency: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return html`
      <div class="user-management">
        <div class="loading">Loading users...</div>
      </div>
    `;
  }

  return html`
    <div class="user-management">
      <div class="user-management__header">
        <h2 class="user-management__title">User Management</h2>
        <div class="user-management__stats">
          <span class="stats-badge">
            👥 ${users.length} ${users.length === 1 ? 'User' : 'Users'}
          </span>
        </div>
      </div>

      ${error && html`
        <div class="alert alert--error">${error}</div>
      `}

      ${success && html`
        <div class="alert alert--success">${success}</div>
      `}

      ${users.length === 0 ? html`
        <div class="user-empty">
          <p>No users registered yet.</p>
        </div>
      ` : html`
        <!-- Desktop Table View -->
        <div class="user-table-wrapper">
          <table class="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Balance</th>
                <th>Role</th>
                <th>Date Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(user => html`
                <tr key=${user.id}>
                  <td class="user-email">${user.email}</td>
                  <td class="user-name">${user.displayName || '—'}</td>
                  <td class="user-balance">
                    <span class="balance-amount">${formatPrice(user.balance || 0)}</span>
                  </td>
                  <td class="user-role">
                    <span class="role-badge role-badge--${user.role || 'user'}">
                      ${user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </td>
                  <td class="user-date">
                    ${user.createdAt ? formatTimestamp(user.createdAt) : 'Unknown'}
                  </td>
                  <td class="user-actions">
                    <button
                      class="btn-sm btn-sm--primary"
                      onClick=${() => handleGrantClick(user)}
                    >
                      💰 Grant Currency
                    </button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>

        <!-- Mobile Card View -->
        <div class="user-cards">
          ${users.map(user => html`
            <div key=${user.id} class="user-card">
              <div class="user-card__header">
                <div class="user-card__info">
                  <div class="user-card__email">${user.email}</div>
                  <div class="user-card__name">${user.displayName || 'No name'}</div>
                </div>
                <span class="role-badge role-badge--${user.role || 'user'}">
                  ${user.role === 'admin' ? '👑' : '👤'}
                </span>
              </div>

              <div class="user-card__body">
                <div class="user-card__detail">
                  <strong>Balance:</strong>
                  <span class="balance-amount">${formatPrice(user.balance || 0)}</span>
                </div>
                <div class="user-card__detail">
                  <strong>Joined:</strong>
                  ${user.createdAt ? formatTimestamp(user.createdAt) : 'Unknown'}
                </div>
              </div>

              <div class="user-card__actions">
                <button
                  class="btn-sm btn-sm--primary"
                  onClick=${() => handleGrantClick(user)}
                >
                  💰 Grant Currency
                </button>
              </div>
            </div>
          `)}
        </div>
      `}

      <!-- Grant Currency Modal -->
      ${showGrantModal && selectedUser && html`
        <div class="modal-overlay" onClick=${() => setShowGrantModal(false)}>
          <div class="modal" onClick=${(e) => e.stopPropagation()}>
            <div class="modal__header">
              <h2 class="modal__title">
                <span class="modal__icon">💰</span>
                Grant Currency
              </h2>
              <button
                class="modal__close"
                onClick=${() => setShowGrantModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div class="modal__body">
              <p>Grant fictional currency to <strong>${selectedUser.email}</strong></p>

              <div class="user-current-balance">
                <strong>Current Balance:</strong>
                <span class="balance-amount">${formatPrice(selectedUser.balance || 0)}</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="grantAmount">
                  Amount to Grant <span class="required">*</span>
                </label>
                <div class="form-input-group">
                  <span class="form-input-prefix">$</span>
                  <input
                    type="number"
                    id="grantAmount"
                    class="form-input"
                    value=${grantAmount}
                    onChange=${(e) => setGrantAmount(e.target.value)}
                    placeholder="10000"
                    min="100"
                    max="10000000"
                    step="100"
                    autoFocus
                  />
                </div>
                <small class="form-hint">
                  Amount in cents ($1.00 - $100,000.00)
                  ${grantAmount && !isNaN(parseInt(grantAmount)) ?
                    ` = ${formatPrice(parseInt(grantAmount))}` : ''}
                </small>
              </div>

              ${grantAmount && !isNaN(parseInt(grantAmount)) && html`
                <div class="grant-preview">
                  <div class="grant-preview__item">
                    <span>Current Balance:</span>
                    <span>${formatPrice(selectedUser.balance || 0)}</span>
                  </div>
                  <div class="grant-preview__item grant-preview__item--add">
                    <span>+ Grant Amount:</span>
                    <span>${formatPrice(parseInt(grantAmount))}</span>
                  </div>
                  <div class="grant-preview__item grant-preview__item--total">
                    <span>New Balance:</span>
                    <span>${formatPrice((selectedUser.balance || 0) + parseInt(grantAmount))}</span>
                  </div>
                </div>
              `}
            </div>

            <div class="modal__footer">
              <button
                class="btn-secondary"
                onClick=${() => setShowGrantModal(false)}
                disabled=${isProcessing}
              >
                Cancel
              </button>
              <button
                class="btn-primary"
                onClick=${handleGrantCurrency}
                disabled=${isProcessing || !grantAmount || parseInt(grantAmount) < 100}
              >
                ${isProcessing ? 'Granting...' : 'Grant Currency'}
              </button>
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
