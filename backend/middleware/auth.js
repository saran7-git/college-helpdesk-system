const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Unauthorized' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const user = await User.findById(decoded.id).lean()
    if (!user) return res.status(401).json({ message: 'Unauthorized' })
    req.user = {
      id: user._id.toString(),
      role: user.role,
      status: user.status,
      name: user.name,
      email: user.email,
      registerNumber: user.registerNumber || '',
      department: user.department || ''
    }
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' })
    next()
  }
}

module.exports = { auth, requireRole, requireAnyRole }
