import React from 'react';
import StatusBadge from './StatusBadge';

/**
 * Reusable booking table row.
 * Props:
 *   bookings        – array of booking objects
 *   showCustomer    – boolean: include Customer column (admin view)
 *   onCancel        – function(bookingId) for cancel action (optional)
 *   cancelLoading   – boolean, disables cancel buttons while processing
 */
export default function BookingTable({ bookings, showCustomer = false, onCancel, cancelLoading = false }) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="alert alert-light text-center py-4 border">
        No bookings found.
      </div>
    );
  }

  return (
    <div className="table-responsive bg-white rounded shadow-sm">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>Booking ID</th>
            {showCustomer && <th>Customer</th>}
            <th>Room</th>
            <th>From Date</th>
            <th>To Date</th>
            <th>Days</th>
            <th>Total Amount</th>
            <th>Phone</th>
            <th>Status</th>
            {onCancel && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td className="small font-monospace">{b._id.slice(-8)}</td>
              {showCustomer && (
                <td>
                  <div className="fw-semibold">{b.customerName}</div>
                  <small className="text-muted">{b.customerPhone}</small>
                </td>
              )}
              <td>
                <strong>Room {b.roomNumber}</strong>
                <span className="badge bg-light text-dark ms-2">{b.roomType}</span>
              </td>
              <td className="small">{new Date(b.fromDate).toLocaleDateString()}</td>
              <td className="small">{new Date(b.toDate).toLocaleDateString()}</td>
              <td>{b.totalDays}d</td>
              <td className="fw-semibold" style={{ color: '#004080' }}>
                ${b.totalAmount}
              </td>
              <td className="small">{b.customerPhone}</td>
              <td>
                <StatusBadge status={b.status} />
              </td>
              {onCancel && (
                <td>
                  {b.status === 'Active' ? (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onCancel(b._id)}
                      disabled={cancelLoading}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-muted small">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
