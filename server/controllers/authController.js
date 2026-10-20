const User = require('../models/User');
const { hashPassword, comparePassword, signToken } = require('../utils/auth');

/**
 * POST /SignUp or POST /api/auth/register
 * Public registration creates customer accounts only.
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, c_password, confirmPassword, phone } = req.body;

    // Field existence validation
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Name, email, password, and phone are required' });
    }

    // Password confirmation check (support either c_password from source ERD or confirmPassword)
    const confirmation = c_password !== undefined ? c_password : confirmPassword;
    if (confirmation !== undefined && password !== confirmation) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Enforce role: 'customer' regardless of any client-supplied role, userType,
    // type, isAdmin, or any other privilege-escalation attempt in the request body.
    // This is the sole authoritative enforcement point for public registration.
    // See DECISIONS_AND_CONFLICTS.md D-06 and SECURITY.md §3.
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone.trim(),
      role: 'customer',
    });

    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      user: user.toSafeObject(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    next(err);
  }
};

/**
 * POST /Login or POST /api/auth/login
 * Validates credentials and returns JWT with safe user info.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic error to not disclose account existence
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken({
      userId: user._id,
      role: user.role,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Protected endpoint to retrieve authenticated user's profile.
 */
const getMe = async (req, res) => {
  res.status(200).json({
    user: req.user.toSafeObject(),
  });
};

module.exports = {
  register,
  login,
  getMe,
};
