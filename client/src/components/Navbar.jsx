import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Auth-aware navigation bar.
 * - Unauthenticated: Home | Login | Sign Up
 * - Customer: Rooms | My Bookings | user badge | Logout
 * - Admin: Rooms | Admin Dashboard | user badge | Logout
 */
export default function Navbar() {
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark shadow-sm"
      style={{ background: 'linear-gradient(90deg, #004080 0%, #1a6bb5 100%)' }}
    >
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4 text-white" to="/">
          🏨 HotelPro
        </Link>

        {/* Mobile toggler */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            {isAuthenticated && !isAdmin && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/rooms">
                    Rooms
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/my-bookings">
                    My Bookings
                  </Link>
                </li>
              </>
            )}
            {isAdmin && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">
                  Admin Dashboard
                </Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {isAuthenticated ? (
              <>
                <span
                  className="badge rounded-pill text-dark fw-normal px-3 py-2"
                  style={{ background: '#FFD700' }}
                >
                  Hi, {currentUser.name}{' '}
                  {isAdmin && <span className="text-uppercase small ms-1">(Admin)</span>}
                </span>
                <button
                  className="btn btn-sm btn-outline-light"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-sm btn-outline-light" to="/login">
                  Login
                </Link>
                <Link
                  className="btn btn-sm"
                  to="/register"
                  style={{ background: '#FFD700', color: '#004080', fontWeight: 600 }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
