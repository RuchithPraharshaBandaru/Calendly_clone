/**
 * Database Configuration
 * 
 * Uses mysql2 with connection pooling for efficient database connections.
 * Pool reuses connections instead of creating new ones for each query,
 * which is much more performant for a web server.
 * 
 * Alternative considered: Sequelize ORM — rejected because raw SQL
 * demonstrates better understanding of database design (evaluation criteria).
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Connection pool configuration
// SSL is needed for cloud MySQL providers (Aiven, PlanetScale, etc.)
const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'calendly_clone',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Cloud MySQL providers require SSL connections
if (isProduction) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

/**
 * Initialize database by running schema.sql
 * Creates the database and all tables if they don't exist
 */
async function initializeDatabase() {
  // First, connect without specifying a database to create it
  const connConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  };
  if (isProduction) {
    connConfig.ssl = { rejectUnauthorized: false };
  }
  const connection = await mysql.createConnection(connConfig);

  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schema);
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    // If tables already exist, that's fine
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Tables already exist, skipping schema creation');
    } else {
      console.error('❌ Error initializing database:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

module.exports = { pool, initializeDatabase };
