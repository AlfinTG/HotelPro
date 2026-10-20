import React, { useState, useEffect, useCallback } from 'react';
import {
  MDBTabs,
  MDBTabsItem,
  MDBTabsLink,
  MDBTabsContent,
  MDBTabsPane,
} from 'mdb-react-ui-kit';
import api from '../utils/api';
import BookingTable from '../components/BookingTable';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'rooms' | 'addRoom' | 'users'

  // Data states
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);

  // Loading & feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add Room form state
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: 'Standard',
    rent: '',
    maxCount: 2,
    photos: '',
    description: '',
  });
  const [addRoomLoading, setAddRoomLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Bookings
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Rooms
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/GetRooms');
      setRooms(res.data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load depending on activeTab
  useEffect(() => {
    setError(null);
    setSuccess(null);
    if (activeTab === 'bookings') fetchBookings();
    else if (activeTab === 'rooms') fetchRooms();
    else if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchBookings, fetchRooms, fetchUsers]);

  // Admin Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this customer booking? This will immediately free the room slot.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/cancelbooking', { bookingId });
      setSuccess(res.data.message || 'Booking cancelled successfully.');
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Cancellation failed.');
      setLoading(false);
    }
  };

  // Admin Delete Room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room from inventory?')) {
      return;
    }

    setDeleteLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.delete(`/api/rooms/${roomId}`);
      setSuccess(res.data.message || 'Room deleted successfully.');
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete room.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Admin Create Room
  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    setAddRoomLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const photosArray = newRoom.photos
        ? newRoom.photos.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      const payload = {
        roomNumber: newRoom.roomNumber.trim(),
        type: newRoom.type,
        rent: Number(newRoom.rent),
        maxCount: Number(newRoom.maxCount),
        photos: photosArray,
        description: newRoom.description.trim(),
      };

      const res = await api.post('/api/rooms', payload);
      setSuccess(`Room ${res.data.room?.roomNumber || newRoom.roomNumber} added to inventory!`);
      setNewRoom({
        roomNumber: '',
        type: 'Standard',
        rent: '',
        maxCount: 2,
        photos: '',
        description: '',
      });
      // Switch to All Rooms tab to view newly created room
      setActiveTab('rooms');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add room.');
    } finally {
      setAddRoomLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Header banner */}
      <div
        className="p-4 rounded shadow-sm text-white mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2"
        style={{ background: 'linear-gradient(90deg, #004080 0%, #1a6bb5 100%)' }}
      >
        <div>
          <h2 className="fw-bold mb-1">Admin Operations Center</h2>
          <p className="mb-0 opacity-90 small">
            Logged in as {currentUser?.name} &bull; Manage inventory, system bookings, and users
          </p>
        </div>
        <span className="badge px-3 py-2 text-dark fs-6" style={{ background: '#FFD700' }}>
          🛡️ Administrator
        </span>
      </div>

      {/* Global Alerts */}
      {error && <div className="alert alert-danger shadow-sm mb-3">{error}</div>}
      {success && <div className="alert alert-success shadow-sm mb-3">{success}</div>}

      {/* MDB Tabs Navigation */}
      <div className="bg-white rounded shadow-sm p-3 mb-4">
        <MDBTabs className="nav-tabs mb-3 border-bottom">
          <MDBTabsItem>
            <MDBTabsLink
              onClick={() => setActiveTab('bookings')}
              active={activeTab === 'bookings'}
              className="fw-semibold px-4 py-2"
              role="tab"
              style={{
                cursor: 'pointer',
                color: activeTab === 'bookings' ? '#004080' : '#495057',
                borderBottom: activeTab === 'bookings' ? '3px solid #004080' : 'transparent',
              }}
            >
              📋 All Bookings ({bookings.length})
            </MDBTabsLink>
          </MDBTabsItem>
          <MDBTabsItem>
            <MDBTabsLink
              onClick={() => setActiveTab('rooms')}
              active={activeTab === 'rooms'}
              className="fw-semibold px-4 py-2"
              role="tab"
              style={{
                cursor: 'pointer',
                color: activeTab === 'rooms' ? '#004080' : '#495057',
                borderBottom: activeTab === 'rooms' ? '3px solid #004080' : 'transparent',
              }}
            >
              🏨 All Rooms ({rooms.length})
            </MDBTabsLink>
          </MDBTabsItem>
          <MDBTabsItem>
            <MDBTabsLink
              onClick={() => setActiveTab('addRoom')}
              active={activeTab === 'addRoom'}
              className="fw-semibold px-4 py-2"
              role="tab"
              style={{
                cursor: 'pointer',
                color: activeTab === 'addRoom' ? '#004080' : '#495057',
                borderBottom: activeTab === 'addRoom' ? '3px solid #004080' : 'transparent',
              }}
            >
              ➕ Add Room
            </MDBTabsLink>
          </MDBTabsItem>
          <MDBTabsItem>
            <MDBTabsLink
              onClick={() => setActiveTab('users')}
              active={activeTab === 'users'}
              className="fw-semibold px-4 py-2"
              role="tab"
              style={{
                cursor: 'pointer',
                color: activeTab === 'users' ? '#004080' : '#495057',
                borderBottom: activeTab === 'users' ? '3px solid #004080' : 'transparent',
              }}
            >
              👥 All Users ({users.length})
            </MDBTabsLink>
          </MDBTabsItem>
        </MDBTabs>

        {/* MDB Tabs Content */}
        <MDBTabsContent>
          {/* ── TAB 1: ALL BOOKINGS ────────────────────────────────────── */}
          <MDBTabsPane open={activeTab === 'bookings'}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#004080' }}>
                All System Bookings
              </h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchBookings} disabled={loading}>
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 small">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="alert alert-light text-center py-4 border">No bookings in the system yet.</div>
            ) : (
              <BookingTable
                bookings={bookings}
                showCustomer={true}
                onCancel={handleCancelBooking}
                cancelLoading={loading}
              />
            )}
          </MDBTabsPane>

          {/* ── TAB 2: ALL ROOMS ───────────────────────────────────────── */}
          <MDBTabsPane open={activeTab === 'rooms'}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#004080' }}>
                Physical Room Inventory
              </h5>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={fetchRooms} disabled={loading}>
                  🔄 Refresh
                </button>
                <button
                  className="btn btn-sm text-white"
                  style={{ background: '#004080' }}
                  onClick={() => setActiveTab('addRoom')}
                >
                  + Add Room
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 small">Loading room inventory...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="alert alert-light text-center py-4 border">
                No rooms in inventory. Add a room using the "Add Room" tab.
              </div>
            ) : (
              <div className="table-responsive bg-white rounded shadow-sm">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Room #</th>
                      <th>Type</th>
                      <th>Rent / Day</th>
                      <th>Max Guests</th>
                      <th>Photos</th>
                      <th>Description</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room._id}>
                        <td>
                          <span className="fw-bold font-monospace fs-6">Room {room.roomNumber}</span>
                        </td>
                        <td>
                          <span className="badge bg-primary">{room.type}</span>
                        </td>
                        <td className="fw-semibold text-primary">${room.rent}</td>
                        <td>{room.maxCount}</td>
                        <td className="small">
                          {room.photos && room.photos.length > 0 ? (
                            <span className="badge bg-light text-dark">{room.photos.length} photo(s)</span>
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </td>
                        <td className="small text-truncate" style={{ maxWidth: 220 }}>
                          {room.description || '—'}
                        </td>
                        <td>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteRoom(room._id)}
                            disabled={deleteLoading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MDBTabsPane>

          {/* ── TAB 3: ADD ROOM ────────────────────────────────────────── */}
          <MDBTabsPane open={activeTab === 'addRoom'}>
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm p-4 bg-light">
                  <h5 className="fw-bold mb-3" style={{ color: '#004080' }}>
                    Add New Physical Room to Inventory
                  </h5>
                  <p className="text-muted small mb-4">
                    Each room represents a distinct physical room with a unique room number.
                  </p>

                  <form onSubmit={handleAddRoomSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold" htmlFor="adminRoomNum">
                          Room Number *
                        </label>
                        <input
                          id="adminRoomNum"
                          type="text"
                          className="form-control"
                          required
                          placeholder="e.g. 101, 204, 305A"
                          value={newRoom.roomNumber}
                          onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold" htmlFor="adminRoomType">
                          Room Type *
                        </label>
                        <select
                          id="adminRoomType"
                          className="form-select"
                          value={newRoom.type}
                          onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                        >
                          <option value="Standard">Standard</option>
                          <option value="Deluxe">Deluxe</option>
                          <option value="Non-Deluxe">Non-Deluxe</option>
                          <option value="Suite">Suite</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold" htmlFor="adminRoomRent">
                          Rent Per Day ($) *
                        </label>
                        <input
                          id="adminRoomRent"
                          type="number"
                          min="1"
                          step="1"
                          className="form-control"
                          required
                          placeholder="e.g. 150"
                          value={newRoom.rent}
                          onChange={(e) => setNewRoom({ ...newRoom, rent: e.target.value })}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold" htmlFor="adminRoomMax">
                          Max Guests *
                        </label>
                        <input
                          id="adminRoomMax"
                          type="number"
                          min="1"
                          className="form-control"
                          required
                          value={newRoom.maxCount}
                          onChange={(e) => setNewRoom({ ...newRoom, maxCount: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold" htmlFor="adminRoomPhotos">
                          Photo URLs (comma-separated)
                        </label>
                        <input
                          id="adminRoomPhotos"
                          type="text"
                          className="form-control"
                          placeholder="https://images.unsplash.com/..., https://..."
                          value={newRoom.photos}
                          onChange={(e) => setNewRoom({ ...newRoom, photos: e.target.value })}
                        />
                        <div className="form-text small">Enter image URLs separated by commas.</div>
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold" htmlFor="adminRoomDesc">
                          Description
                        </label>
                        <textarea
                          id="adminRoomDesc"
                          rows="3"
                          className="form-control"
                          placeholder="Describe room features, bed configuration, views, and amenities..."
                          value={newRoom.description}
                          onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                        />
                      </div>

                      <div className="col-12 mt-4">
                        <button
                          type="submit"
                          className="btn text-white w-100 fw-semibold py-2"
                          style={{ background: '#004080' }}
                          disabled={addRoomLoading}
                        >
                          {addRoomLoading ? 'Adding Room...' : 'Create Room'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </MDBTabsPane>

          {/* ── TAB 4: ALL USERS ────────────────────────────────────────── */}
          <MDBTabsPane open={activeTab === 'users'}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0" style={{ color: '#004080' }}>
                Registered Users &amp; Roles
              </h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchUsers} disabled={loading}>
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 small">Loading user list...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="alert alert-light text-center py-4 border">No registered users found.</div>
            ) : (
              <div className="table-responsive bg-white rounded shadow-sm">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td className="small font-monospace">{u._id.slice(-8)}</td>
                        <td className="fw-semibold">{u.name}</td>
                        <td>{u.email}</td>
                        <td className="small">{u.phone || '—'}</td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === 'admin' ? 'bg-danger' : 'bg-primary'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MDBTabsPane>
        </MDBTabsContent>
      </div>
    </div>
  );
}
