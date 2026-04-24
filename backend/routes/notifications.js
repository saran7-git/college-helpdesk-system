const express = require('express')
const { auth } = require('../middleware/auth')
const { listNotifications, markRead } = require('../controllers/notificationController')

const router = express.Router()

router.get('/', auth, listNotifications)
router.patch('/:id/read', auth, markRead)

module.exports = router
