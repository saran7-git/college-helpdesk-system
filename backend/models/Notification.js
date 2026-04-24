const mongoose = require('mongoose')

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    type: { type: String, enum: ['created', 'updated', 'resolved'], required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Notification', NotificationSchema)
