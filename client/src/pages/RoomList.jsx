import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RoomCard from '../components/RoomCard';
import { useAuth } from '../context/AuthContext';

/** Valid room types from the Room model schema */
const ROOM_TYPES = ['Deluxe', 'Non-Deluxe', 'Standard', 'Suite'];

export default function RoomList() {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ── Availability filter state ────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ── Client-side filter + sort state ─────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState(''); // '' = all
  const [capacityFilter, setCapacityFilter] = useState(''); // '' = any
  const [sortOrder, setSortOrder] = useState(''); // '' | 'asc' | 'desc'

  // ── Data + UI state ──────────────────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ── Room detail modal state ──────────────────────────────────────────────
  const [detailRoom, setDetailRoom] = useState(null);

  // ── Booking panel state ──────────────────────────────────────────────────
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookFromDate, setBookFromDate] = useState('');
  const [bookToDate, setBookToDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // ── Fetch rooms from backend ─────────────────────────────────────────────
  const fetchRooms = useCallback(async (start = '', end = '') => {
    setLoading(true);
    setError(null);
    try {
      let url = '/GetRooms';
      const params = new URLSearchParams();
      if (start && end) {
        params.append('fromDate', start);
        params.append('toDate', end);
      }
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const res = await api.get(url);
      setRooms(res.data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms('', '');
  }, [fetchRooms]);

  // ── Derived: client-side filtered + sorted rooms ─────────────────────────
  const displayedRooms = useMemo(() => {
    let result = [...rooms];

    // Filter by room type
    if (typeFilter) {
      result = result.filter((r) => r.type === typeFilter);
    }

    // Filter by minimum guest capacity
    if (capacityFilter) {
      const minCap = parseInt(capacityFilter, 10);
      if (!isNaN(minCap)) {
        result = result.filter((r) => r.maxCount >= minCap);
      }
    }

    // Sort by price
    if (sortOrder === 'asc') {
      result.sort((a, b) => a.rent - b.rent);
    } else if (sortOrder === 'desc') {
      result.sort((a, b) => b.rent - a.rent);
    }

    return result;
  }, [rooms, typeFilter, capacityFilter, sortOrder]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    if (Boolean(fromDate) !== Boolean(toDate)) {
      setError('Please select both check-in and check-out dates, or clear both dates.');
      return;
    }
    if (fromDate && toDate && new Date(fromDate) >= new Date(toDate)) {
      setError('Check-out date must be strictly after Check-in date.');
      return;
    }
    setSuccess(null);
    fetchRooms(fromDate, toDate);
  };

  const handleClear = () => {
    setFromDate('');
    setToDate('');
    setError(null);
    fetchRooms('', '');
  };

  const handleResetFilters = () => {
    setTypeFilter('');
    setCapacityFilter('');
    setSortOrder('');
  };

  const handleViewDetails = (room) => {
    setDetailRoom(room);
  };

  const handleSelectRoom = (room) => {
    setDetailRoom(null);
    setSelectedRoom(room);
    setBookFromDate(fromDate || '');
    setBookToDate(toDate || '');
    setBookingError(null);
    setTimeout(() => {
      const panel = document.getElementById('bookingPanel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const estimatedDays = useMemo(() => {
    if (!bookFromDate || !bookToDate) return 0;
    const diff = Math.round((new Date(bookToDate) - new Date(bookFromDate)) / 86400000);
    return diff > 0 ? diff : 0;
  }, [bookFromDate, bookToDate]);

  const estimatedTotal = estimatedDays > 0 ? (selectedRoom?.rent || 0) * estimatedDays : 0;

  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

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

      const confirmed = res.data.booking;
      setSuccess({
        message: `Reservation confirmed for Room ${selectedRoom.roomNumber}!`,
        paymentRef: confirmed.paymentReference,
        bookingId: confirmed._id,
        total: confirmed.totalAmount,
        totalDays: confirmed.totalDays,
        roomNumber: confirmed.roomNumber,
        roomType: confirmed.roomType,
        fromDate: confirmed.fromDate,
        toDate: confirmed.toDate,
      });

      setSelectedRoom(null);
      fetchRooms(fromDate, toDate);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const hasActiveFilters = typeFilter || capacityFilter || sortOrder;

  return (
    <div className="container py-4">
      {/* ── Room Detail Modal ── */}
      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onBook={handleSelectRoom}
        />
      )}

      {/* ── Personalized Greeting ── */}
      {currentUser && (
        <div className="mb-4 p-3 bg-white rounded shadow-sm border-start border-4 border-primary d-flex justify-content-between align-items-center flex-wrap gap-2">
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
            View My Bookings →
          </button>
        </div>
      )}

      {/* ── Availability Filter ── */}
      <div className="card shadow-sm border-0 mb-3 p-3 bg-white">
        <h6 className="fw-bold mb-3" style={{ color: '#004080' }}>🗓️ Check Availability</h6>
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
                min={todayStr}
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
                min={fromDate || todayStr}
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
                <button type="button" className="btn btn-outline-secondary" onClick={handleClear}>
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ── Client-side Filters & Sort ── */}
      <div className="card shadow-sm border-0 mb-4 p-3 bg-white">
        <div className="row g-2 align-items-end">
          <div className="col-sm-4">
            <label className="form-label small fw-semibold" htmlFor="typeFilter">Room Type</label>
            <select
              id="typeFilter"
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="col-sm-4">
            <label className="form-label small fw-semibold" htmlFor="capacityFilter">
              Min. Guests
            </label>
            <select
              id="capacityFilter"
              className="form-select form-select-sm"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              <option value="">Any capacity</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}+ guests</option>
              ))}
            </select>
          </div>

          <div className="col-sm-4">
            <label className="form-label small fw-semibold" htmlFor="sortOrder">Sort by Price</label>
            <select
              id="sortOrder"
              className="form-select form-select-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="">Default order</option>
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="col-12 text-end">
              <button
                className="btn btn-sm btn-link text-muted p-0"
                onClick={handleResetFilters}
              >
                ✕ Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="alert alert-danger shadow-sm" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <h5 className="alert-heading fw-bold">🎉 {success.message}</h5>
          <div className="row g-2 small mb-2">
            <div className="col-sm-6">
              <strong>Booking ID:</strong>{' '}
              <span className="font-monospace">{String(success.bookingId).slice(-10)}</span>
            </div>
            <div className="col-sm-6">
              <strong>Payment Ref:</strong>{' '}
              <span className="font-monospace">{success.paymentRef}</span>
            </div>
            <div className="col-sm-6">
              <strong>Room:</strong> {success.roomNumber} ({success.roomType})
            </div>
            <div className="col-sm-6">
              <strong>Duration:</strong> {success.totalDays} night{success.totalDays !== 1 ? 's' : ''}
            </div>
            <div className="col-sm-6">
              <strong>Check-in:</strong>{' '}
              {success.fromDate ? new Date(success.fromDate).toLocaleDateString() : '—'}
            </div>
            <div className="col-sm-6">
              <strong>Check-out:</strong>{' '}
              {success.toDate ? new Date(success.toDate).toLocaleDateString() : '—'}
            </div>
            <div className="col-12">
              <strong>Total (Simulated Payment):</strong>{' '}
              <span className="fw-bold text-success">${success.total}</span>
            </div>
          </div>
          <hr />
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-success" onClick={() => navigate('/my-bookings')}>
              View My Bookings
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSuccess(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Room Catalog Header ── */}
      <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#004080' }}>
            Available Rooms{' '}
            {!loading && (
              <span className="text-muted fs-6">
                ({displayedRooms.length}
                {displayedRooms.length !== rooms.length ? ` of ${rooms.length}` : ''})
              </span>
            )}
          </h4>
          {fromDate && toDate && !loading && (
            <p className="small text-muted mb-0">
              Availability for{' '}
              {new Date(fromDate).toLocaleDateString()} –{' '}
              {new Date(toDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* ── Room Grid ── */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary" role="status" />
          <p className="mt-2">Searching available rooms...</p>
        </div>
      ) : displayedRooms.length === 0 ? (
        <div className="alert alert-info text-center py-5">
          <h5 className="fw-bold">
            {rooms.length === 0
              ? fromDate && toDate
                ? 'No rooms available for those dates'
                : 'No rooms found in inventory'
              : 'No rooms match your filters'}
          </h5>
          <p className="mb-2 text-muted small">
            {rooms.length === 0 && fromDate && toDate
              ? 'Try different check-in / check-out dates.'
              : 'Adjust the type, capacity, or sort filters above.'}
          </p>
          {hasActiveFilters && (
            <button className="btn btn-sm btn-outline-secondary mt-1" onClick={handleResetFilters}>
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {displayedRooms.map((room) => (
            <div key={room._id} className="col-md-6 col-lg-4">
              <RoomCard
                room={room}
                onSelect={handleSelectRoom}
                onDetails={handleViewDetails}
                selected={selectedRoom?._id === room._id}
                showBook={true}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Booking Panel ── */}
      {selectedRoom && (
        <div
          className="card shadow-lg border-0 mt-5 p-4 bg-white"
          id="bookingPanel"
          style={{ borderLeft: '4px solid #004080' }}
        >
          <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-1" style={{ color: '#004080' }}>
                Complete Reservation — Room {selectedRoom.roomNumber}
              </h4>
              <div>
                <span className="badge bg-primary me-2">{selectedRoom.type}</span>
                <span className="text-muted small">
                  ${selectedRoom.rent} / night · max {selectedRoom.maxCount} guests
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Close booking panel"
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
                  Check-in Date *
                </label>
                <input
                  id="bookFromDate"
                  type="date"
                  className="form-control"
                  required
                  min={todayStr}
                  value={bookFromDate}
                  onChange={(e) => setBookFromDate(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold" htmlFor="bookToDate">
                  Check-out Date *
                </label>
                <input
                  id="bookToDate"
                  type="date"
                  className="form-control"
                  required
                  min={bookFromDate || todayStr}
                  value={bookToDate}
                  onChange={(e) => setBookToDate(e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold">Cost Summary</label>
                <div className="form-control bg-light" style={{ height: 'auto', minHeight: '38px' }}>
                  {estimatedDays > 0 ? (
                    <div>
                      <div className="fw-bold text-primary">${estimatedTotal}</div>
                      <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                        ${selectedRoom.rent} × {estimatedDays} night{estimatedDays !== 1 ? 's' : ''}
                        {' '}(estimated)
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted small">Select valid dates</span>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated payment notice */}
            <div className="p-3 bg-light rounded border mb-4 d-flex align-items-start gap-2">
              <span className="fs-5 mt-1">💳</span>
              <div>
                <strong className="d-block small text-dark">Simulated Payment Mode</strong>
                <span className="small text-muted">
                  No real card or financial transaction is required. An instant simulated payment
                  confirmation reference will be issued on completion.
                </span>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 flex-wrap">
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
                {bookingLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Processing…
                  </>
                ) : (
                  'Confirm & Pay (Simulated)'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ── Room Detail Modal (file-local component) ────────────────────────────── */
function RoomDetailModal({ room, onClose, onBook }) {
  const typeColors = {
    Standard: 'primary',
    Deluxe: 'success',
    Suite: 'warning',
    'Non-Deluxe': 'secondary',
  };
  const badgeColor = typeColors[room.type] || 'info';

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header" style={{ background: '#004080', color: 'white' }}>
            <h5 className="modal-title fw-bold">
              Room {room.roomNumber}
              <span className={`badge bg-${badgeColor} ms-2`}>{room.type}</span>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
            />
          </div>

          <div className="modal-body p-0">
            {/* Photo */}
            {room.photos && room.photos.length > 0 ? (
              <div style={{ height: 260, overflow: 'hidden', background: '#c7d9ee' }}>
                <img
                  src={room.photos[0]}
                  alt={`Room ${room.roomNumber}`}
                  className="w-100"
                  style={{ height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ) : (
              <div
                className="d-flex align-items-center justify-content-center text-muted fw-semibold"
                style={{ height: 160, background: '#e9f0f8' }}
              >
                📷 No photo available
              </div>
            )}

            <div className="p-4">
              {/* Key stats */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="text-center p-3 rounded border bg-white">
                    <div className="fs-4 fw-bold" style={{ color: '#004080' }}>${room.rent}</div>
                    <div className="small text-muted">per night</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center p-3 rounded border bg-white">
                    <div className="fs-4 fw-bold text-success">👥 {room.maxCount}</div>
                    <div className="small text-muted">max guests</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center p-3 rounded border bg-white">
                    <div className="fs-5 fw-bold text-secondary">{room.type}</div>
                    <div className="small text-muted">room type</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center p-3 rounded border bg-white">
                    <div className="fs-5 fw-bold text-secondary">#{room.roomNumber}</div>
                    <div className="small text-muted">room number</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {room.description && (
                <div className="mb-3">
                  <h6 className="fw-bold mb-2" style={{ color: '#004080' }}>About this room</h6>
                  <p className="text-muted mb-0">{room.description}</p>
                </div>
              )}

              {/* Photo count */}
              {room.photos && room.photos.length > 1 && (
                <div className="mb-2">
                  <span className="badge bg-light text-dark border">
                    📷 {room.photos.length} photos available
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer border-top-0">
            <button className="btn btn-outline-secondary" onClick={onClose}>
              Close
            </button>
            <button
              className="btn text-white fw-semibold px-4"
              style={{ background: '#004080' }}
              onClick={() => onBook(room)}
            >
              Book This Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
