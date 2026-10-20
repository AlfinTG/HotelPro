const User = require('../models/User');

/**
 * GET /api/admin/users
 * Admin only: Retrieve all registered users with safe fields.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash -__v').sort({ createdAt: -1 });
    res.status(200).json({
      users,
      total: users.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
};
