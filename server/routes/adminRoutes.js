const express = require('express');
const router = express.Router();
const { getAllBookings } = require('../controllers/bookingController');
const { getRooms } = require('../controllers/roomController');
const { getAllUsers, getAdminStats, updateUserRole } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

router.get('/stats', getAdminStats);
router.get('/bookings', getAllBookings);
router.get('/rooms', getRooms);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

module.exports = router;
