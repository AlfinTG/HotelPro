const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

describe('Unit: Room & Booking Models Validation', () => {
  test('Room model validates required fields', () => {
    const room = new Room({});
    const err = room.validateSync();
    assert.ok(err);
    assert.ok(err.errors.roomNumber);
    assert.ok(err.errors.rent);
  });

  test('Room model rejects negative rent', () => {
    const room = new Room({
      roomNumber: '101',
      rent: -50,
      type: 'Standard',
    });
    const err = room.validateSync();
    assert.ok(err);
    assert.ok(err.errors.rent);
  });

  test('Room model toSafeObject formats correctly', () => {
    const room = new Room({
      roomNumber: '102',
      rent: 1500,
      type: 'Deluxe',
      photos: ['https://example.com/photo.jpg'],
    });
    const safe = room.toSafeObject();
    assert.equal(safe.roomNumber, '102');
    assert.equal(safe.type, 'Deluxe');
    assert.equal(safe.rent, 1500);
    assert.equal(safe.__v, undefined);
  });

  test('Booking model validates required fields', () => {
    const booking = new Booking({});
    const err = booking.validateSync();
    assert.ok(err);
    assert.ok(err.errors.room);
    assert.ok(err.errors.user);
    assert.ok(err.errors.fromDate);
    assert.ok(err.errors.toDate);
    assert.ok(err.errors.totalDays);
    assert.ok(err.errors.totalAmount);
  });

  test('Booking model defaults status to Active and paymentStatus to Simulated_Paid', () => {
    const booking = new Booking({
      room: '507f1f77bcf86cd799439011',
      user: '507f1f77bcf86cd799439012',
      roomType: 'Deluxe',
      roomNumber: '201',
      fromDate: new Date('2026-11-01'),
      toDate: new Date('2026-11-05'),
      totalDays: 4,
      totalAmount: 6000,
      customerPhone: '9876543210',
      customerName: 'Test Customer',
    });

    assert.equal(booking.status, 'Active');
    assert.equal(booking.paymentStatus, 'Simulated_Paid');
    assert.ok(booking.paymentReference.startsWith('SIMPAY-'));
  });
});
