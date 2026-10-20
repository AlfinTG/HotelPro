/**
 * server/config/db.js
 * Establishes and manages the Mongoose connection to MongoDB.
 * Connection URI is read from environment configuration only — never hardcoded.
 * Throws on failure so the caller can decide whether to exit or continue.
 */

const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, Node c-ares DNS resolver can default to 127.0.0.1 where no local DNS stub runs,
// causing querySrv ECONNREFUSED on mongodb+srv:// records. Fall back to standard public DNS if so.
try {
  const currentServers = dns.getServers();
  if (currentServers.length === 1 && currentServers[0] === '127.0.0.1') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {
  // Ignore DNS config fallback failures
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set. Check your .env file.');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[DB] MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (err) {
    // Log the error type and message without exposing credentials or stack detail to stdout
    console.error(`[DB] MongoDB connection failed: ${err.message}`);
    throw err; // Let the caller handle exit or graceful degradation
  }
};

module.exports = connectDB;
