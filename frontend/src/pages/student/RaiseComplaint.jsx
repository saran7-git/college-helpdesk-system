import React, { useState } from 'react'
import UploadArea from '../../components/UploadArea'
import { createTicket } from '../../services/api'
import { useNavigate } from 'react-router-dom'

export default function RaiseComplaint() {
const [form, setForm] = useState({ category: 'Academic', priority: 'Medium', subject: '', description: '' })
  const [files, setFiles] = useState([])
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('category', form.category)
      fd.append('priority', form.priority)
      fd.append('subject', form.subject)
      fd.append('description', form.description)
files.forEach((f) => fd.append('media', f))
      const { data } = await createTicket(fd)
      setSuccess({ id: data.id, ticketNo: data.ticketId || data.ticketNo || data.id })
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Raise Complaint</div>
      {error && <div style={{ color: '#ef4444', marginBottom: 8 }}>{error}</div>}
      {success && (
        <div className="card" style={{ background: '#ecfeff', borderColor: '#a5f3fc', marginBottom: 12 }}>
          <div>Submitted successfully. Ticket ID: <span style={{ color: 'var(--primary)' }}>{success.ticketNo}</span></div>
          <div style={{ marginTop: 8 }}>
            <button className="btn secondary" onClick={() => navigate(`/student/tickets/${success.id}`)}>View Ticket</button>
          </div>
        </div>
      )}
      <form onSubmit={onSubmit}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 2fr' }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ marginBottom: 6 }}>Category</div>
            <select className="select" name="category" value={form.category} onChange={onChange}>
              <option>Academic</option>
              <option>Hostel</option>
              <option>Transport</option>
              <option>Fees</option>
              <option>Infrastructure</option>
              <option>Technical</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ marginBottom: 6 }}>Priority</div>
            <select className="select" name="priority" value={form.priority} onChange={onChange}>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ marginBottom: 6 }}>Subject</div>
            <input className="input" name="subject" value={form.subject} onChange={onChange} required />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 6 }}>Description</div>
          <textarea className="textarea" name="description" value={form.description} onChange={onChange} required />
        </div>
<div style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 6 }}>Media</div>
          <UploadArea onFilesSelected={setFiles} />
        </div>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
