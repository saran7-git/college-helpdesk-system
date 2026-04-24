const Ticket = require('../models/Ticket')
const Call = require('../models/Call')

async function canAccess(req, ticketId) {
  const t = await Ticket.findById(ticketId).lean()
  if (!t) return false
  if (['admin', 'super_admin'].includes(req.user.role)) return true
  if (req.user.role === 'department_admin' && t.department === req.user.department) return true
  return t.studentId.toString() === req.user.id
}

async function getCalls(req, res) {
  try {
    const ok = await canAccess(req, req.params.ticketId)
    if (!ok) return res.status(403).json({ message: 'Forbidden' })
    const calls = await Call.find({ ticketId: req.params.ticketId })
      .sort({ timestamp: -1 })
      .populate('callerId', 'name role')
      .lean()
    res.json(calls)
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch calls' })
  }
}

async function listAllCalls(req, res) {
  try {
    const calls = await Call.find()
      .sort({ timestamp: -1 })
      .populate('callerId', 'name role')
      .populate('ticketId', 'subject status studentId')
      .lean()
    res.json(calls)
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch call logs' })
  }
}

async function createCall(req, res) {
  try {
    const ok = await canAccess(req, req.params.ticketId)
    if (!ok) return res.status(403).json({ message: 'Forbidden' })
    const { type, duration } = req.body
    if (!['audio', 'video'].includes(type)) return res.status(400).json({ message: 'Invalid call type' })
    const call = await Call.create({
      ticketId: req.params.ticketId,
      callerId: req.user.id,
      type,
      duration: Number(duration) || 0
    })
    try {
      const io = req.app.get('io')
      io.emit('call:new', { _id: call._id, ticketId: req.params.ticketId, callerId: req.user.id, type, duration: call.duration, timestamp: call.timestamp })
    } catch {}
    res.status(201).json(call)
  } catch (e) {
    res.status(500).json({ message: 'Failed to create call' })
  }
}

module.exports = { getCalls, listAllCalls, createCall }
