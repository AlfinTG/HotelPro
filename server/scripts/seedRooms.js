/**
 * server/scripts/seedRooms.js
 *
 * Idempotent demo room seeding script.
 *
 * Inserts a representative set of demo rooms for development and demonstration
 * purposes. Checks each room by its unique roomNumber before inserting; rooms
 * that already exist in the database are skipped. No existing rooms, bookings,
 * users, or admin-edited room data are ever modified or deleted.
 *
 * Room types are constrained to the schema enum:
 *   'Deluxe' | 'Non-Deluxe' | 'Standard' | 'Suite'
 *
 * Usage:
 *   cd server && npm run seed:rooms
 *
 * Environment:
 *   Reads MONGO_URI from server/.env (via dotenv). Never logs credentials.
 */

'use strict';

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Room = require('../models/Room');

dotenv.config();

// ---------------------------------------------------------------------------
// Demo room definitions
// Ordered by roomNumber for predictable output.
// Every record must satisfy the existing Room schema validation:
//   roomNumber (String, required, unique)
//   type       (String, required, enum: Deluxe | Non-Deluxe | Standard | Suite)
//   rent       (Number, required, >= 0)
//   photos     ([String], optional)
//   description (String, optional)
//   maxCount   (Number, >= 1, default 2)
// ---------------------------------------------------------------------------
const DEMO_ROOMS = [
  {
    roomNumber: '101',
    type: 'Standard',
    rent: 2500,
    maxCount: 2,
    description:
      'A comfortable Standard room on the first floor featuring a queen-size bed, en-suite bathroom, flat-screen TV, and city-facing window. Ideal for solo travellers or couples on a short stay.',
    photos: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop',
    ],
  },
  {
    roomNumber: '102',
    type: 'Standard',
    rent: 2500,
    maxCount: 2,
    description:
      'Twin-bed Standard room with a calm garden view, writing desk, wardrobe, and free Wi-Fi. Perfect for business travellers who value quiet and convenience.',
    photos: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop',
    ],
  },
  {
    roomNumber: '201',
    type: 'Deluxe',
    rent: 4500,
    maxCount: 2,
    description:
      'Spacious Deluxe room on the second floor with king-size bed, premium rain shower, lounge seating area, and a panoramic city view. Includes complimentary breakfast.',
    photos: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&auto=format&fit=crop',
    ],
  },
  {
    roomNumber: '202',
    type: 'Deluxe',
    rent: 4800,
    maxCount: 3,
    description:
      'Luxury Deluxe family room with a king bed plus a single pull-out sofa, jacuzzi bathtub, dual vanity, and a private balcony overlooking the hotel garden.',
    photos: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop',
    ],
  },
  {
    roomNumber: '301',
    type: 'Non-Deluxe',
    rent: 1800,
    maxCount: 2,
    description:
      'Affordable Non-Deluxe room on the third floor with a double bed, attached bathroom, cable TV, and complimentary toiletries. Great value for budget-conscious guests.',
    photos: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop',
    ],
  },
  {
    roomNumber: '302',
    type: 'Non-Deluxe',
    rent: 1800,
    maxCount: 2,
    description:
      'Cosy Non-Deluxe corner room on the third floor. Features a double bed, natural lighting through large windows, and a compact bathroom with shower.',
    photos: [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop',
    ],
  },
  {
    roomNumber: '401',
    type: 'Suite',
    rent: 9500,
    maxCount: 4,
    description:
      'The signature Presidential Suite occupying the entire fourth floor. Features a separate living room, master bedroom with California king bed, kitchenette, luxury spa bathroom, and a wraparound terrace with skyline views. Butler service on request.',
    photos: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop',
    ],
  },
  {
    roomNumber: '402',
    type: 'Suite',
    rent: 8000,
    maxCount: 3,
    description:
      'Executive Suite with a king bedroom, private lounge, 55-inch OLED TV, premium minibar, soaking tub, and a glass-enclosed rainfall shower. Includes complimentary airport transfer.',
    photos: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop',
    ],
  },
];

// ---------------------------------------------------------------------------
// Main seeding function
// ---------------------------------------------------------------------------
const seedRooms = async () => {
  try {
    await connectDB();
  } catch {
    // connectDB logs the connection error internally without leaking credentials
    console.error('[Room Seeding] ERROR: Could not connect to the database. Seeding aborted.');
    process.exit(1);
  }

  let inserted = 0;
  let skipped = 0;
  const failed = [];

  console.log(`[Room Seeding] Checking ${DEMO_ROOMS.length} demo room definitions…`);

  for (const roomData of DEMO_ROOMS) {
    try {
      const existing = await Room.findOne({ roomNumber: roomData.roomNumber });

      if (existing) {
        console.log(
          `[Room Seeding]   SKIP  Room ${roomData.roomNumber} — already exists in database.`
        );
        skipped++;
        continue;
      }

      // Validate via Mongoose before saving so any schema mismatch fails fast
      const room = new Room(roomData);
      const validationError = room.validateSync();
      if (validationError) {
        const messages = Object.values(validationError.errors)
          .map((e) => e.message)
          .join(', ');
        console.error(
          `[Room Seeding]   FAIL  Room ${roomData.roomNumber} — validation error: ${messages}`
        );
        failed.push(roomData.roomNumber);
        continue;
      }

      await room.save();
      console.log(
        `[Room Seeding]   OK    Room ${roomData.roomNumber} (${roomData.type}, $${roomData.rent}/night) inserted.`
      );
      inserted++;
    } catch (err) {
      // Duplicate-key race: another process may have inserted between our
      // findOne check and save(). Treat E11000 as a benign skip.
      if (err.code === 11000) {
        console.log(
          `[Room Seeding]   SKIP  Room ${roomData.roomNumber} — duplicate key (concurrent insert).`
        );
        skipped++;
      } else {
        console.error(
          `[Room Seeding]   FAIL  Room ${roomData.roomNumber} — unexpected error: ${err.message}`
        );
        failed.push(roomData.roomNumber);
      }
    }
  }

  console.log('');
  console.log('[Room Seeding] ─────────────────────────────────────────');
  console.log(`[Room Seeding]   Inserted : ${inserted}`);
  console.log(`[Room Seeding]   Skipped  : ${skipped} (already existed)`);
  console.log(`[Room Seeding]   Failed   : ${failed.length}${failed.length ? ` (${failed.join(', ')})` : ''}`);
  console.log('[Room Seeding] ─────────────────────────────────────────');

  try {
    await mongoose.disconnect();
  } catch {
    // Ignore disconnect errors — connection will close with the process
  }

  if (failed.length > 0) {
    console.error('[Room Seeding] Seeding completed with errors. Review the FAIL lines above.');
    process.exit(1);
  }

  console.log('[Room Seeding] Done.');
  process.exit(0);
};

// Export the room definitions so test files can validate them offline
// without connecting to a database.
module.exports = { DEMO_ROOMS };

seedRooms();
