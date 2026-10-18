require('dotenv').config();
const http = require('http');
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// Validate essential environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const server = http.createServer(app);

// Graceful shutdown — required so node --watch can restart without EADDRINUSE
function shutdown(signal) {
  console.log(`\n${signal} received. Closing HTTP server...`);
  server.close(() => {
    pool.end().catch(() => {});
    process.exit(0);
  });
  // Force-exit after 3 s if something hangs
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Test MySQL connection on startup
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully.');
    connection.release();

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use by another process.`);
        console.error(`   Run this command to free it, then restart:\n`);
        console.error(`   PowerShell:  Stop-Process -Name node -Force\n`);
        process.exit(1);
      } else {
        throw err;
      }
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to the database. Stopping server startup.', error.message);
    process.exit(1);
  }
}

startServer();
