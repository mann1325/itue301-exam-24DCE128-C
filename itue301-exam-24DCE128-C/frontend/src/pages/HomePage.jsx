import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Calendar, Clock, CheckCircle, Star, Shield, Zap, Stethoscope, Users, Heart } from 'lucide-react'
import AppointmentCard from '../components/AppointmentCard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

function HomePage() {
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadAppointments() {
      try {
        const [appointmentsResponse, doctorsResponse] = await Promise.all([
          fetch(`${API_URL}/appointments`),
          fetch(`${API_URL}/doctors`)
        ])
        const appointmentsResult = await appointmentsResponse.json()
        const doctorsResult = await doctorsResponse.json()
        if (!appointmentsResponse.ok || !appointmentsResult.success || !Array.isArray(appointmentsResult.data)) {
          throw new Error(appointmentsResult.message || 'Unable to load appointments.')
        }
        if (!doctorsResponse.ok || !doctorsResult.success || !Array.isArray(doctorsResult.data)) {
          throw new Error(doctorsResult.message || 'Unable to load doctors.')
        }
        setAppointments(appointmentsResult.data)
        setDoctors(doctorsResult.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load appointments.')
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-left">
          <div className="hero-badge">
            <Zap size={14} />
            SMART HEALTHCARE PLATFORM
          </div>
          <h1 className="hero-heading">
            Healthcare appointments,<br />
            <span className="hero-highlight">made simple.</span>
          </h1>
          <p className="hero-desc">
            Book appointments with trusted doctors, manage your schedule, and access better healthcare.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/booking')}>
              <Calendar size={18} />
              Book Appointment
            </button>
            <button className="btn-secondary" onClick={() => navigate('/doctors')}>
              View Doctors
            </button>
          </div>
          <div className="trust-row">
            <div className="trust-item">
              <CheckCircle size={16} className="trust-icon" />
              Easy booking
            </div>
            <div className="trust-item">
              <Shield size={16} className="trust-icon" />
              Trusted doctors
            </div>
            <div className="trust-item">
              <Clock size={16} className="trust-icon" />
              Flexible scheduling
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-card-grid">
            <div className="hero-card hero-card-primary">
              <Stethoscope size={32} className="hero-icon" />
              <h3>Expert Doctors</h3>
              <p>Specialized care from verified medical professionals</p>
            </div>
            <div className="hero-card">
              <Users size={32} className="hero-icon" />
              <h3>24/7 Support</h3>
              <p>Round-the-clock assistance for all your needs</p>
            </div>
            <div className="hero-card">
              <Heart size={32} className="hero-icon" />
              <h3>Patient Care</h3>
              <p>Compassionate care for every patient</p>
            </div>
            <div className="hero-card hero-card-secondary">
              <Calendar size={32} className="hero-icon" />
              <h3>Easy Booking</h3>
              <p>Simple, fast appointment scheduling</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="stats-bar">
        <div className="stat-item">
          <span className="stat-num">{appointments.length}</span>
          <span className="stat-label">Appointments</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{doctors.length}</span>
          <span className="stat-label">Doctors Listed</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-num">{doctors.filter(doctor => doctor.available).length}</span>
          <span className="stat-label">Available Doctors</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-stars">
            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
          </div>
          <span className="stat-label">Live API Data</span>
        </div>
      </section>

      {/* Recent Appointments */}
      <section className="container">
        <div className="section-header">
          <h2 className="section-title">Recent Appointments</h2>
          <p className="section-sub">Track and manage your upcoming visits</p>
        </div>
        <div className="appointments-list">
          {loading && <p className="loading-text">Loading appointments...</p>}
          {error && <p className="error-text" role="alert">{error}</p>}
          {!loading && !error && appointments.length === 0 && (
            <p className="empty-text">No appointments have been booked yet.</p>
          )}
          {!loading && !error && appointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              patientName={apt.patientName}
              doctorName={apt.doctorName}
              date={apt.date}
              timeSlot={apt.timeSlot}
              status={apt.status}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
