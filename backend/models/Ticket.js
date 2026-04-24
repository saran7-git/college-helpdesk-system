const mongoose = require('mongoose')

const remarksSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    remark: { type: String, required: true, trim: true },
    status: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
)

const TicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true, trim: true },
    registerNumber: { type: String, required: true, trim: true, uppercase: true },
    department: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['Academic', 'Hostel', 'Transport', 'Fees', 'Infrastructure', 'Technical'] },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
    attachments: [{ type: String }],
    media: [{ type: String }],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminRemarks: [remarksSchema],
    status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

TicketSchema.pre('validate', function (next) {
  if (!this.ticketId) {
    this.ticketId = `TKT-TEMP-${Date.now()}`
  }
  if (!this.attachments?.length && this.media?.length) this.attachments = this.media
  if (!this.media?.length && this.attachments?.length) this.media = this.attachments
  next()
})

module.exports = mongoose.model('Ticket', TicketSchema)
