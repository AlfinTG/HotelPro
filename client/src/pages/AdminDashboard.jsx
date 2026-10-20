import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const ROOM_TYPES = ['Deluxe', 'Non-Deluxe', 'Standard', 'Suite'];

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'rooms' | 'addRoom' | 'users'

  // Data states
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  // Loading & feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modals state
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editRoomLoading, setEditRoomLoading] = useState(false);
  const [editRoomError, setEditRoomError] = useState(null);

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
  const [actionLoading, setActionLoading] = useState(false);

  // ── Filters & Search state ───────────────────────────────────────────────
  // Bookings Tab Filters
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingFromDate, setBookingFromDate] = useState('');
  const [bookingToDate, setBookingToDate] = useState('');

  // Rooms Tab Filters
  const [roomSearch, setRoomSearch] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');

  // Users Tab Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // ── Data Fetching ────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch {
      // Non-critical; metrics can be derived from live arrays
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch bookings');
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/api/rooms');
      setRooms(res.data.rooms || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch rooms');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch users');
    }
  }, []);

  // Refresh all datasets simultaneously
  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchBookings(), fetchRooms(), fetchUsers(), fetchStats()]);
    } finally {
      setLoading(false);
    }
  }, [fetchBookings, fetchRooms, fetchUsers, fetchStats]);

  // Initial load: populate all counts so tabs and KPI metrics are immediately live
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ── Filtered Data Projections ────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search by Customer Name, Phone, Room Number, or Booking Reference/ID
      if (bookingSearch) {
        const q = bookingSearch.toLowerCase();
        const nameMatch = b.customerName?.toLowerCase().includes(q);
        const phoneMatch = b.customerPhone?.toLowerCase().includes(q);
        const roomMatch = b.roomNumber?.toLowerCase().includes(q);
        const refMatch = b.paymentReference?.toLowerCase().includes(q);
        const idMatch = b._id?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !roomMatch && !refMatch && !idMatch) return false;
      }

      // Status Filter
      if (bookingStatusFilter && b.status !== bookingStatusFilter) {
        return false;
      }

      // Date Range Filters
      if (bookingFromDate) {
        const bFrom = new Date(b.fromDate);
        if (bFrom < new Date(bookingFromDate)) return false;
      }
      if (bookingToDate) {
        const bTo = new Date(b.toDate);
        if (bTo > new Date(bookingToDate)) return false;
      }

      return true;
    });
  }, [bookings, bookingSearch, bookingStatusFilter, bookingFromDate, bookingToDate]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (roomSearch) {
        const q = roomSearch.toLowerCase();
        const numMatch = r.roomNumber?.toLowerCase().includes(q);
        const descMatch = r.description?.toLowerCase().includes(q);
        if (!numMatch && !descMatch) return false;
      }
      if (roomTypeFilter && r.type !== roomTypeFilter) {
        return false;
      }
      return true;
    });
  }, [rooms, roomSearch, roomTypeFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userSearch) {
        const q = userSearch.toLowerCase();
        const nameMatch = u.name?.toLowerCase().includes(q);
        const emailMatch = u.email?.toLowerCase().includes(q);
        const phoneMatch = u.phone?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !phoneMatch) return false;
      }
      if (userRoleFilter && u.role !== userRoleFilter) {
        return false;
      }
      return true;
    });
  }, [users, userSearch, userRoleFilter]);

  // Derived live KPI metrics
  const liveMetrics = useMemo(() => {
    const totalRooms = rooms.length;
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter((b) => b.status === 'Active').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'Cancelled').length;
    const totalUsers = users.length;
    const totalCustomers = users.filter((u) => u.role === 'customer').length;
    const totalAdmins = users.filter((u) => u.role === 'admin').length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'Active')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const now = new Date();
    const occupiedCount = bookings.filter((b) => {
      if (b.status !== 'Active') return false;
      const start = new Date(b.fromDate);
      const end = new Date(b.toDate);
      return start <= now && end > now;
    }).length;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

    return {
      totalRooms: stats?.totalRooms ?? totalRooms,
      totalBookings: stats?.totalBookings ?? totalBookings,
      activeBookings: stats?.activeBookings ?? activeBookings,
      cancelledBookings: stats?.cancelledBookings ?? cancelledBookings,
      totalUsers: stats?.totalUsers ?? totalUsers,
      totalCustomers: stats?.totalCustomers ?? totalCustomers,
      totalAdmins: stats?.totalAdmins ?? totalAdmins,
      totalRevenue: stats?.totalRevenue ?? totalRevenue,
      currentOccupiedRooms: stats?.currentOccupiedRooms ?? occupiedCount,
      occupancyRate: stats?.occupancyRate ?? occupancyRate,
    };
  }, [bookings, rooms, users, stats]);

  // ── Admin Actions ────────────────────────────────────────────────────────

  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this customer booking? This will immediately free the room slot.')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/cancelbooking', { bookingId });
      setSuccess(res.data.message || 'Booking cancelled successfully.');
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room from inventory?')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.delete(`/api/rooms/${roomId}`);
      setSuccess(res.data.message || 'Room deleted successfully.');
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete room.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Room Modal
  const handleOpenEditRoom = (room) => {
    setEditingRoom({
      _id: room._id,
      roomNumber: room.roomNumber || '',
      type: room.type || 'Standard',
      rent: room.rent || '',
      maxCount: room.maxCount || 2,
      photos: Array.isArray(room.photos) ? room.photos.join(', ') : '',
      description: room.description || '',
    });
    setEditRoomError(null);
  };

  // Submit Edit Room
  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;

    setEditRoomLoading(true);
    setEditRoomError(null);

    try {
      const photosArray = editingRoom.photos
        ? editingRoom.photos.split(',').map((p) => p.trim()).filter(Boolean)
        : [];

      const payload = {
        roomNumber: String(editingRoom.roomNumber).trim(),
        type: editingRoom.type,
        rent: Number(editingRoom.rent),
        maxCount: Number(editingRoom.maxCount),
        photos: photosArray,
        description: editingRoom.description.trim(),
      };

      const res = await api.put(`/api/rooms/${editingRoom._id}`, payload);
      setSuccess(`Room ${res.data.room?.roomNumber || editingRoom.roomNumber} updated successfully.`);
      setEditingRoom(null);
      await refreshAll();
    } catch (err) {
      setEditRoomError(err.response?.data?.message || err.message || 'Failed to update room.');
    } finally {
      setEditRoomLoading(false);
    }
  };

  // Add Room Submit
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
      await refreshAll();
      setActiveTab('rooms');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add room.');
    } finally {
      setAddRoomLoading(false);
    }
  };

  // Update User Role
  const handleUpdateRole = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;

    if (targetUser._id === currentUser?._id && newRole !== 'admin') {
      alert('You cannot demote your own administrator account.');
      return;
    }

    if (targetUser.role === 'admin' && newRole !== 'admin' && liveMetrics.totalAdmins <= 1) {
      alert('Cannot demote the last remaining administrator in the system.');
      return;
    }

    const confirmMsg = `Change role for ${targetUser.name} (${targetUser.email}) from "${targetUser.role}" to "${newRole}"?`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put(`/api/admin/users/${targetUser._id}/role`, { role: newRole });
      setSuccess(res.data.message || 'User role updated successfully.');
      await refreshAll();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* ── Top Header Banner ── */}
      <div
        className="p-4 rounded shadow-sm text-white mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
        style={{ background: 'linear-gradient(90deg, #004080 0%, #1a6bb5 100%)' }}
      >
        <div>
          <h2 className="fw-bold mb-1">Admin Operations Center</h2>
          <p className="mb-0 opacity-90 small">
            Logged in as <strong>{currentUser?.name}</strong> &bull; System inventory, bookings, and user administration
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
            onClick={refreshAll}
            disabled={loading || actionLoading}
            title="Refresh all dashboard statistics and tables"
          >
            <span>🔄</span> Refresh Data
          </button>
          <span className="badge px-3 py-2 text-dark fs-6" style={{ background: '#FFD700' }}>
            🛡️ Administrator
          </span>
        </div>
      </div>

      {/* ── Live Operational Metric KPI Cards ── */}
      <div className="row g-3 mb-4">
        {/* Total Rooms */}
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100 bg-white border-start border-4 border-primary">
            <div className="small text-muted fw-semibold text-uppercase">Total Rooms</div>
            <div className="d-flex align-items-baseline justify-content-between mt-1">
              <div className="fs-3 fw-bold" style={{ color: '#004080' }}>
                {liveMetrics.totalRooms}
              </div>
              <span className="badge bg-light text-primary border">Inventory</span>
            </div>
            <div className="small text-muted mt-2" style={{ fontSize: '0.8rem' }}>
              🏨 {liveMetrics.currentOccupiedRooms} occupied today ({liveMetrics.occupancyRate}%)
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100 bg-white border-start border-4 border-success">
            <div className="small text-muted fw-semibold text-uppercase">Total Bookings</div>
            <div className="d-flex align-items-baseline justify-content-between mt-1">
              <div className="fs-3 fw-bold text-success">{liveMetrics.totalBookings}</div>
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                {liveMetrics.activeBookings} Active
              </span>
            </div>
            <div className="small text-muted mt-2" style={{ fontSize: '0.8rem' }}>
              ✕ {liveMetrics.cancelledBookings} cancelled
            </div>
          </div>
        </div>

        {/* Total Confirmed Revenue */}
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100 bg-white border-start border-4 border-warning">
            <div className="small text-muted fw-semibold text-uppercase">Active Revenue</div>
            <div className="d-flex align-items-baseline justify-content-between mt-1">
              <div className="fs-3 fw-bold text-dark">${liveMetrics.totalRevenue.toLocaleString()}</div>
              <span className="badge bg-warning-subtle text-dark border border-warning-subtle">Simulated</span>
            </div>
            <div className="small text-muted mt-2" style={{ fontSize: '0.8rem' }}>
              From {liveMetrics.activeBookings} active stays
            </div>
          </div>
        </div>

        {/* Registered Users */}
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm p-3 h-100 bg-white border-start border-4 border-info">
            <div className="small text-muted fw-semibold text-uppercase">Registered Users</div>
            <div className="d-flex align-items-baseline justify-content-between mt-1">
              <div className="fs-3 fw-bold text-info">{liveMetrics.totalUsers}</div>
              <span className="badge bg-info-subtle text-info border border-info-subtle">
                {liveMetrics.totalCustomers} Customers
              </span>
            </div>
            <div className="small text-muted mt-2" style={{ fontSize: '0.8rem' }}>
              🛡️ {liveMetrics.totalAdmins} admin{liveMetrics.totalAdmins !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── Global Alerts ── */}
      {error && (
        <div className="alert alert-danger shadow-sm mb-3 d-flex justify-content-between align-items-center" role="alert">
          <div>{error}</div>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setError(null)} />
        </div>
      )}
      {success && (
        <div className="alert alert-success shadow-sm mb-3 d-flex justify-content-between align-items-center" role="alert">
          <div>{success}</div>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setSuccess(null)} />
        </div>
      )}

      {/* ── MDB Tabs Navigation ── */}
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

        {/* ── MDB Tabs Content ── */}
        <MDBTabsContent>
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: ALL BOOKINGS
             ══════════════════════════════════════════════════════════════════ */}
          <MDBTabsPane open={activeTab === 'bookings'}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-0" style={{ color: '#004080' }}>
                  System Bookings Management
                </h5>
                <small className="text-muted">
                  Showing {filteredBookings.length} of {bookings.length} reservations
                </small>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchBookings}
                disabled={loading || actionLoading}
              >
                🔄 Refresh Bookings
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 bg-light rounded border mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold" htmlFor="bookingSearchInput">
                    Search Bookings
                  </label>
                  <input
                    id="bookingSearchInput"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Customer, phone, room #, or ref..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold" htmlFor="bookingStatusSelect">
                    Status
                  </label>
                  <select
                    id="bookingStatusSelect"
                    className="form-select form-select-sm"
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold" htmlFor="bookingFromDateInput">
                    Check-in On/After
                  </label>
                  <input
                    id="bookingFromDateInput"
                    type="date"
                    className="form-control form-control-sm"
                    value={bookingFromDate}
                    onChange={(e) => setBookingFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label small fw-semibold" htmlFor="bookingToDateInput">
                    Check-out On/Before
                  </label>
                  <input
                    id="bookingToDateInput"
                    type="date"
                    className="form-control form-control-sm"
                    value={bookingToDate}
                    onChange={(e) => setBookingToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  {(bookingSearch || bookingStatusFilter || bookingFromDate || bookingToDate) && (
                    <button
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => {
                        setBookingSearch('');
                        setBookingStatusFilter('');
                        setBookingFromDate('');
                        setBookingToDate('');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 small">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="alert alert-light text-center py-4 border">
                {bookings.length === 0
                  ? 'No bookings in the system yet.'
                  : 'No bookings match your current search and filter criteria.'}
              </div>
            ) : (
              <BookingTable
                bookings={filteredBookings}
                showCustomer={true}
                onCancel={handleCancelBooking}
                onViewDetails={(booking) => setSelectedBookingDetails(booking)}
                cancelLoading={actionLoading}
              />
            )}
          </MDBTabsPane>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: ALL ROOMS
             ══════════════════════════════════════════════════════════════════ */}
          <MDBTabsPane open={activeTab === 'rooms'}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-0" style={{ color: '#004080' }}>
                  Physical Room Inventory
                </h5>
                <small className="text-muted">
                  Showing {filteredRooms.length} of {rooms.length} physical rooms
                </small>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={fetchRooms}
                  disabled={loading || actionLoading}
                >
                  🔄 Refresh Rooms
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

            {/* Filter & Search Bar */}
            <div className="p-3 bg-light rounded border mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <label className="form-label small fw-semibold" htmlFor="roomSearchInput">
                    Search Rooms
                  </label>
                  <input
                    id="roomSearchInput"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search room number or description..."
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold" htmlFor="roomTypeSelect">
                    Room Type
                  </label>
                  <select
                    id="roomTypeSelect"
                    className="form-select form-select-sm"
                    value={roomTypeFilter}
                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {ROOM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  {(roomSearch || roomTypeFilter) && (
                    <button
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => {
                        setRoomSearch('');
                        setRoomTypeFilter('');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 small">Loading room inventory...</p>
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="alert alert-light text-center py-4 border">
                {rooms.length === 0
                  ? 'No rooms in inventory. Add a room using the "Add Room" tab.'
                  : 'No rooms match your filter criteria.'}
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map((room) => (
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
                          <div className="d-flex gap-1 flex-wrap">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleOpenEditRoom(room)}
                              disabled={actionLoading}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteRoom(room._id)}
                              disabled={actionLoading}
                              title="Delete room from inventory (protected if future bookings exist)"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MDBTabsPane>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: ADD ROOM
             ══════════════════════════════════════════════════════════════════ */}
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
                          {ROOM_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
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

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: ALL USERS
             ══════════════════════════════════════════════════════════════════ */}
          <MDBTabsPane open={activeTab === 'users'}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold mb-0" style={{ color: '#004080' }}>
                  Registered Users &amp; Role Management
                </h5>
                <small className="text-muted">
                  Showing {filteredUsers.length} of {users.length} registered accounts
                </small>
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={fetchUsers}
                disabled={loading || actionLoading}
              >
                🔄 Refresh Users
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-3 bg-light rounded border mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <label className="form-label small fw-semibold" htmlFor="userSearchInput">
                    Search Users
                  </label>
                  <input
                    id="userSearchInput"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by name, email, or phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold" htmlFor="userRoleSelect">
                    Filter by Role
                  </label>
                  <select
                    id="userRoleSelect"
                    className="form-select form-select-sm"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="col-md-3">
                  {(userSearch || userRoleFilter) && (
                    <button
                      className="btn btn-sm btn-outline-secondary w-100"
                      onClick={() => {
                        setUserSearch('');
                        setUserRoleFilter('');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 small">Loading user list...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="alert alert-light text-center py-4 border">
                {users.length === 0 ? 'No registered users found.' : 'No users match your search criteria.'}
              </div>
            ) : (
              <div className="table-responsive bg-white rounded shadow-sm">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Current Role</th>
                      <th>Joined</th>
                      <th>Manage Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isSelf = u._id === currentUser?._id;
                      return (
                        <tr key={u._id}>
                          <td className="small font-monospace">{u._id.slice(-8)}</td>
                          <td className="fw-semibold">
                            {u.name}
                            {isSelf && <span className="badge bg-secondary ms-2 small">You</span>}
                          </td>
                          <td>{u.email}</td>
                          <td className="small">{u.phone || '—'}</td>
                          <td>
                            <span
                              className={`badge ${u.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}
                            >
                              {u.role === 'admin' ? 'Administrator' : 'Customer'}
                            </span>
                          </td>
                          <td className="small text-muted">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString(undefined, { timeZone: 'UTC' })
                              : '—'}
                          </td>
                          <td>
                            {isSelf ? (
                              <span className="text-muted small">Current User</span>
                            ) : (
                              <div className="d-flex gap-1">
                                {u.role === 'customer' ? (
                                  <button
                                    className="btn btn-sm btn-outline-danger py-0 px-2"
                                    onClick={() => handleUpdateRole(u, 'admin')}
                                    disabled={actionLoading}
                                    title="Promote customer to administrator"
                                  >
                                    Promote to Admin
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-outline-secondary py-0 px-2"
                                    onClick={() => handleUpdateRole(u, 'customer')}
                                    disabled={actionLoading || liveMetrics.totalAdmins <= 1}
                                    title={
                                      liveMetrics.totalAdmins <= 1
                                        ? 'Cannot demote the last remaining administrator'
                                        : 'Demote administrator to customer'
                                    }
                                  >
                                    Demote to Customer
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </MDBTabsPane>
        </MDBTabsContent>
      </div>

      {/* ── Booking Details Modal ── */}
      {selectedBookingDetails && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBookingDetails(null);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ background: '#004080', color: 'white' }}>
                <h5 className="modal-title fw-bold">
                  Booking Details — Ref #{selectedBookingDetails._id.slice(-8)}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setSelectedBookingDetails(null)}
                />
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <div className="small text-muted fw-semibold">CUSTOMER</div>
                    <div className="fs-6 fw-bold">{selectedBookingDetails.customerName}</div>
                    <div className="small text-muted">{selectedBookingDetails.customerPhone}</div>
                  </div>
                  <div className="col-sm-6">
                    <div className="small text-muted fw-semibold">ROOM RESERVED</div>
                    <div className="fs-6 fw-bold" style={{ color: '#004080' }}>
                      Room {selectedBookingDetails.roomNumber}
                    </div>
                    <span className="badge bg-secondary">{selectedBookingDetails.roomType}</span>
                  </div>
                </div>

                <hr />

                <div className="row g-3 mb-3">
                  <div className="col-sm-4">
                    <div className="small text-muted fw-semibold">CHECK-IN</div>
                    <div>
                      {selectedBookingDetails.fromDate
                        ? new Date(selectedBookingDetails.fromDate).toLocaleDateString(undefined, {
                            timeZone: 'UTC',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="small text-muted fw-semibold">CHECK-OUT</div>
                    <div>
                      {selectedBookingDetails.toDate
                        ? new Date(selectedBookingDetails.toDate).toLocaleDateString(undefined, {
                            timeZone: 'UTC',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="small text-muted fw-semibold">STAY DURATION</div>
                    <div>
                      {selectedBookingDetails.totalDays} night
                      {selectedBookingDetails.totalDays !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-sm-4">
                    <div className="small text-muted fw-semibold">TOTAL AMOUNT</div>
                    <div className="fs-5 fw-bold text-success">${selectedBookingDetails.totalAmount}</div>
                  </div>
                  <div className="col-sm-4">
                    <div className="small text-muted fw-semibold">STATUS</div>
                    <StatusBadge status={selectedBookingDetails.status} />
                  </div>
                  <div className="col-sm-4">
                    <div className="small text-muted fw-semibold">PAYMENT STATUS</div>
                    <div className="small fw-semibold">
                      {selectedBookingDetails.paymentStatus?.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded border small">
                  <div>
                    <strong>Payment Reference:</strong>{' '}
                    <span className="font-monospace">{selectedBookingDetails.paymentReference || '—'}</span>
                  </div>
                  <div>
                    <strong>Full Booking ID:</strong>{' '}
                    <span className="font-monospace">{selectedBookingDetails._id}</span>
                  </div>
                  <div>
                    <strong>Booked At:</strong>{' '}
                    {selectedBookingDetails.createdAt
                      ? new Date(selectedBookingDetails.createdAt).toLocaleString()
                      : '—'}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 d-flex justify-content-between">
                <div>
                  {selectedBookingDetails.status === 'Active' && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => {
                        const bId = selectedBookingDetails._id;
                        setSelectedBookingDetails(null);
                        handleCancelBooking(bId);
                      }}
                      disabled={actionLoading}
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSelectedBookingDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Room Modal ── */}
      {editingRoom && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingRoom(null);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header" style={{ background: '#004080', color: 'white' }}>
                <h5 className="modal-title fw-bold">Edit Room {editingRoom.roomNumber}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setEditingRoom(null)}
                />
              </div>
              <form onSubmit={handleEditRoomSubmit}>
                <div className="modal-body p-4">
                  {editRoomError && (
                    <div className="alert alert-danger py-2 small mb-3">{editRoomError}</div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="editRoomNum">
                        Room Number *
                      </label>
                      <input
                        id="editRoomNum"
                        type="text"
                        className="form-control"
                        required
                        value={editingRoom.roomNumber}
                        onChange={(e) =>
                          setEditingRoom({ ...editingRoom, roomNumber: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="editRoomType">
                        Room Type *
                      </label>
                      <select
                        id="editRoomType"
                        className="form-select"
                        value={editingRoom.type}
                        onChange={(e) => setEditingRoom({ ...editingRoom, type: e.target.value })}
                      >
                        {ROOM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="editRoomRent">
                        Rent Per Day ($) *
                      </label>
                      <input
                        id="editRoomRent"
                        type="number"
                        min="1"
                        step="1"
                        className="form-control"
                        required
                        value={editingRoom.rent}
                        onChange={(e) => setEditingRoom({ ...editingRoom, rent: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold" htmlFor="editRoomMax">
                        Max Guests *
                      </label>
                      <input
                        id="editRoomMax"
                        type="number"
                        min="1"
                        className="form-control"
                        required
                        value={editingRoom.maxCount}
                        onChange={(e) =>
                          setEditingRoom({ ...editingRoom, maxCount: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold" htmlFor="editRoomPhotos">
                        Photo URLs (comma-separated)
                      </label>
                      <input
                        id="editRoomPhotos"
                        type="text"
                        className="form-control"
                        value={editingRoom.photos}
                        onChange={(e) =>
                          setEditingRoom({ ...editingRoom, photos: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold" htmlFor="editRoomDesc">
                        Description
                      </label>
                      <textarea
                        id="editRoomDesc"
                        rows="3"
                        className="form-control"
                        value={editingRoom.description}
                        onChange={(e) =>
                          setEditingRoom({ ...editingRoom, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setEditingRoom(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-semibold px-4"
                    style={{ background: '#004080' }}
                    disabled={editRoomLoading}
                  >
                    {editRoomLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
