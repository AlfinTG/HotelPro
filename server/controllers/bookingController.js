const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

/**
 * Helper: Calculate full days between dates.
 * Disallows zero-day or fractional under-1-day stays.
 */
const calculateDays = (from, to) => {
  const diffTime = to.getTime() - from.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * POST /api/bookings
 * Authenticated customer: Create a booking.
 * Concurrency strategy:
 * Executes atomic conditional update on Room.currentBookings ($not + $elemMatch).
 * If a concurrent request attempts to reserve an overlapping slot on the same physical room,
 * the atomic update matches 0 documents and returns HTTP 409 Conflict immediately.
 * A newly generated ObjectId is reserved in currentBookings before creating the Booking record,
 * with automatic compensatory rollback if booking save fails.
 */
const createBooking = async (req, res, next) => {
  try {
    const { roomId, fromDate, toDate } = req.body;
    const userId = req.user._id;

    if (!roomId || !fromDate || !toDate) {
      return res.status(400).json({ message: 'roomId, fromDate, and toDate are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Require check-out strictly after check-in
    if (end <= start) {
      return res.status(400).json({ message: 'Departure date (toDate) must be strictly after arrival date (fromDate)' });
    }

    // Validate that arrival date is not in the distant past (allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startZero = new Date(start);
    startZero.setHours(0, 0, 0, 0);
    if (startZero < today) {
      return res.status(400).json({ message: 'Arrival date cannot be in the past' });
    }

    // Fetch the room to verify existence and rent
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Server calculates totalDays and totalAmount — never trust client-supplied values
    const totalDays = calculateDays(start, end);
    const totalAmount = totalDays * room.rent;

    // Treat persisted active Booking records as an independent source of truth.
    // This protects against stale/missing Room.currentBookings slots.
    const activeBooking = await Booking.findOne({
      room: room._id,
      status: 'Active',
      fromDate: { $lt: end },
      toDate: { $gt: start },
    }).select('_id');

    if (activeBooking) {
      return res.status(409).json({
        message: `Room ${room.roomNumber} is already booked for the selected dates`,
      });
    }

    const newBookingId = new mongoose.Types.ObjectId();

    // Atomic conditional slot reservation on the physical Room document
    // Overlap condition: existing.fromDate < requested.toDate AND existing.toDate > requested.fromDate
    const atomicUpdate = await Room.findOneAndUpdate(
      {
        _id: room._id,
        currentBookings: {
          $not: {
            $elemMatch: {
              fromDate: { $lt: end },
              toDate: { $gt: start },
            },
          },
        },
      },
      {
        $push: {
          currentBookings: {
            bookingId: newBookingId,
            fromDate: start,
            toDate: end,
          },
        },
      },
      { new: true }
    );

    if (!atomicUpdate) {
      return res.status(409).json({
        message: `Room ${room.roomNumber} is already booked for the selected dates`,
      });
    }

    // Room slot successfully and atomically locked. Now persist the formal Booking record.
    try {
      const booking = new Booking({
        _id: newBookingId,
        room: room._id,
        user: userId,
        roomType: room.type,
        roomNumber: room.roomNumber,
        fromDate: start,
        toDate: end,
        totalDays,
        totalAmount,
        customerPhone: req.user.phone,
        customerName: req.user.name,
        status: 'Active',
        paymentStatus: 'Simulated_Paid',
      });

      await booking.save();

      return res.status(201).json({
        message: 'Booking created successfully (Simulated Payment confirmed)',
        booking: booking.toSafeObject(),
      });
    } catch (saveErr) {
      // Rollback the atomic slot reservation on Booking save failure
      await Room.updateOne(
        { _id: room._id },
        { $pull: { currentBookings: { bookingId: newBookingId } } }
      );
      throw saveErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/mine
 * Authenticated customer: Retrieve customer's own booking history.
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      bookings: bookings.map((b) => b.toSafeObject()),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /cancelbooking or POST /api/bookings/cancel
 * Authenticated customer or Admin: Cancel an active booking.
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Enforce ownership: only owner or administrator can cancel
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access forbidden: You cannot cancel another user\'s booking' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    // Release the reservation from Room.currentBookings atomically so dates become available
    await Room.updateOne(
      { _id: booking.room },
      { $pull: { currentBookings: { bookingId: booking._id } } }
    );

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking: booking.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings
 * Admin only: Retrieve all bookings system-wide.
 */
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json({
      bookings: bookings.map((b) => b.toSafeObject()),
      total: bookings.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Repair helper: Detect and reconcile orphaned or stale currentBookings on Room documents.
 * Retains only currentBookings slots that correspond to confirmed 'Active' Booking documents.
 */
const reconcileRoomBookings = async (roomId = null) => {
  const query = roomId ? { _id: roomId } : {};
  const rooms = await Room.find(query);
  let reconciledSlotsCount = 0;

  for (const room of rooms) {
    if (!room.currentBookings || room.currentBookings.length === 0) continue;

    const validSlots = [];
    for (const slot of room.currentBookings) {
      const activeBooking = await Booking.findOne({
        _id: slot.bookingId,
        room: room._id,
        status: 'Active',
      });

      if (activeBooking) {
        validSlots.push(slot);
      } else {
        reconciledSlotsCount++;
      }
    }

    if (validSlots.length !== room.currentBookings.length) {
      room.currentBookings = validSlots;
      await room.save();
    }
  }

  return { reconciledSlotsCount };
};

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  reconcileRoomBookings,
};
