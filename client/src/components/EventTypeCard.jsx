/**
 * EventTypeCard — Calendly-style event type row
 * 
 * Flat list item with left color border, event info, and action buttons.
 * Matches Calendly's actual "Scheduling" page layout.
 */

import { useNavigate } from 'react-router-dom';
import './EventTypeCard.css';

function EventTypeCard({ event, onDelete, onToggle, onCopy }) {
  const navigate = useNavigate();
  const bookingUrl = `${window.location.origin}/book/${event.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl).then(() => {
      onCopy(event.slug);
    });
  };

  return (
    <div className={`event-row ${!event.is_active ? 'event-row-inactive' : ''}`}>
      <div className="event-row-color" style={{ background: event.color || '#0069ff' }}></div>
      <div className="event-row-info">
        <h3 className="event-row-name">{event.name}</h3>
        <p className="event-row-meta">
          {event.duration} min
          {event.schedule_name && <> • {event.schedule_name}</>}
        </p>
      </div>
      <div className="event-row-actions">
        <button className="action-btn copy-btn" onClick={handleCopy} title="Copy link">
          Copy link
        </button>
        <button className="action-btn edit-btn" onClick={() => navigate(`/event-types/${event.id}/edit`)} title="Edit">
          Edit
        </button>
        <div className="toggle-wrapper">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={event.is_active}
              onChange={(e) => onToggle(event.id, e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <button className="action-btn action-danger" onClick={() => onDelete(event.id)} title="Delete">
          Delete
        </button>
      </div>
    </div>
  );
}

export default EventTypeCard;
