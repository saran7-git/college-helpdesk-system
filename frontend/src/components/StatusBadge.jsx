import React from 'react'

export default function StatusBadge({ status }) {
  const map = {
    Pending: 'status pending',
    Assigned: 'status assigned',
    'In Progress': 'status progress',
    Resolved: 'status resolved',
    Rejected: 'status rejected'
  }
  return <span className={map[status] || 'status'}>{status}</span>
}
