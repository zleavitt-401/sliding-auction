/**
 * AuthForm Component
 * Handles both login and registration forms
 */

import { useAuth } from '../hooks/useAuth.js';

const { useState } = React;

/**
 * Authentication form component
 * @param {Object} props - Component props
 * @param {string} props.mode - 'login' or 'register'
 * @returns {JSX.Element} Auth form
 */
export function AuthForm({ mode = 'login' }) {
  const { login, register, resetPassword, loading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validation
    if (!email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isLogin) {
        await login(email, password);
        // Redirect to homepage on successful login
        window.location.href = '/';
      } else if (isRegister) {
        await register(email, password, displayName || null);
        // Redirect to homepage on successful registration
        window.location.href = '/';
      }

    } catch (err) {
      console.error('[AuthForm] Submit error:', err);
      setFormError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle password reset
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!email) {
      setFormError('Please enter your email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(email);
      setFormSuccess('Password reset email sent! Check your inbox.');
      setShowResetPassword(false);
    } catch (err) {
      console.error('[AuthForm] Reset password error:', err);
      setFormError(err.message || 'Failed to send reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password reset form
  if (showResetPassword) {
    return html`
      <form onSubmit=${handleResetPassword} class="auth-form">
        <h2>Reset Password</h2>
        <p class="auth-form-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        ${formError && html`<div class="error">${formError}</div>`}
        ${formSuccess && html`<div class="success">${formSuccess}</div>`}

        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            value=${email}
            onChange=${(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled=${isSubmitting}
          />
        </div>

        <button
          type="submit"
          class="btn-primary"
          disabled=${isSubmitting}
        >
          ${isSubmitting ? 'Sending...' : 'Send Reset Email'}
        </button>

        <button
          type="button"
          class="btn-secondary"
          onClick=${() => setShowResetPassword(false)}
          disabled=${isSubmitting}
        >
          Back to Login
        </button>
      </form>
    `;
  }

  // Login/Register form
  return html`
    <form onSubmit=${handleSubmit} class="auth-form">
      ${formError && html`<div class="error">${formError}</div>`}
      ${error && html`<div class="error">${error}</div>`}

      ${isRegister && html`
        <div class="form-group">
          <label for="displayName">Display Name (optional)</label>
          <input
            type="text"
            id="displayName"
            value=${displayName}
            onChange=${(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            disabled=${isSubmitting}
          />
        </div>
      `}

      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          type="email"
          id="email"
          value=${email}
          onChange=${(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          disabled=${isSubmitting}
          autoComplete=${isLogin ? 'username' : 'email'}
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          value=${password}
          onChange=${(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          required
          disabled=${isSubmitting}
          autoComplete=${isLogin ? 'current-password' : 'new-password'}
        />
      </div>

      ${isRegister && html`
        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value=${confirmPassword}
            onChange=${(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            disabled=${isSubmitting}
            autoComplete="new-password"
          />
        </div>
      `}

      ${isLogin && html`
        <div class="form-actions">
          <button
            type="button"
            class="link-button"
            onClick=${() => setShowResetPassword(true)}
            disabled=${isSubmitting}
          >
            Forgot password?
          </button>
        </div>
      `}

      <button
        type="submit"
        class="btn-primary"
        disabled=${isSubmitting || loading}
      >
        ${isSubmitting || loading
          ? 'Please wait...'
          : isLogin
            ? 'Sign In'
            : 'Create Account'}
      </button>

      ${isRegister && html`
        <p class="auth-notice">
          By creating an account, you'll start with $1,000.00 in fictional currency to use in auctions.
        </p>
      `}
    </form>
  `;
}
