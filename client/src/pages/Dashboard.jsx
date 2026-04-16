/**
 * Dashboard Page (Admin)
 * 
 * The main admin page showing all event types.
 * Similar to Calendly's "Event Types" tab.
 * 
 * Features:
 * - List of event type cards
 * - "New Event Type" button
 * - Delete with confirmation
 * - Toggle active/inactive
 * - Copy booking link with toast feedback
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventTypes, deleteEventType, updateEventType } from '../api';
import EventTypeCard from '../components/EventTypeCard';
import Toast from '../components/Toast';
import './Dashboard.css';

function Dashboard() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const { data } = await getEventTypes();
      setEventTypes(data);
    } catch (error) {
      console.error('Failed to fetch event types:', error);
      setToast({ message: 'Failed to load event types', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event type? All associated meetings will be deleted too.')) {
      return;
    }

    try {
      await deleteEventType(id);
      setEventTypes(prev => prev.filter(e => e.id !== id));
      setToast({ message: 'Event type deleted', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to delete event type', type: 'error' });
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await updateEventType(id, { is_active: isActive });
      setEventTypes(prev => prev.map(e => e.id === id ? { ...e, is_active: isActive } : e));
      setToast({ message: isActive ? 'Event type activated' : 'Event type deactivated', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to update event type', type: 'error' });
    }
  };

  const handleCopy = (slug) => {
    setToast({ message: 'Booking link copied to clipboard!', type: 'success' });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading event types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Event Types</h1>
          <p className="page-subtitle">Create events to share for people to book on your calendar.</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/event-types/new')}
        >
          + New Event Type
        </button>
      </div>

      {eventTypes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No event types yet</h3>
          <p>Create your first event type to start receiving bookings.</p>
          <button className="btn-primary" onClick={() => navigate('/event-types/new')}>
            + Create Event Type
          </button>
        </div>
      ) : (
        <div className="event-list">
          {eventTypes.map(event => (
            <EventTypeCard
              key={event.id}
              event={event}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default Dashboard;
