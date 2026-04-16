/**
 * Booking Routes (Public)
 * 
 * These routes are accessed by invitees (public, no auth required).
 * The booking flow is:
 * 1. GET /api/booking/:slug — Load event type details
 * 2. GET /api/booking/:slug/slots?date=YYYY-MM-DD — Get available slots for a date
 * 3. POST /api/booking/:slug — Book a time slot
 * 
 * Double-booking prevention uses a MySQL transaction with row-level
 * locking (SELECT ... FOR UPDATE) to ensure two simultaneous requests
 * can't book the same slot.
 * 
 * Alternative: Optimistic locking with version column — more complex,
 * MySQL transactions are simpler and sufficient here.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { generateAvailableSlots } = require('../utils/slotGenerator');
const { sendBookingConfirmation } = require('../utils/email');

/**
 * GET /api/booking/:slug
 * Get event type details by slug (public page)
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const [eventTypes] = await pool.query(
      `SELECT et.*, u.name as user_name, u.email as user_email
       FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE et.slug = ? AND et.is_active = 1`,
      [req.params.slug]
    );

    if (eventTypes.length === 0) {
      const err = new Error('Event type not found');
      err.status = 404;
      throw err;
    }

    // Also get custom questions
    const [questions] = await pool.query(
      'SELECT * FROM custom_questions WHERE event_type_id = ? ORDER BY sort_order',
      [eventTypes[0].id]
    );

    res.json({ ...eventTypes[0], questions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/booking/:slug/slots?date=YYYY-MM-DD
 * Get available time slots for a specific date
 */
router.get('/:slug/slots', async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      const err = new Error('Date parameter is required (format: YYYY-MM-DD)');
      err.status = 400;
      throw err;
    }

    const result = await generateAvailableSlots(req.params.slug, date);

    if (result.error) {
      const err = new Error(result.error);
      err.status = 404;
      throw err;
    }

    res.json({
      date,
      slots: result.slots,
      eventType: {
        name: result.eventType.name,
        duration: result.eventType.duration
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/booking/:slug
 * Book a meeting
 * 
 * Uses MySQL transaction to prevent double booking:
 * 1. Start transaction
 * 2. Lock overlapping meeting rows (SELECT ... FOR UPDATE)
 * 3. If no conflicts, insert the new meeting
 * 4. Commit transaction
 */
router.post('/:slug', async (req, res, next) => {
  const connection = await pool.getConnection();
  
  try {
    const { invitee_name, invitee_email, start_time, answers } = req.body;

    // Validate required fields
    if (!invitee_name || !invitee_email || !start_time) {
      const err = new Error('Invitee name, email, and start time are required');
      err.status = 400;
      throw err;
    }

    // Get event type
    const [eventTypes] = await connection.query(
      `SELECT et.*, u.name as user_name FROM event_types et
       JOIN users u ON et.user_id = u.id
       WHERE et.slug = ? AND et.is_active = 1`,
      [req.params.slug]
    );

    if (eventTypes.length === 0) {
      const err = new Error('Event type not found');
      err.status = 404;
      throw err;
    }

    const eventType = eventTypes[0];
    const meetingStart = new Date(start_time);
    const meetingEnd = new Date(meetingStart.getTime() + eventType.duration * 60000);

    // Begin transaction for double-booking prevention
    await connection.beginTransaction();

    try {
      // Check for overlapping meetings (with buffer) using row-level lock
      const [conflicts] = await connection.query(
        `SELECT id FROM meetings 
         WHERE event_type_id IN (SELECT id FROM event_types WHERE user_id = ?)
         AND status != 'cancelled'
         AND start_time < ? AND end_time > ?
         FOR UPDATE`,
        [eventType.user_id, meetingEnd, meetingStart]
      );

      if (conflicts.length > 0) {
        await connection.rollback();
        const err = new Error('This time slot is no longer available');
        err.status = 409;
        return res.status(409).json({ error: 'Conflict', message: err.message });
      }

      // Insert the meeting
      const [result] = await connection.query(
        `INSERT INTO meetings (event_type_id, invitee_name, invitee_email, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, 'scheduled')`,
        [eventType.id, invitee_name, invitee_email, meetingStart, meetingEnd]
      );

      const meetingId = result.insertId;

      // Insert answers to custom questions
      if (answers && answers.length > 0) {
        const answerValues = answers.map(a => [meetingId, a.question_id, a.answer_text]);
        await connection.query(
          'INSERT INTO meeting_answers (meeting_id, question_id, answer_text) VALUES ?',
          [answerValues]
        );
      }

      await connection.commit();

      // Send confirmation email (non-blocking)
      const meeting = { invitee_name, invitee_email, start_time: meetingStart };
      sendBookingConfirmation(meeting, { ...eventType, userName: eventType.user_name })
        .catch(err => console.error('Failed to send email:', err.message));

      // Return the created meeting
      const [newMeeting] = await connection.query(
        'SELECT * FROM meetings WHERE id = ?',
        [meetingId]
      );

      res.status(201).json({
        meeting: newMeeting[0],
        eventType: {
          name: eventType.name,
          duration: eventType.duration,
          user_name: eventType.user_name
        }
      });
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
