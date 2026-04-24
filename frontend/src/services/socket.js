const socketBaseUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000')

export const socket = window.io(socketBaseUrl, {
  path: '/socket.io',
  transports: ['websocket']
})
