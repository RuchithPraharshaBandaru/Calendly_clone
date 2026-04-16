/**
 * Availability Routes
 * 
 * Manages availability schedules, weekly rules, and date overrides.
 * 
 * A schedule contains rules (e.g., Mon-Fri 9AM-5PM) and optional
 * date overrides (e.g., Dec 25 = unavailable, Jan 2 = 10AM-2PM).
 * 
 * Multiple schedules are supported so a user can have "Working Hours"
 * and "Extended Hours" and assign different schedules to different event types.
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * GET /api/availability
 * List all availability schedules for the default user
 */
router.get('/', async (req, res, next) => {
  try {
    const [schedules] = await pool.query(
      'SELECT * FROM availability_schedules WHERE user_id = 1 ORDER BY is_default DESC, created_at ASC'
    );
    res.json(schedules);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/availability/:id
 * Get a schedule with all its rules and overrides
 */
router.get('/:id', async (req, res, next) => {
  try {
    const [schedules] = await pool.query(
      'SELECT * FROM availability_schedules WHERE id = ?',
      [req.params.id]
    );

    if (schedules.length === 0) {
      const err = new Error('Schedule not found');
      err.status = 404;
      throw err;
    }

    // Get weekly rules grouped by day
    const [rules] = await pool.query(
      'SELECT * FROM availability_rules WHERE schedule_id = ? ORDER BY day_of_week, start_time',
      [req.params.id]
    );

    // Get date overrides
    const [overrides] = await pool.query(
      'SELECT * FROM date_overrides WHERE schedule_id = ? ORDER BY override_date',
      [req.params.id]
    );

    res.json({
      ...schedules[0],
      rules,
      overrides
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/availability
 * Create a new availability schedule
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, timezone, is_default, rules } = req.body;

    // If this is set as default, unset other defaults
    if (is_default) {
      await pool.query(
        'UPDATE availability_schedules SET is_default = 0 WHERE user_id = 1'
      );
    }

    const [result] = await pool.query(
      'INSERT INTO availability_schedules (user_id, name, timezone, is_default) VALUES (1, ?, ?, ?)',
      [name || 'Working Hours', timezone || 'Asia/Kolkata', is_default ? 1 : 0]
    );

    const scheduleId = result.insertId;

    // Insert rules if provided
    if (rules && rules.length > 0) {
      const ruleValues = rules.map(r => [scheduleId, r.day_of_week, r.start_time, r.end_time]);
      await pool.query(
        'INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time) VALUES ?',
        [ruleValues]
      );
    }

    // Fetch the complete schedule
    const [newSchedule] = await pool.query('SELECT * FROM availability_schedules WHERE id = ?', [scheduleId]);
    const [newRules] = await pool.query('SELECT * FROM availability_rules WHERE schedule_id = ?', [scheduleId]);

    res.status(201).json({ ...newSchedule[0], rules: newRules });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/availability/:id
 * Update schedule and its rules
 * 
 * Rules are replaced entirely (delete all, then insert new ones).
 * This is simpler than tracking individual rule changes and works
 * well because the full schedule form is submitted at once.
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, timezone, is_default, rules } = req.body;

    const [existing] = await pool.query(
      'SELECT * FROM availability_schedules WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      const err = new Error('Schedule not found');
      err.status = 404;
      throw err;
    }

    // If setting as default, unset others
    if (is_default) {
      await pool.query('UPDATE availability_schedules SET is_default = 0 WHERE user_id = 1');
    }

    await pool.query(
      `UPDATE availability_schedules SET 
        name = COALESCE(?, name),
        timezone = COALESCE(?, timezone),
        is_default = COALESCE(?, is_default)
      WHERE id = ?`,
      [name, timezone, is_default, req.params.id]
    );

    // Replace rules if provided
    if (rules) {
      await pool.query('DELETE FROM availability_rules WHERE schedule_id = ?', [req.params.id]);
      
      if (rules.length > 0) {
        const ruleValues = rules.map(r => [req.params.id, r.day_of_week, r.start_time, r.end_time]);
        await pool.query(
          'INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time) VALUES ?',
          [ruleValues]
        );
      }
    }

    // Return updated schedule
    const [updated] = await pool.query('SELECT * FROM availability_schedules WHERE id = ?', [req.params.id]);
    const [updatedRules] = await pool.query(
      'SELECT * FROM availability_rules WHERE schedule_id = ? ORDER BY day_of_week, start_time',
      [req.params.id]
    );
    const [updatedOverrides] = await pool.query(
      'SELECT * FROM date_overrides WHERE schedule_id = ? ORDER BY override_date',
      [req.params.id]
    );

    res.json({ ...updated[0], rules: updatedRules, overrides: updatedOverrides });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/availability/:id/overrides
 * Add a date-specific override
 */
router.post('/:id/overrides', async (req, res, next) => {
  try {
    const { override_date, start_time, end_time } = req.body;

    if (!override_date) {
      const err = new Error('Override date is required');
      err.status = 400;
      throw err;
    }

    // Delete existing override for this date (replace behavior)
    await pool.query(
      'DELETE FROM date_overrides WHERE schedule_id = ? AND override_date = ?',
      [req.params.id, override_date]
    );

    const [result] = await pool.query(
      'INSERT INTO date_overrides (schedule_id, override_date, start_time, end_time) VALUES (?, ?, ?, ?)',
      [req.params.id, override_date, start_time || null, end_time || null]
    );

    const [newOverride] = await pool.query('SELECT * FROM date_overrides WHERE id = ?', [result.insertId]);
    res.status(201).json(newOverride[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/availability/overrides/:id
 * Delete a date override
 */
router.delete('/overrides/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM date_overrides WHERE id = ?', [req.params.id]);
    res.json({ message: 'Override deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
