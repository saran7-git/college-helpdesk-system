const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    registerNumber: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'super_admin', 'admin'], default: 'student' },
    department: { type: String, default: '' },
    year: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' }
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
