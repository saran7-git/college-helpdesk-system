require('dotenv').config()
const connectDB = require('../config/db')
const bcrypt = require('bcrypt')
const User = require('../models/User')

async function upsertUser({ email, password, name, role }) {
  const existing = await User.findOne({ email })
  if (existing) {
    console.log(`User already exists: ${email}`)
    return
  }
  const hash = await bcrypt.hash(password, 10)
  await User.create({ email, password: hash, name, role, status: 'active' })
  console.log(`Created user: ${email} (${role})`)
}

async function main() {
  await connectDB()
  await upsertUser({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME || 'Admin',
    role: 'admin'
  })
  await upsertUser({
    email: process.env.STUDENT_EMAIL,
    password: process.env.STUDENT_PASSWORD,
    name: process.env.STUDENT_NAME || 'Student',
    role: 'student'
  })
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
