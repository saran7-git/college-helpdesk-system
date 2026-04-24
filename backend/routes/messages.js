const express = require('express')
const { auth } = require('../middleware/auth')
const { getMessages, postMessage } = require('../controllers/messageController')
const router = express.Router()

router.get('/:ticketId', auth, getMessages)
router.post('/:ticketId', auth, postMessage)

module.exports = router
