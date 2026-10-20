const User = require('../models/User');
const { verifyToken } = require('../utils/auth');

/**
 * Authentication middleware.
 * Verifies JWT from Authorization: Bearer <token>
 * Attaches user to req.user (loading fresh record from DB).
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (tokenErr) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Malformed token payload' });
    }

    // Load fresh user from DB to verify identity & role currently in effect
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Admin authorization middleware.
 * Requires authMiddleware to have run previously.
 * Verifies req.user.role === 'admin'.
 */
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden: Administrator privileges required' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
};
