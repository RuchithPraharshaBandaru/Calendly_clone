/**
 * Event Types Routes
 * 
 * CRUD operations for event types (the different meeting types a user offers).
 * Examples: "30-minute meeting", "60-minute consultation", etc.
 * 
 * Each event type has a unique slug used for the public booking URL.
 * For example, slug "30-min-meeting" becomes /book/30-min-meeting
 * 
 * Why REST?: Standard convention, easy to understand, maps naturally
 * to CRUD operations. Alternative: GraphQL — overkill for this simple API.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * GET /api/event-types
 * List all event types for the default user (user_id = 1)
 */
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT et.*, as2.name as schedule_name
       FROM event_types et
       LEFT JOIN availability_schedules as2 ON et.schedule_id = as2.id
       WHERE et.user_id = 1
       ORDER BY et.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/event-types/:id
 * Get a single event type with its custom questions
 */
router.get('/:id', async (req, res, next) => {
  try {
    const [eventTypes] = await pool.query(
      'SELECT * FROM event_types WHERE id = ?',
      [req.params.id]
    );

    if (eventTypes.length === 0) {
      const err = new Error('Event type not found');
      err.status = 404;
      throw err;
    }

    // Also fetch custom questions
    const [questions] = await pool.query(
      'SELECT * FROM custom_questions WHERE event_type_id = ? ORDER BY sort_order',
      [req.params.id]
    );

    res.json({ ...eventTypes[0], questions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/event-types
 * Create a new event type
 * 
 * Auto-generates a slug from the name if not provided.
 * Slug is URL-safe: lowercase, spaces replaced with hyphens.
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description, duration, slug, color, buffer_before, buffer_after, schedule_id } = req.body;

    // Validate required fields
    if (!name || !duration) {
      const err = new Error('Name and duration are required');
      err.status = 400;
      throw err;
    }

    // Auto-generate slug from name if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [result] = await pool.query(
      `INSERT INTO event_types (user_id, name, description, duration, slug, color, buffer_before, buffer_after, schedule_id)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, duration, finalSlug, color || '#0069ff', buffer_before || 0, buffer_after || 0, schedule_id || null]
    );

    const [newEventType] = await pool.query('SELECT * FROM event_types WHERE id = ?', [result.insertId]);
    res.status(201).json(newEventType[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/event-types/:id
 * Update an existing event type
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, duration, slug, color, is_active, buffer_before, buffer_after, schedule_id } = req.body;

    const [existing] = await pool.query('SELECT * FROM event_types WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      const err = new Error('Event type not found');
      err.status = 404;
      throw err;
    }

    await pool.query(
      `UPDATE event_types SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        duration = COALESCE(?, duration),
        slug = COALESCE(?, slug),
        color = COALESCE(?, color),
        is_active = COALESCE(?, is_active),
        buffer_before = COALESCE(?, buffer_before),
        buffer_after = COALESCE(?, buffer_after),
        schedule_id = COALESCE(?, schedule_id)
      WHERE id = ?`,
      [name, description, duration, slug, color, is_active, buffer_before, buffer_after, schedule_id, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM event_types WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/event-types/:id
 * Delete an event type (cascading deletes meetings too)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const [existing] = await pool.query('SELECT * FROM event_types WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      const err = new Error('Event type not found');
      err.status = 404;
      throw err;
    }

    await pool.query('DELETE FROM event_types WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event type deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
