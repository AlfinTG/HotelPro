import React from 'react';

/**
 * Reusable room card.
 * Props:
 *   room       – room object from API
 *   onSelect   – called with room when "Book Room" is clicked (optional)
 *   selected   – boolean, highlights card when this room is selected
 *   showBook   – boolean (default true), whether to show the Book button
 *   onDelete   – called with room._id for admin delete action (optional)
 *   deleteLoading – boolean, disables delete button while processing
 */
export default function RoomCard({
  room,
  onSelect,
  selected = false,
  showBook = true,
  onDelete,
  deleteLoading = false,
}) {
  const typeColors = {
    Standard: 'primary',
    Deluxe: 'success',
    Suite: 'warning',
    'Non-Deluxe': 'secondary',
  };
  const badgeColor = typeColors[room.type] || 'info';

  return (
    <div
      className={`card h-100 shadow-sm border-0 ${selected ? 'border border-2 border-primary' : ''}`}
      style={selected ? { boxShadow: '0 0 0 3px #004080' } : {}}
    >
      {/* Room photo */}
      <div
        className="d-flex align-items-center justify-content-center overflow-hidden"
        style={{ height: 180, background: '#c7d9ee' }}
      >
        {room.photos && room.photos.length > 0 ? (
          <img
            src={room.photos[0]}
            alt={`Room ${room.roomNumber}`}
            className="w-100"
            style={{ height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.replaceWith(
                Object.assign(document.createElement('div'), {
                  className: 'd-flex align-items-center justify-content-center w-100 h-100 text-muted',
                  textContent: '📷 No Photo',
                })
              );
            }}
          />
        ) : (
          <span className="text-muted fw-semibold" style={{ color: '#004080' }}>
            Room {room.roomNumber}
          </span>
        )}
      </div>

      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-0" style={{ color: '#004080' }}>
            Room {room.roomNumber}
          </h5>
          <span className={`badge bg-${badgeColor}`}>{room.type}</span>
        </div>

        <p className="card-text small text-muted flex-grow-1">
          {room.description || 'Comfortable stay with modern amenities.'}
        </p>

        <div className="small text-muted mb-2">
          <span>👥 Max guests: {room.maxCount}</span>
        </div>

        <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
          <div>
            <span className="h5 fw-bold" style={{ color: '#004080' }}>
              ${room.rent}
            </span>
            <span className="text-muted small"> / day</span>
          </div>

          <div className="d-flex gap-1">
            {showBook && onSelect && (
              <button
                className={`btn btn-sm ${selected ? 'btn-success' : 'btn-outline-primary'}`}
                onClick={() => onSelect(room)}
              >
                {selected ? '✓ Selected' : 'Book Room'}
              </button>
            )}
            {onDelete && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => onDelete(room._id)}
                disabled={deleteLoading}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
