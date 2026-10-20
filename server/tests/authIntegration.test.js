const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = require('../index');
const User = require('../models/User');
const { signToken, hashPassword } = require('../utils/auth');

let server;
let baseUrl;

// Unique prefix for this test run to prevent any collision
const runId = Date.now();
const testEmail1 = `test.user.${runId}@example.com`;
const testEmailDuplicate = `test.duplicate.${runId}@example.com`;
const testEmailAdmin = `test.admin.${runId}@example.com`;
const testPassword = 'Password123!';

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

describe('Integration: Authentication & Authorization Flow', () => {
  before(async () => {
    // Start temporary HTTP server on an ephemeral port
    await new Promise((resolve) => {
      server = http.createServer(app).listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Ensure database connection is ready
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGO_URI);
    }
  });

  after(async () => {
    // Clean up created test users
    try {
      await User.deleteMany({
        email: {
          $in: [
            testEmail1,
            testEmailDuplicate,
            testEmailAdmin,
            `normalized.${runId}@example.com`,
            // Phase 2-P3 user-type selector tests (inline deleteOne handles
            // cleanup per test, but include here as a safety net)
            `usertype.admin.${runId}@example.com`,
            `role.admin.${runId}@example.com`,
            `normal.customer.${runId}@example.com`,
          ],
        },
      });
    } catch {
      // Ignore cleanup error
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  // ── Registration Tests ────────────────────────────────────────────────────────

  test('POST /SignUp successfully registers a new customer', async () => {
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'Stage B Tester',
        email: testEmail1,
        password: testPassword,
        c_password: testPassword,
        phone: '1234567890',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.message, 'Registration successful');
    assert.ok(res.data.user);
    assert.equal(res.data.user.email, testEmail1);
    assert.equal(res.data.user.role, 'customer');
    assert.equal(res.data.user.passwordHash, undefined);

    // Verify DB stored hash, not plaintext
    const dbUser = await User.findOne({ email: testEmail1 });
    assert.ok(dbUser);
    assert.notEqual(dbUser.passwordHash, testPassword);
    assert.match(dbUser.passwordHash, /^\$2[aby]\$/);
  });

  test('POST /SignUp rejects duplicate email', async () => {
    // First registration
    await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'First User',
        email: testEmailDuplicate,
        password: testPassword,
        c_password: testPassword,
        phone: '1112223333',
      },
    });

    // Duplicate attempt
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'Duplicate Attempt',
        email: testEmailDuplicate.toUpperCase(), // Test case-insensitive duplicate check
        password: testPassword,
        c_password: testPassword,
        phone: '4445556666',
      },
    });

    assert.equal(res.status, 409);
    assert.match(res.data.message, /already exists/i);
  });

  test('POST /SignUp rejects password confirmation mismatch', async () => {
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'Mismatch User',
        email: `mismatch.${runId}@example.com`,
        password: testPassword,
        c_password: 'differentPassword999',
        phone: '1234567890',
      },
    });

    assert.equal(res.status, 400);
    assert.match(res.data.message, /passwords do not match/i);
  });

  test('POST /SignUp rejects missing required fields', async () => {
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        email: `incomplete.${runId}@example.com`,
        password: testPassword,
      },
    });

    assert.equal(res.status, 400);
  });

  test('POST /SignUp forces role to customer even if client submits role: "admin"', async () => {
    const maliciousEmail = `sneaky.admin.${runId}@example.com`;
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'Attacker',
        email: maliciousEmail,
        password: testPassword,
        c_password: testPassword,
        phone: '1234567890',
        role: 'admin',
        type: 'Admin',
        userType: 'Admin',
        isAdmin: true,
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.user.role, 'customer');

    // Confirm in DB
    const dbRecord = await User.findOne({ email: maliciousEmail });
    assert.equal(dbRecord.role, 'customer');

    await User.deleteOne({ email: maliciousEmail });
  });

  // ── Phase 2-P3: User-Type Selector security tests ────────────────────────────
  // These focused tests verify the D-06 security requirement: the client-supplied
  // userType field (from the registration form's Account Type selector) must never
  // grant administrator privileges, even when explicitly set to 'admin'.

  test('POST /SignUp with userType:"admin" in body still creates a customer account', async () => {
    const email = `usertype.admin.${runId}@example.com`;
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'UserType Admin Attempt',
        email,
        password: testPassword,
        c_password: testPassword,
        phone: '5550001111',
        userType: 'admin', // from the UI selector — must be ignored by backend
      },
    });

    assert.equal(res.status, 201, 'registration should succeed');
    assert.equal(res.data.user.role, 'customer', 'response role must be customer');
    assert.notEqual(res.data.user.role, 'admin', 'response must not report admin');

    const dbRecord = await User.findOne({ email });
    assert.ok(dbRecord, 'user must be persisted in database');
    assert.equal(dbRecord.role, 'customer', 'DB role must be customer');

    await User.deleteOne({ email });
  });

  test('POST /SignUp with role:"admin" in body still creates a customer account', async () => {
    const email = `role.admin.${runId}@example.com`;
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'Role Field Admin Attempt',
        email,
        password: testPassword,
        c_password: testPassword,
        phone: '5550002222',
        role: 'admin', // crafted privilege-escalation attempt
      },
    });

    assert.equal(res.status, 201, 'registration should succeed');
    assert.equal(res.data.user.role, 'customer', 'response role must be customer');

    const dbRecord = await User.findOne({ email });
    assert.ok(dbRecord, 'user must be persisted in database');
    assert.equal(dbRecord.role, 'customer', 'DB role must be customer');

    await User.deleteOne({ email });
  });

  test('Normal customer registration still works correctly after userType selector changes', async () => {
    const email = `normal.customer.${runId}@example.com`;
    const res = await makeRequest('/SignUp', {
      method: 'POST',
      body: {
        name: 'Normal Customer',
        email,
        password: testPassword,
        c_password: testPassword,
        phone: '5550003333',
        userType: 'customer', // explicit customer selection from the UI selector
      },
    });

    assert.equal(res.status, 201, 'normal registration must succeed');
    assert.equal(res.data.message, 'Registration successful');
    assert.equal(res.data.user.role, 'customer', 'role must be customer');
    assert.equal(res.data.user.email, email, 'email must match');
    assert.equal(res.data.user.passwordHash, undefined, 'hash must not be returned');

    // Verify login works for the new customer
    const loginRes = await makeRequest('/Login', {
      method: 'POST',
      body: { email, password: testPassword },
    });
    assert.equal(loginRes.status, 200, 'login must succeed');
    assert.equal(loginRes.data.user.role, 'customer', 'login response role must be customer');

    await User.deleteOne({ email });
  });

  // ── Login Tests ───────────────────────────────────────────────────────────────

  test('POST /Login succeeds with valid credentials and returns JWT + safe user', async () => {
    const res = await makeRequest('/Login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: testPassword,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.message, 'Login successful');
    assert.ok(res.data.token);
    assert.equal(typeof res.data.token, 'string');
    assert.equal(res.data.user.email, testEmail1);
    assert.equal(res.data.user.passwordHash, undefined);
  });

  test('POST /Login rejects invalid password with generic error', async () => {
    const res = await makeRequest('/Login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: 'wrongPasswordHere!',
      },
    });

    assert.equal(res.status, 401);
    assert.match(res.data.message, /invalid email or password/i);
  });

  test('POST /Login rejects non-existent email with generic error', async () => {
    const res = await makeRequest('/Login', {
      method: 'POST',
      body: {
        email: `nonexistent.${runId}@example.com`,
        password: testPassword,
      },
    });

    assert.equal(res.status, 401);
    assert.match(res.data.message, /invalid email or password/i);
  });

  // ── Authentication & Authorization Middleware Tests ──────────────────────────

  test('GET /api/auth/me returns 401 when Authorization header is missing', async () => {
    const res = await makeRequest('/api/auth/me');
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/me returns 401 when token is invalid or corrupted', async () => {
    const res = await makeRequest('/api/auth/me', {
      headers: {
        Authorization: 'Bearer invalid.jwt.token.string',
      },
    });
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/me returns 200 with authenticated user profile when valid token provided', async () => {
    const loginRes = await makeRequest('/Login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: testPassword,
      },
    });

    const token = loginRes.data.token;
    const res = await makeRequest('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.user.email, testEmail1);
    assert.equal(res.data.user.passwordHash, undefined);
  });

  test('GET /api/auth/admin-test returns 403 Forbidden for customer role', async () => {
    const loginRes = await makeRequest('/Login', {
      method: 'POST',
      body: {
        email: testEmail1,
        password: testPassword,
      },
    });

    const token = loginRes.data.token;
    const res = await makeRequest('/api/auth/admin-test', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(res.status, 403);
    assert.match(res.data.message, /administrator privileges required/i);
  });

  test('GET /api/auth/admin-test returns 200 OK for provisioned admin user', async () => {
    // Manually create an admin record in DB (simulating seedAdmin script)
    const adminHash = await hashPassword(testPassword);
    const adminUser = new User({
      name: 'Test Administrator',
      email: testEmailAdmin,
      passwordHash: adminHash,
      phone: '9998887777',
      role: 'admin',
    });
    await adminUser.save();

    const loginRes = await makeRequest('/Login', {
      method: 'POST',
      body: {
        email: testEmailAdmin,
        password: testPassword,
      },
    });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.data.user.role, 'admin');

    const adminToken = loginRes.data.token;
    const res = await makeRequest('/api/auth/admin-test', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.message, 'Welcome Administrator');
    assert.equal(res.data.user.role, 'admin');
  });

  test('Revoked or demoted admin cannot access admin endpoint even with previous token', async () => {
    // Demote test admin to customer in DB
    await User.updateOne({ email: testEmailAdmin }, { role: 'customer' });

    // Generate token with claims or use prior token
    const token = signToken({
      userId: (await User.findOne({ email: testEmailAdmin }))._id,
      role: 'admin', // Token claims admin, but DB now has customer!
    });

    const res = await makeRequest('/api/auth/admin-test', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Fresh DB lookup in authMiddleware ensures demotion is respected immediately
    assert.equal(res.status, 403);
  });
});
