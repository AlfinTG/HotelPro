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
      await api.post('/SignUp', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        c_password: form.c_password,
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
              <h2 className="fw-bold" style={{ color: '#004080' }}>Create an Account</h2>
              <p className="text-muted small">Register as a guest to book rooms and manage reservations</p>
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
