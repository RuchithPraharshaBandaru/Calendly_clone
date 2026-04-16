-- Calendly Clone Database Schema
-- Tables are created in the database specified by DB_NAME env var

-- Users table (default user, no auth needed)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event types (the meetings a user offers)
CREATE TABLE IF NOT EXISTS event_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INT NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#0069ff',
  is_active BOOLEAN DEFAULT TRUE,
  buffer_before INT DEFAULT 0,
  buffer_after INT DEFAULT 0,
  schedule_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Custom questions on booking form
CREATE TABLE IF NOT EXISTS custom_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type_id INT NOT NULL,
  question_text VARCHAR(500) NOT NULL,
  question_type ENUM('text', 'textarea', 'select') DEFAULT 'text',
  is_required BOOLEAN DEFAULT FALSE,
  options JSON,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
);

-- Availability schedules (a user can have multiple)
CREATE TABLE IF NOT EXISTS availability_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) DEFAULT 'Working Hours',
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Weekly rules (which hours on which days)
CREATE TABLE IF NOT EXISTS availability_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  day_of_week TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
);

-- Date overrides (special hours or blocked dates)
CREATE TABLE IF NOT EXISTS date_overrides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT NOT NULL,
  override_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE CASCADE
);

-- Booked meetings
CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type_id INT NOT NULL,
  invitee_name VARCHAR(100) NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('scheduled', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
  cancel_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE
);

-- Answers to custom questions
CREATE TABLE IF NOT EXISTS meeting_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  question_id INT NOT NULL,
  answer_text TEXT,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES custom_questions(id) ON DELETE CASCADE
);

-- Add foreign key for schedule_id in event_types after availability_schedules is created
ALTER TABLE event_types
  ADD FOREIGN KEY (schedule_id) REFERENCES availability_schedules(id) ON DELETE SET NULL;
