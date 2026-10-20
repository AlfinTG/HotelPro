const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      trim: true,
      enum: ['Deluxe', 'Non-Deluxe', 'Standard', 'Suite'],
      default: 'Standard',
    },
    rent: {
      type: Number,
      required: [true, 'Rent per day is required'],
      min: [0, 'Rent must be a non-negative number'],
    },
    photos: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    maxCount: {
      type: Number,
      default: 2,
      min: [1, 'Capacity must be at least 1 person'],
    },
    currentBookings: [
      {
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Booking',
          required: true,
        },
        fromDate: {
          type: Date,
          required: true,
        },
        toDate: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to format room for response
roomSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
