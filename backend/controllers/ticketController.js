const Ticket = require('../models/Ticket')
const User = require('../models/User')
const Notification = require('../models/Notification')
const Counter = require('../models/Counter')

const CATEGORY_DEPARTMENT_MAP = {
  Academic: 'Academic',
  Hostel: 'Hostel',
  Transport: 'Transport',
  Fees: 'Accounts',
  Infrastructure: 'Infrastructure',
  Technical: 'Technical'
}

const VALID_STATUSES = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected']
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const VALID_CATEGORIES = Object.keys(CATEGORY_DEPARTMENT_MAP)

function sanitizeTicketForAdmin(ticket) {
  const t = { ...ticket }
  delete t.studentName
  delete t.registerNumber
  if (t.studentId && typeof t.studentId === 'object') {
    t.studentId = { _id: t.studentId._id || t.studentId }
  }
  return t
}

function normalizeCategory(category) {
  const value = String(category || '').trim().toLowerCase()
  const found = VALID_CATEGORIES.find((c) => c.toLowerCase() === value)
  return found || null
}

async function createNotification({ userId, ticketId, type, title, message, io }) {
  if (!userId) return
  const notification = await Notification.create({ userId, ticketId, type, title, message })
  if (io) io.emit('notification:new', notification)
}

function canManageTicket(user, ticket) {
  if (!user) return false
  if (['super_admin', 'admin'].includes(user.role)) return true
  return false
}

async function getRoutedAdmin(category, department) {
  return User.findOne({
    role: { $in: ['super_admin', 'admin'] },
    status: 'active'
  }).lean()
}

async function getNextTicketNumber() {
  const counter = await Counter.findOneAndUpdate(
    { key: 'ticket' },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean()
  return `TKT-${String(counter.value).padStart(6, '0')}`
}

async function createTicket(req, res) {
  try {
    const category = normalizeCategory(req.body.category)
    const subject = String(req.body.subject || '').trim()
    const description = String(req.body.description || '').trim()
    const priority = VALID_PRIORITIES.includes(req.body.priority) ? req.body.priority : 'Medium'
    const attachments = (req.files || []).map((f) => `/uploads/${f.filename}`)

    if (!category || !subject || !description) {
      return res.status(400).json({ message: 'Category, subject and description are required' })
    }

    const student = await User.findById(req.user.id).lean()
    if (!student || student.role !== 'student') return res.status(403).json({ message: 'Forbidden' })
    if (!student.registerNumber) return res.status(400).json({ message: 'Register number not found for student' })

    const department = student.department || CATEGORY_DEPARTMENT_MAP[category]
    const routedAdmin = await getRoutedAdmin(category, CATEGORY_DEPARTMENT_MAP[category])
    const status = routedAdmin ? 'Assigned' : 'Pending'
    const ticketNumber = await getNextTicketNumber()

    const ticket = await Ticket.create({
      ticketId: ticketNumber,
      studentId: req.user.id,
      studentName: student.name,
      registerNumber: student.registerNumber,
      department,
      category,
      subject,
      description,
      priority,
      status,
      assignedTo: routedAdmin?._id || null,
      attachments,
      media: attachments
    })

    const io = req.app.get('io')
    const payload = await Ticket.findById(ticket._id).populate('studentId', '_id').lean()
    io.emit('ticket:new', sanitizeTicketForAdmin(payload))

    await createNotification({
      userId: student._id,
      ticketId: ticket._id,
      type: 'created',
      title: 'Complaint Created',
      message: `${ticket.ticketId} has been created successfully.`,
      io
    })

    if (routedAdmin?._id) {
      await createNotification({
        userId: routedAdmin._id,
        ticketId: ticket._id,
        type: 'created',
        title: 'New Complaint Assigned',
        message: `${ticket.ticketId} has been routed to your queue.`,
        io
      })
    }

    res.status(201).json({ ...payload, id: payload._id, ticketNo: payload.ticketId })
  } catch (e) {
    res.status(500).json({ message: 'Could not create ticket' })
  }
}

async function listTickets(req, res) {
  try {
    const { status, priority, department, dateFrom, dateTo, search } = req.query
    const filter = {}

    // Remove student ID filtering to make tickets public for all students
    // if (req.user.role === 'student') filter.studentId = req.user.id
    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (department && ['super_admin', 'admin'].includes(req.user.role)) filter.department = department

    if (dateFrom || dateTo) {
      filter.createdAt = {}
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) filter.createdAt.$lte = new Date(dateTo)
    }

    if (search) {
      const q = String(search).trim()
      filter.$or = [
        { ticketId: { $regex: q, $options: 'i' } },
        { studentName: { $regex: q, $options: 'i' } },
        { registerNumber: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } }
      ]
    }

    const query = Ticket.find(filter).sort({ createdAt: -1 })
    if (req.user.role !== 'student') query.populate('studentId', '_id')
    query.populate('assignedTo', 'name email department')
    const tickets = await query.lean()
    if (req.user.role === 'student') return res.json(tickets)
    res.json(tickets.map(sanitizeTicketForAdmin))
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch tickets' })
  }
}

