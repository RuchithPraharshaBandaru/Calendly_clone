/**
 * Meetings Page — Calendly-style
 * 
 * Matches Calendly's Meetings page layout:
 * - "Meetings" title with event count
 * - Upcoming / Past tabs
 * - Flat meeting cards with date badge, color dot, details, and actions
 */

import { useState, useEffect } from 'react';
import { getMeetings, cancelMeeting, rescheduleMeeting } from '../api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import './Meetings.css';

function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reschedule modal
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [newDateTime, setNewDateTime] = useState('');

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const { data } = await getMeetings(filter);
      setMeetings(data);
    } catch (error) {
      setToast({ message: 'Failed to load meetings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMeeting(cancelModal.id, { cancel_reason: cancelReason });
      setCancelModal(null);
      setCancelReason('');
      setToast({ message: 'Meeting cancelled', type: 'success' });
      fetchMeetings();
    } catch (error) {
      setToast({ message: 'Failed to cancel', type: 'error' });
    }
  };

  const handleReschedule = async () => {
    if (!newDateTime) return;
    try {
      await rescheduleMeeting(rescheduleModal.id, { new_start_time: newDateTime });
      setRescheduleModal(null);
      setNewDateTime('');
      setToast({ message: 'Meeting rescheduled', type: 'success' });
      fetchMeetings();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reschedule';
      setToast({ message: msg, type: 'error' });
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="meetings-page">
      {/* Header */}
      <div className="meetings-header">
        <h1>Meetings</h1>
        <span className="meetings-count">
          Displaying {meetings.length} event{meetings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabs */}
      <div className="meetings-tabs">
        <button
          className={`meetings-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`meetings-tab ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      {/* Meeting List */}
      {loading ? (
        <div className="meetings-empty">
          <div className="spinner"></div>
          <p>Loading meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="meetings-empty">
          <div className="meetings-empty-icon">📋</div>
          <h3>No {filter === 'upcoming' ? 'Upcoming' : 'Past'} Events</h3>
          <p>Share Event Type links to schedule events.</p>
        </div>
      ) : (
        <div className="meeting-list">
          {meetings.map(meeting => {
            const { day, num, time } = formatDate(meeting.start_time);
            const endTime = new Date(meeting.end_time).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true
            });

            return (
              <div key={meeting.id} className="meeting-card">
                <div className="meeting-date-badge">
                  <div className="date-day">{day}</div>
                  <div className="date-num">{num}</div>
                </div>

                <div
                  className="meeting-color-dot"
                  style={{ background: meeting.event_color || '#0069ff' }}
                ></div>

                <div className="meeting-info">
                  <p className="meeting-time">{time} - {endTime}</p>
                  <h3 className="meeting-event-name">{meeting.event_name}</h3>
                  <p className="meeting-invitee">
                    {meeting.invitee_name} • {meeting.invitee_email}
                  </p>
                </div>

                <span className={`meeting-status status-${meeting.status}`}>
                  {meeting.status}
                </span>

                {meeting.status === 'scheduled' && filter === 'upcoming' && (
                  <div className="meeting-actions">
                    <button
                      className="meeting-action-btn"
                      onClick={() => setRescheduleModal(meeting)}
                    >
                      Reschedule
                    </button>
                    <button
                      className="meeting-action-btn cancel-btn"
                      onClick={() => setCancelModal(meeting)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <Modal title="Cancel Meeting" onClose={() => setCancelModal(null)}>
          <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '14px' }}>
            Cancel your meeting with <strong>{cancelModal.invitee_name}</strong>?
          </p>
          <textarea
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '10px', border: '1px solid #d1d5db',
              borderRadius: '8px', fontSize: '14px', resize: 'vertical',
              fontFamily: 'inherit', marginBottom: '16px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setCancelModal(null)}
              style={{
                padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '8px',
                background: 'white', cursor: 'pointer', fontWeight: 500
              }}
            >
              Keep
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '8px',
                background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 600
              }}
            >
              Cancel Meeting
            </button>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <Modal title="Reschedule Meeting" onClose={() => setRescheduleModal(null)}>
          <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: '14px' }}>
            Pick a new time for <strong>{rescheduleModal.invitee_name}</strong>:
          </p>
          <input
            type="datetime-local"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
            style={{
              width: '100%', padding: '10px', border: '1px solid #d1d5db',
              borderRadius: '8px', fontSize: '14px', marginBottom: '16px'
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setRescheduleModal(null)}
              style={{
                padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '8px',
                background: 'white', cursor: 'pointer', fontWeight: 500
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleReschedule}
              style={{
                padding: '8px 16px', border: 'none', borderRadius: '8px',
                background: '#0069ff', color: 'white', cursor: 'pointer', fontWeight: 600
              }}
            >
              Reschedule
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Meetings;
