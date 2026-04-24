import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listAllTickets, listStudentTickets } from '../services/api'
import { socket } from '../services/socket'

const adminNavItems = [
  { label: 'Dashboard', to: '/admin/dashboard?view=tickets', view: 'tickets', status: 'all', icon: 'M3 3h8v8H3V3zm10 0h8v12h-8V3zM3 13h8v8H3v-8zm10 4h8v4h-8v-4z' },
  { label: 'Histories', to: '/admin/dashboard?view=history', view: 'history', status: 'all', icon: 'M13 3a9 9 0 1 0 8.95 10h-2.02A7 7 0 1 1 13 5V1l4 4-4 4V6a7 7 0 0 1 7 7h-7V3z' },
  { label: 'Pending', to: '/admin/dashboard?view=tickets&status=Pending', view: 'tickets', status: 'Pending', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11h5v-2h-3V6h-2Z' },
  { label: 'Assigned', to: '/admin/dashboard?view=tickets&status=Assigned', view: 'tickets', status: 'Assigned', icon: 'M5 3h14a2 2 0 0 1 2 2v14l-4-3-4 3-4-3-4 3V5a2 2 0 0 1 2-2z' },
  { label: 'In Progress', to: '/admin/dashboard?view=tickets&status=In%20Progress', view: 'tickets', status: 'In Progress', icon: 'M11 7h2v6h-2zm0 8h2v2h-2z' },
  { label: 'Resolved', to: '/admin/dashboard?view=tickets&status=Resolved', view: 'tickets', status: 'Resolved', icon: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z' },
  { label: 'Rejected', to: '/admin/dashboard?view=tickets&status=Rejected', view: 'tickets', status: 'Rejected', icon: 'M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3z' },
  { label: 'Call History', to: '/admin/call-logs', icon: 'M12 3C7 3 2.73 6.11 1 10c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z' }
]

const studentNavItems = [
  { label: 'Dashboard', to: '/student/dashboard', icon: 'M3 3h8v8H3V3zm10 0h8v12h-8V3zM3 13h8v8H3v-8zm10 4h8v4h-8v-4z' },
  { label: 'Histories', to: '/student/dashboard?view=history', view: 'history', icon: 'M13 3a9 9 0 1 0 8.95 10h-2.02A7 7 0 1 1 13 5V1l4 4-4 4V6a7 7 0 0 1 7 7h-7V3z' },
  { label: 'Pending', to: '/student/dashboard?status=Pending', status: 'Pending', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11h5v-2h-3V6h-2Z' },
  { label: 'Assigned', to: '/student/dashboard?status=Assigned', status: 'Assigned', icon: 'M5 3h14a2 2 0 0 1 2 2v14l-4-3-4 3-4-3-4 3V5a2 2 0 0 1 2-2z' },
  { label: 'In Progress', to: '/student/dashboard?status=In%20Progress', status: 'In Progress', icon: 'M11 7h2v6h-2zm0 8h2v2h-2z' },
  { label: 'Resolved', to: '/student/dashboard?status=Resolved', status: 'Resolved', icon: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z' },
  { label: 'Rejected', to: '/student/dashboard?status=Rejected', status: 'Rejected', icon: 'M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3z' },
  { label: 'Raise Complaint', to: '/student/complaints/new', icon: 'M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z' }
]

export default function Sidebar({ collapsed = false, mobileOpen = false, onClose }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [counts, setCounts] = useState({ Pending: 0, Assigned: 0, 'In Progress': 0, Resolved: 0, Rejected: 0, total: 0 })
  const isAdmin = user?.role !== 'student'

  const currentStatus = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('status') || 'all'
  }, [location.search])
  const currentStudentView = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('view') || 'tickets'
  }, [location.search])

  const currentView = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('view') || 'tickets'
  }, [location.search])

  const loadCounts = useCallback(async () => {
    try {
      const { data } = isAdmin ? await listAllTickets() : await listStudentTickets()
      const nextCounts = { Pending: 0, Assigned: 0, 'In Progress': 0, Resolved: 0, Rejected: 0, total: data.length }
      data.forEach((ticket) => {
        if (nextCounts[ticket.status] != null) nextCounts[ticket.status] += 1
      })
      setCounts(nextCounts)
    } catch (e) {
      // Keep last known counts instead of resetting to zero.
    }
  }, [isAdmin])

  useEffect(() => {
    if (!user) return
    loadCounts()

    const refresh = () => loadCounts()
    socket.on('ticket:new', refresh)
    socket.on('ticket:update', refresh)

    const interval = setInterval(loadCounts, 15000)
    return () => {
      socket.off('ticket:new', refresh)
      socket.off('ticket:update', refresh)
      clearInterval(interval)
    }
  }, [user?.id, user?._id, loadCounts, location.pathname, location.search])

  if (!user) return null
  const navItems = isAdmin ? adminNavItems : studentNavItems
  const panelTitle = isAdmin ? 'Admin Panel' : 'Student Panel'
  const isStudentDashboardRoute = location.pathname === '/student/dashboard' && (currentStatus === 'all' || !currentStatus)

  return (
    <>
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div>
        <div className="sidebar-header">
          <div className="sidebar-title">{panelTitle}</div>
        </div>

        <div className="sidebar-menu">
          {navItems.map((item) => {
            const isActive = isAdmin
              ? (item.view
                ? (() => {
                    const onAdminDashboard = location.pathname === '/admin/dashboard'
                    const matchesView = item.view === currentView
                    const matchesStatus = item.status
                      ? (item.status === 'all' ? currentStatus === 'all' : item.status === currentStatus)
                      : true
                    return onAdminDashboard && matchesView && matchesStatus
                  })()
                : location.pathname === item.to)
              : (item.status
                ? location.pathname === '/student/dashboard' && currentStatus === item.status
                : item.view
                ? location.pathname === '/student/dashboard' && currentStudentView === item.view && (currentStatus === 'all' || !currentStatus)
                : item.to === '/student/dashboard'
                ? isStudentDashboardRoute && currentStudentView === 'tickets'
                : location.pathname === item.to)
            const badgeCount =
              item.status && item.status !== 'all'
                ? counts[item.status]
                : isAdmin && item.label === 'Dashboard'
                ? counts.total
                : null

            return (
              <Link
                key={item.label}
                to={item.to}
                className={`sidebar-item${isActive ? ' active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="sidebar-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d={item.icon} fill="currentColor" />
                    </svg>
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </span>
                {badgeCount != null && (
                  <span className="sidebar-badge">{badgeCount}</span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={logout}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z" fill="currentColor" />
            <path d="M20 3H10v2h10v14H10v2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="currentColor" opacity="0.6" />
          </svg>
          Logout
        </button>
      </div>
    </div>
    <div className={`drawer-overlay${mobileOpen ? ' open' : ''}`} onClick={onClose} />
    <div className={`drawer${mobileOpen ? ' open' : ''}`}>
      <div>
        <div className="sidebar-header">
          <div className="sidebar-title">{panelTitle}</div>
        </div>

        <div className="sidebar-menu">
          {navItems.map((item) => {
            const params = new URLSearchParams(location.search)
            const isActive = isAdmin
              ? (() => {
                  if (!item.view) return location.pathname === item.to
                  const onAdminDashboard = location.pathname === '/admin/dashboard'
                  const paramView = params.get('view') || 'tickets'
                  const paramStatus = params.get('status') || 'all'
                  const matchesView = paramView === item.view
                  const matchesStatus = item.status
                    ? (item.status === 'all' ? paramStatus === 'all' : paramStatus === item.status)
                    : true
                  return onAdminDashboard && matchesView && matchesStatus
                })()
              : (item.status
                ? location.pathname === '/student/dashboard' && params.get('status') === item.status
                : item.view
                ? location.pathname === '/student/dashboard' && (params.get('view') || 'tickets') === item.view && (!params.get('status') || params.get('status') === 'all')
                : item.to === '/student/dashboard'
                ? location.pathname === '/student/dashboard' && (!params.get('status') || params.get('status') === 'all') && (params.get('view') || 'tickets') === 'tickets'
                : location.pathname === item.to)
            const badgeCount =
              item.status && item.status !== 'all'
                ? counts[item.status]
                : isAdmin && item.label === 'Dashboard'
                ? counts.total
                : null
            return (
              <Link key={item.label} to={item.to} className={`sidebar-item${isActive ? ' active' : ''}`} onClick={onClose}>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="sidebar-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d={item.icon} fill="currentColor" />
                    </svg>
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </span>
                {badgeCount != null && <span className="sidebar-badge">{badgeCount}</span>}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={() => { logout(); onClose?.() }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 13v-2H7V8l-5 4 5 4v-3h9z" fill="currentColor" />
            <path d="M20 3H10v2h10v14H10v2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="currentColor" opacity="0.6" />
          </svg>
          Logout
        </button>
      </div>
    </div>
    </>
  )
}
