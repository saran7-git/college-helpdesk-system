import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { useAuth } from '../context/AuthContext'

export default function TicketTable({ tickets, emptyMessage, showStatusFilter = true }) {
  const { user } = useAuth()
  const isAdmin = user?.role !== 'student'
  const base = isAdmin ? '/admin/tickets' : '/student/tickets'
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const activeStatus = showStatusFilter ? status : ''
    return tickets.filter((t) => {
      const matchesQ =
        !q ||
        String(t._id).toLowerCase().includes(q) ||
        (t.ticketId || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      const matchesStatus = !activeStatus || t.status === activeStatus
      return matchesQ && matchesStatus
    })
  }, [tickets, query, status, isAdmin, showStatusFilter])

  const resolvedEmptyMessage =
    filtered.length === 0
      ? (query || status ? 'No tickets match current filters.' : (emptyMessage || 'No complaints found.'))
      : ''

  return (
    <div>
      <div className="table-filters" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input className="input" placeholder="Search tickets..." value={query} onChange={(e) => setQuery(e.target.value)} />
        {showStatusFilter && (
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>Assigned</option>
            <option>In Progress</option>
            <option>Resolved</option>
            <option>Rejected</option>
          </select>
        )}
      </div>
      
      {/* Mobile Card Layout */}
      <div className="card-list" style={{ display: 'none' }}>
        {filtered.map((t) => (
          <div key={t._id} className="card-item">
            <h4>
              <Link className="link" to={`${base}/${t._id}`} title={t.ticketId || t._id}>
                {t.ticketId || t._id}
              </Link>
            </h4>
            <div className="card-meta">
              <div className="card-meta-item">
                <strong>Category:</strong> {t.category}
              </div>
              <div className="card-meta-item">
                <strong>Status:</strong> <StatusBadge status={t.status} />
              </div>
            </div>
            <div className="card-meta">
              <div className="card-meta-item">
                <strong>Subject:</strong> {t.subject}
              </div>
              <div className="card-meta-item">
                <strong>Date:</strong> {new Date(t.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="card-actions">
              <Link className="btn" to={`${base}/${t._id}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                  <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="#fff" />
                  <path d="M12 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="#fff" />
                </svg>
                View Details
              </Link>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card-item" style={{ textAlign: 'center', color: 'var(--subtext)' }}>
            {resolvedEmptyMessage}
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="table-responsive">
        <table className="table table-fixed table-tickets">
          <colgroup>
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
            <col style={{ width: '16.66%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Category</th>
              <th>Subject</th>
              <th className="cell-nowrap table-date-col">Date</th>
              <th className="ta-center">Status</th>
              <th className="ta-right table-action-col">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t._id} className="hover">
                <td>
                  <Link className="link ticket-id-link" to={`${base}/${t._id}`} title={t.ticketId || t._id}>
                    {t.ticketId || t._id}
                  </Link>
                </td>
                <td>{t.category}</td>
                <td className="cell-wrap">{t.subject}</td>
                <td className="cell-nowrap table-date-col">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="ta-center"><StatusBadge status={t.status} /></td>
                <td className="ta-right table-action-col">
                  <Link className="action-link table-action-link" to={`${base}/${t._id}`}>
                    <span className="table-action-inner">
                      <svg className="table-action-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="var(--primary)" />
                        <path d="M12 9c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="var(--primary)" />
                      </svg>
                      <span className="table-action-text">View</span>
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="ta-center" style={{ color: 'var(--subtext)', padding: '22px 12px' }}>
                  {resolvedEmptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
