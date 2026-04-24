const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')
const connectDB = require('./config/db')
const User = require('./models/User')
const Student = require('./models/Student')
const http = require('http')
const { Server } = require('socket.io')

dotenv.config()
const app = express()

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const PORT = process.env.PORT || 5000
const FRONTEND_DIST_PATH = path.resolve(__dirname, '../frontend/dist')
const FRONTEND_INDEX_PATH = path.join(FRONTEND_DIST_PATH, 'index.html')
const EXTRA_ORIGINS = String(process.env.FRONTEND_URLS || '')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)
const ALLOWED_ORIGINS = Array.from(new Set([
  FRONTEND_URL,
  ...EXTRA_ORIGINS,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
]))

function isPrivateLanHost(hostname) {
  if (!hostname) return false
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true
  if (hostname.startsWith('10.')) return true
  if (hostname.startsWith('192.168.')) return true
  const match = /^172\.(\d+)\./.exec(hostname)
  if (match) {
    const second = Number(match[1])
    return second >= 16 && second <= 31
  }
  return false
}

function isOriginAllowed(origin) {
  if (!origin) return true
  if (ALLOWED_ORIGINS.includes(origin)) return true
  try {
    const parsed = new URL(origin)
    return isPrivateLanHost(parsed.hostname)
  } catch {
    return false
  }
}

function ensureUploadDir() {
  const dir = path.join(__dirname, 'uploads')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

ensureUploadDir()

async function seedUser({ email, password, name, role, registerNumber = '', department = '', year = 1, forcePasswordReset = false }) {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedRegister = String(registerNumber || '').trim().toUpperCase()
    if (!normalizedEmail || !password) return
    const exists = await User.findOne({
      $or: [{ email: normalizedEmail }, ...(normalizedRegister ? [{ registerNumber: normalizedRegister }] : [])]
    })
    if (exists) {
      const updates = {}
      if (name && exists.name !== name) updates.name = name
      if (normalizedRegister && !exists.registerNumber) updates.registerNumber = normalizedRegister
      if (department && !exists.department) updates.department = department
      if (role && exists.role !== role && ['student', 'super_admin', 'admin'].includes(role)) updates.role = role
      if (year && !exists.year) updates.year = year
      if (Object.keys(updates).length) {
        await User.updateOne({ _id: exists._id }, { $set: updates })
      }
      if (forcePasswordReset) {
        const hash = await bcrypt.hash(password, 10)
        await User.updateOne({ _id: exists._id }, { $set: { password: hash } })
      }
      if (role === 'student' && normalizedRegister) {
        const studentDoc = await Student.findOne({ userId: exists._id })
        if (!studentDoc) {
          await Student.create({
            userId: exists._id,
            registerNumber: normalizedRegister,
            department: exists.department || department || '',
            year: exists.year || year || 1
          })
        } else {
          await Student.updateOne(
            { _id: studentDoc._id },
            {
              $set: {
                registerNumber: studentDoc.registerNumber || normalizedRegister,
                department: studentDoc.department || exists.department || department || '',
                year: studentDoc.year || exists.year || year || 1
              }
            }
          )
        }
      }
      return
    }
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: normalizedEmail,
      registerNumber: normalizedRegister || undefined,
      password: hash,
      role,
      department,
      year,
      status: 'active'
    })
    if (role === 'student') {
      await Student.create({
        userId: user._id,
        registerNumber: normalizedRegister,
        department: user.department || '',
        year: user.year || 1
      })
    }
    console.log(`${role.charAt(0).toUpperCase() + role.slice(1)} user created: ${normalizedEmail}`)
  } catch (e) {
    console.error('Seed user error', e.message)
  }
}

app.use(cors({
  origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
if (fs.existsSync(FRONTEND_DIST_PATH)) {
  app.use(express.static(FRONTEND_DIST_PATH))
}

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
    credentials: true
  }
})
app.set('io', io)
io.on('connection', () => {})

const authRoutes = require('./routes/auth')
const ticketRoutes = require('./routes/tickets')
const messageRoutes = require('./routes/messages')
const callRoutes = require('./routes/calls')
const userRoutes = require('./routes/users')
const dashboardRoutes = require('./routes/dashboard')
const notificationRoutes = require('./routes/notifications')

app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/calls', callRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)

if (fs.existsSync(FRONTEND_INDEX_PATH)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next()
    }
    return res.sendFile(FRONTEND_INDEX_PATH)
  })
}

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found' })
})

app.use((err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Server error'
  res.status(status).json({ message })
})

async function bootstrap() {
  await connectDB()
  await seedUser({
    email: 'saran.ee23@bitsathy.ac.in',
    password: 'bitsathy',
    name: process.env.ADMIN_NAME || 'SARAN R',
    role: 'super_admin',
    forcePasswordReset: true
  })
  await seedUser({
    email: process.env.STUDENT_EMAIL,
    password: process.env.STUDENT_PASSWORD,
    name: process.env.STUDENT_NAME || 'Student',
    role: 'student',
    registerNumber: process.env.STUDENT_REGISTER_NUMBER || 'REG1001',
    department: process.env.STUDENT_DEPARTMENT || 'Technical',
    year: Number(process.env.STUDENT_YEAR || 1)
  })

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`)
  })
}

bootstrap().catch((err) => {
  console.error('Server startup failed', err.message)
  process.exit(1)
})
