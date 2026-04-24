import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getTicket, getCalls, createCall, updateTicketStatus } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import ChatSection from '../../components/ChatSection'
import Modal from '../../components/Modal'
import { socket } from '../../services/socket'

const isAdminRole = (role) => ['admin', 'department_admin', 'super_admin'].includes(role)

export default function AdminTicketDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [calls, setCalls] = useState([])
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('audio')
  const [status, setStatus] = useState('')
  const [remark, setRemark] = useState('')
  const [showUploads, setShowUploads] = useState(false)

  const load = async () => {
    const t = await getTicket(id)
    setTicket(t.data)
    setStatus(t.data.status)
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
      setTicket(t)
      setStatus(t.status)
    }
    socket.on('call:new', onNew)
    socket.on('ticket:update', onTicketUpdate)
    return () => {
      socket.off('call:new', onNew)
      socket.off('ticket:update', onTicketUpdate)
    }
  }, [id])

  const startCall = async () => {
    const { data } = await createCall(id, type, Math.floor(Math.random() * 300) + 30)
    setOpen(false)
    setCalls((prev) => [data, ...prev])
  }

  const saveStatus = async () => {
    await updateTicketStatus(id, status, remark)
    setTicket((prev) => ({ ...prev, status }))
    setRemark('')
  }

  const isVideoFile = (url = '') => /\.(mp4|webm|ogg|mov|mkv)$/i.test(url)
  const isImageFile = (url = '') => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(url)
  const isPdfFile = (url = '') => /\.pdf$/i.test(url)

  if (!ticket) return null

  return (
    <div className="two-columns">
      <div className="grid" style={{ alignContent: 'start' }}>
        {/* Ticket Header Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                {ticket.ticketId || ticket._id}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>
                {ticket.subject}
              </div>
            </div>
            <StatusBadge status={ticket.status} />
          </div>
          <div style={{ color: 'var(--subtext)', marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: 'var(--text)' }}>Category:</strong> {ticket.category}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: 'var(--text)' }}>Priority:</strong> {ticket.priority || 'Medium'}
            </div>
            <div>
              <strong style={{ color: 'var(--text)' }}>Department:</strong> {ticket.department || 'NA'}
            </div>
          </div>
          <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 6 }}>Description</div>
            <div style={{ lineHeight: 1.6, color: 'var(--text)' }}>
              {ticket.description}
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <ChatSection ticketId={ticket._id} />

        {/* Attachments Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Attachments</div>
            <button 
              className="btn secondary" 
              onClick={() => setShowUploads((v) => !v)} 
              style={{ color: '#fff', padding: '8px 14px', fontSize: 13 }}
            >
              {showUploads ? 'Hide' : 'Show'}
            </button>
          </div>
          {showUploads && (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {(ticket.attachments?.length ? ticket.attachments : ticket.media || []).map((m) => (
                <div key={m} className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {isVideoFile(m) && (
                    <video src={m} controls style={{ width: '100%', borderRadius: 8, maxHeight: 150, objectFit: 'cover' }} />
                  )}
                  {isImageFile(m) && (
                    <img src={m} alt="attachment" style={{ width: '100%', borderRadius: 8, maxHeight: 150, objectFit: 'cover' }} />
                  )}
                  {isPdfFile(m) && (
                    <div style={{ padding: 12, background: 'var(--muted)', borderRadius: 8, textAlign: 'center', color: 'var(--subtext)', fontSize: 12, fontWeight: 500 }}>
                      📄 PDF
                    </div>
                  )}
                  {!isVideoFile(m) && !isImageFile(m) && !isPdfFile(m) && (
                    <div style={{ padding: 12, background: 'var(--muted)', borderRadius: 8, textAlign: 'center', color: 'var(--subtext)', fontSize: 12, fontWeight: 500 }}>
                      📎 File
                    </div>
                  )}
                  <a
                    className="btn secondary"
                    href={m}
                    target="_blank"
                    rel="noreferrer"
                    download
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', fontSize: 13, padding: '8px 12px' }}
                  >
                    Download
                  </a>
                </div>
              ))}
              {(ticket.attachments?.length ? ticket.attachments : ticket.media || []).length === 0 && (
                <div style={{ color: 'var(--subtext)', fontSize: 14, padding: '12px 0' }}>No uploads available.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="grid" style={{ alignContent: 'start' }}>
        {/* Call Actions Card */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Initiate Call</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button 
              className="btn" 
              onClick={() => { setType('audio'); setOpen(true) }}
              style={{ padding: '10px 12px', fontSize: 13 }}
            >
              📞 Audio Call
            </button>
            <button 
              className="btn" 
              onClick={() => { setType('video'); setOpen(true) }}
              style={{ padding: '10px 12px', fontSize: 13 }}
            >
              📹 Video Call
            </button>
          </div>
        </div>

        {/* Admin Remarks Timeline */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Admin Remarks</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {(ticket.adminRemarks || []).length === 0 && (
              <li style={{ padding: '12px 0', color: 'var(--subtext)', fontSize: 14 }}>No remarks yet</li>
            )}
            {(ticket.adminRemarks || []).map((r, idx) => (
              <li 
                key={`${r.createdAt}-${idx}`} 
                style={{ 
                  padding: '12px 0', 
                  borderBottom: idx < (ticket.adminRemarks || []).length - 1 ? '1px solid var(--border)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <strong style={{ fontSize: 14 }}>{r.adminId?.name || 'Admin'}</strong>
                  <span style={{ fontSize: 12, color: 'var(--subtext)' }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  {r.status || ticket.status}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text)' }}>
                  {r.remark}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Update Status Card */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Update Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea
              className="textarea"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add admin remark (optional)"
              style={{ minHeight: 80 }}
            />
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Pending</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>
            <button className="btn" onClick={saveStatus} style={{ width: '100%' }}>
              Save Changes
            </button>
          </div>
        </div>

        {/* Call History Card */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Call History</div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {calls.length === 0 && (
              <li style={{ padding: '12px 0', color: 'var(--subtext)', fontSize: 14 }}>No calls yet</li>
            )}
            {calls.map((c, idx) => {
              const caller = c.callerId?._id?.toString() === user.id ? 'You' : isAdminRole(user.role) ? 'Student' : 'Admin'
              return (
                <li 
                  key={c._id} 
                  style={{ 
                    padding: '12px 0', 
                    borderBottom: idx < calls.length - 1 ? '1px solid var(--border)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ textTransform: 'capitalize', fontWeight: 500, fontSize: 14 }}>
                      {c.type === 'audio' ? '📞' : '📹'} {c.type} Call
                    </div>
                    <div style={{ color: 'var(--subtext)', fontSize: 12, fontWeight: 500 }}>
                      by {caller}
                    </div>
                  </div>
                  <div style={{ color: 'var(--subtext)', fontSize: 13 }}>
                    {c.duration}s • {new Date(c.timestamp).toLocaleString()}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {/* Call Modal */}
      <Modal open={open} title={type === 'audio' ? 'Start Audio Call' : 'Start Video Call'} onClose={() => setOpen(false)}>
        <div style={{ marginBottom: 16, fontSize: 14 }}>
          Are you sure you want to start a {type} call with the student?
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={startCall} style={{ flex: 1 }}>
            Yes, Start Call
          </button>
          <button className="btn secondary" onClick={() => setOpen(false)} style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  )
}
