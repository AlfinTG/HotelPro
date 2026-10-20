const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { hashPassword, comparePassword, signToken, verifyToken } = require('../utils/auth');
const User = require('../models/User');

describe('Unit: Auth Utilities & User Model', () => {
  process.env.JWT_SECRET = 'test-secret-key-1234567890-secure';

  test('hashPassword creates a valid bcrypt hash and comparePassword validates match', async () => {
    const password = 'mySecretPassword123';
    const hash = await hashPassword(password);

    assert.notEqual(hash, password);
    assert.match(hash, /^\$2[aby]\$\d+\$/);

    const isMatch = await comparePassword(password, hash);
    assert.equal(isMatch, true);

    const isWrongMatch = await comparePassword('wrongPassword', hash);
    assert.equal(isWrongMatch, false);
  });

  test('signToken creates a valid JWT and verifyToken decodes expected payload', () => {
    const payload = { userId: '507f1f77bcf86cd799439011', role: 'customer' };
    const token = signToken(payload);

    assert.equal(typeof token, 'string');
    assert.equal(token.split('.').length, 3);

    const decoded = verifyToken(token);
    assert.equal(decoded.userId, payload.userId);
    assert.equal(decoded.role, payload.role);
    assert.ok(decoded.exp);
  });

  test('verifyToken throws on invalid or tampered token', () => {
    assert.throws(() => {
      verifyToken('invalid.token.here');
    });
  });

  test('User model validation rejects missing required fields', () => {
    const user = new User({});
    const err = user.validateSync();
    assert.ok(err);
    assert.ok(err.errors.name);
    assert.ok(err.errors.email);
    assert.ok(err.errors.passwordHash);
    assert.ok(err.errors.phone);
  });

  test('User model normalizes email to lowercase and trims whitespace', () => {
    const user = new User({
      name: 'Test Person',
      email: '  TEST.USER@Example.COM  ',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      phone: '1234567890',
    });
    assert.equal(user.email, 'test.user@example.com');
  });

  test('User model toSafeObject strips passwordHash and __v', () => {
    const user = new User({
      name: 'Safe User',
      email: 'safe@example.com',
      passwordHash: 'secretHash123',
      phone: '9876543210',
      role: 'customer',
    });

    const safe = user.toSafeObject();
    assert.equal(safe.name, 'Safe User');
    assert.equal(safe.email, 'safe@example.com');
    assert.equal(safe.role, 'customer');
    assert.equal(safe.passwordHash, undefined);
    assert.equal(safe.__v, undefined);
  });
});
