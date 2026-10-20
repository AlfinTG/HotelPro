/**
 * Stage F – Phase 3 Admin Operations Integration Tests
 *
 * Covers:
 *   1.  GET /api/admin/stats – 401 on unauthenticated request
 *   2.  GET /api/admin/stats – 403 on customer role
 *   3.  GET /api/admin/stats – 200 and real calculated operational metrics for admin
 *   4.  PUT /api/rooms/:id – 401 on unauthenticated request
 *   5.  PUT /api/rooms/:id – 403 on customer role
 *   6.  PUT /api/rooms/:id – 200 allows admin to update room details (rent, type, capacity)
 *   7.  PUT /api/rooms/:id – 400 rejects negative rent
 *   8.  PUT /api/rooms/:id – 400 rejects invalid capacity (< 1)
 *   9.  PUT /api/rooms/:id – 409 rejects duplicate room number
 *  10.  PUT /api/rooms/:id – 404 on nonexistent room
 *  11.  DELETE /api/rooms/:id – 400 rejects deleting room with active future reservation
 *  12.  DELETE /api/rooms/:id – 200 allows deleting room without active reservations
 *  13.  PUT /api/admin/users/:id/role – 401 on unauthenticated request
 *  14.  PUT /api/admin/users/:id/role – 403 on customer role
 *  15.  PUT /api/admin/users/:id/role – 400 rejects self-demotion of current admin
 *  16.  PUT /api/admin/users/:id/role – 400 rejects invalid role string
 *  17.  PUT /api/admin/users/:id/role – 200 allows admin to promote customer to admin
 *  18.  PUT /api/admin/users/:id/role – 200 allows admin to demote admin to customer
 *  19.  GET /api/admin/users – verifies passwordHash and sensitive credentials are never exposed
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

/* ─── HTTP helper ─────────────────────────────────────────────────────────── */
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
let adminToken;
let adminUser;
let customerToken;
let targetCustomerUser;
let testRoom1;
let testRoom2;
let activeBookingId;

const runId = Date.now();

function uniqueEmail(prefix = 'admintest') {
  return `admin_test_${prefix}_${runId}_${Math.random().toString(36).slice(2)}@test.hotelpro`;
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/* ─── Setup / Teardown ────────────────────────────────────────────────────── */
before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;

  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI);
  }

  // Provision admin user
  const adminEmail = uniqueEmail('superadmin');
  adminUser = new User({
    name: 'Admin Ops User',
    email: adminEmail,
    passwordHash: await hashPassword('AdminSecurePass1!'),
    phone: '5551112222',
    role: 'admin',
  });
  await adminUser.save();

  const adminLogin = await req('/Login', {
    method: 'POST',
    body: { email: adminEmail, password: 'AdminSecurePass1!' },
  });
  assert.equal(adminLogin.status, 200, 'Admin login failed');
  adminToken = adminLogin.data.token;

  // Provision target customer user
  const custEmail = uniqueEmail('targetcust');
  targetCustomerUser = new User({
    name: 'Target Customer',
    email: custEmail,
    passwordHash: await hashPassword('CustPass1!'),
    phone: '5553334444',
    role: 'customer',
  });
  await targetCustomerUser.save();

  const custLogin = await req('/Login', {
    method: 'POST',
    body: { email: custEmail, password: 'CustPass1!' },
  });
  assert.equal(custLogin.status, 200, 'Customer login failed');
  customerToken = custLogin.data.token;

  // Seed two distinct test rooms
  testRoom1 = await Room.create({
    roomNumber: `ADM-101-${runId}`,
    type: 'Standard',
    rent: 120,
    maxCount: 2,
    photos: ['https://example.com/adm1.jpg'],
    description: 'Admin test room 1',
  });

  testRoom2 = await Room.create({
    roomNumber: `ADM-102-${runId}`,
    type: 'Deluxe',
    rent: 200,
    maxCount: 4,
    photos: ['https://example.com/adm2.jpg'],
    description: 'Admin test room 2',
  });

  // Create an active future booking on testRoom1
  const start = futureDate(15);
  const end = futureDate(18);
  const bookingRes = await req('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: {
      roomId: testRoom1._id.toString(),
      fromDate: start,
      toDate: end,
    },
  });
  assert.equal(bookingRes.status, 201, 'Setup booking creation failed');
  activeBookingId = bookingRes.data.booking._id;
});

