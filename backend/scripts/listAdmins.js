require('dotenv').config()
const connectDB = require('../config/db')
const User = require('../models/User')

async function main() {
  await connectDB()
  const admins = await User.find({ role: 'admin' }).lean()
  console.log('admins', admins)
  const students = await User.find({ role: 'student' }).lean()
  console.log('students', students)
  process.exit(0)
}

main().catch((e) => {
  console.error('error', e)
  process.exit(1)
})
