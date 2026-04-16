/**
 * TimeSlots Component
 * 
 * Displays available time slots for a selected date.
 * Each slot is a clickable button that, when clicked, shows a
 * "Confirm" button (matching Calendly's two-step selection UX).
 * 
 * This two-step pattern (select → confirm) reduces accidental bookings,
 * which is why Calendly uses it.
 */

import { formatTimeSlot } from '../utils/dateUtils';
import './TimeSlots.css';

function TimeSlots({ slots, selectedSlot, onSlotSelect, onConfirm, loading }) {
  if (loading) {
    return (
      <div className="time-slots">
        <div className="slots-loading">
          <div className="spinner"></div>
          <p>Loading available times...</p>
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="time-slots">
        <div className="no-slots">
          <span className="no-slots-icon">📅</span>
          <p>No available times for this date</p>
        </div>
      </div>
    );
  }

  return (
    <div className="time-slots">
      <h4 className="slots-title">Select a Time</h4>
      <div className="slots-list">
        {slots.map((slot) => (
          <div key={slot.time} className="slot-item">
            {selectedSlot === slot.time ? (
              <div className="slot-confirm-row">
                <button
                  className="slot-button slot-selected"
                  onClick={() => onSlotSelect(null)}
                >
                  {formatTimeSlot(slot.time)}
                </button>
                <button
                  className="slot-confirm-button"
                  onClick={() => onConfirm(slot)}
                >
                  Confirm
                </button>
              </div>
            ) : (
              <button
                className="slot-button"
                onClick={() => onSlotSelect(slot.time)}
              >
                {formatTimeSlot(slot.time)}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TimeSlots;
