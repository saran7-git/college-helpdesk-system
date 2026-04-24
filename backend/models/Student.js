const mongoose = require('mongoose')

const StudentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    registerNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    year: { type: Number, default: 1 }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Student', StudentSchema)
