import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RoomCard from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';

export default function RoomList() {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Selected room for booking
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookFromDate, setBookFromDate] = useState('');
  const [bookToDate, setBookToDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const fetchRooms = useCallback(async (start = fromDate, end = toDate) => {
    setLoading(true);
    setError(null);
    try {
      let url = '/GetRooms';
      const params = new URLSearchParams();
      if (start) params.append('fromDate', start);
      if (end) params.append('toDate', end);
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res = await api.get(url);
      setRooms(res.data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (fromDate && toDate && new Date(fromDate) >= new Date(toDate)) {
      setError('Check-out date must be strictly after Check-in date.');
      return;
    }
    fetchRooms(fromDate, toDate);
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setError(null);
    fetchRooms('', '');
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setBookFromDate(fromDate || '');
    setBookToDate(toDate || '');
    setBookingError(null);
    // Smooth scroll to booking panel
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // Calculate estimated total days and cost
  let estimatedDays = 0;
  let estimatedTotal = 0;
  if (bookFromDate && bookToDate) {
    const start = new Date(bookFromDate);
    const end = new Date(bookToDate);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diff > 0) {
      estimatedDays = diff;
      estimatedTotal = (selectedRoom?.rent || 0) * diff;
    }
  }

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedRoom || !bookFromDate || !bookToDate) {
      setBookingError('Please specify valid check-in and check-out dates.');
      return;
    }

    if (new Date(bookFromDate) >= new Date(bookToDate)) {
      setBookingError('Departure date must be after arrival date.');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setSuccess(null);

    try {
      const res = await api.post('/api/bookings', {
        roomId: selectedRoom._id,
        fromDate: bookFromDate,
        toDate: bookToDate,
      });

      const confirmedBooking = res.data.booking;
      setSuccess({
        message: `Reservation confirmed for Room ${selectedRoom.roomNumber}!`,
        paymentRef: confirmedBooking.paymentReference,
        bookingId: confirmedBooking._id,
        total: confirmedBooking.totalAmount,
      });

      setSelectedRoom(null);
      // Refresh room list with current filter
      fetchRooms(fromDate, toDate);
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
        err.message ||
        'Unable to complete reservation. The room may have been booked for these dates.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Personalized Greeting */}
      {currentUser && (
        <div className="mb-4 p-3 bg-white rounded shadow-sm border-start border-4 border-primary d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: '#004080' }}>
              Welcome, {currentUser.name}!
            </h4>
            <p className="text-muted small mb-0">Browse rooms and plan your next stay.</p>
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => navigate('/my-bookings')}
          >
            View My Bookings &rarr;
          </button>
        </div>
      )}

      {/* Date Availability Filter */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <form onSubmit={handleSearch}>
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="filterFromDate">
                Check-in Date
              </label>
              <input
                id="filterFromDate"
                type="date"
                className="form-control"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold" htmlFor="filterToDate">
                Check-out Date
              </label>
              <input
                id="filterToDate"
                type="date"
                className="form-control"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-md-4 d-flex gap-2">
              <button
                type="submit"
                className="btn text-white w-100 fw-semibold"
                style={{ background: '#004080' }}
                disabled={loading}
              >
                {loading ? 'Checking...' : 'Check Availability'}
              </button>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Global Alerts */}
      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      {success && (
        <div className="alert alert-success shadow-sm mb-4">
          <h5 className="alert-heading fw-bold">🎉 {success.message}</h5>
          <p className="mb-1">
            <strong>Booking ID:</strong> <span className="font-monospace">{success.bookingId}</span>
          </p>
          <p className="mb-1">
            <strong>Total Amount Paid:</strong> ${success.total} (Simulated)
          </p>
          <p className="mb-2">
            <strong>Simulated Payment Reference:</strong>{' '}
            <span className="font-monospace">{success.paymentRef}</span>
          </p>
          <hr />
          <button
            className="btn btn-sm btn-success"
            onClick={() => navigate('/my-bookings')}
          >
            Go to My Bookings
          </button>
        </div>
      )}

      {/* Room Catalog */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h4 className="fw-bold mb-0" style={{ color: '#004080' }}>
          Available Rooms {rooms.length > 0 && <span className="text-muted fs-6">({rooms.length})</span>}
        </h4>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Searching available rooms...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="alert alert-info text-center py-5">
          <h5>No rooms available for the selected dates</h5>
          <p className="mb-0 text-muted small">Try different dates or clear your date filter.</p>
        </div>
      ) : (
        <div className="row g-4">
          {rooms.map((room) => (
            <div key={room._id} className="col-md-6 col-lg-4">
              <RoomCard
                room={room}
                onSelect={handleSelectRoom}
                selected={selectedRoom?._id === room._id}
                showBook={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* Booking Confirmation Section */}
      {selectedRoom && (
        <div className="card shadow-lg border-2 border-primary mt-5 p-4 bg-white" id="bookingConfirmationCard">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: '#004080' }}>
                Complete Reservation — Room {selectedRoom.roomNumber}
              </h4>
              <span className="badge bg-primary me-2">{selectedRoom.type}</span>
              <span className="text-muted small">${selectedRoom.rent} / day</span>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() => setSelectedRoom(null)}
            />
          </div>

          {bookingError && (
            <div className="alert alert-danger py-2 small" role="alert">
              {bookingError}
            </div>
          )}

          <form onSubmit={handleConfirmBooking}>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold" htmlFor="bookFromDate">
                  Check-in Date
                </label>
                <input
                  id="bookFromDate"
                  type="date"
                  className="form-control"
                  required
                  value={bookFromDate}
                  onChange={(e) => setBookFromDate(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold" htmlFor="bookToDate">
                  Check-out Date
                </label>
                <input
                  id="bookToDate"
                  type="date"
                  className="form-control"
                  required
                  value={bookToDate}
                  onChange={(e) => setBookToDate(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Estimated Total</label>
                <div className="form-control bg-light fw-bold text-primary">
                  {estimatedDays > 0 ? (
                    <span>
                      ${estimatedTotal}{' '}
                      <small className="text-muted fw-normal">
                        ({estimatedDays} {estimatedDays === 1 ? 'day' : 'days'})
                      </small>
                    </span>
                  ) : (
                    <span className="text-muted fw-normal">Select valid dates</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-light rounded border mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-5">💳</span>
                <div>
                  <strong className="d-block small text-dark">Simulated Payment Mode</strong>
                  <span className="small text-muted">
                    No actual financial card or transaction is required. An instant simulated payment confirmation code will be issued.
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSelectedRoom(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white fw-semibold px-4"
                style={{ background: '#004080' }}
                disabled={bookingLoading || estimatedDays <= 0}
              >
                {bookingLoading ? 'Processing Reservation...' : 'Confirm & Pay (Simulated)'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
