import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const isAdminRole = (value) => ['admin', 'super_admin'].includes(value)

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  if (role) {
    if (role === 'admin' && !isAdminRole(user.role)) return <Navigate to="/student/dashboard" replace />
    if (role === 'student' && user.role !== 'student') return <Navigate to="/admin/dashboard" replace />
    if (!['admin', 'student'].includes(role) && user.role !== role) {
      return <Navigate to={isAdminRole(user.role) ? '/admin/dashboard' : '/student/dashboard'} replace />
    }
  }
  return children
}
