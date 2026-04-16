/**
 * Dashboard (Scheduling Page)
 * 
 * Matches Calendly's "Scheduling" page:
 * - Page header with title and "+ Create" button
 * - Tabs: "Event types" (active)
 * - Event type list as flat rows with left color border
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEventTypes, deleteEventType, updateEventType } from '../api';
import EventTypeCard from '../components/EventTypeCard';
import Toast from '../components/Toast';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const { data } = await getEventTypes();
      setEventTypes(data);
    } catch (error) {
      setToast({ message: 'Failed to load event types', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event type?')) return;
    try {
      await deleteEventType(id);
      setEventTypes(prev => prev.filter(e => e.id !== id));
      setToast({ message: 'Event type deleted', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await updateEventType(id, { is_active: isActive });
      setEventTypes(prev => prev.map(e => e.id === id ? { ...e, is_active: isActive } : e));
    } catch (error) {
      setToast({ message: 'Failed to update', type: 'error' });
    }
  };

  const handleCopy = (slug) => {
    setToast({ message: 'Link copied to clipboard!', type: 'success' });
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Scheduling</h1>
        </div>
        <button className="create-btn" onClick={() => navigate('/event-types/new')}>
          + Create
        </button>
      </div>

      {/* Tabs */}
      <div className="page-tabs">
        <button className="tab-btn tab-active">Event types</button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Loading event types...</p>
          </div>
        ) : eventTypes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">—</div>
            <h3>No Event Types Yet</h3>
            <p>Create your first event type to start scheduling.</p>
            <button className="create-btn" onClick={() => navigate('/event-types/new')}>
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
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Dashboard;
