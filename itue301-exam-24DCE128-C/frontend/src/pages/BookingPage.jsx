import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

function BookingPage() {
  const [form, setForm] = useState({
    patientName: "",
    doctorName: "",
    date: "",
    timeSlot: ""
  })

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  async function submit(e) {
    e.preventDefault()
    setMessage("")
    setError("")

    const missingField = Object.entries(form).find(([, value]) => !value.trim())
    if (missingField) {
      setError('Please complete all fields before booking.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const result = await response.json()
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Unable to book the appointment.')
      }

      setMessage(`Appointment booked for ${result.data.patientName} with ${result.data.doctorName}. Status: ${result.data.status}.`)
      setForm({
        patientName: "",
        doctorName: "",
        date: "",
        timeSlot: ""
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach the appointment service.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container">
      <h2>Book an Appointment</h2>
      
      <form onSubmit={submit} className="booking-form">
        <div className="form-group">
          <label htmlFor="patientName">Patient Name</label>
          <input
            id="patientName"
            type="text"
            name="patientName"
            value={form.patientName}
            onChange={change}
            placeholder="Enter patient name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="doctorName">Doctor Name</label>
          <input
            id="doctorName"
            type="text"
            name="doctorName"
            value={form.doctorName}
            onChange={change}
            placeholder="Enter doctor name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            name="date"
            value={form.date}
            onChange={change}
          />
        </div>

        <div className="form-group">
          <label htmlFor="timeSlot">Time Slot</label>
          <input
            id="timeSlot"
            type="time"
            name="timeSlot"
            value={form.timeSlot}
            onChange={change}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Booking...' : 'Book Appointment'}
        </button>
      </form>

      {message && <p className="message" role="status">{message}</p>}
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  )
}

export default BookingPage
