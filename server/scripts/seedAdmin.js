/**
 * server/scripts/seedAdmin.js
 *
 * Secure server-side administrator provisioning script.
 * Reads credentials from environment variables:
 *   - ADMIN_NAME (default: "System Administrator")
 *   - ADMIN_EMAIL
 *   - ADMIN_PASSWORD
 *   - ADMIN_PHONE (default: "1234567890")
 *
 * Never prints password or sensitive values to stdout.
 * Exits safely if account already exists.
 */

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { hashPassword } = require('../utils/auth');

dotenv.config();

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'System Administrator';
  const phone = process.env.ADMIN_PHONE || '1234567890';

  if (!email || !password) {
    console.error('[Admin Provisioning] ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in server/.env');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('[Admin Provisioning] ERROR: ADMIN_PASSWORD must be at least 6 characters long');
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.role === 'admin') {
        console.log(`[Admin Provisioning] Admin account already exists for ${normalizedEmail}. No action taken.`);
      } else {
        console.warn(`[Admin Provisioning] Account with email ${normalizedEmail} exists with role: "${existing.role}".`);
        console.warn('[Admin Provisioning] Refusing to silently change role or overwrite password.');
      }
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);
    const adminUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone.trim(),
      role: 'admin',
    });

    await adminUser.save();
    console.log(`[Admin Provisioning] Successfully created admin account for ${normalizedEmail}.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`[Admin Provisioning] Error: ${err.message}`);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
