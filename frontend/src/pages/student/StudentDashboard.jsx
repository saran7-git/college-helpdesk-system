import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getStudentStats, listStudentTickets } from '../../services/api'
import TicketTable from '../../components/TicketTable'
import { socket } from '../../services/socket'

function readCache(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const cacheSuffix = user?.id || user?._id || 'unknown'
  const statsCacheKey = `student:stats:${cacheSuffix}`
  const ticketsCacheKey = `student:tickets:${cacheSuffix}`

  const [stats, setStats] = useState(() => readCache(statsCacheKey, { total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0, rejected: 0, recent: [] }))
  const [tickets, setTickets] = useState(() => readCache(ticketsCacheKey, []))
  const [loading, setLoading] = useState(() => !readCache(ticketsCacheKey, null))
  const [error, setError] = useState('')
  const statusParam = new URLSearchParams(location.search).get('status')
  const viewParam = new URLSearchParams(location.search).get('view') || 'tickets'
  const selectedStatus = statusParam && statusParam !== 'all' ? statusParam : ''
  const isDashboardOption = !selectedStatus
  const isHistoryView = isDashboardOption && viewParam === 'history'
  const RECENT_WINDOW_MS = 12 * 60 * 60 * 1000
  const recentTickets = tickets.filter((t) => {
    const createdAt = new Date(t.createdAt).getTime()
    return Number.isFinite(createdAt) && Date.now() - createdAt <= RECENT_WINDOW_MS
  })
  const historyTickets = tickets

  useEffect(() => {
    setStats(readCache(statsCacheKey, { total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0, rejected: 0, recent: [] }))
    const cachedTickets = readCache(ticketsCacheKey, [])
    setTickets(cachedTickets)
    setLoading(!cachedTickets.length)
  }, [statsCacheKey, ticketsCacheKey])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const hasCached = readCache(ticketsCacheKey, []).length > 0
      setLoading(!hasCached)
      setError('')
      try {
        const [s, t] = await Promise.all([getStudentStats(), listStudentTickets()])
        if (!mounted) return
        setStats(s.data)
        setTickets(t.data)
        try {
          sessionStorage.setItem(statsCacheKey, JSON.stringify(s.data || {}))
          sessionStorage.setItem(ticketsCacheKey, JSON.stringify(Array.isArray(t.data) ? t.data : []))
        } catch {
          // ignore cache write failures
        }
      } catch (err) {
        if (!mounted) return
        setError(err?.response?.data?.message || 'Failed to load student data. Please refresh.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    const onNew = (t) => {
      const incomingStudentId = typeof t.studentId === 'string' ? t.studentId : t.studentId?._id
      const currentUserId = user?.id || user?._id
      if (!currentUserId || String(incomingStudentId) !== String(currentUserId)) return
      setTickets((prev) => [t, ...prev])
      setStats((prev) => {
        const nextRecent = [t, ...prev.recent].slice(0, 5)
        const pending = (prev.pending || 0) + (t.status === 'Pending' ? 1 : 0)
        const assigned = (prev.assigned || 0) + (t.status === 'Assigned' ? 1 : 0)
        const inProgress = (prev.inProgress || 0) + (t.status === 'In Progress' ? 1 : 0)
        const resolved = (prev.resolved || 0) + (t.status === 'Resolved' ? 1 : 0)
        const rejected = (prev.rejected || 0) + (t.status === 'Rejected' ? 1 : 0)
        return { ...prev, total: prev.total + 1, pending, assigned, inProgress, resolved, rejected, recent: nextRecent }
      })
    }
    const onUpdate = (t) => {
      if (!user) return
      setTickets((prev) => {
        const idx = prev.findIndex((x) => x._id === t._id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = { ...next[idx], ...t }
        const pending = next.filter((x) => x.status === 'Pending').length
        const assigned = next.filter((x) => x.status === 'Assigned').length
        const inProgress = next.filter((x) => x.status === 'In Progress').length
        const resolved = next.filter((x) => x.status === 'Resolved').length
        const rejected = next.filter((x) => x.status === 'Rejected').length
        setStats((s) => {
          const recent = (s.recent || []).map((r) => (r._id === t._id ? { ...r, ...t } : r))
          return { ...s, pending, assigned, inProgress, resolved, rejected, recent }
        })
        return next
      })
    }
    socket.on('ticket:new', onNew)
    socket.on('ticket:update', onUpdate)
    return () => {
      mounted = false
      socket.off('ticket:new', onNew)
      socket.off('ticket:update', onUpdate)
    }
  }, [user?.id, user?._id, statsCacheKey, ticketsCacheKey])

  useEffect(() => {
    try {
      sessionStorage.setItem(statsCacheKey, JSON.stringify(stats || {}))
      sessionStorage.setItem(ticketsCacheKey, JSON.stringify(Array.isArray(tickets) ? tickets : []))
    } catch {
      // ignore cache write failures
    }
  }, [stats, tickets, statsCacheKey, ticketsCacheKey])

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1>{isDashboardOption ? (isHistoryView ? 'Complaint Histories' : 'Student Dashboard') : `${selectedStatus} Tickets`}</h1>
        <p>
          {isDashboardOption
            ? (isHistoryView
              ? 'All complaints are listed here.'
              : 'View all complaints and their current status.')
            : `Showing complaints with ${selectedStatus} status.`}
        </p>
      </section>

      {error && (
      <section className="surface-card" style={{ borderColor: '#fecaca', color: '#b91c1c' }}>
        {error}
      </section>
      )}

      {loading && (
      <section className="surface-card" style={{ color: 'var(--subtext)' }}>
        Loading student dashboard...
      </section>
      )}

      {isDashboardOption && (
      <section className="stats-grid stats-grid-student">
        <div className="stat-card"><div className="stat-label">Total Tickets</div><div className="stat-value">{stats.total}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value">{stats.pending}</div></div>
        <div className="stat-card"><div className="stat-label">Assigned</div><div className="stat-value">{stats.assigned || 0}</div></div>
        <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value">{stats.inProgress}</div></div>
        <div className="stat-card"><div className="stat-label">Resolved</div><div className="stat-value">{stats.resolved}</div></div>
        <div className="stat-card"><div className="stat-label">Rejected</div><div className="stat-value">{stats.rejected || 0}</div></div>
      </section>
      )}

      {isDashboardOption && !isHistoryView && (
      <section className="surface-card" style={{ marginTop: 16 }}>
        <div className="surface-title">Recent Complaints</div>
        <TicketTable tickets={recentTickets} emptyMessage={'No recent complaints in the last 12 hours.'} />
      </section>
      )}

      {isHistoryView && (
      <section className="surface-card" style={{ marginTop: 16 }}>
        <div className="surface-title">Complaint Histories</div>
        <TicketTable tickets={historyTickets} emptyMessage={'No complaint histories yet.'} />
      </section>
      )}
      {!isDashboardOption && (
      <section className="surface-card" style={{ marginTop: 16 }}>
        <div className="surface-title">{`${selectedStatus} List`}</div>
        <TicketTable
          tickets={tickets.filter((t) => t.status === selectedStatus)}
          emptyMessage={`There's no "${selectedStatus}"`}
          showStatusFilter={false}
        />
      </section>
      )}
    </div>
  )
}
