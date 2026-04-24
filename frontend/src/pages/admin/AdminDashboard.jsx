import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getDashboardStats, listAllTickets } from '../../services/api'
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

export default function AdminDashboard({ searchQuery }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const view = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('view') || 'tickets'
  }, [location.search])

  const status = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('status') || 'all'
  }, [location.search])
  const ticketsCacheKey = useMemo(() => `admin:tickets:${status}`, [status])
  const statsCacheKey = 'admin:stats'

  const [tickets, setTickets] = useState(() => readCache(ticketsCacheKey, []))
  const [stats, setStats] = useState(() => readCache(statsCacheKey, {
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    highPriorityComplaints: 0
  }))

  useEffect(() => {
    setTickets(readCache(ticketsCacheKey, []))
  }, [ticketsCacheKey])

  const load = async () => {
    setError('')
    setLoading((prev) => (tickets.length ? prev : true))
    try {
      const [{ data }, { data: statData }] = await Promise.all([
        listAllTickets(status === 'all' ? undefined : status),
        getDashboardStats()
      ])
      setTickets(data)
      setStats(statData)
      try {
        sessionStorage.setItem(ticketsCacheKey, JSON.stringify(Array.isArray(data) ? data : []))
        sessionStorage.setItem(statsCacheKey, JSON.stringify(statData || {}))
      } catch {
        // ignore cache write failures
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load admin dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  useEffect(() => {
    try {
      sessionStorage.setItem(ticketsCacheKey, JSON.stringify(Array.isArray(tickets) ? tickets : []))
      sessionStorage.setItem(statsCacheKey, JSON.stringify(stats || {}))
    } catch {
      // ignore cache write failures
    }
  }, [tickets, stats, ticketsCacheKey])

  useEffect(() => {
    const onNew = (t) => {
      if (status !== 'all' && t.status !== status) return
      setTickets((prev) => [t, ...prev])
    }
    const onUpdate = (t) => {
      setTickets((prev) => {
        const idx = prev.findIndex((x) => x._id === t._id)
        if (idx === -1) return prev
        const next = [...prev]
        next[idx] = { ...next[idx], ...t }
        return next
      })
    }
    socket.on('ticket:new', onNew)
    socket.on('ticket:update', onUpdate)
    return () => {
      socket.off('ticket:new', onNew)
      socket.off('ticket:update', onUpdate)
    }
  }, [status])

  const filteredTickets = useMemo(() => {
    if (!searchQuery?.trim()) return tickets
    const q = searchQuery.trim().toLowerCase()
    return tickets.filter((t) => {
      return (
        String(t._id).toLowerCase().includes(q) ||
        String(t.ticketId || '').toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      )
    })
  }, [tickets, searchQuery])

  const isDashboardOption = status === 'all'
  const RECENT_WINDOW_MS = 12 * 60 * 60 * 1000

  const flowCounts = useMemo(() => {
    const pending = tickets.filter((t) => t.status === 'Pending').length
    const assigned = tickets.filter((t) => t.status === 'Assigned').length
    const inProgress = tickets.filter((t) => t.status === 'In Progress').length
    const resolved = tickets.filter((t) => t.status === 'Resolved').length
    const rejected = tickets.filter((t) => t.status === 'Rejected').length
    return { pending, assigned, inProgress, resolved, rejected }
  }, [tickets])

  const historyTickets = useMemo(() => {
    return filteredTickets
  }, [filteredTickets])
  const recentTickets = useMemo(() => {
    return filteredTickets.filter((t) => {
      const createdAt = new Date(t.createdAt).getTime()
      return Number.isFinite(createdAt) && Date.now() - createdAt <= RECENT_WINDOW_MS
    })
  }, [filteredTickets])

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <h1>{isDashboardOption ? (view === 'history' ? 'Complaint Histories' : "Admin's Dashboard") : `${status} Tickets`}</h1>
        <p>
          {isDashboardOption
            ? (view === 'history'
              ? 'View all complaints.'
              : '')
            : `Showing complaints with ${status} status.`}
        </p>
      </section>

      {error && (
      <section className="surface-card" style={{ borderColor: '#fecaca', color: '#b91c1c' }}>
        {error}
      </section>
      )}

      {loading && (
      <section className="surface-card" style={{ color: 'var(--subtext)' }}>
        Loading admin dashboard...
      </section>
      )}

      {isDashboardOption && (
      <section className="stats-grid stats-grid-student" style={{ marginBottom: 22 }}>
        <div className="stat-card">
          <div className="stat-label">Total Tickets</div>
          <div className="stat-value">{stats.totalComplaints}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{stats.pendingComplaints}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Assigned</div>
          <div className="stat-value">{flowCounts.assigned}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{flowCounts.inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{stats.resolvedComplaints}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{flowCounts.rejected}</div>
        </div>
      </section>
      )}

      {view === 'tickets' && !isDashboardOption && (
        <section className="surface-card">
          <div className="surface-title">{`${status} List`}</div>
          <TicketTable
            tickets={filteredTickets}
            emptyMessage={`There's no "${status}"`}
            showStatusFilter={false}
          />
        </section>
      )}

      {view === 'tickets' && isDashboardOption && (
        <section className="surface-card">
          <div className="surface-title">Recent Complaints</div>
          <TicketTable tickets={recentTickets} emptyMessage={'No recent complaints in the last 12 hours.'} />
        </section>
      )}

      {view === 'history' && isDashboardOption && (
        <section className="surface-card">
          <div className="surface-title">Complaint Histories</div>
          <TicketTable tickets={historyTickets} emptyMessage={'No complaint histories yet.'} />
        </section>
      )}
    </div>
  )
}
