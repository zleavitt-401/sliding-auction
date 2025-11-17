/**
 * AdminPanel Component
 * Main admin panel with tabs for different admin functions
 */

import { AuctionForm } from './AuctionForm.js';
import { AuctionManagement } from './AuctionManagement.js';
import { AdminDashboard } from './AdminDashboard.js';
import { UserManagement } from './UserManagement.js';

const { useState } = React;

/**
 * Admin panel component
 * @returns {JSX.Element} Admin panel
 */
export function AdminPanel() {
  const [activeTab, setActiveTab] = useState('monitor');

  return html`
    <div class="admin-panel">
      <div class="admin-panel__header">
        <h1 class="admin-panel__title">Admin Panel</h1>
        <p class="admin-panel__subtitle">
          Manage auctions, view analytics, and configure settings
        </p>
      </div>

      <!-- Tab Navigation -->
      <div class="admin-tabs">
        <button
          class="admin-tab ${activeTab === 'monitor' ? 'admin-tab--active' : ''}"
          onClick=${() => setActiveTab('monitor')}
        >
          📊 Monitor
        </button>
        <button
          class="admin-tab ${activeTab === 'manage' ? 'admin-tab--active' : ''}"
          onClick=${() => setActiveTab('manage')}
        >
          📋 Manage
        </button>
        <button
          class="admin-tab ${activeTab === 'create' ? 'admin-tab--active' : ''}"
          onClick=${() => setActiveTab('create')}
        >
          ➕ Create
        </button>
        <button
          class="admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}"
          onClick=${() => setActiveTab('users')}
        >
          👥 Users
        </button>
      </div>

      <!-- Tab Content -->
      <div class="admin-content">
        ${activeTab === 'monitor' && html`
          <${AdminDashboard} />
        `}

        ${activeTab === 'manage' && html`
          <${AuctionManagement} />
        `}

        ${activeTab === 'create' && html`
          <${AuctionForm} />
        `}

        ${activeTab === 'users' && html`
          <${UserManagement} />
        `}
      </div>
    </div>
  `;
}
