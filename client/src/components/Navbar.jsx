/**
 * Sidebar Navigation (Calendly-style)
 * 
 * Left sidebar with icon + text links, matching Calendly's actual layout.
 * Collapsible on mobile. Has a "+ Create" button at the top.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="14" fill="#0069ff"/>
          <path d="M8 14.5C8 11.5 10.5 9 13.5 9C15.5 9 17.2 10.1 18.1 11.7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="18" cy="11" r="2" fill="white"/>
        </svg>
        <span className="sidebar-brand">Calendly</span>
      </div>

      {/* Create Button */}
      <button className="sidebar-create-btn" onClick={() => navigate('/event-types/new')}>
        + Create
      </button>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-icon">📅</span>
          <span className="sidebar-text">Scheduling</span>
        </NavLink>

        <NavLink to="/meetings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-icon">📋</span>
          <span className="sidebar-text">Meetings</span>
        </NavLink>

        <NavLink to="/availability" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <span className="sidebar-icon">🕐</span>
          <span className="sidebar-text">Availability</span>
        </NavLink>
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">R</div>
          <span className="sidebar-user-name">User</span>
        </div>
      </div>
    </aside>
  );
}

export default Navbar;
