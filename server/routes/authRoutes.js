const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Auth endpoints
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

// Admin-verification testing endpoint
router.get('/admin-test', authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Welcome Administrator',
    user: req.user.toSafeObject(),
  });
});

module.exports = router;
