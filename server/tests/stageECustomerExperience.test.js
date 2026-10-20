/**
 * Stage E – Phase 2 Customer Experience Integration Tests
 *
 * Covers:
 *   1.  GET /GetRooms       – required display fields present (photos, description, maxCount, rent)
 *   2.  GET /GetRooms       – E2E test room appears with correct stored values
 *   3.  GET /GetRooms?dates – date-filtered results include unbooked rooms
 *   4.  POST /api/bookings  – past arrival date rejected (400)
 *   5.  POST /api/bookings  – reversed / equal dates rejected (400)
 *   6.  POST /api/bookings  – server calculates totalAmount (client value ignored)
 *   7.  POST /api/bookings  – overlapping booking rejected (409)
 *   8.  GET /api/bookings/mine – returns owner's bookings with required UI fields
 *   9.  POST /cancelbooking – cross-user cancellation forbidden (403)
 *  10.  POST /cancelbooking – owner cancels; status persists as Cancelled
 *  11.  POST /api/bookings  – freed room is bookable again after cancellation
 *  12.  POST /cancelbooking – double-cancellation rejected (400)
 *  13.  POST /api/bookings  – unauthenticated request returns 401
 *  14.  GET /api/admin/bookings – admin sees all system bookings
 *  15.  GET /GetRooms       – partial date filter rejected (400)
 */

'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
require('../config/db');

const app = require('../index');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { hashPassword } = require('../utils/auth');

let server;
let baseUrl;

/* ─── HTTP helpers ────────────────────────────────────────────────────────── */
async function req(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try { data = await response.json(); } catch { data = null; }
  return { status: response.status, data };
}

/* ─── Shared state ────────────────────────────────────────────────────────── */
let customerToken;
let otherToken;
let adminToken;
let testRoom;
let testBookingId;

const runId = Date.now();

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function uniqueEmail(prefix = 'user') {
  return `e2e_${prefix}_${runId}_${Math.random().toString(36).slice(2)}@test.hotelpro`;
}

async function registerAndLogin(emailPrefix, extra = {}) {
  const email = uniqueEmail(emailPrefix);
  const payload = {
    name: `E2E ${emailPrefix}`,
    email,
    password: 'TestPass1!',
    confirmPassword: 'TestPass1!',
    phone: '5550001234',
    ...extra,
  };
  const reg = await req('/SignUp', { method: 'POST', body: payload });
  assert.equal(reg.status, 201, `SignUp failed for ${emailPrefix}: ${reg.data?.message}`);
  const login = await req('/Login', {
    method: 'POST',
    body: { email, password: payload.password },
  });
  assert.equal(login.status, 200, `Login failed for ${emailPrefix}`);
  return login.data.token;
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
function pastDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/* ─── Setup / Teardown ────────────────────────────────────────────────────── */
before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  // Reconnect if a prior suite's after() called mongoose.disconnect()
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // Seed a dedicated test room
  testRoom = await Room.create({
    roomNumber: `E2E-${runId}`,
    type: 'Deluxe',
    rent: 150,
    maxCount: 3,
    photos: ['https://example.com/room-e2e.jpg'],
    description: 'Phase 2 E2E test room',
  });

  // Customer accounts via the API
  customerToken = await registerAndLogin('cust');
  otherToken = await registerAndLogin('other');

  // Admin account via DB (role cannot be set via API)
  const adminEmail = uniqueEmail('admin');
  const adminUser = new User({
    name: 'E2E Admin',
    email: adminEmail,
    passwordHash: await hashPassword('AdminPass1!'),
    phone: '5550009999',
    role: 'admin',
  });
  await adminUser.save();
  const adminLogin = await req('/Login', {
    method: 'POST',
    body: { email: adminEmail, password: 'AdminPass1!' },
  });
  assert.equal(adminLogin.status, 200, 'Admin login failed');
  adminToken = adminLogin.data.token;
});

