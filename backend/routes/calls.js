const express = require('express')
const { auth, requireAnyRole } = require('../middleware/auth')
const { getCalls, listAllCalls, createCall } = require('../controllers/callController')
const router = express.Router()

router.get('/', auth, requireAnyRole(['department_admin', 'super_admin', 'admin']), listAllCalls)
router.get('/:ticketId', auth, getCalls)
router.post('/:ticketId', auth, createCall)

module.exports = router
