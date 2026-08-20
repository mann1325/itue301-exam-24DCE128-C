import { Link } from 'react-router-dom'

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-container">
        <h1 className="nav-title">Hospital Appointment</h1>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/doctors">Doctors</Link></li>
          <li><Link to="/booking">Booking</Link></li>
        </ul>
      </div>
    </nav>
  )
}

export default Nav
