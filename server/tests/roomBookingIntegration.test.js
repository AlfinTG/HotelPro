const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Ensure DNS fallback is applied
require('../config/db');

const app = require('../index');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { signToken, hashPassword } = require('../utils/auth');

let server;
let baseUrl;

const runId = Date.now();
const adminEmail = `room.admin.${runId}@example.com`;
const customerEmail1 = `cust.one.${runId}@example.com`;
const customerEmail2 = `cust.two.${runId}@example.com`;
const testPassword = 'Password123!';

let adminToken;
let customer1Token;
let customer2Token;
let customer1User;
let customer2User;

let testRoom1;
let testRoom2;

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

describe('Integration: Room & Booking Management Lifecycle', () => {
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

    // Create Admin user
    const adminUser = new User({
      name: 'Stage C Admin',
      email: adminEmail,
      passwordHash: hashed,
      phone: '1112223333',
      role: 'admin',
    });
    await adminUser.save();
    adminToken = signToken({ userId: adminUser._id, role: 'admin' });

    // Create Customer 1
    customer1User = new User({
      name: 'Customer One',
      email: customerEmail1,
      passwordHash: hashed,
      phone: '9876543210',
      role: 'customer',
    });
    await customer1User.save();
    customer1Token = signToken({ userId: customer1User._id, role: 'customer' });

    // Create Customer 2
    customer2User = new User({
      name: 'Customer Two',
      email: customerEmail2,
      passwordHash: hashed,
      phone: '8887776666',
      role: 'customer',
    });
    await customer2User.save();
    customer2Token = signToken({ userId: customer2User._id, role: 'customer' });
  });

  after(async () => {
    try {
      // Clean up all data created in this test run
      await User.deleteMany({ email: { $in: [adminEmail, customerEmail1, customerEmail2] } });
      if (testRoom1) await Room.deleteOne({ _id: testRoom1._id });
      if (testRoom2) await Room.deleteOne({ _id: testRoom2._id });
      await Booking.deleteMany({ user: { $in: [customer1User?._id, customer2User?._id] } });
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

  // ── Room Management Tests ───────────────────────────────────────────────────

  test('POST /api/rooms rejects unauthenticated requests with 401', async () => {
    const res = await makeRequest('/api/rooms', {
      method: 'POST',
      body: { roomNumber: `R-${runId}-1`, type: 'Deluxe', rent: 2000 },
    });
    assert.equal(res.status, 401);
  });

  test('POST /api/rooms rejects customer role with 403 Forbidden', async () => {
    const res = await makeRequest('/api/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: { roomNumber: `R-${runId}-1`, type: 'Deluxe', rent: 2000 },
    });
    assert.equal(res.status, 403);
  });

  test('POST /api/rooms allows admin to create physical rooms', async () => {
    const roomNum = `R-${runId}-1`;
    const res = await makeRequest('/api/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        roomNumber: roomNum,
        type: 'Deluxe',
        rent: 2500,
        photos: ['https://example.com/r1.jpg'],
        description: 'Spacious ocean-view deluxe room',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.room.roomNumber, roomNum);
    assert.equal(res.data.room.rent, 2500);
    testRoom1 = res.data.room;
  });

  test('POST /api/rooms rejects duplicate room numbers with 409 Conflict', async () => {
    const res = await makeRequest('/api/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        roomNumber: testRoom1.roomNumber,
        type: 'Standard',
        rent: 1200,
      },
    });

    assert.equal(res.status, 409);
    assert.match(res.data.message, /already exists/i);
  });

  test('GET /GetRooms returns public room list without requiring auth', async () => {
    // Create second room
    const resRoom2 = await makeRequest('/api/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        roomNumber: `R-${runId}-2`,
        type: 'Suite',
        rent: 5000,
        description: 'Luxury presidential suite',
      },
    });
    testRoom2 = resRoom2.data.room;

    const res = await makeRequest('/GetRooms');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.rooms));
    const found1 = res.data.rooms.find((r) => r.roomNumber === testRoom1.roomNumber);
    const found2 = res.data.rooms.find((r) => r.roomNumber === testRoom2.roomNumber);
    assert.ok(found1);
    assert.ok(found2);
    assert.equal(found1.currentBookings, undefined);
    assert.equal(found2.currentBookings, undefined);
  });

  test('GET /api/rooms/:id omits internal currentBookings slots', async () => {
    const res = await makeRequest(`/api/rooms/${testRoom1._id}`);
    assert.equal(res.status, 200);
    assert.equal(res.data.room.currentBookings, undefined);
  });

  // ── Booking Creation & Validation Tests ───────────────────────────────────────

  let activeBooking1;

  test('POST /api/bookings rejects unauthenticated requests with 401', async () => {
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      body: {
        roomId: testRoom1._id,
        fromDate: '2026-12-01',
        toDate: '2026-12-05',
      },
    });
    assert.equal(res.status, 401);
  });

  test('POST /api/bookings rejects invalid room ID format with 400', async () => {
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: {
        roomId: 'invalid-room-id-format',
        fromDate: '2026-12-01',
        toDate: '2026-12-05',
      },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /invalid room id format/i);
  });

  test('POST /cancelbooking rejects invalid booking ID format with 400', async () => {
    const res = await makeRequest('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: {
        bookingId: 'invalid-booking-id-format',
      },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /invalid booking id format/i);
  });

  test('POST /api/bookings rejects nonexistent room with 404', async () => {
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: {
        roomId: '507f1f77bcf86cd799439011',
        fromDate: '2026-12-01',
        toDate: '2026-12-05',
      },
    });
    assert.equal(res.status, 404);
  });

  test('POST /api/bookings rejects departure date before or equal to arrival date', async () => {
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: {
        roomId: testRoom1._id,
        fromDate: '2026-12-05',
        toDate: '2026-12-01', // reversed dates
      },
    });
    assert.equal(res.status, 400);
    assert.match(res.data.message, /strictly after/i);
  });

  test('POST /api/bookings creates valid booking and calculates total server-side', async () => {
    // 4 days: 2026-12-01 to 2026-12-05. Rent is 2500/day => totalAmount must be 10000.
    // Even if client attempts to send client-manipulated totalAmount or paymentStatus,
    // server calculates it authoritatively.
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: {
        roomId: testRoom1._id,
        fromDate: '2026-12-01',
        toDate: '2026-12-05',
        totalAmount: 1, // Maliciously low client amount
        status: 'Active',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.booking.totalDays, 4);
    assert.equal(res.data.booking.totalAmount, 10000); // 4 * 2500
    assert.equal(res.data.booking.status, 'Active');
    assert.equal(res.data.booking.paymentStatus, 'Simulated_Paid');
    assert.equal(res.data.booking.roomNumber, testRoom1.roomNumber);
    assert.equal(res.data.booking.customerName, 'Customer One');

    activeBooking1 = res.data.booking;
  });

  // ── Overlap & Concurrency Prevention ────────────────────────────────────────

  test('POST /api/bookings rejects overlapping active booking on same room with 409 Conflict', async () => {
    // Existing booking: 2026-12-01 to 2026-12-05
    // Overlapping attempt: 2026-12-03 to 2026-12-08
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: {
        roomId: testRoom1._id,
        fromDate: '2026-12-03',
        toDate: '2026-12-08',
      },
    });

    assert.equal(res.status, 409);
    assert.match(res.data.message, /already booked/i);
  });

  test('POST /api/bookings allows non-overlapping booking on same room', async () => {
    // Non-overlapping range: 2026-12-10 to 2026-12-12
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: {
        roomId: testRoom1._id,
        fromDate: '2026-12-10',
        toDate: '2026-12-12',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.booking.totalDays, 2);
    assert.equal(res.data.booking.totalAmount, 5000);
  });

  // ── Date-Filtered Room Availability Query ───────────────────────────────────

  test('GET /GetRooms?fromDate=...&toDate=... accurately excludes booked rooms', async () => {
    // Query range that overlaps testRoom1 (which is booked 2026-12-01 to 2026-12-05)
    const res = await makeRequest('/GetRooms?fromDate=2026-12-02&toDate=2026-12-04');
    assert.equal(res.status, 200);

    const hasRoom1 = res.data.rooms.some((r) => r.roomNumber === testRoom1.roomNumber);
    const hasRoom2 = res.data.rooms.some((r) => r.roomNumber === testRoom2.roomNumber);

    assert.equal(hasRoom1, false, 'Booked room must be excluded');
    assert.equal(hasRoom2, true, 'Available room must be included');
  });

  test('Active Booking document blocks availability and duplicate booking even when its room slot is missing', async () => {
    const fromDate = new Date('2026-12-20T00:00:00.000Z');
    const toDate = new Date('2026-12-24T00:00:00.000Z');

    // Simulate inconsistent persisted data: active Booking exists, Room.currentBookings has no matching slot.
    await Booking.create({
      room: testRoom2._id,
      user: customer1User._id,
      roomType: testRoom2.type,
      roomNumber: testRoom2.roomNumber,
      fromDate,
      toDate,
      totalDays: 4,
      totalAmount: testRoom2.rent * 4,
      customerPhone: customer1User.phone,
      customerName: customer1User.name,
      status: 'Active',
      paymentStatus: 'Simulated_Paid',
    });

    const availabilityRes = await makeRequest(
      '/GetRooms?fromDate=2026-12-21&toDate=2026-12-23'
    );
    assert.equal(availabilityRes.status, 200);
    assert.equal(
      availabilityRes.data.rooms.some((room) => room._id === testRoom2._id),
      false,
      'Room must be excluded based on the active Booking document'
    );

    const bookingRes = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: {
        roomId: testRoom2._id,
        fromDate: '2026-12-21',
        toDate: '2026-12-23',
      },
    });
    assert.equal(bookingRes.status, 409);
    assert.match(bookingRes.data.message, /already booked/i);
  });

  test('GET /GetRooms rejects partial availability date filters', async () => {
    const onlyFromDate = await makeRequest('/GetRooms?fromDate=2026-12-01');
    const onlyToDate = await makeRequest('/GetRooms?toDate=2026-12-05');
    const emptyToDate = await makeRequest('/GetRooms?fromDate=2026-12-01&toDate=');
    const emptyFromDate = await makeRequest('/GetRooms?fromDate=&toDate=2026-12-05');
    assert.equal(onlyFromDate.status, 400);
    assert.equal(onlyToDate.status, 400);
    assert.equal(emptyToDate.status, 400);
    assert.equal(emptyFromDate.status, 400);
  });

  test('GET /GetRooms returns full room list when neither date filter is provided or both are empty', async () => {
    const resNoParams = await makeRequest('/GetRooms');
    const resEmptyParams = await makeRequest('/GetRooms?fromDate=&toDate=');
    assert.equal(resNoParams.status, 200);
    assert.equal(resEmptyParams.status, 200);
    assert.equal(resEmptyParams.data.rooms.length, resNoParams.data.rooms.length);
  });

  test('GET /GetRooms rejects invalid date ranges and malformed dates', async () => {
    const invertedRes = await makeRequest('/GetRooms?fromDate=2026-12-05&toDate=2026-12-01');
    const sameDayRes = await makeRequest('/GetRooms?fromDate=2026-12-05&toDate=2026-12-05');
    const malformedRes = await makeRequest('/GetRooms?fromDate=not-a-date&toDate=2026-12-05');
    assert.equal(invertedRes.status, 400);
    assert.equal(sameDayRes.status, 400);
    assert.equal(malformedRes.status, 400);
  });

  // ── Customer Ownership & Isolation Tests ────────────────────────────────────

  test('GET /api/bookings/mine returns only the requesting customer\'s bookings', async () => {
    const res1 = await makeRequest('/api/bookings/mine', {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(res1.status, 200);
    assert.ok(res1.data.bookings.length >= 1);
    // All returned bookings must belong to customer1
    for (const b of res1.data.bookings) {
      assert.equal(b.customerName, 'Customer One');
    }

    const res2 = await makeRequest('/api/bookings/mine', {
      headers: { Authorization: `Bearer ${customer2Token}` },
    });
    assert.equal(res2.status, 200);
    for (const b of res2.data.bookings) {
      assert.equal(b.customerName, 'Customer Two');
    }
  });

  test('POST /cancelbooking rejects cross-customer cancellation with 403 Forbidden', async () => {
    // Customer 2 attempts to cancel Customer 1's booking
    const res = await makeRequest('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: { bookingId: activeBooking1._id },
    });

    assert.equal(res.status, 403);
    assert.match(res.data.message, /cannot cancel another user's booking/i);

    // Verify booking status remains Active in DB
    const booking = await Booking.findById(activeBooking1._id);
    assert.equal(booking.status, 'Active');
  });

  test('POST /cancelbooking allows owner to cancel their own booking', async () => {
    const res = await makeRequest('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: { bookingId: activeBooking1._id },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.booking.status, 'Cancelled');
  });

  test('POST /cancelbooking rejects already cancelled booking with 400', async () => {
    const res = await makeRequest('/cancelbooking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer1Token}` },
      body: { bookingId: activeBooking1._id },
    });

    assert.equal(res.status, 400);
    assert.match(res.data.message, /already cancelled/i);
  });

  test('Cancelled booking frees up dates for a new booking', async () => {
    // Now Customer 2 books testRoom1 for the exact same dates: 2026-12-01 to 2026-12-05
    const res = await makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customer2Token}` },
      body: {
        roomId: testRoom1._id,
        fromDate: '2026-12-01',
        toDate: '2026-12-05',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.booking.status, 'Active');
    assert.equal(res.data.booking.customerName, 'Customer Two');
  });

  // ── Admin-Only Endpoints ───────────────────────────────────────────────────

  test('GET /api/admin/bookings returns all bookings for admin only', async () => {
    // Customer attempt returns 403
    const custRes = await makeRequest('/api/admin/bookings', {
      headers: { Authorization: `Bearer ${customer1Token}` },
    });
    assert.equal(custRes.status, 403);

    // Admin attempt returns 200 with all bookings
    const adminRes = await makeRequest('/api/admin/bookings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminRes.status, 200);
    assert.ok(adminRes.data.total >= 2);
  });

  test('GET /api/admin/users returns all users for admin only', async () => {
    const adminRes = await makeRequest('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(adminRes.status, 200);
    assert.ok(adminRes.data.total >= 3);
    for (const u of adminRes.data.users) {
      assert.equal(u.passwordHash, undefined);
    }
  });
});
