const mysql = require('mysql2/promise');
require('dotenv').config();

const sslEnabled = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Set DB_SSL=true when connecting to hosted providers like Aiven MySQL.
  // rejectUnauthorized: false disables certificate chain verification —
  // acceptable for this college-level deployment but note the trade-off.
  ...(sslEnabled ? { ssl: { rejectUnauthorized: false } } : {})
});

module.exports = pool;
