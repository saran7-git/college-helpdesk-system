const mongoose = require('mongoose')
let memoryServer = null

async function connectDB() {
  try {
    const useMemory = (process.env.USE_IN_MEMORY_DB || '').toLowerCase() === 'true'
    const uriEnv = process.env.MONGO_URI
    const uri = useMemory ? null : uriEnv || 'mongodb://localhost:27017/college_helpdesk'
    mongoose.set('strictQuery', true)
    if (uri) {
      await mongoose.connect(uri)
      console.log('MongoDB connected')
      return
    }
    const { MongoMemoryServer } = require('mongodb-memory-server')
    memoryServer = await MongoMemoryServer.create()
    const memUri = memoryServer.getUri()
    await mongoose.connect(memUri)
    console.log('MongoDB (in-memory) connected')
  } catch (err) {
    console.error('MongoDB connection error', err.message)
    process.exit(1)
  }
}

module.exports = connectDB
