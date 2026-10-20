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
const { reconcileRoomBookings } = require('../controllers/bookingController');
const { signToken, hashPassword } = require('../utils/auth');

let server;
let baseUrl;

const runId = Date.now();
const testEmail = `audit.user.${runId}@example.com`;
const testPassword = 'Password123!';

let customerToken;
let adminToken;
let customerUser;
let adminUser;
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

describe('Audit: Stage C Boundary, Consistency, and Repair Checks', () => {
  before(async () => {
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
    customerUser = new User({
      name: 'Audit Customer',
      email: testEmail,
      passwordHash: hashed,
      phone: '1234567890',
      role: 'customer',
    });
    await customerUser.save();
    customerToken = signToken({ userId: customerUser._id, role: 'customer' });

    adminUser = new User({
      name: 'Audit Admin',
      email: `audit.admin.${runId}@example.com`,
      passwordHash: hashed,
      phone: '9998887777',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = signToken({ userId: adminUser._id, role: 'admin' });

    testRoom = new Room({
      roomNumber: `AUDIT-${runId}`,
      type: 'Standard',
      rent: 1000,
    });
    await testRoom.save();
  });

  after(async () => {
    try {
      await User.deleteMany({ _id: { $in: [customerUser?._id, adminUser?._id] } });
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

  // ── Boundary Case: Adjacent Stays ──────────────────────────────────────────

  test('Boundary: Adjacent stays are permitted (checkout date = next check-in date)', async () => {
    // Stay 1: 2026-12-01 to 2026-12-05
    const res1 = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        roomId: testRoom._id,
        fromDate: '2026-12-01',
        toDate: '2026-12-05',
      },
    });
    assert.equal(res1.status, 201);

    // Stay 2: 2026-12-05 to 2026-12-10 (starts on exact departure day of Stay 1)
    const res2 = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        roomId: testRoom._id,
        fromDate: '2026-12-05',
        toDate: '2026-12-10',
      },
    });
    assert.equal(res2.status, 201, 'Adjacent stay starting on check-out day must be allowed');
    assert.equal(res2.data.booking.totalDays, 5);

    // Stay 3: 2026-11-25 to 2026-12-01 (ends on exact check-in day of Stay 1)
    const res3 = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        roomId: testRoom._id,
        fromDate: '2026-11-25',
        toDate: '2026-12-01',
      },
    });
    assert.equal(res3.status, 201, 'Adjacent stay ending on check-in day must be allowed');
  });

  // ── Availability Filtering Considers Both CurrentBookings and Bookings ─────

  test('Availability Consistency: GetRooms accounts for currentBookings slots', async () => {
    // Query dates overlapping Stay 1 (e.g. 2026-12-02 to 2026-12-04)
    const res = await makeRequest('/GetRooms?fromDate=2026-12-02&toDate=2026-12-04');
    assert.equal(res.status, 200);

    const isAvailable = res.data.rooms.some((r) => r.roomNumber === testRoom.roomNumber);
    assert.equal(isAvailable, false, 'Room with active booking/slot must be excluded from available rooms');
  });

  // ── Room Deletion Protection Considers Active Slots ────────────────────────

  test('Room Deletion Protection: Rejects deletion when room has active future slots', async () => {
    const deleteRes = await makeRequest(`/api/rooms/${testRoom._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(deleteRes.status, 400);
    assert.match(deleteRes.data.message, /cannot delete room with active future reservations/i);
  });

  // ── Safe Repair & Reconciliation of Stale/Orphaned Slots ───────────────────

  test('Repair: reconcileRoomBookings safely removes orphaned slots without touching confirmed active reservations', async () => {
    // Inject a simulated orphaned slot into testRoom.currentBookings (e.g., simulating a crashed process before Booking.save in non-tx environment)
    const fakeOrphanBookingId = new mongoose.Types.ObjectId();
    await Room.updateOne(
      { _id: testRoom._id },
      {
        $push: {
          currentBookings: {
            bookingId: fakeOrphanBookingId,
            fromDate: new Date('2027-01-01'),
            toDate: new Date('2027-01-05'),
          },
        },
      }
    );

    const roomBefore = await Room.findById(testRoom._id);
    const slotsCountBefore = roomBefore.currentBookings.length;

    // Run reconciliation helper
    const repairResult = await reconcileRoomBookings(testRoom._id);
    assert.equal(repairResult.reconciledSlotsCount, 1, 'Exactly one orphaned slot must be detected and removed');

    const roomAfter = await Room.findById(testRoom._id);
    assert.equal(roomAfter.currentBookings.length, slotsCountBefore - 1);

    // Verify all remaining slots correspond to real active bookings
    for (const slot of roomAfter.currentBookings) {
      const active = await Booking.findOne({ _id: slot.bookingId, status: 'Active' });
      assert.ok(active, 'Remaining slot must correspond to an active Booking document');
    }
  });
});
