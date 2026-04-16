/**
 * Sidebar Navigation (Calendly-style)
 * 
 * Left sidebar with SVG icon + text links, matching Calendly's actual layout.
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
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
        </svg>
        <span className="sidebar-btn-text">Create</span>
      </button>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="sidebar-text">Scheduling</span>
        </NavLink>

        <NavLink to="/meetings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className="sidebar-text">Meetings</span>
        </NavLink>

        <NavLink to="/availability" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <svg className="sidebar-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
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