after(async () => {
  try {
    if (testRoom1) {
      await Booking.deleteMany({ room: testRoom1._id });
      await Room.findByIdAndDelete(testRoom1._id);
    }
    if (testRoom2) {
      await Booking.deleteMany({ room: testRoom2._id });
      await Room.findByIdAndDelete(testRoom2._id);
    }
    await User.deleteMany({ email: new RegExp(`^admin_test_.*_${runId}_`) });
  } catch {
    // Ignore teardown cleanup errors
  }

  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

/* ─── Tests ───────────────────────────────────────────────────────────────── */
describe('Stage F: Phase 3 Admin Operations Tests', () => {

  // ── 1. GET /api/admin/stats ───────────────────────────────────────────────
  it('1. GET /api/admin/stats returns 401 when unauthenticated', async () => {
    const { status } = await req('/api/admin/stats');
    assert.equal(status, 401);
  });

  it('2. GET /api/admin/stats returns 403 for customer role', async () => {
    const { status } = await req('/api/admin/stats', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.equal(status, 403);
  });

  it('3. GET /api/admin/stats returns live operational metrics for admin', async () => {
    const { status, data } = await req('/api/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(status, 200);

    for (const key of [
      'totalRooms',
      'totalBookings',
      'activeBookings',
      'cancelledBookings',
      'totalUsers',
      'totalCustomers',
      'totalAdmins',
      'totalRevenue',
      'currentOccupiedRooms',
      'occupancyRate',
    ]) {
      assert.ok(key in data, `stats should contain: ${key}`);
      assert.equal(typeof data[key], 'number', `${key} should be a number`);
    }

    assert.ok(data.totalRooms >= 2, 'totalRooms should count seeded test rooms');
    assert.ok(data.totalBookings >= 1, 'totalBookings should include created test booking');
    assert.ok(data.totalRevenue > 0, 'totalRevenue should include active booking total');
  });

  // ── 2. PUT /api/rooms/:id (Edit Room) ──────────────────────────────────────
  it('4. PUT /api/rooms/:id returns 401 when unauthenticated', async () => {
    const { status } = await req(`/api/rooms/${testRoom2._id}`, {
      method: 'PUT',
      body: { rent: 250 },
    });
    assert.equal(status, 401);
  });

  it('5. PUT /api/rooms/:id returns 403 for customer role', async () => {
    const { status } = await req(`/api/rooms/${testRoom2._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { rent: 250 },
    });
    assert.equal(status, 403);
  });

  it('6. PUT /api/rooms/:id allows admin to update room details', async () => {
    const { status, data } = await req(`/api/rooms/${testRoom2._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        rent: 280,
        type: 'Suite',
        maxCount: 5,
        description: 'Updated luxury suite description',
        photos: ['https://example.com/updated1.jpg', 'https://example.com/updated2.jpg'],
      },
    });
    assert.equal(status, 200);
    assert.equal(data.room.rent, 280);
    assert.equal(data.room.type, 'Suite');
    assert.equal(data.room.maxCount, 5);
    assert.equal(data.room.description, 'Updated luxury suite description');
    assert.equal(data.room.photos.length, 2);

    // Verify database persistence
    const dbRoom = await Room.findById(testRoom2._id);
    assert.equal(dbRoom.rent, 280);
    assert.equal(dbRoom.type, 'Suite');
  });

  it('7. PUT /api/rooms/:id rejects negative rent with 400', async () => {
    const { status, data } = await req(`/api/rooms/${testRoom2._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { rent: -50 },
    });
    assert.equal(status, 400);
    assert.ok(data.message?.toLowerCase().includes('negative') || data.message?.toLowerCase().includes('rent'));
  });

  it('8. PUT /api/rooms/:id rejects invalid capacity with 400', async () => {
    const { status, data } = await req(`/api/rooms/${testRoom2._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { maxCount: 0 },
    });
    assert.equal(status, 400);
    assert.ok(data.message?.toLowerCase().includes('capacity') || data.message?.toLowerCase().includes('1'));
  });

  it('9. PUT /api/rooms/:id rejects duplicate room number with 409', async () => {
    // Attempt to rename testRoom2 to testRoom1's roomNumber
    const { status, data } = await req(`/api/rooms/${testRoom2._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { roomNumber: testRoom1.roomNumber },
    });
    assert.equal(status, 409);
    assert.ok(data.message?.toLowerCase().includes('already exists'));
  });

  it('10. PUT /api/rooms/:id returns 404 for nonexistent room', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const { status } = await req(`/api/rooms/${fakeId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { rent: 300 },
    });
    assert.equal(status, 404);
  });

  // ── 3. DELETE /api/rooms/:id (Safe Removal Workflow) ──────────────────────
  it('11. DELETE /api/rooms/:id rejects deleting room with active future reservation (400)', async () => {
    const { status, data } = await req(`/api/rooms/${testRoom1._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(status, 400);
    assert.ok(
      data.message?.toLowerCase().includes('active') ||
      data.message?.toLowerCase().includes('future') ||
      data.message?.toLowerCase().includes('reservation')
    );

    // Verify room is still in database
    const dbRoom = await Room.findById(testRoom1._id);
    assert.ok(dbRoom, 'Room with active future booking must NOT be deleted');
  });

  it('12. DELETE /api/rooms/:id allows deleting room without active reservations', async () => {
    // testRoom2 has no active bookings
    const { status, data } = await req(`/api/rooms/${testRoom2._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(status, 200);
    assert.ok(data.message?.toLowerCase().includes('deleted'));

    const dbRoom = await Room.findById(testRoom2._id);
    assert.equal(dbRoom, null, 'Room without active reservations should be deleted');
    testRoom2 = null; // Prevent double-deletion in teardown
  });

  // ── 4. PUT /api/admin/users/:id/role (User Role Management) ───────────────
  it('13. PUT /api/admin/users/:id/role returns 401 when unauthenticated', async () => {
    const { status } = await req(`/api/admin/users/${targetCustomerUser._id}/role`, {
      method: 'PUT',
      body: { role: 'admin' },
    });
    assert.equal(status, 401);
  });

  it('14. PUT /api/admin/users/:id/role returns 403 for customer role', async () => {
    const { status } = await req(`/api/admin/users/${targetCustomerUser._id}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { role: 'admin' },
    });
    assert.equal(status, 403);
  });

  it('15. PUT /api/admin/users/:id/role rejects admin self-demotion with 400', async () => {
    const { status, data } = await req(`/api/admin/users/${adminUser._id}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'customer' },
    });
    assert.equal(status, 400);
    assert.ok(data.message?.toLowerCase().includes('demote'));
  });

  it('16. PUT /api/admin/users/:id/role rejects invalid role string with 400', async () => {
    const { status, data } = await req(`/api/admin/users/${targetCustomerUser._id}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'super_hacker' },
    });
    assert.equal(status, 400);
    assert.ok(data.message?.toLowerCase().includes('invalid role'));
  });

  it('17. PUT /api/admin/users/:id/role allows admin to promote customer to admin', async () => {
    const { status, data } = await req(`/api/admin/users/${targetCustomerUser._id}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'admin' },
    });
    assert.equal(status, 200);
    assert.equal(data.user.role, 'admin');

    const updatedUser = await User.findById(targetCustomerUser._id);
    assert.equal(updatedUser.role, 'admin');
  });

  it('18. PUT /api/admin/users/:id/role allows admin to demote promoted admin back to customer', async () => {
    const { status, data } = await req(`/api/admin/users/${targetCustomerUser._id}/role`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: 'customer' },
    });
    assert.equal(status, 200);
    assert.equal(data.user.role, 'customer');

    const updatedUser = await User.findById(targetCustomerUser._id);
    assert.equal(updatedUser.role, 'customer');
  });

  // ── 5. Safe User Field Exposure Checks ────────────────────────────────────
  it('19. GET /api/admin/users returns safe user fields and never exposes passwordHash', async () => {
    const { status, data } = await req('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(status, 200);
    assert.ok(Array.isArray(data.users));
    assert.ok(data.users.length > 0);

    for (const u of data.users) {
      assert.equal(u.passwordHash, undefined, 'passwordHash must never be exposed');
      assert.equal(u.__v, undefined, '__v should not be exposed');
      assert.ok('name' in u, 'user should have name');
      assert.ok('email' in u, 'user should have email');
      assert.ok('role' in u, 'user should have role');
    }
  });

  // ── 6. Last Remaining Administrator Safeguard ──────────────────────────────
  it('20. PUT /api/admin/users/:id/role rejects demoting the last remaining administrator (400)', async () => {
    const origCount = User.countDocuments;
    User.countDocuments = async function (query) {
      if (query && query.role === 'admin') return 1;
      return origCount.call(User, query);
    };

    let anotherAdmin;
    try {
      anotherAdmin = new User({
        name: 'Secondary Admin',
        email: uniqueEmail('secondadmin'),
        passwordHash: await hashPassword('AdminPassSecret1!'),
        phone: '5552223333',
        role: 'admin',
      });
      await anotherAdmin.save();

      const { status, data } = await req(`/api/admin/users/${anotherAdmin._id}/role`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: { role: 'customer' },
      });

      assert.equal(status, 400);
      assert.ok(
        data.message?.toLowerCase().includes('last remaining administrator'),
        `Expected last-admin warning, got: ${data.message}`
      );
    } finally {
      User.countDocuments = origCount;
      if (anotherAdmin?._id) {
        await User.findByIdAndDelete(anotherAdmin._id);
      }
    }
  });
});
