/**
 * Date Utility Functions
 * 
 * Helper functions for date formatting and manipulation.
 * Uses the date-fns library which is much lighter than Moment.js
 * (Moment.js is 300KB+, date-fns is tree-shakeable and only imports what you use).
 * 
 * Alternative: Native Intl.DateTimeFormat — works but has inconsistent
 * browser support for some formatting options. date-fns is more reliable.
 */

import { format, parseISO, isToday, isTomorrow, isPast, isBefore, addDays } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param {string} dateStr - ISO date string
 * @param {string} formatStr - date-fns format string
 * @returns {string} Formatted date
 */
export function formatDate(dateStr, formatStr = 'EEEE, MMMM d, yyyy') {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, formatStr);
}

/**
 * Format time from ISO string
 * @param {string} dateStr - ISO date string  
 * @returns {string} Time like "9:00 AM"
 */
export function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, 'h:mm a');
}

/**
 * Format a time string (HH:mm) for display
 * @param {string} timeStr - Time like "09:00" or "14:30"
 * @returns {string} Time like "9:00 AM" or "2:30 PM"
 */
export function formatTimeSlot(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Get a relative date label
 * @param {string} dateStr - ISO date string
 * @returns {string} "Today", "Tomorrow", or formatted date
 */
export function getRelativeDate(dateStr) {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEEE, MMMM d');
}

/**
 * Check if a date is in the past
 */
export function isDatePast(dateStr) {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return isPast(date);
}

/**
 * Check if a date is before today (not just past the current time)
 */
export function isDateBeforeToday(dateStr) {
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isBefore(date, today);
}

/**
 * Get the next N days starting from today
 * @param {number} n - Number of days
 * @returns {Date[]} Array of Date objects
 */
export function getNextDays(n) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    days.push(addDays(today, i));
  }
  return days;
}

/**
 * Format date to YYYY-MM-DD for API requests
 */
export function toDateString(date) {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Day names for display
 */
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
