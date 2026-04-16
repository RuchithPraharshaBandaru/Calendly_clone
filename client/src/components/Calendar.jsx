/**
 * Calendar Component
 * 
 * A month-view calendar for selecting dates on the public booking page.
 * Mimics Calendly's clean calendar design with:
 * - Month/year header with navigation arrows
 * - Day-of-week headers
 * - Clickable date cells
 * - Disabled past dates and unavailable days
 * 
 * Built from scratch instead of using a library like react-calendar
 * because the requirements are simple and a custom component gives
 * full control over styling to match Calendly's design.
 */

import { useState } from 'react';
import { MONTH_NAMES, SHORT_DAY_NAMES } from '../utils/dateUtils';
import './Calendar.css';

function Calendar({ selectedDate, onDateSelect, availableDays = null }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Get the first day of the month (0=Sun, 6=Sat)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Get total days in the month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Navigate to previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check if a date is in the past
  const isPast = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return date < today;
  };

  // Check if a day is available (based on day-of-week availability)
  const isAvailable = (day) => {
    if (isPast(day)) return false;
    if (!availableDays) return true; // If no availability data, all future days are clickable
    const date = new Date(currentYear, currentMonth, day);
    const dayOfWeek = date.getDay();
    return availableDays.includes(dayOfWeek);
  };

  // Check if this is the selected date
  const isSelected = (day) => {
    if (!selectedDate) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === selectedDate.toDateString();
  };

  // Check if this is today
  const isToday = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.toDateString() === today.toDateString();
  };

  // Can go back only if current month is current or future month
  const canGoPrev = currentYear > today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());

  // Build calendar grid
  const calendarDays = [];
  
  // Empty cells before the first day
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  // Actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const available = isAvailable(day);
    const selected = isSelected(day);
    const todayClass = isToday(day);
    
    calendarDays.push(
      <button
        key={day}
        className={`calendar-day ${available ? 'available' : 'disabled'} ${selected ? 'selected' : ''} ${todayClass ? 'today' : ''}`}
        onClick={() => available && onDateSelect(new Date(currentYear, currentMonth, day))}
        disabled={!available}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button 
          className="calendar-nav" 
          onClick={prevMonth} 
          disabled={!canGoPrev}
        >
          ‹
        </button>
        <h3 className="calendar-month">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h3>
        <button className="calendar-nav" onClick={nextMonth}>
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {SHORT_DAY_NAMES.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays}
      </div>
    </div>
  );
}

export default Calendar;
