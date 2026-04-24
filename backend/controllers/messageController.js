const Ticket = require('../models/Ticket')
const Message = require('../models/Message')

async function canAccess(req, ticketId) {
  const t = await Ticket.findById(ticketId).lean()
  if (!t) return false
  if (['admin', 'super_admin'].includes(req.user.role)) return true
  if (req.user.role === 'department_admin' && t.department === req.user.department) return true
  return t.studentId.toString() === req.user.id
}

async function getMessages(req, res) {
  try {
    const ok = await canAccess(req, req.params.ticketId)
    if (!ok) return res.status(403).json({ message: 'Forbidden' })
    const msgs = await Message.find({ ticketId: req.params.ticketId }).sort({ timestamp: 1 }).lean()
    res.json(msgs)
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch messages' })
  }
}

async function postMessage(req, res) {
  try {
    const ok = await canAccess(req, req.params.ticketId)
    if (!ok) return res.status(403).json({ message: 'Forbidden' })
    const { text } = req.body
    const msg = await Message.create({
      ticketId: req.params.ticketId,
      senderId: req.user.id,
      text
    })
    try {
      const io = req.app.get('io')
      io.emit('message:new', { _id: msg._id, ticketId: req.params.ticketId, senderId: req.user.id, text, timestamp: msg.timestamp })
    } catch {}
    res.status(201).json(msg)
  } catch (e) {
    res.status(500).json({ message: 'Failed to post message' })
  }
}

module.exports = { getMessages, postMessage }
