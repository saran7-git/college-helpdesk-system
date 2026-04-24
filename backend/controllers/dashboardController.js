const Ticket = require('../models/Ticket')

async function getDashboardStats(req, res) {
  try {
    const { department, status, priority, dateFrom, dateTo, search } = req.query
    const filter = {}

    // Remove student ID filtering to make dashboard stats public for all students
    // if (req.user.role === 'student') filter.studentId = req.user.id
    if (department && ['super_admin', 'admin'].includes(req.user.role)) filter.department = department
    if (status) filter.status = status
    if (priority) filter.priority = priority
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

    const [total, pending, resolved, highPriority] = await Promise.all([
      Ticket.countDocuments(filter),
      Ticket.countDocuments({ ...filter, status: 'Pending' }),
      Ticket.countDocuments({ ...filter, status: 'Resolved' }),
      Ticket.countDocuments({ ...filter, priority: { $in: ['High', 'Urgent'] } })
    ])

    res.json({ totalComplaints: total, pendingComplaints: pending, resolvedComplaints: resolved, highPriorityComplaints: highPriority })
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats' })
  }
}

module.exports = { getDashboardStats }
