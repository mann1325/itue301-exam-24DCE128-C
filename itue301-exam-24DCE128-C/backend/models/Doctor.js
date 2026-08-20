const mongoose = require('mongoose')

const doctorSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  specialisation: {
    type: String,
    required: true,
    trim: true
  },
  available: {
    type: Boolean,
    default: true
  }
})

module.exports = mongoose.model('Doctor', doctorSchema)
