/**
 * Custom Questions Routes
 * 
 * CRUD for custom questions attached to event types.
 * These questions appear on the public booking form alongside
 * the standard name/email fields.
 * 
 * Supports three question types: text (single line), textarea (multi-line),
 * and select (dropdown with predefined options).
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

/**
 * GET /api/event-types/:eventTypeId/questions
 * List all questions for an event type
 */
router.get('/event-types/:eventTypeId/questions', async (req, res, next) => {
  try {
    const [questions] = await pool.query(
      'SELECT * FROM custom_questions WHERE event_type_id = ? ORDER BY sort_order',
      [req.params.eventTypeId]
    );
    res.json(questions);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/event-types/:eventTypeId/questions
 * Add a custom question to an event type
 */
router.post('/event-types/:eventTypeId/questions', async (req, res, next) => {
  try {
    const { question_text, question_type, is_required, options, sort_order } = req.body;

    if (!question_text) {
      const err = new Error('Question text is required');
      err.status = 400;
      throw err;
    }

    const [result] = await pool.query(
      `INSERT INTO custom_questions (event_type_id, question_text, question_type, is_required, options, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.params.eventTypeId,
        question_text,
        question_type || 'text',
        is_required ? 1 : 0,
        options ? JSON.stringify(options) : null,
        sort_order || 0
      ]
    );

    const [newQuestion] = await pool.query('SELECT * FROM custom_questions WHERE id = ?', [result.insertId]);
    res.status(201).json(newQuestion[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/questions/:id
 * Update a custom question
 */
router.put('/questions/:id', async (req, res, next) => {
  try {
    const { question_text, question_type, is_required, options, sort_order } = req.body;

    await pool.query(
      `UPDATE custom_questions SET
        question_text = COALESCE(?, question_text),
        question_type = COALESCE(?, question_type),
        is_required = COALESCE(?, is_required),
        options = COALESCE(?, options),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ?`,
      [question_text, question_type, is_required, options ? JSON.stringify(options) : null, sort_order, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM custom_questions WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/questions/:id
 * Delete a custom question
 */
router.delete('/questions/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM custom_questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
