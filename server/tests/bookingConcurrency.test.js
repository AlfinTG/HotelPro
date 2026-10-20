const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
require('../config/db');

const app = require('../index');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { signToken, hashPassword } = require('../utils/auth');

let server;
let baseUrl;

const runId = Date.now();
const customerEmails = Array.from({ length: 6 }, (_, i) => `concurrent.user.${runId}.${i}@example.com`);
const testPassword = 'Password123!';

let customerTokens = [];
let customerUsers = [];
let testRoom;

async function makeRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const status = response.status;
  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { status, data };
}

describe('Concurrency: Simultaneous Booking Race Conditions', () => {
  before(async () => {
    // Start temporary HTTP server on ephemeral port
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }

    const hashed = await hashPassword(testPassword);

    // Create 6 distinct customer users to simulate real multi-client concurrency
    for (const email of customerEmails) {
      const user = new User({
        name: `Concurrent User ${email}`,
        email,
        passwordHash: hashed,
        phone: '1234567890',
        role: 'customer',
      });
      await user.save();
      customerUsers.push(user);
      customerTokens.push(signToken({ userId: user._id, role: 'customer' }));
    }

    // Create one physical room
    testRoom = new Room({
      roomNumber: `RACE-${runId}`,
      type: 'Deluxe',
      rent: 2000,
      description: 'Concurrency Test Room',
    });
    await testRoom.save();
  });

  after(async () => {
    try {
      await User.deleteMany({ email: { $in: customerEmails } });
      if (testRoom) await Room.deleteOne({ _id: testRoom._id });
      await Booking.deleteMany({ room: testRoom?._id });
    } catch {
      // Ignore
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('Guarantees exactly ONE booking succeeds when 6 simultaneous requests compete for the same room and dates', async () => {
    const bookingPayload = {
      roomId: testRoom._id,
      fromDate: '2026-12-15',
      toDate: '2026-12-20',
    };

    // Dispatch all 6 requests simultaneously using Promise.all
    const promises = customerTokens.map((token) =>
      makeRequest('/api/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: bookingPayload,
      })
    );

    const results = await Promise.all(promises);

    const successes = results.filter((r) => r.status === 201);
    const conflicts = results.filter((r) => r.status === 409);

    console.log(`Concurrency Results: Successes = ${successes.length}, Conflicts = ${conflicts.length}`);

    // Exactly 1 request must succeed; exactly 5 must receive 409 Conflict
    assert.equal(successes.length, 1, 'Exactly one concurrent booking must succeed');
    assert.equal(conflicts.length, customerTokens.length - 1, 'All other concurrent requests must receive 409 Conflict');

    for (const conflict of conflicts) {
      assert.match(conflict.data.message, /already booked/i);
    }

    // Verify in database that exactly ONE booking record exists for this room
    const bookingsInDb = await Booking.find({ room: testRoom._id, status: 'Active' });
    assert.equal(bookingsInDb.length, 1);

    // Verify in database that Room.currentBookings contains exactly ONE entry
    const roomInDb = await Room.findById(testRoom._id);
    assert.equal(roomInDb.currentBookings.length, 1);
  });

  test('Cancelling the winning booking allows another concurrent booking to succeed subsequently', async () => {
    // Find the winning booking
    const winningBooking = await Booking.findOne({ room: testRoom._id, status: 'Active' });
    assert.ok(winningBooking);

    // Cancel the winning booking as owner
    const winningUserToken = customerTokens[customerUsers.findIndex((u) => u._id.equals(winningBooking.user))];
    const cancelRes = await makeRequest('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${winningUserToken}` },
      body: { bookingId: winningBooking._id },
    });
    assert.equal(cancelRes.status, 200);

    // Now a new customer books the exact same dates
    const newCustomerToken = customerTokens[0];
    const newBookingRes = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${newCustomerToken}` },
      body: {
        roomId: testRoom._id,
        fromDate: '2026-12-15',
        toDate: '2026-12-20',
      },
    });

    assert.equal(newBookingRes.status, 201);
    assert.equal(newBookingRes.data.booking.status, 'Active');
  });
});
