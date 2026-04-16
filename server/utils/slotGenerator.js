/**
 * Slot Generation Utility
 * 
 * Generates available time slots for a given date based on:
 * 1. Weekly availability rules (which days/hours the user is available)
 * 2. Date-specific overrides (special hours or blocked dates)
 * 3. Existing meetings (to prevent double booking)
 * 4. Buffer time before/after meetings
 * 
 * Algorithm:
 * - Get the day of week for the requested date
 * - Check for date overrides first (they take priority)
 * - Fall back to weekly rules if no override exists
 * - Generate slots at intervals matching event duration
 * - Filter out slots that conflict with existing meetings + buffer
 * - Filter out slots in the past
 * 
 * Alternative considered: Using a calendar library like FullCalendar —
 * rejected because custom slot generation gives more control and 
 * demonstrates algorithmic thinking.
 */

const { pool } = require('../config/db');

/**
 * Generate available time slots for a given date and event type
 * @param {string} slug - Event type URL slug
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {Array} Array of available time slot strings (e.g., ["09:00", "09:30"])
 */
async function generateAvailableSlots(slug, dateStr) {
  const connection = await pool.getConnection();
  
  try {
    // 1. Get event type details (duration, buffer times, schedule)
    const [eventTypes] = await connection.query(
      `SELECT et.*, COALESCE(et.schedule_id, 
        (SELECT id FROM availability_schedules WHERE user_id = et.user_id AND is_default = 1 LIMIT 1)
      ) as effective_schedule_id
      FROM event_types et WHERE et.slug = ? AND et.is_active = 1`,
      [slug]
    );

    if (eventTypes.length === 0) {
      return { error: 'Event type not found', slots: [] };
    }

    const eventType = eventTypes[0];
    const { duration, buffer_before, buffer_after, effective_schedule_id } = eventType;

    if (!effective_schedule_id) {
      return { error: 'No availability schedule configured', slots: [] };
    }

    // 2. Parse the requested date
    const requestedDate = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay(); // 0=Sun, 6=Sat

    // 3. Check for date-specific overrides first
    const [overrides] = await connection.query(
      'SELECT * FROM date_overrides WHERE schedule_id = ? AND override_date = ?',
      [effective_schedule_id, dateStr]
    );

    let timeRanges = [];

    if (overrides.length > 0) {
      // Use override times (if start_time is null, user is unavailable that day)
      for (const override of overrides) {
        if (override.start_time && override.end_time) {
          timeRanges.push({
            start: override.start_time,
            end: override.end_time
          });
        }
      }
      // If all overrides have null times, the day is blocked
      if (timeRanges.length === 0) {
        return { slots: [], eventType };
      }
    } else {
      // 4. Fall back to weekly availability rules
      const [rules] = await connection.query(
        'SELECT * FROM availability_rules WHERE schedule_id = ? AND day_of_week = ?',
        [effective_schedule_id, dayOfWeek]
      );

      if (rules.length === 0) {
        return { slots: [], eventType }; // Not available on this day
      }

      timeRanges = rules.map(rule => ({
        start: rule.start_time,
        end: rule.end_time
      }));
    }

    // 5. Get existing meetings for this date (to avoid conflicts)
    const [meetings] = await connection.query(
      `SELECT start_time, end_time FROM meetings 
       WHERE event_type_id IN (SELECT id FROM event_types WHERE user_id = ?)
       AND DATE(start_time) = ?
       AND status != 'cancelled'`,
      [eventType.user_id, dateStr]
    );

    // 6. Generate slots from each time range
    const slots = [];
    const now = new Date();

    for (const range of timeRanges) {
      // Parse time strings like "09:00:00" into hours and minutes
      const [startH, startM] = range.start.split(':').map(Number);
      const [endH, endM] = range.end.split(':').map(Number);

      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (currentMinutes + duration <= endMinutes) {
        const slotStartH = Math.floor(currentMinutes / 60);
        const slotStartM = currentMinutes % 60;
        const slotEndMinutes = currentMinutes + duration;
        const slotEndH = Math.floor(slotEndMinutes / 60);
        const slotEndM = slotEndMinutes % 60;

        const slotStart = new Date(requestedDate);
        slotStart.setHours(slotStartH, slotStartM, 0, 0);

        const slotEnd = new Date(requestedDate);
        slotEnd.setHours(slotEndH, slotEndM, 0, 0);

        // Skip slots in the past
        if (slotStart <= now) {
          currentMinutes += duration;
          continue;
        }

        // Check for conflicts with existing meetings (including buffer)
        const hasConflict = meetings.some(meeting => {
          const meetingStart = new Date(meeting.start_time);
          const meetingEnd = new Date(meeting.end_time);

          // Add buffer time around the meeting
          const bufferedStart = new Date(meetingStart.getTime() - buffer_before * 60000);
          const bufferedEnd = new Date(meetingEnd.getTime() + buffer_after * 60000);

          // Check overlap: slot overlaps if it starts before meeting ends AND ends after meeting starts
          return slotStart < bufferedEnd && slotEnd > bufferedStart;
        });

        if (!hasConflict) {
          slots.push({
            time: `${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`,
            datetime: slotStart.toISOString()
          });
        }

        currentMinutes += duration;
      }
    }

    return { slots, eventType };
  } finally {
    connection.release();
  }
}

module.exports = { generateAvailableSlots };
