/**
 * Meetings Routes (Admin)
 * 
 * View, cancel, and reschedule meetings. These routes are for the
 * admin side (the user managing their calendar).
 * 
 * Meetings can be filtered by upcoming/past and include event type
 * details for display.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { sendCancellationEmail } = require('../utils/email');

/**
 * GET /api/meetings?filter=upcoming|past
 * List meetings with optional filter
 */
router.get('/', async (req, res, next) => {
  try {
    const { filter } = req.query;
    let whereClause = 'WHERE et.user_id = 1';
    let orderClause = 'ORDER BY m.start_time ASC';

    if (filter === 'upcoming') {
      whereClause += ` AND m.start_time > NOW() AND m.status = 'scheduled'`;
    } else if (filter === 'past') {
      whereClause += ` AND (m.start_time <= NOW() OR m.status != 'scheduled')`;
      orderClause = 'ORDER BY m.start_time DESC';
    }

    const [meetings] = await pool.query(
      `SELECT m.*, et.name as event_name, et.duration, et.color, et.slug
       FROM meetings m
       JOIN event_types et ON m.event_type_id = et.id
       ${whereClause}
       ${orderClause}`
    );

    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/:id
 * Get a single meeting with all details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const [meetings] = await pool.query(
      `SELECT m.*, et.name as event_name, et.duration, et.color, et.slug,
              u.name as user_name, u.email as user_email
       FROM meetings m
       JOIN event_types et ON m.event_type_id = et.id
       JOIN users u ON et.user_id = u.id
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (meetings.length === 0) {
      const err = new Error('Meeting not found');
      err.status = 404;
      throw err;
    }

    // Get answers to custom questions
    const [answers] = await pool.query(
      `SELECT ma.*, cq.question_text, cq.question_type
       FROM meeting_answers ma
       JOIN custom_questions cq ON ma.question_id = cq.id
       WHERE ma.meeting_id = ?`,
      [req.params.id]
    );

    res.json({ ...meetings[0], answers });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/meetings/:id/cancel
 * Cancel a meeting
 */
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const { cancel_reason } = req.body;

    const [meetings] = await pool.query(
      `SELECT m.*, et.name as event_name, et.duration, u.name as user_name
       FROM meetings m
       JOIN event_types et ON m.event_type_id = et.id
       JOIN users u ON et.user_id = u.id
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (meetings.length === 0) {
      const err = new Error('Meeting not found');
      err.status = 404;
      throw err;
    }

    await pool.query(
      `UPDATE meetings SET status = 'cancelled', cancel_reason = ? WHERE id = ?`,
      [cancel_reason || null, req.params.id]
    );

    // Send cancellation email (non-blocking)
    const meeting = meetings[0];
    sendCancellationEmail(
      { ...meeting, cancel_reason },
      { name: meeting.event_name, duration: meeting.duration, userName: meeting.user_name }
    ).catch(err => console.error('Failed to send cancellation email:', err.message));

    res.json({ message: 'Meeting cancelled successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/meetings/:id/reschedule
 * Reschedule a meeting to a new time
 * 
 * This cancels the old meeting and creates a new one at the new time.
 * We keep the rescheduled status on the old meeting for history.
 */
router.put('/:id/reschedule', async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { new_start_time } = req.body;

    if (!new_start_time) {
      const err = new Error('New start time is required');
      err.status = 400;
      throw err;
    }

    const [meetings] = await connection.query(
      `SELECT m.*, et.duration, et.user_id, et.id as event_type_id
       FROM meetings m
       JOIN event_types et ON m.event_type_id = et.id
       WHERE m.id = ?`,
      [req.params.id]
    );

    if (meetings.length === 0) {
      const err = new Error('Meeting not found');
      err.status = 404;
      throw err;
    }

    const oldMeeting = meetings[0];
    const newStart = new Date(new_start_time);
    const newEnd = new Date(newStart.getTime() + oldMeeting.duration * 60000);

    await connection.beginTransaction();

    try {
      // Check for conflicts at new time
      const [conflicts] = await connection.query(
        `SELECT id FROM meetings 
         WHERE event_type_id IN (SELECT id FROM event_types WHERE user_id = ?)
         AND id != ?
         AND status != 'cancelled'
         AND start_time < ? AND end_time > ?
         FOR UPDATE`,
        [oldMeeting.user_id, req.params.id, newEnd, newStart]
      );

      if (conflicts.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Conflict', message: 'The new time slot is not available' });
      }

      // Mark old meeting as rescheduled
      await connection.query(
        `UPDATE meetings SET status = 'rescheduled' WHERE id = ?`,
        [req.params.id]
      );

      // Create new meeting at new time
      const [result] = await connection.query(
        `INSERT INTO meetings (event_type_id, invitee_name, invitee_email, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, 'scheduled')`,
        [oldMeeting.event_type_id, oldMeeting.invitee_name, oldMeeting.invitee_email, newStart, newEnd]
      );

      await connection.commit();

      const [newMeeting] = await connection.query('SELECT * FROM meetings WHERE id = ?', [result.insertId]);
      res.json({ message: 'Meeting rescheduled successfully', meeting: newMeeting[0] });
    } catch (innerError) {
      await connection.rollback();
      throw innerError;
    }
  } catch (error) {
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
