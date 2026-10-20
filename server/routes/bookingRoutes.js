const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  cancelBooking,
} = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

// Customer-protected endpoints
router.post('/', authMiddleware, createBooking);
router.get('/mine', authMiddleware, getMyBookings);
router.post('/cancel', authMiddleware, cancelBooking);

module.exports = router;
