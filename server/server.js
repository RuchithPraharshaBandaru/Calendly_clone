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

// ─── Start Server ───────────────────────────────────────────
async function startServer() {
  try {
    // Initialize database tables
    await initializeDatabase();
    console.log('✅ Database ready');

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
