const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Request Logger Middleware
function requestLogger(req, res, next) {
  console.log(`[${req.method}] ${req.path} [${new Date().toISOString()}]`)
  next()
}

app.use(requestLogger)

// Models
const Patient = require('./models/Patient')
const Doctor = require('./models/Doctor')
const Appointment = require('./models/Appointment')

// MongoDB Connection
async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required')
  }

  await mongoose.connect(process.env.MONGO_URI)
  await Doctor.bulkWrite([
    {
      updateOne: {
        filter: { id: '1' },
        update: { $setOnInsert: { id: '1', name: 'Dr. Amit Patel', email: 'amit@hospital.com', specialisation: 'Cardiologist', available: true } },
        upsert: true
      }
    },
    {
      updateOne: {
        filter: { id: '2' },
        update: { $setOnInsert: { id: '2', name: 'Dr. Riya Shah', email: 'riya@hospital.com', specialisation: 'Dentist', available: false } },
        upsert: true
      }
    },
    {
      updateOne: {
        filter: { id: '3' },
        update: { $setOnInsert: { id: '3', name: 'Dr. Neha Joshi', email: 'neha@hospital.com', specialisation: 'Dermatologist', available: true } },
        upsert: true
      }
    }
  ])
  console.log('MongoDB connected')
}

function validationMessage(error) {
  return Object.values(error.errors)
    .map(item => item.message)
    .join(', ')
}

function appointmentResponse(appointment) {
  const patient = appointment.patientId
  const doctor = appointment.doctorId

  return {
    id: appointment._id,
    _id: appointment._id,
    patientId: patient?._id || patient,
    doctorId: doctor?._id || doctor,
    patientName: patient?.name || '',
    doctorName: doctor?.name || '',
    date: appointment.date,
    timeSlot: appointment.timeSlot,
    status: appointment.status,
    reason: appointment.reason || ''
  }
}

app.get('/api/v1/appointments', async (req, res, next) => {
  try {
    const data = await Appointment.find()
      .populate('patientId', 'name email')
      .populate('doctorId', 'name email specialisation available')
      .sort({ date: 1, timeSlot: 1 })
      .lean()

    res.status(200).json({ success: true, data: data.map(appointmentResponse) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/v1/appointments', async (req, res, next) => {
  try {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: 'Request body must be a JSON object' })
  }

  const { patientId, doctorId, patientName, doctorName, patientEmail, date, timeSlot, status, reason } = req.body

  if ([patientName, doctorName, date, timeSlot].some(value => typeof value !== 'string' || !value.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Patient name, doctor name, date, and time slot are required'
    })
  }

  const appointmentDate = new Date(`${date}T00:00:00.000Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(appointmentDate.getTime())) {
    return res.status(400).json({ success: false, message: 'Date must be a valid YYYY-MM-DD value' })
  }

  const validStatuses = ['pending', 'confirmed', 'cancelled']
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid appointment status' })
  }
  if (reason !== undefined && (typeof reason !== 'string' || reason.length > 300)) {
    return res.status(400).json({ success: false, message: 'Reason must be 300 characters or fewer' })
  }

  let patient
  if (patientId) {
    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID' })
    }
    patient = await Patient.findById(patientId)
  } else if (patientEmail) {
    patient = await Patient.findOne({ email: patientEmail.trim().toLowerCase() })
  } else {
    patient = await Patient.findOne({ name: patientName.trim() })
  }

  if (!patient) {
    if (patientId) {
      return res.status(404).json({ success: false, message: 'Patient not found' })
    }

    const email = (patientEmail || `${patientName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.')}.booking@hospital.local`).toLowerCase()
    patient = await Patient.create({ name: patientName.trim(), email })
  }

  let doctor
  if (doctorId) {
    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' })
    }
    doctor = await Doctor.findById(doctorId)
  } else {
    doctor = await Doctor.findOne({ name: doctorName.trim() })
  }

  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }

  const duplicate = await Appointment.exists({
    patientId: patient._id,
    doctorId: doctor._id,
    date: appointmentDate,
    timeSlot: timeSlot.trim()
  })
  if (duplicate) {
    return res.status(409).json({ success: false, message: 'This appointment has already been booked' })
  }

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    date: appointmentDate,
    timeSlot: timeSlot.trim(),
    status: status || 'pending',
    reason
  })
  const data = await Appointment.findById(appointment._id)
    .populate('patientId', 'name email')
    .populate('doctorId', 'name email specialisation available')
    .lean()

  res.status(201).json({
    success: true,
    message: 'Appointment created',
    data: appointmentResponse(data)
  })
  } catch (error) {
    next(error)
  }
})

app.get('/api/v1/doctors', async (req, res, next) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 }).lean()
    res.status(200).json({ success: true, data: doctors.map(doctor => ({ ...doctor, id: doctor._id.toString() })) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/v1/doctors', async (req, res, next) => {
  try {
    const { name, email, specialisation, available } = req.body || {}
    if (!name || !email || !specialisation) {
      return res.status(400).json({ success: false, message: 'Name, email, and specialisation are required' })
    }

    const doctor = await Doctor.create({
      id: `doctor-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      specialisation: specialisation.trim(),
      available
    })
    res.status(201).json({ success: true, message: 'Doctor created', data: doctor })
  } catch (error) {
    next(error)
  }
})

// Task 5 MongoDB Endpoint - Create Patient
app.post('/api/v1/patients', async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, age } = req.body || {}

    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      })
    }

    const newPatient = await Patient.create({
      name,
      email: email.trim().toLowerCase(),
      phone,
      bloodGroup,
      age
    })

    res.status(201).json({
      success: true,
      message: 'Patient created',
      data: newPatient
    })
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: validationMessage(err)
      })
    }

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    })
  }
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Global Error Handler (last middleware)
app.use((err, req, res, next) => {
  console.error(err.message)

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain valid JSON'
    })
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: validationMessage(err)
    })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid data format' })
  }

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate record' })
  }

  res.status(500).json({
    success: false,
    message: 'Server error'
  })
})

const PORT = process.env.PORT || 5000

async function startServer() {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Unable to start server:', error.message)
    process.exitCode = 1
  }
}

startServer()