after(async () => {
  if (testRoom) {
    await Booking.deleteMany({ room: testRoom._id });
    await Room.findByIdAndDelete(testRoom._id);
  }
  await User.deleteMany({ email: new RegExp(`^e2e_.*_${runId}_`) });
  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

/* ─── Tests ───────────────────────────────────────────────────────────────── */
describe('Stage E: Phase 2 Customer Experience Tests', () => {

  it('1. GET /GetRooms returns rooms with required display fields', async () => {
    const { status, data } = await req('/GetRooms');
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.rooms), 'rooms should be an array');
    assert.ok(data.rooms.length > 0, 'rooms array should not be empty');

    const room = data.rooms[0];
    for (const field of ['roomNumber', 'type', 'rent', 'maxCount', 'photos', 'description']) {
      assert.ok(field in room, `room should have field: ${field}`);
    }
    assert.ok(!('currentBookings' in room), 'currentBookings must NOT be exposed to clients');
  });

  it('2. GET /GetRooms includes E2E room with correct stored values', async () => {
    const { status, data } = await req('/GetRooms');
    assert.equal(status, 200);
    const found = data.rooms.find((r) => r._id === testRoom._id.toString());
    assert.ok(found, 'E2E test room should appear in room list');
    assert.equal(found.rent, 150);
    assert.equal(found.maxCount, 3);
    assert.equal(found.type, 'Deluxe');
    assert.deepEqual(found.photos, ['https://example.com/room-e2e.jpg']);
    assert.equal(found.description, 'Phase 2 E2E test room');
  });

  it('3. GET /GetRooms?dates includes unbooked room in date-filtered results', async () => {
    const { status, data } = await req(`/GetRooms?fromDate=${futureDate(70)}&toDate=${futureDate(73)}`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.rooms));
    const found = data.rooms.find((r) => r._id === testRoom._id.toString());
    assert.ok(found, 'unbooked E2E room should appear in far-future date-filtered results');
  });

  it('4. POST /api/bookings rejects arrival date in the past (400)', async () => {
    const { status, data } = await req('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        roomId: testRoom._id.toString(),
        fromDate: pastDate(3),
        toDate: futureDate(1),
      },
    });
    assert.equal(status, 400, `Expected 400, got ${status}: ${data?.message}`);
    assert.ok(
      data.message?.toLowerCase().includes('past') || data.message?.toLowerCase().includes('arrival'),
      `Expected past-date error, got: ${data?.message}`
    );
  });

  it('5. POST /api/bookings rejects checkout equal to check-in (400)', async () => {
    const date = futureDate(5);
    const { status, data } = await req('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { roomId: testRoom._id.toString(), fromDate: date, toDate: date },
    });
    assert.equal(status, 400, `Expected 400, got ${status}: ${data?.message}`);
    assert.ok(
      data.message?.toLowerCase().includes('after') || data.message?.toLowerCase().includes('departure'),
      `Expected date-order error, got: ${data?.message}`
    );
  });

  it('6. POST /api/bookings calculates totalAmount server-side (ignores client value)', async () => {
    const start = futureDate(30);
    const end = futureDate(33); // 3 nights × $150 = $450

    const { status, data } = await req('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        roomId: testRoom._id.toString(),
        fromDate: start,
        toDate: end,
        totalAmount: 99999, // should be ignored
      },
    });
    assert.equal(status, 201, `Expected 201, got ${status}: ${data?.message}`);

    const booking = data.booking;
    testBookingId = booking._id;
    assert.equal(booking.totalDays, 3, 'server should compute 3 nights');
    assert.equal(booking.totalAmount, 450, 'server should compute 3 × $150 = $450');
    assert.equal(booking.status, 'Active');
    assert.ok(booking.paymentReference, 'paymentReference should be set');
  });

  it('7. POST /api/bookings rejects overlapping booking on same room+dates (409)', async () => {
    const { status, data } = await req('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: {
        roomId: testRoom._id.toString(),
        fromDate: futureDate(30),
        toDate: futureDate(33),
      },
    });
    assert.equal(status, 409, `Expected 409, got ${status}: ${data?.message}`);
    assert.ok(
      data.message?.toLowerCase().includes('booked') ||
      data.message?.toLowerCase().includes('unavailable') ||
      data.message?.toLowerCase().includes('conflict'),
      `Expected availability conflict, got: ${data?.message}`
    );
  });

  it('8. GET /api/bookings/mine returns owner bookings with required UI fields', async () => {
    const { status, data } = await req('/api/bookings/mine', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.bookings));

    const found = data.bookings.find((b) => b._id === testBookingId);
    assert.ok(found, 'newly created booking should appear in /mine');

    for (const field of ['roomNumber', 'roomType', 'fromDate', 'toDate', 'totalDays', 'totalAmount', 'status', 'paymentReference']) {
      assert.ok(field in found, `booking should have field: ${field}`);
    }
    assert.ok(!('__v' in found), '__v should not be exposed');
  });

  it('9. POST /cancelbooking rejects cancellation by non-owner non-admin (403)', async () => {
    const { status, data } = await req('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: { bookingId: testBookingId },
    });
    assert.equal(status, 403, `Expected 403, got ${status}: ${data?.message}`);
  });

  it('10. POST /cancelbooking allows owner to cancel; persisted status becomes Cancelled', async () => {
    const { status, data } = await req('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { bookingId: testBookingId },
    });
    assert.equal(status, 200, `Expected 200, got ${status}: ${data?.message}`);
    assert.ok(data.message?.toLowerCase().includes('cancel'));

    const dbBooking = await Booking.findById(testBookingId);
    assert.equal(dbBooking.status, 'Cancelled', 'persisted status must be Cancelled');
  });

  it('11. After cancellation the same room+dates are bookable again', async () => {
    const { status, data } = await req('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: {
        roomId: testRoom._id.toString(),
        fromDate: futureDate(30),
        toDate: futureDate(33),
      },
    });
    assert.equal(status, 201, `Expected 201, got ${status}: ${data?.message}`);

    // Tidy up the secondary booking so teardown can delete the room cleanly
    if (data.booking?._id) {
      await Booking.findByIdAndDelete(data.booking._id);
      await Room.updateOne(
        { _id: testRoom._id },
        { $pull: { currentBookings: { bookingId: new mongoose.Types.ObjectId(data.booking._id) } } }
      );
    }
  });

  it('12. POST /cancelbooking rejects double-cancellation (400)', async () => {
    const { status, data } = await req('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { bookingId: testBookingId },
    });
    assert.equal(status, 400, `Expected 400, got ${status}: ${data?.message}`);
    assert.ok(
      data.message?.toLowerCase().includes('already'),
      `Expected already-cancelled error, got: ${data?.message}`
    );
  });

  it('13. POST /api/bookings returns 401 when not authenticated', async () => {
    const { status, data } = await req('/api/bookings', {
      method: 'POST',
      body: {
        roomId: testRoom._id.toString(),
        fromDate: futureDate(10),
        toDate: futureDate(12),
      },
    });
    assert.equal(status, 401, `Expected 401, got ${status}: ${data?.message}`);
    assert.ok(data?.message, 'should include a message field');
  });

  it('14. GET /api/admin/bookings returns all bookings for admin', async () => {
    const { status, data } = await req('/api/admin/bookings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.bookings));
    assert.equal(typeof data.total, 'number');
  });

  it('15. GET /GetRooms rejects partial date filter (only fromDate)', async () => {
    const { status, data } = await req(`/GetRooms?fromDate=${futureDate(1)}`);
    assert.equal(status, 400, `Expected 400 for partial date, got ${status}`);
    assert.ok(data?.message, 'should include a message field');
  });

  it('16. Boundary: Allows check-in on today date and adjacent back-to-back booking', async () => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayFormatted = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    // Booking from today for 1 night
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

    const { status, data } = await req('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        roomId: testRoom._id.toString(),
        fromDate: todayFormatted,
        toDate: tomorrowFormatted,
      },
    });
    assert.equal(status, 201, `Booking today should succeed: ${data?.message}`);
    const firstBookingId = data.booking?._id;

    // Adjacent back-to-back: arrives exactly on tomorrow (checkout date of first booking)
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const dayAfterFormatted = `${dayAfter.getFullYear()}-${pad(dayAfter.getMonth() + 1)}-${pad(dayAfter.getDate())}`;

    const { status: status2, data: data2 } = await req('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: {
        roomId: testRoom._id.toString(),
        fromDate: tomorrowFormatted,
        toDate: dayAfterFormatted,
      },
    });
    assert.equal(status2, 201, `Adjacent stay should succeed: ${data2?.message}`);
    const secondBookingId = data2.booking?._id;

    // Clean up
    if (firstBookingId) {
      await Booking.findByIdAndDelete(firstBookingId);
    }
    if (secondBookingId) {
      await Booking.findByIdAndDelete(secondBookingId);
    }
    await Room.updateOne(
      { _id: testRoom._id },
      {
        $pull: {
          currentBookings: {
            bookingId: {
              $in: [
                new mongoose.Types.ObjectId(firstBookingId),
                new mongoose.Types.ObjectId(secondBookingId),
              ],
            },
          },
        },
      }
    );
  });
});
