/**
 * Availability Page — Calendly-style
 * 
 * Matches Calendly's "Availability" page:
 * - Schedule selector dropdown
 * - Weekly hours grid with day circles + time inputs
 * - Date-specific overrides section
 * - Timezone selector
 */

import { useState, useEffect } from 'react';
import { getSchedules, getSchedule, updateSchedule, addDateOverride, deleteDateOverride } from '../api';
import Toast from '../components/Toast';
import './Availability.css';

const DAYS = [
  { key: 0, short: 'S', label: 'Sunday' },
  { key: 1, short: 'M', label: 'Monday' },
  { key: 2, short: 'T', label: 'Tuesday' },
  { key: 3, short: 'W', label: 'Wednesday' },
  { key: 4, short: 'T', label: 'Thursday' },
  { key: 5, short: 'F', label: 'Friday' },
  { key: 6, short: 'S', label: 'Saturday' }
];

function Availability() {
  const [schedules, setSchedules] = useState([]);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [scheduleDetail, setScheduleDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Override form
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideStart, setOverrideStart] = useState('');
  const [overrideEnd, setOverrideEnd] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (activeSchedule) fetchScheduleDetail(activeSchedule);
  }, [activeSchedule]);

  const fetchSchedules = async () => {
    try {
      const { data } = await getSchedules();
      setSchedules(data);
      if (data.length > 0) {
        setActiveSchedule(data.find(s => s.is_default)?.id || data[0].id);
      }
    } catch (error) {
      setToast({ message: 'Failed to load schedules', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleDetail = async (id) => {
    try {
      const { data } = await getSchedule(id);
      setScheduleDetail(data);
    } catch (error) {
      setToast({ message: 'Failed to load schedule', type: 'error' });
    }
  };

  const getRuleForDay = (dayNum) => {
    return scheduleDetail?.rules?.find(r => r.day_of_week === dayNum);
  };

  const toggleDay = async (dayNum) => {
    const rule = getRuleForDay(dayNum);
    let newRules;

    if (rule) {
      // Remove the rule (disable day)
      newRules = scheduleDetail.rules.filter(r => r.day_of_week !== dayNum);
    } else {
      // Add default rule (enable day)
      newRules = [...scheduleDetail.rules, { day_of_week: dayNum, start_time: '09:00:00', end_time: '17:00:00' }];
    }

    try {
      await updateSchedule(activeSchedule, { rules: newRules });
      fetchScheduleDetail(activeSchedule);
    } catch (error) {
      setToast({ message: 'Failed to update', type: 'error' });
    }
  };

  const updateTime = async (dayNum, field, value) => {
    const newRules = scheduleDetail.rules.map(r => {
      if (r.day_of_week === dayNum) {
        return { ...r, [field]: value + ':00' };
      }
      return r;
    });

    try {
      await updateSchedule(activeSchedule, { rules: newRules });
      fetchScheduleDetail(activeSchedule);
    } catch (error) {
      setToast({ message: 'Failed to update', type: 'error' });
    }
  };

  const handleAddOverride = async () => {
    if (!overrideDate) return;
    try {
      await addDateOverride(activeSchedule, {
        override_date: overrideDate,
        start_time: overrideStart || null,
        end_time: overrideEnd || null
      });
      setShowOverrideForm(false);
      setOverrideDate('');
      setOverrideStart('');
      setOverrideEnd('');
      fetchScheduleDetail(activeSchedule);
      setToast({ message: 'Override added', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to add override', type: 'error' });
    }
  };

  const handleDeleteOverride = async (id) => {
    try {
      await deleteDateOverride(id);
      fetchScheduleDetail(activeSchedule);
    } catch (error) {
      setToast({ message: 'Failed to delete override', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="availability-page">
        <h1>Availability</h1>
        <div className="meetings-empty"><div className="spinner"></div><p>Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="availability-page">
      <h1>Availability</h1>

      {/* Schedule Selector */}
      <div className="schedule-section">
        <p className="schedule-label">Schedule</p>
        <select
          className="schedule-select"
          value={activeSchedule || ''}
          onChange={(e) => setActiveSchedule(parseInt(e.target.value))}
        >
          {schedules.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.is_default ? '(default)' : ''}
            </option>
          ))}
        </select>
      </div>

      {scheduleDetail && (
        <>
          {/* Weekly Hours */}
          <div className="hours-section">
            <div className="hours-header">
              <div>
                <h3>Weekly hours</h3>
                <p className="hours-subtitle">Set when you are typically available for meetings</p>
              </div>
            </div>

            {DAYS.map(day => {
              const rule = getRuleForDay(day.key);
              const isActive = !!rule;

              return (
                <div key={day.key} className="day-row">
                  <div
                    className={`day-circle ${isActive ? 'active' : 'inactive'}`}
                    onClick={() => toggleDay(day.key)}
                    title={`Toggle ${day.label}`}
                  >
                    {day.short}
                  </div>

                  {isActive ? (
                    <div className="day-times">
                      <input
                        type="time"
                        className="time-input"
                        value={rule.start_time?.slice(0, 5)}
                        onChange={(e) => updateTime(day.key, 'start_time', e.target.value)}
                      />
                      <span className="time-separator">-</span>
                      <input
                        type="time"
                        className="time-input"
                        value={rule.end_time?.slice(0, 5)}
                        onChange={(e) => updateTime(day.key, 'end_time', e.target.value)}
                      />
                      <button className="day-action-btn" onClick={() => toggleDay(day.key)} title="Remove">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="day-unavailable">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Date Overrides */}
          <div className="overrides-section">
            <div className="overrides-header">
              <div>
                <h3>Date-specific hours</h3>
              </div>
              <button className="add-hours-btn" onClick={() => setShowOverrideForm(!showOverrideForm)}>
                + Hours
              </button>
            </div>

            {showOverrideForm && (
              <div className="override-form">
                <div className="override-form-row">
                  <label>Date:</label>
                  <input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} />
                  <label>From:</label>
                  <input type="time" value={overrideStart} onChange={(e) => setOverrideStart(e.target.value)} />
                  <label>To:</label>
                  <input type="time" value={overrideEnd} onChange={(e) => setOverrideEnd(e.target.value)} />
                  <button className="save-override-btn" onClick={handleAddOverride}>Save</button>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>
                  Leave times empty to mark the date as unavailable
                </p>
              </div>
            )}

            {scheduleDetail.overrides?.length > 0 ? (
              scheduleDetail.overrides.map(o => (
                <div key={o.id} className="override-row">
                  <span className="override-date">
                    {new Date(o.override_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="override-times">
                    {o.start_time && o.end_time
                      ? `${o.start_time.slice(0, 5)} - ${o.end_time.slice(0, 5)}`
                      : 'Unavailable (blocked)'}
                  </span>
                  <button className="override-remove" onClick={() => handleDeleteOverride(o.id)}>✕</button>
                </div>
              ))
            ) : (
              !showOverrideForm && <p className="override-empty">No date-specific hours set</p>
            )}
          </div>

          {/* Timezone */}
          <div className="timezone-section">
            <label>Timezone:</label>
            <select className="timezone-select" value={scheduleDetail.timezone} disabled>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Availability;
