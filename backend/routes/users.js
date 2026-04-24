const express = require('express')
const { auth, requireAnyRole } = require('../middleware/auth')
const { listStudents, getStudent, updateStudentStatus } = require('../controllers/userController')
const router = express.Router()

router.get('/students', auth, requireAnyRole(['super_admin', 'admin']), listStudents)
router.get('/students/:id', auth, requireAnyRole(['super_admin', 'admin']), getStudent)
router.patch('/students/:id/status', auth, requireAnyRole(['super_admin', 'admin']), updateStudentStatus)

module.exports = router
