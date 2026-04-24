const Notification = require('../models/Notification')

async function listNotifications(req, res) {
  try {
    const list = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean()
    res.json(list)
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch notifications' })
  }
}

async function markRead(req, res) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    ).lean()
    if (!notification) return res.status(404).json({ message: 'Notification not found' })
    res.json(notification)
  } catch (e) {
    res.status(500).json({ message: 'Failed to update notification' })
  }
}

module.exports = { listNotifications, markRead }
