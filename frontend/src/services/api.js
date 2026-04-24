import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const registerStudent = (payload) => axios.post('/auth/register', payload)
export const loginUser = (payload) => axios.post('/auth/login', payload)

export const getStudentStats = () => axios.get('/tickets/stats')
export const listStudentTickets = () => axios.get('/tickets')
export const listAllTickets = (status) => axios.get('/tickets', { params: { status } })
export const getTicket = (id) => axios.get(`/tickets/${id}`)
export const createTicket = (formData) =>
  axios.post('/tickets', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateTicketStatus = (id, status, remark) => axios.put(`/tickets/${id}/status`, { status, remark })
export const updateTicketRemarks = (id, remark) => axios.put(`/tickets/${id}/remarks`, { remark })
export const deleteTicket = (id) => axios.delete(`/tickets/${id}`)

export const getMessages = (ticketId) => axios.get(`/messages/${ticketId}`)
export const postMessage = (ticketId, text) => axios.post(`/messages/${ticketId}`, { text })

export const getCalls = (ticketId) => axios.get(`/calls/${ticketId}`)
export const createCall = (ticketId, type, duration) => axios.post(`/calls/${ticketId}`, { type, duration })
export const listAllCalls = () => axios.get('/calls')
export const getCallLogs = () => axios.get('/calls')

export const listStudents = (params) => axios.get('/users/students', { params })
export const getStudentById = (id) => axios.get(`/users/students/${id}`)
export const updateStudentStatus = (id, status) => axios.patch(`/users/students/${id}/status`, { status })
export const getDashboardStats = (params) => axios.get('/dashboard/stats', { params })
export const listNotifications = () => axios.get('/notifications')
export const markNotificationRead = (id) => axios.patch(`/notifications/${id}/read`)
