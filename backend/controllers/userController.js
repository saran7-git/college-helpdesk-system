const User = require('../models/User')
const Ticket = require('../models/Ticket')
const mongoose = require('mongoose')

async function listStudents(req, res) {
  try {
    const { q, department, year, status } = req.query
    const filter = { role: 'student' }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { registerNumber: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } }
      ]
    }
    if (department) filter.department = department
    if (year) filter.year = Number(year)
    if (status) filter.status = status
    const students = await User.find(filter).sort({ name: 1 }).lean()
    const ids = students.map((s) => s._id)
    const counts = await Ticket.aggregate([{ $match: { studentId: { $in: ids } } }, { $group: { _id: '$studentId', count: { $sum: 1 } } }])
    const map = new Map(counts.map((c) => [c._id.toString(), c.count]))
    const result = students.map((s) => ({
      id: s._id,
      name: s.name,
      email: s.email,
      registerNumber: s.registerNumber || '',
      department: s.department,
      year: s.year,
      status: s.status,
      totalComplaints: map.get(s._id.toString()) || 0
    }))
    res.json(result)
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch students' })
  }
}

async function getStudent(req, res) {
  try {
    const s = await User.findById(req.params.id).lean()
    if (!s || s.role !== 'student') return res.status(404).json({ message: 'Student not found' })
    const totalComplaints = await Ticket.countDocuments({ studentId: s._id })
    res.json({
      id: s._id,
      name: s.name,
      email: s.email,
      registerNumber: s.registerNumber || '',
      department: s.department,
      year: s.year,
      status: s.status,
      totalComplaints
    })
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch student' })
  }
}

async function updateStudentStatus(req, res) {
  try {
    const { status } = req.body
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ message: 'Invalid status' })
    const s = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean()
    if (!s) return res.status(404).json({ message: 'Student not found' })
    res.json({
      id: s._id,
      name: s.name,
      email: s.email,
      registerNumber: s.registerNumber || '',
      department: s.department,
      year: s.year,
      status: s.status
    })
  } catch (e) {
    res.status(500).json({ message: 'Failed to update status' })
  }
}

module.exports = { listStudents, getStudent, updateStudentStatus }
