const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Student = require('../models/Student')
const STUDENT_EMAIL_DOMAIN = '@bitsathy.ac.in'
const ADMIN_ONLY_EMAIL = 'saran.ee23@bitsathy.ac.in'
const ADMIN_ONLY_PASSWORD = 'bitsathy'

function isAdminRole(role) {
  return ['admin', 'super_admin'].includes(role)
}

function isAllowedStudentEmail(email) {
  return String(email || '').trim().toLowerCase().endsWith(STUDENT_EMAIL_DOMAIN)
}

function signToken(user) {
  const payload = { id: user._id.toString(), role: user.role, department: user.department || '' }
  const secret = process.env.JWT_SECRET || 'secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

async function register(req, res) {
  try {
    const { name, email, registerNumber, password, department, year } = req.body
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedRegisterNumber = String(registerNumber || '').trim().toUpperCase()
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (!normalizedRegisterNumber) {
      return res.status(400).json({ message: 'Register number is required' })
    }
    if (!isAllowedStudentEmail(normalizedEmail)) {
      return res.status(400).json({ message: `Only ${STUDENT_EMAIL_DOMAIN} email IDs are allowed for students` })
    }
    const exists = await User.findOne({
      $or: [{ email: normalizedEmail }, { registerNumber: normalizedRegisterNumber }]
    })
    if (exists) return res.status(400).json({ message: 'Email already in use' })
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email: normalizedEmail,
      registerNumber: normalizedRegisterNumber,
      password: hash,
      role: 'student',
      department: department || '',
      year: Number(year) || 1
    })
    await Student.create({
      userId: user._id,
      registerNumber: normalizedRegisterNumber,
      department: user.department || '',
      year: user.year || 1
    })
    const token = signToken(user)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registerNumber: user.registerNumber,
        role: user.role,
        department: user.department,
        status: user.status
      }
    })
  } catch (e) {
    res.status(500).json({ message: 'Registration failed' })
  }
}

async function login(req, res) {
  try {
    const { email, registerNumber, identifier, password } = req.body
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedRegisterNumber = String(registerNumber || '').trim().toUpperCase()
    const normalizedIdentifier = String(identifier || '').trim()
    let filter = null

    if (normalizedEmail) filter = { email: normalizedEmail }
    else if (normalizedRegisterNumber) filter = { registerNumber: normalizedRegisterNumber }
    else if (normalizedIdentifier) {
      if (normalizedIdentifier.includes('@')) filter = { email: normalizedIdentifier.toLowerCase() }
      else filter = { registerNumber: normalizedIdentifier.toUpperCase() }
    }

    if (!filter || !password) {
      return res.status(400).json({ message: 'Email/Register Number and password are required' })
    }

    let user = await User.findOne(filter)
    let studentProfile = null
    if (!user && filter.registerNumber) {
      studentProfile = await Student.findOne({ registerNumber: filter.registerNumber }).lean()
      if (studentProfile?.userId) {
        user = await User.findById(studentProfile.userId)
      }
    }
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })
    if (isAdminRole(user.role)) {
      const attemptedEmail = filter.email || user.email
      if (attemptedEmail !== ADMIN_ONLY_EMAIL || user.email !== ADMIN_ONLY_EMAIL || password !== ADMIN_ONLY_PASSWORD) {
        return res.status(403).json({ message: 'Invalid admin credentials' })
      }
    }
    if (user.role === 'student' && !isAllowedStudentEmail(user.email)) {
      return res.status(403).json({ message: `Only ${STUDENT_EMAIL_DOMAIN} email IDs are allowed for students` })
    }
    if (user.status === 'blocked') return res.status(403).json({ message: 'Account blocked' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: 'Invalid credentials' })
    const token = signToken(user)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registerNumber: user.registerNumber || studentProfile?.registerNumber || '',
        role: user.role,
        department: user.department,
        status: user.status
      }
    })
  } catch (e) {
    res.status(500).json({ message: 'Login failed' })
  }
}

module.exports = { register, login }
