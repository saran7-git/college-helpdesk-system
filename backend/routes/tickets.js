const express = require('express')
const multer = require('multer')
const path = require('path')
const { auth, requireRole, requireAnyRole } = require('../middleware/auth')
const {
  createTicket,
  listTickets,
  getTicket,
  updateTicketStatus,
  updateTicketRemarks,
  deleteTicket,
  stats
} = require('../controllers/ticketController')
const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'))
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, unique + ext)
  }
})

function fileFilter(req, file, cb) {
  const allowed = ['image/', 'video/', 'application/pdf']
  if (allowed.some((p) => file.mimetype.startsWith(p))) cb(null, true)
  else cb(new Error('Invalid file type'))
}

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 200)
const upload = multer({ storage, limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 }, fileFilter })

router.post('/', auth, requireRole('student'), upload.array('media', 5), createTicket)
router.get('/', auth, listTickets)
router.get('/stats', auth, requireRole('student'), stats)
router.get('/:id', auth, getTicket)
router.put('/:id/status', auth, requireAnyRole(['super_admin', 'admin']), updateTicketStatus)
router.patch('/:id/status', auth, requireAnyRole(['super_admin', 'admin']), updateTicketStatus)
router.put('/:id/remarks', auth, requireAnyRole(['super_admin', 'admin']), updateTicketRemarks)
router.delete('/:id', auth, requireAnyRole(['super_admin', 'admin']), deleteTicket)

module.exports = router
