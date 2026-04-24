import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getTicket, getCalls, createCall } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import ChatSection from '../../components/ChatSection'
import Modal from '../../components/Modal'
import { socket } from '../../services/socket'

const isAdminRole = (role) => ['admin', 'department_admin', 'super_admin'].includes(role)
const ADMIN_CALL_NUMBER = '+91 7339696112'
const ADMIN_CALL_TEL = '+917339696112'

export default function TicketDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [calls, setCalls] = useState([])
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('audio')

  const load = async () => {
    const t = await getTicket(id)
    setTicket(t.data)
    const c = await getCalls(id)
    setCalls(c.data)
  }

  useEffect(() => {
    load()
    const onNew = (c) => {
      if (String(c.ticketId) !== String(id)) return
      setCalls((prev) => [c, ...prev])
    }
    const onTicketUpdate = (t) => {
      if (String(t._id) !== String(id)) return
      setTicket((prev) => (prev ? { ...prev, ...t } : prev))
    }
    socket.on('call:new', onNew)
    socket.on('ticket:update', onTicketUpdate)
    return () => {
      socket.off('call:new', onNew)
      socket.off('ticket:update', onTicketUpdate)
    }
  }, [id])

  const startCall = async () => {
    try {
      const { data } = await createCall(id, type, 0)
      setCalls((prev) => [data, ...prev])
    } catch (err) {
      // Keep calling flow usable even if call log fails.
    } finally {
      setOpen(false)
      window.location.href = `tel:${ADMIN_CALL_TEL}`
    }
  }

  if (!ticket) return null

  return (
    <div className="two-columns">
      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>{ticket.ticketId || ticket._id} - {ticket.subject}</div>
            <StatusBadge status={ticket.status} />
          </div>
          <div style={{ color: 'var(--subtext)', marginTop: 6 }}>
            {ticket.category} | {ticket.priority || 'Medium'} | {ticket.department || 'NA'}
          </div>
          <div style={{ marginTop: 10 }}>{ticket.description}</div>
        </div>
        <ChatSection ticketId={ticket._id} />
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Media</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {ticket.media?.map((m) => (
              m.endsWith('.mp4') || m.includes('/video') ? (
                <video key={m} src={m} controls style={{ width: '100%', borderRadius: 8 }} />
              ) : (
                <img key={m} src={m} alt="" style={{ width: '100%', borderRadius: 8 }} />
              )
            ))}
          </div>
        </div>
      </div>
      <div className="grid" style={{ alignContent: 'start' }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Call</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => { setType('audio'); setOpen(true) }}>Audio Call</button>
            <button className="btn" onClick={() => { setType('video'); setOpen(true) }}>Video Call</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--subtext)' }}>Direct line: {ADMIN_CALL_NUMBER}</div>
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Admin Responses</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {(ticket.adminRemarks || []).length === 0 && (
              <li style={{ padding: '8px 0', color: 'var(--subtext)' }}>No admin responses yet</li>
            )}
            {(ticket.adminRemarks || []).map((r, idx) => (
              <li key={`${r.createdAt}-${idx}`} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{r.adminId?.name || 'Admin'}</strong>
                  <span style={{ fontSize: 12, color: 'var(--subtext)' }}>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ color: 'var(--subtext)', fontSize: 12, margin: '4px 0' }}>{r.status || ticket.status}</div>
                <div>{r.remark}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Call History</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {calls.length === 0 && <li style={{ padding: '8px 0', color: 'var(--subtext)' }}>No calls yet</li>}
            {calls.map((c) => {
              const caller = c.callerId?._id?.toString() === user.id ? 'You' : isAdminRole(user.role) ? 'Student' : 'Admin'
              return (
                <li key={c._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ textTransform: 'capitalize' }}>{c.type}</div>
                    <div style={{ color: 'var(--subtext)', fontSize: 12 }}>{caller}</div>
                  </div>
                  <div style={{ color: 'var(--subtext)' }}>{c.duration}s | {new Date(c.timestamp).toLocaleString()}</div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <Modal open={open} title={type === 'audio' ? 'Audio Call' : 'Video Call'} onClose={() => setOpen(false)}>
        <div style={{ marginBottom: 12 }}>Start {type} call to admin ({ADMIN_CALL_NUMBER})?</div>
        <button className="btn" onClick={startCall}>Start</button>
      </Modal>
    </div>
  )
}

