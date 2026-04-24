import React, { useEffect, useRef, useState } from 'react'
import { getMessages, postMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { socket } from '../services/socket'

export default function ChatSection({ ticketId }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const ref = useRef(null)

  const senderIdOf = (value) => (typeof value === 'object' ? value?._id : value)
  const isOwnMessage = (m) => String(senderIdOf(m.senderId)) === String(user?.id || user?._id)

  const load = async () => {
    const { data } = await getMessages(ticketId)
    setMessages(data)
    setTimeout(() => ref.current?.scrollTo(0, ref.current.scrollHeight), 50)
  }

  useEffect(() => {
    load()
    const onNew = (m) => {
      if (m.ticketId !== ticketId) return
      setMessages((prev) => {
        if (prev.some((x) => String(x._id) === String(m._id))) return prev
        return [...prev, m]
      })
      setTimeout(() => ref.current?.scrollTo(0, ref.current.scrollHeight), 50)
    }
    socket.on('message:new', onNew)
    return () => socket.off('message:new', onNew)
  }, [ticketId])

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    const { data } = await postMessage(ticketId, text.trim())
    setText('')
    setMessages((prev) => {
      if (prev.some((x) => String(x._id) === String(data._id))) return prev
      return [...prev, data]
    })
    setTimeout(() => ref.current?.scrollTo(0, ref.current.scrollHeight), 50)
  }

  return (
    <div className="card" id="ticket-messages">
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Messages</div>
      <div ref={ref} style={{ maxHeight: 280, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--subtext)', fontSize: 13, padding: '6px 4px' }}>
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map((m) => (
          <div key={m._id} style={{ display: 'flex', justifyContent: isOwnMessage(m) ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
            <div className="card" style={{ padding: 8, background: isOwnMessage(m) ? '#e5f0ff' : '#fff', minWidth: 120, maxWidth: '85%' }}>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginBottom: 4 }}>
                {isOwnMessage(m) ? 'You' : 'Support'} • {new Date(m.timestamp).toLocaleString()}
              </div>
              <div>{m.text}</div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type your message..." />
        <button className="btn" type="submit">Send</button>
      </form>
    </div>
  )
}
