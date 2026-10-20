const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    roomType: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    fromDate: {
      type: Date,
      required: [true, 'Arrival date (fromDate) is required'],
    },
    toDate: {
      type: Date,
      required: [true, 'Departure date (toDate) is required'],
    },
    totalDays: {
      type: Number,
      required: true,
      min: [1, 'Booking must be at least 1 day'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount must be non-negative'],
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Cancelled'],
      default: 'Active',
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Simulated_Paid', 'Pending'],
      default: 'Simulated_Paid',
    },
    paymentReference: {
      type: String,
      default: () => `SIMPAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance and date overlap checks
bookingSchema.index({ room: 1, status: 1, fromDate: 1, toDate: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });

bookingSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
