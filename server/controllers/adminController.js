const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

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

/**
 * GET /api/admin/stats
 * Admin only: Retrieve live operational dashboard metrics calculated from database collections.
 */
const getAdminStats = async (req, res, next) => {
  try {
    const totalRooms = await Room.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: 'Active' });
    const cancelledBookings = await Booking.countDocuments({ status: 'Cancelled' });
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Calculate total revenue from confirmed active bookings
    const revenueAgg = await Booking.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    // Calculate current occupancy (rooms currently occupied today)
    const today = new Date();
    const occupiedBookings = await Booking.find({
      status: 'Active',
      fromDate: { $lte: today },
      toDate: { $gt: today },
    }).distinct('room');
    const currentOccupiedRooms = occupiedBookings.length;
    const occupancyRate = totalRooms > 0 ? Math.round((currentOccupiedRooms / totalRooms) * 100) : 0;

    res.status(200).json({
      totalRooms,
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalUsers,
      totalCustomers,
      totalAdmins,
      totalRevenue,
      currentOccupiedRooms,
      occupancyRate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/users/:id/role
 * Admin only: Update a user's role (customer <-> admin).
 * Enforces safeguards against self-demotion and invalid roles.
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetUserId = req.params.id;

    if (!role || !['customer', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Role must be 'customer' or 'admin'" });
    }

    // Safeguard: Prevent admin from demoting themselves
    if (targetUserId === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot demote your own administrator account' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safeguard: Prevent demoting the last remaining administrator
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the last remaining administrator in the system' });
      }
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: `User role updated to ${role} successfully`,
      user: user.toSafeObject(),
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getAdminStats,
  updateUserRole,
};
