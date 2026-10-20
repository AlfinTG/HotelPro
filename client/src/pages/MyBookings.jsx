import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

/**
 * Determine a booking's display category.
 *  - 'cancelled'  – status is Cancelled regardless of dates
 *  - 'upcoming'   – Active AND checkout date is today or in the future
 *  - 'past'       – Active AND checkout date is before today
 */
function getBookingCategory(booking) {
  if (booking.status === 'Cancelled') return 'cancelled';
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const toDateStr = (booking.toDate instanceof Date
    ? booking.toDate.toISOString()
    : String(booking.toDate || '')
  ).slice(0, 10);
  return toDateStr >= todayStr ? 'upcoming' : 'past';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Single booking detail card */
function BookingCard({ booking, onCancel, cancelLoading }) {
  const category = getBookingCategory(booking);
  const canCancel = category === 'upcoming';

  const categoryStyles = {
    upcoming: { border: '2px solid #004080', background: '#f0f5ff' },
    past: { border: '1px solid #dee2e6', background: '#f8f9fa' },
    cancelled: { border: '1px dashed #adb5bd', background: '#f8f9fa', opacity: 0.85 },
  };

  return (
    <div className="card mb-3 shadow-sm" style={categoryStyles[category]}>
      <div className="card-body">
        <div className="row g-3 align-items-start">
          {/* Room & type */}
          <div className="col-6 col-md-3">
            <div className="small text-muted fw-semibold mb-1">ROOM</div>
            <div className="fw-bold" style={{ color: '#004080' }}>
              Room {booking.roomNumber}
            </div>
            <span className="badge bg-secondary mt-1">{booking.roomType}</span>
          </div>

          {/* Dates */}
          <div className="col-6 col-md-3">
            <div className="small text-muted fw-semibold mb-1">DATES</div>
            <div className="small fw-semibold">
              {formatDate(booking.fromDate)}
            </div>
            <div className="small text-muted">to {formatDate(booking.toDate)}</div>
            <div className="small text-muted mt-1">
              {booking.totalDays} night{booking.totalDays !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Amount */}
          <div className="col-6 col-md-2">
            <div className="small text-muted fw-semibold mb-1">TOTAL</div>
            <div className="fw-bold text-success">${booking.totalAmount}</div>
            <div className="small text-muted">{booking.paymentStatus?.replace('_', ' ')}</div>
          </div>

          {/* Status */}
          <div className="col-6 col-md-2">
            <div className="small text-muted fw-semibold mb-1">STATUS</div>
            <StatusBadge status={booking.status} />
            {category === 'past' && booking.status === 'Active' && (
              <div className="small text-muted mt-1">Completed</div>
            )}
          </div>

          {/* Reference + action */}
          <div className="col-12 col-md-2 text-md-end">
            <div className="small text-muted fw-semibold mb-1">REF</div>
            <div className="font-monospace small" style={{ fontSize: '0.72rem' }}>
              {booking.paymentReference || String(booking._id).slice(-8)}
            </div>
            {canCancel && onCancel && (
              <button
                className="btn btn-outline-danger btn-sm mt-2"
                disabled={cancelLoading}
                onClick={() => onCancel(booking._id)}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past' | 'cancelled'

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/bookings/mine');
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch your bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Categorise
  const { upcoming, past, cancelled } = useMemo(() => {
    const upcoming = [];
    const past = [];
    const cancelled = [];
    for (const b of bookings) {
      const cat = getBookingCategory(b);
      if (cat === 'upcoming') upcoming.push(b);
      else if (cat === 'past') past.push(b);
      else cancelled.push(b);
    }
    return { upcoming, past, cancelled };
  }, [bookings]);

  const tabBookings = { upcoming, past, cancelled }[activeTab] || [];

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? This will free the room slot.')) {
      return;
    }

    setCancelLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/cancelbooking', { bookingId });
      setSuccess(res.data.message || 'Booking cancelled successfully.');
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  const tabConfig = [
    { key: 'upcoming', label: '🗓️ Upcoming', count: upcoming.length },
    { key: 'past', label: '✅ Past', count: past.length },
    { key: 'cancelled', label: '✕ Cancelled', count: cancelled.length },
  ];

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#004080' }}>
            My Reservations
          </h2>
          <p className="text-muted small mb-0">
            {currentUser?.name} · {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => navigate('/rooms')}
        >
          + Book Another Room
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger shadow-sm mb-3" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success shadow-sm mb-3" role="alert">
          {success}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading your reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty state */
        <div className="card border-0 shadow-sm p-5 text-center bg-white">
          <div className="display-4 text-muted mb-3">📅</div>
          <h4 className="fw-bold text-secondary mb-2">No bookings yet</h4>
          <p className="text-muted mb-4">
            You don't have any room reservations at HotelPro. Find the perfect room for your stay!
          </p>
          <div>
            <button
              className="btn text-white fw-semibold px-4 py-2"
              style={{ background: '#004080' }}
              onClick={() => navigate('/rooms')}
            >
              Browse Available Rooms
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Tab navigation */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {tabConfig.map(({ key, label, count }) => (
              <button
                key={key}
                className={`btn btn-sm fw-semibold ${
                  activeTab === key
                    ? 'text-white'
                    : 'btn-outline-secondary'
                }`}
                style={
                  activeTab === key
                    ? { background: '#004080', borderColor: '#004080' }
                    : {}
                }
                onClick={() => setActiveTab(key)}
              >
                {label}{' '}
                <span
                  className={`badge ms-1 ${
                    activeTab === key ? 'bg-white text-dark' : 'bg-secondary text-white'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tabBookings.length === 0 ? (
            <div className="alert alert-light text-center py-4 border">
              {activeTab === 'upcoming' && 'No upcoming reservations. Plan your next stay!'}
              {activeTab === 'past' && 'No past stays yet.'}
              {activeTab === 'cancelled' && 'No cancelled bookings.'}
            </div>
          ) : (
            <div>
              {activeTab === 'upcoming' && (
                <p className="small text-muted mb-3">
                  Cancellations are only available for upcoming reservations.
                </p>
              )}
              {tabBookings.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  onCancel={activeTab === 'upcoming' ? handleCancelBooking : null}
                  cancelLoading={cancelLoading}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
