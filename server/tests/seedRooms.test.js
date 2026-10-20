'use strict';

/**
 * server/tests/seedRooms.test.js
 *
 * Unit-level tests for the demo room seeding definitions.
 *
 * Approach — fully offline:
 *   - Import only the exported DEMO_ROOMS array from seedRooms.js.
 *   - Validate every record against the Room Mongoose model using validateSync()
 *     (no database connection required).
 *   - Assert structural invariants required by the schema and business rules.
 *
 * These tests do NOT connect to MongoDB. They do NOT call seedRooms() directly
 * because that function calls process.exit(). The idempotency behaviour under
 * live conditions is covered by the integration-level description in the
 * acceptance criteria; the duplicate-key guard is tested here at the model level
 * by confirming every roomNumber is unique within the seed set itself.
 */

const { describe, test, before } = require('node:test');
const assert = require('node:assert/strict');

// Import seed definitions (no DB connection triggered because module.exports
// is set before seedRooms() executes — seedRooms() calls connectDB and
// process.exit so we cannot call it safely in a test. We validate the data.)
const { DEMO_ROOMS } = require('../scripts/seedRooms');
const Room = require('../models/Room');

// Valid schema enum values
const VALID_TYPES = new Set(['Deluxe', 'Non-Deluxe', 'Standard', 'Suite']);

describe('Unit: Demo Room Seed Definitions', () => {
  // ── Structural invariants ─────────────────────────────────────────────────

  test('DEMO_ROOMS is a non-empty array', () => {
    assert.ok(Array.isArray(DEMO_ROOMS), 'DEMO_ROOMS must be an Array');
    assert.ok(DEMO_ROOMS.length > 0, 'DEMO_ROOMS must contain at least one entry');
  });

  test('Every demo room has a non-empty roomNumber string', () => {
    for (const room of DEMO_ROOMS) {
      assert.equal(typeof room.roomNumber, 'string', `roomNumber must be a string (got ${typeof room.roomNumber})`);
      assert.ok(room.roomNumber.trim().length > 0, `roomNumber must not be blank (room: ${JSON.stringify(room.roomNumber)})`);
    }
  });

  test('All roomNumber values within the seed set are unique (no duplicates)', () => {
    const seen = new Set();
    for (const room of DEMO_ROOMS) {
      assert.ok(
        !seen.has(room.roomNumber),
        `Duplicate roomNumber found in DEMO_ROOMS: "${room.roomNumber}"`
      );
      seen.add(room.roomNumber);
    }
  });

  test('Every demo room type is a valid schema enum value', () => {
    for (const room of DEMO_ROOMS) {
      assert.ok(
        VALID_TYPES.has(room.type),
        `Room ${room.roomNumber} has invalid type "${room.type}". Must be one of: ${[...VALID_TYPES].join(', ')}`
      );
    }
  });

  test('Every demo room has a positive numeric rent', () => {
    for (const room of DEMO_ROOMS) {
      assert.equal(typeof room.rent, 'number', `Room ${room.roomNumber}: rent must be a number`);
      assert.ok(room.rent > 0, `Room ${room.roomNumber}: rent must be positive, got ${room.rent}`);
    }
  });

  test('Every demo room maxCount is at least 1', () => {
    for (const room of DEMO_ROOMS) {
      const count = room.maxCount !== undefined ? room.maxCount : 2; // schema default
      assert.ok(
        Number.isInteger(count) && count >= 1,
        `Room ${room.roomNumber}: maxCount must be an integer >= 1, got ${room.maxCount}`
      );
    }
  });

  test('Every demo room photos entry is a non-empty string URL', () => {
    for (const room of DEMO_ROOMS) {
      if (!room.photos || room.photos.length === 0) continue; // photos is optional
      for (const url of room.photos) {
        assert.equal(typeof url, 'string', `Room ${room.roomNumber}: photo entry must be a string`);
        assert.ok(url.trim().length > 0, `Room ${room.roomNumber}: photo URL must not be blank`);
        assert.ok(
          url.startsWith('http://') || url.startsWith('https://'),
          `Room ${room.roomNumber}: photo URL must start with http:// or https://, got "${url}"`
        );
      }
    }
  });

  test('Every demo room description is a string (may be empty)', () => {
    for (const room of DEMO_ROOMS) {
      if (room.description !== undefined) {
        assert.equal(
          typeof room.description,
          'string',
          `Room ${room.roomNumber}: description must be a string`
        );
      }
    }
  });

  // ── Mongoose schema validation (offline) ──────────────────────────────────

  test('Every demo room passes Room model validateSync() without errors', () => {
    for (const roomData of DEMO_ROOMS) {
      const room = new Room(roomData);
      const err = room.validateSync();
      assert.equal(
        err,
        undefined,
        `Room ${roomData.roomNumber} failed schema validation: ${err ? JSON.stringify(Object.keys(err.errors)) : ''}`
      );
    }
  });

  test('Seed set covers all four schema enum types', () => {
    const typesInSeed = new Set(DEMO_ROOMS.map((r) => r.type));
    for (const expectedType of VALID_TYPES) {
      assert.ok(
        typesInSeed.has(expectedType),
        `Seed data should contain at least one room of type "${expectedType}" for demo coverage`
      );
    }
  });

  test('Seed set contains at least 6 rooms for a realistic demo catalog', () => {
    assert.ok(
      DEMO_ROOMS.length >= 6,
      `Seed set should contain at least 6 rooms for browsing/booking demo, found ${DEMO_ROOMS.length}`
    );
  });

  test('No demo room rent exceeds a reasonable demonstration cap ($50,000/night)', () => {
    for (const room of DEMO_ROOMS) {
      assert.ok(
        room.rent <= 50000,
        `Room ${room.roomNumber}: rent $${room.rent} seems unrealistically high for a demo`
      );
    }
  });
});
