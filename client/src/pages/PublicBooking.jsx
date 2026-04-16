/**
 * Public Booking Page
 * 
 * The public-facing page where invitees book a meeting.
 * Accessible at /book/:slug (no login required).
 * 
 * Flow (matching Calendly's UX):
 * 1. Show event type info + calendar
 * 2. User selects a date → available time slots appear
 * 3. User selects a time → clicks "Confirm" 
 * 4. Booking form appears → user enters name, email, answers questions
 * 5. User submits → redirected to confirmation page
 * 
 * The side-by-side layout (info | calendar | slots) matches
 * Calendly's actual booking page design.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventBySlug, getAvailableSlots, bookMeeting } from '../api';
import Calendar from '../components/Calendar';
import TimeSlots from '../components/TimeSlots';
import BookingForm from '../components/BookingForm';
import Toast from '../components/Toast';
import { toDateString, formatTimeSlot } from '../utils/dateUtils';
import './PublicBooking.css';

function PublicBooking() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [eventType, setEventType] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  // Fetch event type details on mount
  useEffect(() => {
    fetchEventType();
  }, [slug]);

  const fetchEventType = async () => {
    try {
      const { data } = await getEventBySlug(slug);
      setEventType(data);
    } catch (error) {
      setError('Event type not found');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available slots when date changes
  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setShowForm(false);
    setSlotsLoading(true);

    try {
      const { data } = await getAvailableSlots(slug, toDateString(date));
      setSlots(data.slots);
    } catch (error) {
      setSlots([]);
      setToast({ message: 'Failed to load time slots', type: 'error' });
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSlotConfirm = (slot) => {
    setConfirmedSlot(slot);
    setShowForm(true);
  };

  const handleBooking = async (formData) => {
    setBookingLoading(true);
    try {
      const { data } = await bookMeeting(slug, formData);
      
      // Navigate to confirmation page with meeting details
      navigate('/booking/confirmation', { 
        state: { 
          meeting: data.meeting, 
          eventType: data.eventType 
        } 
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to book meeting';
      setToast({ message: msg, type: 'error' });
    } finally {
      setBookingLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="error-state">
            <span className="error-icon">😕</span>
            <h2>Event Not Found</h2>
            <p>The booking page you're looking for doesn't exist or has been deactivated.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        {showForm ? (
          /* Step 3: Booking Form */
          <BookingForm
            eventType={eventType}
            selectedDate={selectedDate}
            selectedTime={confirmedSlot?.time ? formatTimeSlot(confirmedSlot.time) : ''}
            selectedDatetime={confirmedSlot?.datetime || ''}
            onSubmit={handleBooking}
            onBack={() => setShowForm(false)}
            loading={bookingLoading}
          />
        ) : (
          /* Step 1 & 2: Calendar + Time Slots */
          <div className="booking-layout">
            {/* Left: Event Info */}
            <div className="booking-info">
              <div className="booking-info-color" style={{ background: eventType.color || '#0069ff' }}></div>
              <p className="booking-host">{eventType.user_name}</p>
              <h2 className="booking-event-name">{eventType.name}</h2>
              <div className="booking-meta">
                <span className="meta-item">🕐 {eventType.duration} min</span>
                {eventType.description && (
                  <p className="booking-description">{eventType.description}</p>
                )}
              </div>
            </div>

            {/* Center: Calendar */}
            <div className="booking-calendar">
              <h3 className="booking-section-title">Select a Date & Time</h3>
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </div>

            {/* Right: Time Slots (shown when date is selected) */}
            {selectedDate && (
              <div className="booking-slots">
                <p className="slots-date-label">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <TimeSlots
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSlotSelect={setSelectedSlot}
                  onConfirm={handleSlotConfirm}
                  loading={slotsLoading}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default PublicBooking;
