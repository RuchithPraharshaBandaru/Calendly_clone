/**
 * Navbar Component
 * 
 * Top navigation bar with the Calendly-like design.
 * Shows the app logo/name and navigation links.
 * Uses React Router's NavLink for active link highlighting.
 * 
 * Why NavLink over Link?: NavLink automatically adds an "active" 
 * class to the current route link, which is perfect for nav highlighting.
 */

import { NavLink } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#0069ff"/>
            <path d="M7 12L10.5 15.5L17 8.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Calendly</span>
        </NavLink>
        
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Event Types
          </NavLink>
          <NavLink to="/availability" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Availability
          </NavLink>
          <NavLink to="/meetings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            Meetings
          </NavLink>
        </div>

        <div className="navbar-user">
          <div className="user-avatar">JD</div>
          <span className="user-name">John Doe</span>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
