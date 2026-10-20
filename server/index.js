/**
 * server/index.js — HotelPro Express entry point
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Controllers for source-exact endpoints
const { register, login } = require('./controllers/authController');
const { getRooms } = require('./controllers/roomController');
const { cancelBooking } = require('./controllers/bookingController');
const { authMiddleware } = require('./middleware/auth');

// Modular Routers
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables before anything else
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Track database connection state for health reporting
let dbConnected = false;

// ── Middleware ─────────────────────────────────────────────────────────────────

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health endpoint ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    project: 'HotelPro',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── Documented Explicit Routes ────────────────────────────────────────────────
// Preserves exact paths named in source documents:
// POST /SignUp, POST /Login, GET /GetRooms, POST /cancelbooking
app.post('/SignUp', register);
app.post('/Login', login);
app.get('/GetRooms', getRooms);
app.post('/cancelbooking', authMiddleware, cancelBooking);

// ── API Modular Route Mounts ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// ── Centralised error handler ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const startServer = async () => {
  app.listen(PORT, async () => {
    console.log(`[Server] HotelPro API running on http://localhost:${PORT}`);

    try {
      await connectDB();
      dbConnected = true;
    } catch {
      console.warn('[Server] Running without database connection — data operations will fail.');
    }
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
