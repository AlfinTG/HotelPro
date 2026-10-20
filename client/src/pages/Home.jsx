import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import RoomCard from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';

/**
 * Public Home page.
 * Shows hero banner, featured room previews, and About section.
 * All data from real API — no mock/hardcoded rooms.
 */
export default function Home() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomError, setRoomError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingRooms(true);
    api
      .get('/GetRooms')
      .then((res) => {
        if (!cancelled) {
          // Show up to 3 featured rooms on the home page
          setFeaturedRooms((res.data.rooms || []).slice(0, 3));
        }
      })
      .catch((err) => {
        if (!cancelled) setRoomError(err.response?.data?.message || err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingRooms(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <section
        className="text-white py-5"
        style={{
          background: 'linear-gradient(135deg, #004080 0%, #1a6bb5 60%, #003060 100%)',
          minHeight: 320,
        }}
      >
        <div className="container py-4">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <h1 className="display-4 fw-bold mb-3">
                Welcome to <span style={{ color: '#FFD700' }}>HotelPro</span>
              </h1>
              <p className="lead mb-4 opacity-90">
                Experience comfort, elegance, and world-class hospitality. Browse our
                rooms, check availability, and book your perfect stay — all in one place.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                {isAuthenticated && !isAdmin ? (
                  <Link
                    to="/rooms"
                    className="btn btn-lg fw-semibold"
                    style={{ background: '#FFD700', color: '#004080' }}
                  >
                    Browse Rooms
                  </Link>
                ) : isAdmin ? (
                  <Link
                    to="/admin"
                    className="btn btn-lg fw-semibold"
                    style={{ background: '#FFD700', color: '#004080' }}
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="btn btn-lg fw-semibold"
                      style={{ background: '#FFD700', color: '#004080' }}
                    >
                      Get Started
                    </Link>
                    <Link to="/login" className="btn btn-lg btn-outline-light">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="col-lg-5 text-center d-none d-lg-block">
              <span style={{ fontSize: 120 }}>🏨</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Rooms ───────────────────────────────────────────── */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: '#004080' }}>
              Our Rooms
            </h2>
            <p className="text-muted">
              Discover our range of carefully curated rooms for every occasion.
            </p>
          </div>

          {loadingRooms ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border" role="status" style={{ color: '#004080' }} />
              <p className="mt-2">Loading rooms…</p>
            </div>
          ) : roomError ? (
            <div className="alert alert-warning text-center">
              Unable to load rooms right now. Please try again later.
            </div>
          ) : featuredRooms.length === 0 ? (
            <div className="alert alert-info text-center">
              No rooms are currently listed. Check back soon!
            </div>
          ) : (
            <div className="row g-4">
              {featuredRooms.map((room) => (
                <div key={room._id} className="col-md-6 col-lg-4">
                  <RoomCard room={room} showBook={false} />
                </div>
              ))}
            </div>
          )}

          {featuredRooms.length > 0 && !isAdmin && (
            <div className="text-center mt-4">
              <Link
                to={isAuthenticated ? '/rooms' : '/login'}
                className="btn btn-primary btn-lg"
                style={{ background: '#004080', border: 'none' }}
              >
                {isAuthenticated ? 'View All Rooms & Book' : 'Login to Book a Room'}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── About Section ────────────────────────────────────────────── */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-md-6">
              <h2 className="fw-bold mb-3" style={{ color: '#004080' }}>
                About HotelPro
              </h2>
              <p className="text-muted">
                HotelPro is a modern hotel management system designed to deliver a
                seamless experience for guests and staff alike. Our platform handles
                room inventory, bookings, and guest management with reliability and ease.
              </p>
              <ul className="list-unstyled text-muted">
                <li className="mb-2">✅ Real-time room availability</li>
                <li className="mb-2">✅ Secure account registration and login</li>
                <li className="mb-2">✅ Easy booking and cancellation</li>
                <li className="mb-2">✅ Transparent pricing — no hidden fees</li>
              </ul>
            </div>
            <div className="col-md-6 text-center">
              <div
                className="rounded p-4 text-white"
                style={{
                  background: 'linear-gradient(135deg, #004080 0%, #1a6bb5 100%)',
                }}
              >
                <div style={{ fontSize: 64 }}>🛎️</div>
                <h4 className="fw-bold mt-2" style={{ color: '#FFD700' }}>
                  24/7 Service
                </h4>
                <p className="mb-0 opacity-90">
                  Our team is always here to ensure your stay is comfortable and
                  memorable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
