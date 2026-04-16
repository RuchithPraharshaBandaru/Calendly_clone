/**
 * Meetings Page (Admin)
 * 
 * View and manage all meetings. Split into Upcoming and Past tabs.
 * Each meeting card shows invitee info, event type, date/time,
 * and provides cancel/reschedule actions.
 * 
 * Rescheduling opens a modal to pick a new date and time.
 */

import { useState, useEffect } from 'react';
import { getMeetings, cancelMeeting, rescheduleMeeting } from '../api';
import { formatDate, formatTime, getRelativeDate } from '../utils/dateUtils';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import './Meetings.css';

function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [filter, setFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
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
    if (!cancelModal) return;
    try {
      await cancelMeeting(cancelModal.id, { cancel_reason: cancelReason });
      setCancelModal(null);
      setCancelReason('');
      fetchMeetings();
      setToast({ message: 'Meeting cancelled', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to cancel meeting', type: 'error' });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !newDateTime) return;
    try {
      await rescheduleMeeting(rescheduleModal.id, { new_start_time: newDateTime });
      setRescheduleModal(null);
      setNewDateTime('');
      fetchMeetings();
      setToast({ message: 'Meeting rescheduled!', type: 'success' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reschedule';
      setToast({ message: msg, type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: { bg: '#ecfdf5', color: '#065f46', text: 'Scheduled' },
      cancelled: { bg: '#fef2f2', color: '#991b1b', text: 'Cancelled' },
      rescheduled: { bg: '#eff6ff', color: '#1e40af', text: 'Rescheduled' }
    };
    const s = styles[status] || styles.scheduled;
    return (
      <span className="status-badge" style={{ background: s.bg, color: s.color }}>
        {s.text}
      </span>
    );
  };

  return (
    <div className="page-container meetings-page">
      <div className="meetings-header">
        <h1 className="page-title">Scheduled Meetings</h1>
        <p className="page-subtitle">View and manage your booked meetings.</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`filter-tab ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past
        </button>
      </div>

      {/* Meetings List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading meetings...</p>
        </div>
      ) : meetings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No {filter} meetings</h3>
          <p>{filter === 'upcoming' ? 'You don\'t have any upcoming meetings.' : 'No past meetings to show.'}</p>
        </div>
      ) : (
        <div className="meetings-list">
          {meetings.map(meeting => (
            <div key={meeting.id} className={`meeting-card ${meeting.status !== 'scheduled' ? 'meeting-inactive' : ''}`}>
              <div className="meeting-color" style={{ background: meeting.color || '#0069ff' }}></div>
              <div className="meeting-content">
                <div className="meeting-top">
                  <div className="meeting-info">
                    <div className="meeting-date-badge">
                      <span className="meeting-day">{formatDate(meeting.start_time, 'dd')}</span>
                      <span className="meeting-month">{formatDate(meeting.start_time, 'MMM')}</span>
                    </div>
                    <div>
                      <h4 className="meeting-event-name">{meeting.event_name}</h4>
                      <p className="meeting-invitee">
                        👤 {meeting.invitee_name} • {meeting.invitee_email}
                      </p>
                      <p className="meeting-time">
                        🕐 {getRelativeDate(meeting.start_time)} • {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
                      </p>
                      <p className="meeting-duration">{meeting.duration} minutes</p>
                    </div>
                  </div>
                  <div className="meeting-right">
                    {getStatusBadge(meeting.status)}
                  </div>
                </div>

                {meeting.status === 'scheduled' && filter === 'upcoming' && (
                  <div className="meeting-actions">
                    <button 
                      className="btn-reschedule"
                      onClick={() => setRescheduleModal(meeting)}
                    >
                      🔄 Reschedule
                    </button>
                    <button 
                      className="btn-cancel-meeting"
                      onClick={() => setCancelModal(meeting)}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}

                {meeting.status === 'cancelled' && meeting.cancel_reason && (
                  <p className="cancel-reason">Reason: {meeting.cancel_reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      <Modal 
        isOpen={!!cancelModal} 
        onClose={() => setCancelModal(null)} 
        title="Cancel Meeting"
        size="small"
      >
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>
          Are you sure you want to cancel the meeting with <strong>{cancelModal?.invitee_name}</strong>?
        </p>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">Reason (optional)</label>
          <textarea
            className="form-input"
            placeholder="Provide a reason for cancellation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={() => setCancelModal(null)}>Keep Meeting</button>
          <button className="btn-danger" onClick={handleCancel}>Cancel Meeting</button>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal 
        isOpen={!!rescheduleModal} 
        onClose={() => setRescheduleModal(null)} 
        title="Reschedule Meeting"
        size="small"
      >
        <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 16px' }}>
          Pick a new date and time for the meeting with <strong>{rescheduleModal?.invitee_name}</strong>.
        </p>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label">New Date & Time</label>
          <input
            type="datetime-local"
            className="form-input"
            value={newDateTime}
            onChange={(e) => setNewDateTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn-cancel" onClick={() => setRescheduleModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={handleReschedule} disabled={!newDateTime}>
            Reschedule
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Meetings;
