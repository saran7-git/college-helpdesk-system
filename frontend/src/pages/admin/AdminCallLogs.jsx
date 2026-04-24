import React, { useEffect, useState } from 'react'
import { getCallLogs } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function AdminCallLogs() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getCallLogs()
        setCalls(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1>Call History</h1>
        <p>Recent audio/video call activity across all tickets.</p>
      </section>

      <section className="surface-card" style={{ padding: 0 }}>
        <div className="table-responsive">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Type</th>
                <th>Caller</th>
                <th className="ta-center">Duration</th>
                <th className="cell-nowrap">Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="ta-center" style={{ padding: 18, color: 'var(--subtext)' }}>
                    Loading call logs...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ta-center" style={{ padding: 18, color: 'var(--subtext)' }}>
                    No call logs yet.
                  </td>
                </tr>
              ) : (
                calls.map((c) => {
                  const callerName = 'Private'
                  const ticketId = c.ticketId?._id || c.ticketId
                  const ticketSubject = c.ticketId?.subject || ''
                  return (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ticketId}</div>
                        {ticketSubject && <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{ticketSubject}</div>}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                      <td>{callerName}</td>
                      <td className="ta-center">{c.duration}s</td>
                      <td className="cell-nowrap">{new Date(c.timestamp).toLocaleString()}</td>
                      <td><StatusBadge status={c.ticketId?.status || 'Pending'} /></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

