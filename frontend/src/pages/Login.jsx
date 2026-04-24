import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setSubmitting(true)
      await login(identifier, password)
    } catch (err) {
      setError(err.message || 'Unable to login')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-aside">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3 3 8l9 5 9-5-9-5Z" fill="#fff" opacity=".95" />
                <path d="M6 10.7V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.3l-6 3.3-6-3.3Z" fill="#fff" opacity=".75" />
              </svg>
            </div>
            <div>
              <h1>College Helpdesk</h1>
              <p>Centralized issue tracking for students and admins</p>
            </div>
          </div>
          <ul className="auth-points">
            <li>Track complaint lifecycle in real time</li>
            <li>Manage student accounts and call logs</li>
            <li>Secure role-based access for each dashboard</li>
          </ul>
          <div className="auth-panel-fill">
            <div className="auth-mini-stats">
              <div className="auth-mini-stat">
                <span>24/7</span>
                <small>Helpdesk Support</small>
              </div>
              <div className="auth-mini-stat">
                <span>Live</span>
                <small>Status Updates</small>
              </div>
            </div>
            <div className="auth-support-note">
              <div className="auth-support-title">Need immediate help?</div>
              <div className="auth-support-text">Use the emergency contact after login for urgent issues.</div>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in as student or admin to continue to your dashboard.</p>
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={onSubmit}>
            <label className="auth-label">Email / Register Number</label>
            <input
              className="input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter email or register number"
              autoComplete="username"
              required
            />

            <label className="auth-label" style={{ marginTop: 12 }}>Password</label>
            <div className="auth-password-row">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button className="btn" type="submit" style={{ width: '100%', marginTop: 14 }} disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer auth-footer-cta">
            <div className="auth-footer-title">New to College Helpdesk?</div>
            <div className="auth-footer-text">Create your student account to raise and track complaints.</div>
            <Link to="/register" className="auth-register-btn">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
