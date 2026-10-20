import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BookingTable from '../components/BookingTable';
import { useAuth } from '../context/AuthContext';

export default function MyBookings() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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
      // Refresh list
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Cancellation failed.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#004080' }}>
            My Reservations
          </h2>
          <p className="text-muted small mb-0">
            View your active stays and past booking history
          </p>
        </div>
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => navigate('/rooms')}
        >
          + Book Another Room
        </button>
      </div>

      {error && <div className="alert alert-danger shadow-sm mb-3">{error}</div>}
      {success && <div className="alert alert-success shadow-sm mb-3">{success}</div>}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Loading your reservations...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center bg-white">
          <div className="display-4 text-muted mb-3">📅</div>
          <h4 className="fw-bold text-secondary mb-2">No bookings yet</h4>
          <p className="text-muted mb-4">
            You don't have any room reservations at HotelPro. Find the perfect room for your upcoming stay!
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
        <BookingTable
          bookings={bookings}
          showCustomer={false}
          onCancel={handleCancelBooking}
          cancelLoading={cancelLoading}
        />
      )}
    </div>
  );
}
