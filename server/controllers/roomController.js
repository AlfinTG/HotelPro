const Room = require('../models/Room');
const Booking = require('../models/Booking');

/**
 * GET /GetRooms or GET /api/rooms
 * Public room list with optional date filtering for availability.
 * Checks both Room.currentBookings AND Booking documents for comprehensive availability truth.
 */
const getRooms = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const hasFromDate = fromDate !== undefined;
    const hasToDate = toDate !== undefined;

    if (hasFromDate !== hasToDate) {
      return res.status(400).json({
        message: 'Both fromDate and toDate are required when filtering room availability',
      });
    }

    if (!hasFromDate) {
      const rooms = await Room.find().sort({ roomNumber: 1 });
      return res.status(200).json({ rooms: rooms.map((r) => r.toSafeObject()) });
    }

    if (
      typeof fromDate !== 'string' ||
      typeof toDate !== 'string' ||
      !fromDate.trim() ||
      !toDate.trim()
    ) {
      return res.status(400).json({ message: 'Invalid fromDate or toDate query parameters' });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({ message: 'Invalid fromDate or toDate query parameters' });
    }

    const rooms = await Room.find().sort({ roomNumber: 1 });

    // Check availability against both Room.currentBookings slots and active Booking records
    const overlappingBookings = await Booking.find({
      status: 'Active',
      fromDate: { $lt: end },
      toDate: { $gt: start },
    }).select('room');

    const bookedFromBookings = new Set(overlappingBookings.map((b) => b.room.toString()));

    // Filter rooms ensuring neither active Bookings nor currentBookings slots overlap
    const availableRooms = rooms.filter((r) => {
      if (bookedFromBookings.has(r._id.toString())) return false;

      if (r.currentBookings && r.currentBookings.length > 0) {
        const hasSlotOverlap = r.currentBookings.some((slot) => {
          return new Date(slot.fromDate) < end && new Date(slot.toDate) > start;
        });
        if (hasSlotOverlap) return false;
      }

      return true;
    });

    res.status(200).json({
      rooms: availableRooms.map((r) => r.toSafeObject()),
      totalAvailable: availableRooms.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/rooms/:id
 * Public: Get single room details.
 */
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json({ room: room.toSafeObject() });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
    next(err);
  }
};

/**
 * POST /api/rooms
 * Admin only: Create a physical room record.
 */
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, type, rent, photos, description, maxCount } = req.body;

    if (!roomNumber || rent === undefined || !type) {
      return res.status(400).json({ message: 'Room number, type, and rent are required' });
    }

    if (Number(rent) < 0) {
      return res.status(400).json({ message: 'Rent must be a non-negative number' });
    }

    const existing = await Room.findOne({ roomNumber: String(roomNumber).trim() });
    if (existing) {
      return res.status(409).json({ message: `Room ${roomNumber} already exists` });
    }

    const room = new Room({
      roomNumber: String(roomNumber).trim(),
      type,
      rent: Number(rent),
      photos: Array.isArray(photos) ? photos : (photos ? [photos] : []),
      description: description || '',
      maxCount: maxCount ? Number(maxCount) : 2,
    });

    await room.save();

    res.status(201).json({
      message: 'Room created successfully',
      room: room.toSafeObject(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Room number already exists' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(err);
  }
};

/**
 * PUT /api/rooms/:id
 * Admin only: Update an existing room record.
 */
const updateRoom = async (req, res, next) => {
  try {
    const { roomNumber, type, rent, photos, description, maxCount } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (roomNumber && String(roomNumber).trim() !== room.roomNumber) {
      const existing = await Room.findOne({ roomNumber: String(roomNumber).trim() });
      if (existing) {
        return res.status(409).json({ message: `Room ${roomNumber} already exists` });
      }
      room.roomNumber = String(roomNumber).trim();
    }

    if (type) room.type = type;
    if (rent !== undefined) {
      if (Number(rent) < 0) return res.status(400).json({ message: 'Rent must be non-negative' });
      room.rent = Number(rent);
    }
    if (photos !== undefined) {
      room.photos = Array.isArray(photos) ? photos : [photos];
    }
    if (description !== undefined) room.description = description;
    if (maxCount !== undefined) room.maxCount = Number(maxCount);

    await room.save();

    res.status(200).json({
      message: 'Room updated successfully',
      room: room.toSafeObject(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Room number already exists' });
    }
    next(err);
  }
};

/**
 * DELETE /api/rooms/:id
 * Admin only: Delete a room record.
 * Protects against deletion if room has either active future Bookings OR active future currentBookings slots.
 */
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const now = new Date();

    // Check if room has active bookings in Booking collection
    const activeBooking = await Booking.findOne({
      room: room._id,
      status: 'Active',
      toDate: { $gte: now },
    });

    // Check if room has active future slots in currentBookings
    const activeSlot = room.currentBookings && room.currentBookings.some((slot) => new Date(slot.toDate) >= now);

    if (activeBooking || activeSlot) {
      return res.status(400).json({
        message: 'Cannot delete room with active future reservations',
      });
    }

    await Room.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
