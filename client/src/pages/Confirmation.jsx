/**
 * Confirmation Page
 * 
 * Shown after a successful booking. Displays a checkmark animation
 * and all meeting details. Matches Calendly's confirmation page.
 * 
 * Receives meeting data via React Router's location state.
 * If no state (direct URL visit), shows a generic message.
 */

import { useLocation, Link } from 'react-router-dom';
import { formatDate, formatTime } from '../utils/dateUtils';
import './Confirmation.css';

function Confirmation() {
  const location = useLocation();
  const { meeting, eventType } = location.state || {};

  if (!meeting) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="confirmation-icon">✓</div>
          <h1 className="confirmation-title">Booking Confirmed</h1>
          <p className="confirmation-subtitle">Your meeting has been scheduled.</p>
          <Link to="/" className="back-home-link">Back to Home</Link>
        </div>
      </div>
    );
  }

  const slug = eventType?.slug || '';

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-icon confirmed">✓</div>
        <h1 className="confirmation-title">You are scheduled</h1>
        <p className="confirmation-subtitle">
          A calendar invitation has been sent to your email address.
        </p>

        <div className="confirmation-details">
          <h3 className="detail-event-name">{eventType?.name || 'Meeting'}</h3>
          
          <div className="detail-row">
            <span className="detail-label">Host</span>
            <span className="detail-value">{eventType?.user_name || 'Host'}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Date</span>
            <span className="detail-value">{formatDate(meeting.start_time)}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Time</span>
            <span className="detail-value">
              {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Duration</span>
            <span className="detail-value">{eventType?.duration || 30} minutes</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Invitee</span>
            <span className="detail-value">{meeting.invitee_name} ({meeting.invitee_email})</span>
          </div>
        </div>

        <div className="confirmation-actions">
          {slug && (
            <Link to={`/book/${slug}`} className="book-another-link">
              Schedule another meeting
            </Link>
          )}
          <Link to="/" className="back-home-link">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Confirmation;
