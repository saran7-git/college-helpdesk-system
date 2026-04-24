import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', registerNumber: '', password: '', department: '', year: 1 })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      setSubmitting(true)
      await register(form)
    } catch (e) {
      setError(e.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell register-shell">
        <div className="auth-aside register-aside">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3 3 8l9 5 9-5-9-5Z" fill="#fff" opacity=".95" />
                <path d="M6 10.7V15c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.3l-6 3.3-6-3.3Z" fill="#fff" opacity=".75" />
              </svg>
            </div>
            <div>
              <h1>Create Account</h1>
              <p>Set up your student access to the College Helpdesk portal.</p>
            </div>
          </div>
          <ul className="auth-points">
            <li>Use your official `@bitsathy.ac.in` email ID.</li>
            <li>Track complaints, status updates, and responses in one place.</li>
            <li>Access dashboard and ticket history from any device.</li>
          </ul>
          <div className="auth-footer-text" style={{ color: 'rgba(255,255,255,0.9)', marginTop: 'auto' }}>
            Already registered? <Link to="/login" style={{ color: '#fff', fontWeight: 700 }}>Sign In</Link>
          </div>
        </div>

        <div className="auth-card register-card">
          <h2>Student Registration</h2>
          <p className="auth-subtitle">Fill in your details to create a secure student account.</p>
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={onSubmit} className="register-form">
            <div className="register-grid">
              <div>
                <label className="auth-label">Full Name</label>
                <input className="input" name="name" value={form.name} onChange={onChange} required />
              </div>
              <div>
                <label className="auth-label">Email</label>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="name@bitsathy.ac.in"
                  required
                />
              </div>
            </div>

            <div className="register-grid">
              <div>
                <label className="auth-label">Register Number</label>
                <input className="input" name="registerNumber" value={form.registerNumber} onChange={onChange} required />
              </div>
              <div>
                <label className="auth-label">Department</label>
                <input className="input" name="department" value={form.department} onChange={onChange} />
              </div>
            </div>

            <div className="register-grid">
              <div>
                <label className="auth-label">Year</label>
                <select className="select" name="year" value={form.year} onChange={onChange}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className="auth-label">Password</label>
                <input className="input" type="password" name="password" value={form.password} onChange={onChange} required />
              </div>
            </div>

            <button className="btn" type="submit" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
