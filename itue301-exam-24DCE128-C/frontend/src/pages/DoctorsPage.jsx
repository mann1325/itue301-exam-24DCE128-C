import { useState, useEffect } from 'react'
import { User, CheckCircle, XCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

function DoctorAvatar({ name }) {
  const initials = name
    .split(' ')
    .filter(w => w !== 'Dr.')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="doctor-avatar">
      <User size={40} />
      <span className="doctor-avatar-text">{initials}</span>
    </div>
  )
}

function DoctorsPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function getDoctors() {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/doctors`)
      const result = await res.json()
      if (!res.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(result.message || 'Failed to fetch doctors')
      }
      setData(result.data)
      setError("")
    } catch (err) {
      setError(err.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getDoctors()
  }, [])

  if (loading) {
    return (
      <div className="container">
        <p className="loading-text">Loading doctors...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-text" role="alert">Error: {error}</p>
        <button type="button" className="btn-secondary retry-btn" onClick={getDoctors}>Try again</button>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="section-header">
        <h2 className="section-title">Our Doctors</h2>
        <p className="section-sub">Meet our team of experienced healthcare professionals</p>
      </div>
      <div className="doctors-list">
        {data.length === 0 && <p className="empty-text">No doctors are currently available.</p>}
        {data.map((doctor) => (
          <div key={doctor.id} className="doctor-card">
            <div className="doctor-header">
              <DoctorAvatar name={doctor.name} />
              <div className="doctor-info">
                <p className="doctor-name">{doctor.name}</p>
                <p className="doctor-spec">{doctor.specialisation}</p>
              </div>
            </div>
            <div className="doctor-body">
              <div className="doctor-meta">
                <span className="meta-item">
                  {doctor.available ? <CheckCircle size={14} className="icon-green" /> : <XCircle size={14} className="icon-red" />}
                  {doctor.available ? 'Available Now' : 'Currently Unavailable'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DoctorsPage
