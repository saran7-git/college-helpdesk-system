import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import ProtectedRoute from './components/ProtectedRoute'
import { listNotifications, markNotificationRead } from './services/api'
import { socket } from './services/socket'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/student/StudentDashboard'
import RaiseComplaint from './pages/student/RaiseComplaint'
import TicketDetails from './pages/student/TicketDetails'
import StudentCallLogs from './pages/student/StudentCallLogs'
import AdminDashboard from './pages/admin/AdminDashboard'
import Students from './pages/admin/Students'
import AdminTicketDetail from './pages/admin/AdminTicketDetail'
import AdminCallLogs from './pages/admin/AdminCallLogs'

export default function App() {
  const { user, loading } = useAuth()
  const isAdmin = ['admin', 'super_admin'].includes(user?.role)
  const headerUserName = user?.name === 'Super Admin' ? 'SARAN R' : user?.name
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)
  const toggleSidebar = () => {
    if (window.innerWidth <= 960) {
      setMobileOpen((v) => !v)
    } else {
      setCollapsed((v) => !v)
    }
  }

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications])

  useEffect(() => {
    setShowNotifications(false)
    setMobileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!showNotifications) return
      if (!notificationRef.current) return
      if (!notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    const onEscape = (event) => {
      if (event.key === 'Escape') setShowNotifications(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onEscape)
    }
  }, [showNotifications])

  useEffect(() => {
    if (!user) return
    let mounted = true
    const loadNotifications = async () => {
      try {
        const { data } = await listNotifications()
        if (mounted) setNotifications(Array.isArray(data) ? data : [])
      } catch (err) {
        if (mounted) setNotifications([])
      }
    }
    loadNotifications()
    const onNotification = (n) => {
      const targetUserId = typeof n.userId === 'object' ? n.userId?._id : n.userId
      const currentUserId = user.id || user._id
      if (!targetUserId || String(targetUserId) !== String(currentUserId)) return
      setNotifications((prev) => {
        if (prev.some((x) => x._id === n._id)) return prev
        return [n, ...prev]
      })
    }
    socket.on('notification:new', onNotification)
    return () => {
      mounted = false
      socket.off('notification:new', onNotification)
    }
  }, [user?.id, user?._id])

  const handleNotificationClick = async (n) => {
    if (!n || n.isRead) return
    try {
      await markNotificationRead(n._id)
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))
    } catch (err) {
      // no-op
    }
  }

  if (loading) return null

  if (!user) {
    return (
      <div className="auth-layout">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className={`layout role-${isAdmin ? 'admin' : 'student'}${collapsed ? ' collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <header className="header">
          <div className="header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="header-icon mobile-menu-toggle"
                aria-label={mobileOpen ? 'Close sidebar' : 'Open sidebar'}
                onClick={toggleSidebar}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div className="header-title">{isAdmin ? 'Admin Workspace' : 'Student Workspace'}</div>
            </div>
            <div className="header-right">
              {!isAdmin && (
                <a className="emergency-badge" href="tel:+917339696112" title="Emergency Number">
                  Emergency: +91 7339696112
                </a>
              )}
              <div className="notification-wrap" ref={notificationRef}>
                <div className="header-icon" title="Notifications" onClick={() => setShowNotifications((v) => !v)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2a7 7 0 0 0-7 7v5H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2h-1V9a7 7 0 0 0-7-7z" fill="var(--subtext)" />
                    <path d="M8 21a4 4 0 0 0 8 0h-8z" fill="var(--subtext)" />
                  </svg>
                  {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </div>
                {showNotifications && (
                  <div className="notification-panel">
                    <div className="notification-title">Notifications</div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">No notifications yet.</div>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <button
                            key={n._id}
                            className={`notification-item${n.isRead ? '' : ' unread'}`}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div className="notification-item-title">{n.title}</div>
                            <div className="notification-item-text">{n.message}</div>
                            <div className="notification-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ color: 'var(--subtext)', fontSize: 14, marginRight: 22 }}>{headerUserName}</div>
            </div>
          </div>
        </header>

        <div className="container">
          <Routes>
            <Route path="/" element={<Navigate to={isAdmin ? '/admin/dashboard' : '/student/dashboard'} replace />} />
            <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/complaints/new" element={<ProtectedRoute role="student"><RaiseComplaint /></ProtectedRoute>} />
            <Route path="/student/tickets/:id" element={<ProtectedRoute role="student"><TicketDetails /></ProtectedRoute>} />
            <Route path="/student/call-logs" element={<ProtectedRoute role="student"><StudentCallLogs /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/call-logs" element={<ProtectedRoute role="admin"><AdminCallLogs /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute role="admin"><Students /></ProtectedRoute>} />
            <Route path="/admin/tickets/:id" element={<ProtectedRoute role="admin"><AdminTicketDetail /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
