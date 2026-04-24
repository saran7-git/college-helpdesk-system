import React from 'react'

export default function StudentCallLogs() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1>Call History</h1>
        <p>View your recent support call activity.</p>
      </section>

      <section className="surface-card">
        <div className="surface-title">Recent Calls</div>
        <div style={{ color: 'var(--subtext)', fontSize: 14 }}>
          No call logs yet.
        </div>
      </section>
    </div>
  )
}
