import React from 'react'

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}
