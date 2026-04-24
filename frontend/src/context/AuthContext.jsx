import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

axios.defaults.baseURL = '/api'

const AuthContext = createContext(null)
const isAdminRole = (role) => ['admin', 'department_admin', 'super_admin'].includes(role)
const ACTIVE_SESSION_KEY = 'active_session_key'
const LAST_ADMIN_SESSION_KEY = 'last_admin_session_key'
const LAST_STUDENT_SESSION_KEY = 'last_student_session_key'

const buildSessionKey = (user) => {
  const roleBucket = isAdminRole(user?.role) ? 'admin' : 'student'
  return `auth_session_${roleBucket}_${user?.id || user?._id || 'unknown'}`
}

const saveSession = (key, token, user) => {
  sessionStorage.setItem('token', token)
  sessionStorage.setItem('user', JSON.stringify(user))
  sessionStorage.setItem(ACTIVE_SESSION_KEY, key)
  localStorage.setItem(key, JSON.stringify({ token, user }))
  localStorage.setItem(isAdminRole(user?.role) ? LAST_ADMIN_SESSION_KEY : LAST_STUDENT_SESSION_KEY, key)
}

const loadSessionByKey = (key) => {
  if (!key) return null
  const raw = localStorage.getItem(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.user) return null
    return parsed
  } catch (err) {
    return null
  }
}

const clearTabSession = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  sessionStorage.removeItem(ACTIVE_SESSION_KEY)
}

const setAuthHeader = (tokenValue) => {
  if (tokenValue) axios.defaults.headers.common.Authorization = `Bearer ${tokenValue}`
  else delete axios.defaults.headers.common.Authorization
}

const buildLoginFallbackUrls = () => {
  if (typeof window === 'undefined') return []
  const host = window.location.hostname || '127.0.0.1'
  const urls = [
    `http://${host}:5000/api/auth/login`,
    'http://127.0.0.1:5000/api/auth/login',
    'http://localhost:5000/api/auth/login'
  ]
  return Array.from(new Set(urls))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [sessionKey, setSessionKey] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const t = sessionStorage.getItem('token')
    const u = sessionStorage.getItem('user')
    const activeKey = sessionStorage.getItem(ACTIVE_SESSION_KEY)
    if (t && u) {
      try {
        setToken(t)
        setAuthHeader(t)
        const parsedUser = JSON.parse(u)
        setUser(parsedUser)
        setSessionKey(activeKey || buildSessionKey(parsedUser))
        setLoading(false)
        return
      } catch (err) {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem(ACTIVE_SESSION_KEY)
      }
    }

    const wantsAdmin = window.location.pathname.startsWith('/admin')
    const fallbackKey = wantsAdmin
      ? localStorage.getItem(LAST_ADMIN_SESSION_KEY)
      : localStorage.getItem(LAST_STUDENT_SESSION_KEY)
    const fallbackSession = loadSessionByKey(fallbackKey)
    if (fallbackSession) {
      saveSession(fallbackKey, fallbackSession.token, fallbackSession.user)
      setToken(fallbackSession.token)
      setAuthHeader(fallbackSession.token)
      setUser(fallbackSession.user)
      setSessionKey(fallbackKey)
      setLoading(false)
      return
    }

    // One-time migration from old shared storage.
    const oldToken = localStorage.getItem('token')
    const oldUser = localStorage.getItem('user')
    if (oldToken && oldUser) {
      try {
        const parsedUser = JSON.parse(oldUser)
        const key = buildSessionKey(parsedUser)
        saveSession(key, oldToken, parsedUser)
        setToken(oldToken)
        setAuthHeader(oldToken)
        setUser(parsedUser)
        setSessionKey(key)
      } catch (err) {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem(ACTIVE_SESSION_KEY)
      } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    const requestInterceptor = axios.interceptors.request.use((config) => {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
      return config
    })
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          if (sessionKey) localStorage.removeItem(sessionKey)
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('user')
          sessionStorage.removeItem(ACTIVE_SESSION_KEY)
          setToken(null)
          setAuthHeader(null)
          setUser(null)
          setSessionKey(null)
          navigate('/login')
        }
        return Promise.reject(error)
      }
    )
    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [token, sessionKey, navigate])

  const login = async (identifier, password) => {
    clearTabSession()
    try {
      const normalizedIdentifier = String(identifier || '').trim()
      const payload = { identifier: normalizedIdentifier, password }
      let data = null
      try {
        const res = await axios.post('/auth/login', payload)
        data = res.data
      } catch (primaryErr) {
        const fallbackUrls = buildLoginFallbackUrls()
        let lastErr = primaryErr
        for (const url of fallbackUrls) {
          try {
            const res = await axios.post(url, payload)
            data = res.data
            lastErr = null
            break
          } catch (fallbackErr) {
            lastErr = fallbackErr
          }
        }
        if (!data) throw lastErr
      }
      setToken(data.token)
      setAuthHeader(data.token)
      setUser(data.user)
      const key = buildSessionKey(data.user)
      setSessionKey(key)
      saveSession(key, data.token, data.user)
      if (isAdminRole(data.user.role)) navigate('/admin/dashboard')
      else navigate('/student/dashboard')
    } catch (err) {
      const message = err?.response?.data?.message || (err?.message === 'Network Error' ? 'Cannot reach server. Please start backend and try again.' : 'Login failed')
      throw new Error(message)
    }
  }

  const register = async (payload) => {
    try {
      const normalizedPayload = {
        ...payload,
        email: String(payload?.email || '').trim().toLowerCase(),
        registerNumber: String(payload?.registerNumber || '').trim().toUpperCase()
      }
      const { data } = await axios.post('/auth/register', normalizedPayload)
      setToken(data.token)
      setAuthHeader(data.token)
      setUser(data.user)
      const key = buildSessionKey(data.user)
      setSessionKey(key)
      saveSession(key, data.token, data.user)
      navigate('/student/dashboard')
    } catch (err) {
      const message = err?.response?.data?.message || (err?.message === 'Network Error' ? 'Cannot reach server. Please start backend and try again.' : 'Registration failed')
      throw new Error(message)
    }
  }

  const logout = () => {
    if (sessionKey) {
      localStorage.removeItem(sessionKey)
    }
    setToken(null)
    setAuthHeader(null)
    setUser(null)
    setSessionKey(null)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem(ACTIVE_SESSION_KEY)
    navigate('/login')
  }

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
