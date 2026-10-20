import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    c_password: '',
    userType: 'customer', // visible selector only — backend always creates 'customer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.c_password) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // Option B: userType is included in the request so that the server-side
      // security behavior is explicit and testable.  The backend ignores it and
      // always assigns role: 'customer' regardless of this value.
      await api.post('/SignUp', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        c_password: form.c_password,
        userType: form.userType,
      });

      navigate('/login', {
        state: { message: 'Registration successful! You can now log in.' },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-7 col-lg-6">
          <div className="card shadow-sm border-0 p-4">
            <div className="text-center mb-4">
              <h2 className="fw-bold" style={{ color: '#004080' }}>Create Your Account</h2>
              <p className="text-muted small">
                Join HotelPro to browse rooms and manage your reservations.
              </p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="regName">
                  Full Name
                </label>
                <input
                  id="regName"
                  name="name"
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="regEmail">
                  Email Address
                </label>
                <input
                  id="regEmail"
                  name="email"
                  type="email"
                  className="form-control"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold" htmlFor="regPhone">
                  Phone Number
                </label>
                <input
                  id="regPhone"
                  name="phone"
                  type="tel"
                  className="form-control"
                  required
                  placeholder="e.g. 555-0199"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="regPassword">
                    Password
                  </label>
                  <input
                    id="regPassword"
                    name="password"
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="regCPassword">
                    Confirm Password
                  </label>
                  <input
                    id="regCPassword"
                    name="c_password"
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    value={form.c_password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* ── User Type selector (R-03 / D-06) ──────────────────────────────
                  The source User Flow and PRD require a visible "User Type" field
                  with Customer/Ordinary and Admin options (DECISIONS_AND_CONFLICTS.md D-06).
                  The backend ignores this field and always creates a customer account.
                  See server/controllers/authController.js register() for enforcement.
              ─────────────────────────────────────────────────────────────────── */}
              <div className="mb-3">
                <fieldset>
                  <legend className="form-label small fw-semibold mb-2">Account Type</legend>
                  <div className="d-flex gap-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="userType"
                        id="typeCustomer"
                        value="customer"
                        checked={form.userType === 'customer'}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="typeCustomer">
                        Customer / Ordinary
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="userType"
                        id="typeAdmin"
                        value="admin"
                        checked={form.userType === 'admin'}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="typeAdmin">
                        Admin
                      </label>
                    </div>
                  </div>
                </fieldset>

                {form.userType === 'admin' && (
                  <div
                    className="alert alert-info py-2 mt-2 small mb-0"
                    role="note"
                  >
                    ℹ️ Selecting <strong>Admin</strong> during public registration does not
                    grant administrative privileges. Admin accounts must be provisioned
                    separately by an existing administrator.
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="btn w-100 fw-semibold text-white py-2 mt-2"
                style={{ background: '#004080' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="text-center mt-4 pt-2 border-top">
              <p className="text-muted small mb-0">
                Already have an account?{' '}
                <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: '#004080' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
