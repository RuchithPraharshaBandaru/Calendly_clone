/**
 * Database Seed Script
 * 
 * Populates the database with sample data for development and demo:
 * - 1 default user
 * - 1 default availability schedule (Mon-Fri 9AM-5PM)
 * - 3 sample event types (30min, 60min, 15min)
 * - Custom questions on one event type
 * - A few sample meetings (upcoming and past)
 * 
 * Run with: npm run seed
 */

const { pool, initializeDatabase } = require('./config/db');

async function seed() {
  try {
    // First, ensure schema exists
    await initializeDatabase();

    const connection = await pool.getConnection();

    try {
      // Clear existing data (in reverse dependency order)
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('TRUNCATE TABLE meeting_answers');
      await connection.query('TRUNCATE TABLE meetings');
      await connection.query('TRUNCATE TABLE custom_questions');
      await connection.query('TRUNCATE TABLE date_overrides');
      await connection.query('TRUNCATE TABLE availability_rules');
      await connection.query('TRUNCATE TABLE availability_schedules');
      await connection.query('TRUNCATE TABLE event_types');
      await connection.query('TRUNCATE TABLE users');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');

      console.log('🗑️  Cleared existing data');

      // ─── 1. Create default user ───────────────────────────
      await connection.query(
        `INSERT INTO users (id, name, email, timezone) VALUES (1, 'John Doe', 'john@example.com', 'Asia/Kolkata')`
      );
      console.log('👤 Created default user: John Doe');

      // ─── 2. Create availability schedules ─────────────────
      // Schedule 1: Working Hours (default)
      await connection.query(
        `INSERT INTO availability_schedules (id, user_id, name, timezone, is_default) 
         VALUES (1, 1, 'Working Hours', 'Asia/Kolkata', 1)`
      );

      // Schedule 2: Extended Hours
      await connection.query(
        `INSERT INTO availability_schedules (id, user_id, name, timezone, is_default) 
         VALUES (2, 1, 'Extended Hours', 'Asia/Kolkata', 0)`
      );

      // Working Hours rules: Mon-Fri 9AM-5PM
      const workingHoursRules = [
        [1, 1, '09:00:00', '17:00:00'], // Monday
        [1, 2, '09:00:00', '17:00:00'], // Tuesday
        [1, 3, '09:00:00', '17:00:00'], // Wednesday
        [1, 4, '09:00:00', '17:00:00'], // Thursday
        [1, 5, '09:00:00', '17:00:00'], // Friday
      ];

      await connection.query(
        'INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time) VALUES ?',
        [workingHoursRules]
      );

      // Extended Hours rules: Mon-Sat 8AM-8PM
      const extendedRules = [
        [2, 1, '08:00:00', '20:00:00'],
        [2, 2, '08:00:00', '20:00:00'],
        [2, 3, '08:00:00', '20:00:00'],
        [2, 4, '08:00:00', '20:00:00'],
        [2, 5, '08:00:00', '20:00:00'],
        [2, 6, '10:00:00', '14:00:00'], // Saturday (limited)
      ];

      await connection.query(
        'INSERT INTO availability_rules (schedule_id, day_of_week, start_time, end_time) VALUES ?',
        [extendedRules]
      );

      console.log('📅 Created availability schedules');

      // ─── 3. Create event types ────────────────────────────
      await connection.query(
        `INSERT INTO event_types (id, user_id, name, description, duration, slug, color, schedule_id, buffer_before, buffer_after)
         VALUES 
         (1, 1, '30 Minute Meeting', 'A quick 30 minute catch-up call to discuss your needs.', 30, '30-minute-meeting', '#0069ff', 1, 5, 5),
         (2, 1, '60 Minute Consultation', 'An in-depth 60 minute consultation session for detailed discussions.', 60, '60-minute-consultation', '#7b2ff7', 1, 10, 10),
         (3, 1, '15 Minute Quick Chat', 'A brief 15 minute introductory call.', 15, '15-minute-quick-chat', '#00a86b', 1, 0, 5)`
      );
      console.log('📝 Created 3 event types');

      // ─── 4. Create custom questions ───────────────────────
      await connection.query(
        `INSERT INTO custom_questions (event_type_id, question_text, question_type, is_required, options, sort_order)
         VALUES 
         (1, 'What would you like to discuss?', 'textarea', 0, NULL, 1),
         (1, 'How did you hear about us?', 'select', 0, '["Google", "LinkedIn", "Referral", "Other"]', 2),
         (2, 'Please describe your project requirements', 'textarea', 1, NULL, 1),
         (2, 'What is your budget range?', 'select', 0, '["< $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "> $10,000"]', 2)`
      );
      console.log('❓ Created custom questions');

      // ─── 5. Create sample meetings ────────────────────────
      // Create some upcoming meetings (relative to current date)
      const now = new Date();
      
      // Tomorrow at 10 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const tomorrowEnd = new Date(tomorrow.getTime() + 30 * 60000);

      // Day after tomorrow at 2 PM
      const dayAfter = new Date(now);
      dayAfter.setDate(dayAfter.getDate() + 2);
      dayAfter.setHours(14, 0, 0, 0);
      const dayAfterEnd = new Date(dayAfter.getTime() + 60 * 60000);

      // Next week at 11 AM
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(11, 0, 0, 0);
      const nextWeekEnd = new Date(nextWeek.getTime() + 15 * 60000);

      // Yesterday at 3 PM (past meeting)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(15, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday.getTime() + 30 * 60000);

      // 3 days ago (past + cancelled)
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(9, 0, 0, 0);
      const threeDaysAgoEnd = new Date(threeDaysAgo.getTime() + 60 * 60000);

      const formatDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

      await connection.query(
        `INSERT INTO meetings (event_type_id, invitee_name, invitee_email, start_time, end_time, status, cancel_reason)
         VALUES 
         (1, 'Alice Johnson', 'alice@example.com', ?, ?, 'scheduled', NULL),
         (2, 'Bob Smith', 'bob@example.com', ?, ?, 'scheduled', NULL),
         (3, 'Charlie Brown', 'charlie@example.com', ?, ?, 'scheduled', NULL),
         (1, 'Diana Prince', 'diana@example.com', ?, ?, 'scheduled', NULL),
         (2, 'Eve Adams', 'eve@example.com', ?, ?, 'cancelled', 'Schedule conflict')`,
        [
          formatDate(tomorrow), formatDate(tomorrowEnd),
          formatDate(dayAfter), formatDate(dayAfterEnd),
          formatDate(nextWeek), formatDate(nextWeekEnd),
          formatDate(yesterday), formatDate(yesterdayEnd),
          formatDate(threeDaysAgo), formatDate(threeDaysAgoEnd)
        ]
      );
      console.log('🤝 Created 5 sample meetings');

      // Add sample answers for the first meeting
      await connection.query(
        `INSERT INTO meeting_answers (meeting_id, question_id, answer_text)
         VALUES 
         (1, 1, 'I want to discuss a potential project collaboration.'),
         (1, 2, 'LinkedIn')`
      );

      console.log('\n✅ Database seeded successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Default user: John Doe (john@example.com)');
      console.log('Event types: 3 (30min, 60min, 15min)');
      console.log('Availability: Mon-Fri 9AM-5PM');
      console.log('Sample meetings: 5 (3 upcoming, 1 past, 1 cancelled)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } finally {
      connection.release();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
