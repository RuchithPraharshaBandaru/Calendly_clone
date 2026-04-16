/**
 * Availability Page (Admin)
 * 
 * Manage availability schedules — set which days/hours are available
 * for booking. Supports multiple schedules and date-specific overrides.
 * 
 * Layout: A schedule selector at top, then a weekly grid with day toggles
 * and time pickers, and a date overrides section below.
 * 
 * Why a weekly grid? Calendly uses this pattern — it's intuitive because
 * most people have a weekly routine. Date overrides handle exceptions.
 */

import { useState, useEffect } from 'react';
import { getSchedules, getSchedule, updateSchedule, createSchedule, addDateOverride, deleteDateOverride } from '../api';
import Toast from '../components/Toast';
import { DAY_NAMES } from '../utils/dateUtils';
import './Availability.css';

const DEFAULT_RULES = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  enabled: i >= 1 && i <= 5, // Mon-Fri enabled by default
  start_time: '09:00',
  end_time: '17:00'
}));

function Availability() {
  const [schedules, setSchedules] = useState([]);
  const [activeScheduleId, setActiveScheduleId] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [scheduleName, setScheduleName] = useState('Working Hours');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Date override state
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideStart, setOverrideStart] = useState('');
  const [overrideEnd, setOverrideEnd] = useState('');
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data } = await getSchedules();
      setSchedules(data);
      if (data.length > 0) {
        const defaultSchedule = data.find(s => s.is_default) || data[0];
        setActiveScheduleId(defaultSchedule.id);
        await fetchScheduleDetail(defaultSchedule.id);
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
      setScheduleData(data);
      setScheduleName(data.name);
      setTimezone(data.timezone);
      
      // Convert rules from DB format to UI format
      const uiRules = DAY_NAMES.map((_, dayIndex) => {
        const dbRule = data.rules?.find(r => r.day_of_week === dayIndex);
        return {
          day_of_week: dayIndex,
          enabled: !!dbRule,
          start_time: dbRule ? dbRule.start_time.substring(0, 5) : '09:00',
          end_time: dbRule ? dbRule.end_time.substring(0, 5) : '17:00'
        };
      });
      setRules(uiRules);
    } catch (error) {
      setToast({ message: 'Failed to load schedule details', type: 'error' });
    }
  };

  const handleScheduleChange = async (id) => {
    setActiveScheduleId(id);
    setLoading(true);
    await fetchScheduleDetail(id);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert UI rules back to DB format (only enabled days)
      const dbRules = rules
        .filter(r => r.enabled)
        .map(r => ({
          day_of_week: r.day_of_week,
          start_time: r.start_time + ':00',
          end_time: r.end_time + ':00'
        }));

      await updateSchedule(activeScheduleId, {
        name: scheduleName,
        timezone,
        rules: dbRules
      });

      setToast({ message: 'Availability saved!', type: 'success' });
      fetchSchedules();
    } catch (error) {
      setToast({ message: 'Failed to save availability', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      const { data } = await createSchedule({
        name: 'New Schedule',
        timezone: 'Asia/Kolkata',
        rules: [
          { day_of_week: 1, start_time: '09:00:00', end_time: '17:00:00' },
          { day_of_week: 2, start_time: '09:00:00', end_time: '17:00:00' },
          { day_of_week: 3, start_time: '09:00:00', end_time: '17:00:00' },
          { day_of_week: 4, start_time: '09:00:00', end_time: '17:00:00' },
          { day_of_week: 5, start_time: '09:00:00', end_time: '17:00:00' }
        ]
      });
      setSchedules(prev => [...prev, data]);
      setActiveScheduleId(data.id);
      await fetchScheduleDetail(data.id);
      setToast({ message: 'New schedule created!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to create schedule', type: 'error' });
    }
  };

  const handleAddOverride = async () => {
    if (!overrideDate) {
      setToast({ message: 'Please select a date', type: 'error' });
      return;
    }

    try {
      const payload = {
        override_date: overrideDate,
        start_time: isUnavailable ? null : (overrideStart || null),
        end_time: isUnavailable ? null : (overrideEnd || null)
      };
      
      await addDateOverride(activeScheduleId, payload);
      await fetchScheduleDetail(activeScheduleId);
      setOverrideDate('');
      setOverrideStart('');
      setOverrideEnd('');
      setIsUnavailable(false);
      setToast({ message: 'Date override added!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to add override', type: 'error' });
    }
  };

  const handleDeleteOverride = async (id) => {
    try {
      await deleteDateOverride(id);
      await fetchScheduleDetail(activeScheduleId);
      setToast({ message: 'Override removed', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to remove override', type: 'error' });
    }
  };

  const toggleDay = (dayIndex) => {
    setRules(prev => prev.map(r => 
      r.day_of_week === dayIndex ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const updateTime = (dayIndex, field, value) => {
    setRules(prev => prev.map(r => 
      r.day_of_week === dayIndex ? { ...r, [field]: value } : r
    ));
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="availability-header">
        <div>
          <h1 className="page-title">Availability</h1>
          <p className="page-subtitle">Set when you're available for meetings.</p>
        </div>
        <button className="btn-primary" onClick={handleCreateSchedule}>
          + New Schedule
        </button>
      </div>

      {/* Schedule Selector */}
      <div className="schedule-tabs">
        {schedules.map(s => (
          <button
            key={s.id}
            className={`schedule-tab ${activeScheduleId === s.id ? 'active' : ''}`}
            onClick={() => handleScheduleChange(s.id)}
          >
            {s.name} {s.is_default ? '⭐' : ''}
          </button>
        ))}
      </div>

      {/* Schedule Name & Timezone */}
      <div className="availability-section">
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Schedule Name</label>
            <input
              type="text"
              className="form-input"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Timezone</label>
            <select
              className="form-input"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Weekly Hours */}
      <div className="availability-section">
        <h3 className="section-title">Weekly Hours</h3>
        <div className="weekly-grid">
          {rules.map(rule => (
            <div key={rule.day_of_week} className={`day-row ${rule.enabled ? '' : 'disabled'}`}>
              <label className="day-toggle">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleDay(rule.day_of_week)}
                />
                <span className="day-name">{DAY_NAMES[rule.day_of_week]}</span>
              </label>
              
              {rule.enabled ? (
                <div className="time-range">
                  <input
                    type="time"
                    className="time-input"
                    value={rule.start_time}
                    onChange={(e) => updateTime(rule.day_of_week, 'start_time', e.target.value)}
                  />
                  <span className="time-separator">—</span>
                  <input
                    type="time"
                    className="time-input"
                    value={rule.end_time}
                    onChange={(e) => updateTime(rule.day_of_week, 'end_time', e.target.value)}
                  />
                </div>
              ) : (
                <span className="unavailable-text">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Date Overrides */}
      <div className="availability-section">
        <h3 className="section-title">Date-Specific Hours</h3>
        <p className="section-desc">Override your availability for specific dates (e.g. holidays, special hours).</p>

        {/* Existing overrides */}
        {scheduleData?.overrides?.length > 0 && (
          <div className="overrides-list">
            {scheduleData.overrides.map(o => (
              <div key={o.id} className="override-item">
                <div>
                  <span className="override-date">
                    {new Date(o.override_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="override-time">
                    {o.start_time ? `${o.start_time.substring(0, 5)} - ${o.end_time.substring(0, 5)}` : 'Unavailable'}
                  </span>
                </div>
                <button className="override-delete" onClick={() => handleDeleteOverride(o.id)}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Add override form */}
        <div className="add-override">
          <input
            type="date"
            className="form-input"
            value={overrideDate}
            onChange={(e) => setOverrideDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isUnavailable}
              onChange={(e) => setIsUnavailable(e.target.checked)}
            />
            Unavailable
          </label>
          {!isUnavailable && (
            <>
              <input
                type="time"
                className="time-input"
                value={overrideStart}
                onChange={(e) => setOverrideStart(e.target.value)}
              />
              <span>to</span>
              <input
                type="time"
                className="time-input"
                value={overrideEnd}
                onChange={(e) => setOverrideEnd(e.target.value)}
              />
            </>
          )}
          <button className="btn-secondary" onClick={handleAddOverride}>
            + Add Override
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="save-bar">
        <button className="btn-primary save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default Availability;