async function getTicket(req, res) {
  try {
    const t = await Ticket.findById(req.params.id)
      .populate('studentId', 'name email registerNumber department')
      .populate('assignedTo', 'name email department')
      .populate('adminRemarks.adminId', 'name role')
      .lean()
    if (!t) return res.status(404).json({ message: 'Ticket not found' })
    if (req.user.role === 'student' && t.studentId?._id?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    if (req.user.role === 'student') return res.json(t)
    res.json(sanitizeTicketForAdmin(t))
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch ticket' })
  }
}

async function updateTicketStatus(req, res) {
  try {
    const status = String(req.body.status || '').trim()
    const remark = String(req.body.remark || '').trim()
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' })

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Forbidden' })

    ticket.status = status
    if (!ticket.assignedTo && ['Assigned', 'In Progress'].includes(status)) ticket.assignedTo = req.user.id
    if (remark) {
      ticket.adminRemarks.push({ adminId: req.user.id, remark, status })
    }
    await ticket.save()

    const io = req.app.get('io')
    const payload = await Ticket.findById(ticket._id)
      .populate('studentId', '_id')
      .populate('assignedTo', 'name email department')
      .populate('adminRemarks.adminId', 'name role')
      .lean()
    io.emit('ticket:update', sanitizeTicketForAdmin(payload))

    await createNotification({
      userId: payload.studentId?._id,
      ticketId: payload._id,
      type: status === 'Resolved' ? 'resolved' : 'updated',
      title: 'Complaint Updated',
      message: `${payload.ticketId} status changed to ${status}.`,
      io
    })

    if (req.user.role === 'student') return res.json(payload)
    res.json(sanitizeTicketForAdmin(payload))
  } catch (e) {
    res.status(500).json({ message: 'Failed to update status' })
  }
}

async function updateTicketRemarks(req, res) {
  try {
    const remark = String(req.body.remark || '').trim()
    if (!remark) return res.status(400).json({ message: 'Remark is required' })

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    if (!canManageTicket(req.user, ticket)) return res.status(403).json({ message: 'Forbidden' })

    ticket.adminRemarks.push({
      adminId: req.user.id,
      remark,
      status: ticket.status
    })
    await ticket.save()

    const io = req.app.get('io')
    const payload = await Ticket.findById(ticket._id)
      .populate('studentId', '_id')
      .populate('assignedTo', 'name email department')
      .populate('adminRemarks.adminId', 'name role')
      .lean()
    io.emit('ticket:update', sanitizeTicketForAdmin(payload))

    await createNotification({
      userId: payload.studentId?._id,
      ticketId: payload._id,
      type: 'updated',
      title: 'New Admin Remark',
      message: `Admin added a remark on ${payload.ticketId}.`,
      io
    })

    if (req.user.role === 'student') return res.json(payload)
    res.json(sanitizeTicketForAdmin(payload))
  } catch (e) {
    res.status(500).json({ message: 'Failed to update remarks' })
  }
}

async function deleteTicket(req, res) {
  try {
    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })

    const canDelete = ['super_admin', 'admin'].includes(req.user.role)

    if (!canDelete) return res.status(403).json({ message: 'Forbidden' })

    await Ticket.deleteOne({ _id: ticket._id })
    res.json({ message: 'Ticket deleted' })
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete ticket' })
  }
}

async function stats(req, res) {
  try {
    const baseFilter = {}
    // Remove student ID filtering to make stats public for all students
    // if (req.user.role === 'student') baseFilter.studentId = req.user.id

    const [total, pending, assigned, inProgress, resolved, rejected, highPriority] = await Promise.all([
      Ticket.countDocuments(baseFilter),
      Ticket.countDocuments({ ...baseFilter, status: 'Pending' }),
      Ticket.countDocuments({ ...baseFilter, status: 'Assigned' }),
      Ticket.countDocuments({ ...baseFilter, status: 'In Progress' }),
      Ticket.countDocuments({ ...baseFilter, status: 'Resolved' }),
      Ticket.countDocuments({ ...baseFilter, status: 'Rejected' }),
      Ticket.countDocuments({ ...baseFilter, priority: { $in: ['High', 'Urgent'] } })
    ])

    const recent = await Ticket.find(baseFilter).sort({ createdAt: -1 }).limit(5).lean()
    res.json({ total, pending, assigned, inProgress, resolved, rejected, highPriority, recent })
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
}

module.exports = {
  createTicket,
  listTickets,
  getTicket,
  updateTicketStatus,
  updateTicketRemarks,
  deleteTicket,
  stats
}
