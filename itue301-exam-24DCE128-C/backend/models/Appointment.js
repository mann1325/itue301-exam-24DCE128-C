const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  reason: {
    type: String,
    maxlength: 300
  }
})

appointmentSchema.index({ patientId: 1, doctorId: 1, date: 1, timeSlot: 1 }, { unique: true })

module.exports = mongoose.model('Appointment', appointmentSchema)
