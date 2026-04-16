/**
 * EventTypeCard Component
 * 
 * Displays a single event type as a card on the admin dashboard.
 * Each card shows the event name, duration, and provides actions:
 * - Copy booking link
 * - Edit event type
 * - Delete event type
 * - Toggle active/inactive
 * 
 * Mimics Calendly's event type card layout with a left color border.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventTypeCard.css';

function EventTypeCard({ event, onDelete, onToggle, onCopy }) {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  const bookingUrl = `${window.location.origin}/book/${event.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    onCopy(event.slug);
  };

  return (
    <div className={`event-card ${!event.is_active ? 'event-card-inactive' : ''}`}>
      <div className="event-card-color" style={{ background: event.color || '#0069ff' }}></div>
      
      <div className="event-card-content">
        <div className="event-card-header">
          <div>
            <h3 className="event-card-name">{event.name}</h3>
            <p className="event-card-duration">
              {event.duration} min
              {event.buffer_before > 0 && ` • ${event.buffer_before}min buffer before`}
              {event.buffer_after > 0 && ` • ${event.buffer_after}min buffer after`}
            </p>
            {event.description && (
              <p className="event-card-desc">{event.description}</p>
            )}
          </div>

          <div className="event-card-actions">
            <label className="toggle-switch" title={event.is_active ? 'Active' : 'Inactive'}>
              <input
                type="checkbox"
                checked={event.is_active}
                onChange={() => onToggle(event.id, !event.is_active)}
              />
              <span className="toggle-slider"></span>
            </label>

            <div className="dropdown-container">
              <button 
                className="action-btn dots-btn"
                onClick={() => setShowOptions(!showOptions)}
              >
                ⋮
              </button>
              {showOptions && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setShowOptions(false)}></div>
                  <div className="dropdown-menu">
                    <button onClick={() => { navigate(`/event-types/${event.id}/edit`); setShowOptions(false); }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => { handleCopy(); setShowOptions(false); }}>
                      🔗 Copy Link
                    </button>
                    <button onClick={() => { window.open(`/book/${event.slug}`, '_blank'); setShowOptions(false); }}>
                      👁️ Preview
                    </button>
                    <button className="delete-option" onClick={() => { onDelete(event.id); setShowOptions(false); }}>
                      🗑️ Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="event-card-footer">
          <a 
            href={`/book/${event.slug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="event-card-link"
          >
            View booking page →
          </a>
          <button className="copy-link-btn" onClick={handleCopy}>
            📋 Copy link
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventTypeCard;
