/**
 * Express Server Entry Point
 * 
 * Sets up the Express app with:
 * - CORS for cross-origin requests from the React frontend
 * - JSON body parsing
 * - All API routes mounted under /api
 * - Centralized error handling
 * - Database initialization on startup
 * 
 * Why Express?: Assignment requirement. It's minimal, flexible, and
 * the most popular Node.js web framework. Alternative: Fastify (faster)
 * or Koa (more modern) — but Express has the largest ecosystem.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initializeDatabase } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import route modules
const eventTypesRoutes = require('./routes/eventTypes');
const availabilityRoutes = require('./routes/availability');
const bookingsRoutes = require('./routes/bookings');
const meetingsRoutes = require('./routes/meetings');
const questionsRoutes = require('./routes/questions');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────
// CORS: In production, frontend is served from same origin (no CORS needed).
// In development, allow the Vite dev server.
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow same-origin in production
    : (process.env.CLIENT_URL || 'http://localhost:5173'),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Parse JSON request bodies (limit 10mb for potential large payloads)
app.use(express.json({ limit: '10mb' }));

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/event-types', eventTypesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/booking', bookingsRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api', questionsRoutes);  // Mounted at /api because it has mixed paths

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve React build in production ────────────────────────
// In production, the backend serves the React frontend build files.
// This allows deploying both as a single service on Render/Railway.
const clientBuildPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // SPA fallback: serve index.html for any non-API route
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
  console.log('📦 Serving React build from client/dist');
}

// ─── Error Handler (must be last middleware) ────────────────
app.use(errorHandler);

// ─── Auto-seed helper ───────────────────────────────────────
// Checks if the database is empty and seeds it automatically.
// This runs on first deploy so you don't need to manually seed.
async function autoSeedIfEmpty() {
  const { pool } = require('./config/db');
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (rows[0].count === 0) {
      console.log('📭 Database is empty — auto-seeding sample data...');
      
      const connection = await pool.getConnection();
      try {
        // Create default user
        await connection.query(
          `INSERT INTO users (id, name, email, timezone) VALUES (1, 'John Doe', 'john@example.com', 'Asia/Kolkata')`
        );

        // Create availability schedules
        await connection.query(
          `INSERT INTO availability_schedules (id, user_id, name, timezone, is_default) VALUES 
           (1, 1, 'Working Hours', 'Asia/Kolkata', 1),
           (2, 1, 'Extended Hours', 'Asia/Kolkata', 0)`
        );

        // Working Hours: Mon-Fri 9AM-5PM
        await connection.query(
          `INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time) VALUES 
           (1, 1, '09:00:00', '17:00:00'), (1, 2, '09:00:00', '17:00:00'),
           (1, 3, '09:00:00', '17:00:00'), (1, 4, '09:00:00', '17:00:00'),
           (1, 5, '09:00:00', '17:00:00')`
        );

        // Extended Hours: Mon-Sat
        await connection.query(
          `INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time) VALUES 
           (2, 1, '08:00:00', '20:00:00'), (2, 2, '08:00:00', '20:00:00'),
           (2, 3, '08:00:00', '20:00:00'), (2, 4, '08:00:00', '20:00:00'),
           (2, 5, '08:00:00', '20:00:00'), (2, 6, '10:00:00', '14:00:00')`
        );

        // Create 3 event types
        await connection.query(
          `INSERT INTO event_types (id, user_id, name, description, duration, slug, color, schedule_id, buffer_before, buffer_after) VALUES 
           (1, 1, '30 Minute Meeting', 'A quick 30 minute catch-up call to discuss your needs.', 30, '30-minute-meeting', '#0069ff', 1, 5, 5),
           (2, 1, '60 Minute Consultation', 'An in-depth 60 minute consultation session for detailed discussions.', 60, '60-minute-consultation', '#7b2ff7', 1, 10, 10),
           (3, 1, '15 Minute Quick Chat', 'A brief 15 minute introductory call.', 15, '15-minute-quick-chat', '#00a86b', 1, 0, 5)`
        );

        // Custom questions
        await connection.query(
          `INSERT INTO custom_questions (event_type_id, question_text, question_type, is_required, options, sort_order) VALUES 
           (1, 'What would you like to discuss?', 'textarea', 0, NULL, 1),
           (1, 'How did you hear about us?', 'select', 0, '["Google", "LinkedIn", "Referral", "Other"]', 2),
           (2, 'Please describe your project requirements', 'textarea', 1, NULL, 1)`
        );

        // Sample meetings (relative dates)
        const now = new Date();
        const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
        
        const t1 = new Date(now); t1.setDate(t1.getDate() + 1); t1.setHours(10, 0, 0, 0);
        const t1e = new Date(t1.getTime() + 30 * 60000);
        const t2 = new Date(now); t2.setDate(t2.getDate() + 2); t2.setHours(14, 0, 0, 0);
        const t2e = new Date(t2.getTime() + 60 * 60000);
        const t3 = new Date(now); t3.setDate(t3.getDate() + 7); t3.setHours(11, 0, 0, 0);
        const t3e = new Date(t3.getTime() + 15 * 60000);

        await connection.query(
          `INSERT INTO meetings (event_type_id, invitee_name, invitee_email, start_time, end_time, status) VALUES 
           (1, 'Alice Johnson', 'alice@example.com', ?, ?, 'scheduled'),
           (2, 'Bob Smith', 'bob@example.com', ?, ?, 'scheduled'),
           (3, 'Charlie Brown', 'charlie@example.com', ?, ?, 'scheduled')`,
          [fmt(t1), fmt(t1e), fmt(t2), fmt(t2e), fmt(t3), fmt(t3e)]
        );

        console.log('✅ Auto-seeded: 1 user, 3 event types, 3 meetings');
      } finally {
        connection.release();
      }
    } else {
      console.log('✅ Database has data — skipping seed');
    }
  } catch (error) {
    console.error('⚠️ Auto-seed check failed:', error.message);
  }
}

// ─── Start Server ───────────────────────────────────────────
async function startServer() {
  try {
    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database ready');

    // Auto-seed if empty (first deploy)
    await autoSeedIfEmpty();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 API docs: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
