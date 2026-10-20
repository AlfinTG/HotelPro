import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

/**
 * RoomCarousel – accessible, responsive room-highlight carousel.
 *
 * Props:
 *   rooms           – array of room objects from GET /GetRooms
 *   isAuthenticated – boolean from AuthContext
 *   isAdmin         – boolean from AuthContext
 *
 * Design notes:
 *   - Pure-React state carousel; no Bootstrap JS, no new dependencies.
 *   - No autoplay (not required by documented requirements).
 *   - Single slide visible at a time with previous / next controls.
 *   - Dot indicators for direct navigation.
 *   - Keyboard navigation: ArrowLeft / ArrowRight on focused container.
 *   - ARIA: role="region", aria-live="polite" on slide, labelled buttons.
 *   - Consistent with HotelPro design system (#004080, #FFD700, Bootstrap).
 */

const typeColors = {
  Standard: 'primary',
  Deluxe: 'success',
  Suite: 'warning',
  'Non-Deluxe': 'secondary',
};

/** Clamp index within [0, length-1] with wrap-around. */
function wrap(index, length) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

export default function RoomCarousel({ rooms = [], isAuthenticated = false, isAdmin = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = rooms.length;

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => wrap(i - 1, total));
  }, [total]);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => wrap(i + 1, total));
  }, [total]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    },
    [handlePrev, handleNext],
  );

  if (total === 0) {
    return null; // Parent already renders empty-state message
  }

  const safeIndex = wrap(currentIndex, total);
  const room = rooms[safeIndex];
  const badgeColor = typeColors[room.type] || 'info';
  const hasPhoto = room.photos && room.photos.length > 0;
  const singleSlide = total === 1;

  return (
    <>
      {/*
        C-01 fix: inject scoped :focus-visible rule so keyboard users see an
        outline when they Tab into the carousel region, while mouse/pointer
        users do not see a distracting ring.  Using a <style> tag keeps this
        self-contained without adding a new CSS file or import.
      */}
      <style>{`
        .carousel-focus-region:focus-visible {
          outline: 3px solid #004080;
          outline-offset: 3px;
          border-radius: 4px;
        }
        .carousel-focus-region:focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>
      <div
        role="region"
        aria-label="Room highlights carousel"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onKeyDown={handleKeyDown}
        // C-01 fix: use :focus-visible so keyboard users see the outline; mouse users do not.
        // The CSS class 'carousel-focus-region' is defined inline via a <style> tag below.
        className="carousel-focus-region"
      >
      {/* ── Slide ──────────────────────────────────────────────────────── */}
      <div
        className="card border-0 shadow-sm overflow-hidden"
        style={{ maxWidth: 720, margin: '0 auto' }}
      >
        {/* Room photo */}
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ background: '#c7d9ee', height: 300, overflow: 'hidden', position: 'relative' }}
        >
          {hasPhoto ? (
            <RoomPhoto src={room.photos[0]} alt={`Room ${room.roomNumber}`} />
          ) : (
            <span
              className="text-muted fw-semibold fs-5"
              role="img"
              aria-label="No photo available"
            >
              📷 No Photo
            </span>
          )}

          {/* Slide counter badge */}
          <span
            className="badge position-absolute"
            style={{
              top: 12,
              right: 12,
              background: 'rgba(0,0,0,0.55)',
              fontSize: '0.75rem',
            }}
            aria-hidden="true"
          >
            {safeIndex + 1} / {total}
          </span>
        </div>

        {/* Slide body
            C-03 fix: removed aria-label from the aria-live container.
            aria-label on a live region causes some screen readers to repeat it
            on every update. The slide content (heading + description) is
            sufficient for the announcement. */}
        <div
          className="card-body"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h3 className="h5 mb-0 fw-bold" style={{ color: '#004080' }}>
              Room {room.roomNumber}
            </h3>
            <span className={`badge bg-${badgeColor}`}>{room.type}</span>
          </div>

          <p
            className="text-muted small mb-3"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {room.description || 'Comfortable stay with modern amenities.'}
          </p>

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <span className="h5 fw-bold mb-0" style={{ color: '#004080' }}>
                ${room.rent}
              </span>
              <span className="text-muted small"> / night</span>
              <span className="ms-3 text-muted small">👥 Max {room.maxCount}</span>
            </div>
            {/* C-02 fix: in-slide CTA removed to avoid duplication.
                The section-level CTA below the carousel in Home.jsx serves
                all users correctly and is always visible. */}
          </div>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div
        className="d-flex justify-content-center align-items-center gap-3 mt-3"
        role="group"
        aria-label="Carousel controls"
      >
        {/* Previous */}
        <button
          className="btn btn-outline-secondary btn-sm px-3"
          onClick={handlePrev}
          disabled={singleSlide}
          aria-label="Previous room"
          aria-disabled={singleSlide}
          style={{ minWidth: 80 }}
        >
          ‹ Prev
        </button>

        {/* Dot indicators */}
        <div className="d-flex gap-2" role="group" aria-label="Slide indicators">
          {rooms.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Room ${i + 1} of ${total}`}
              aria-current={i === safeIndex ? 'true' : undefined}
              style={{
                // C-04 fix: 24×24 px minimum touch target (WCAG 2.5.5).
                // Visual dot is 10×10 via inner div; transparent padding fills
                // the remaining target area without changing the design.
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                background: 'transparent',
                cursor: singleSlide ? 'default' : 'pointer',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  display: 'block',
                  background: i === safeIndex ? '#004080' : '#c7d9ee',
                  transition: 'background 0.2s',
                }}
              />
            </button>
          ))}
        </div>

        {/* Next */}
        <button
          className="btn btn-outline-secondary btn-sm px-3"
          onClick={handleNext}
          disabled={singleSlide}
          aria-label="Next room"
          aria-disabled={singleSlide}
          style={{ minWidth: 80 }}
        >
          Next ›
        </button>
      </div>
    </div>
    </>
  );
}

/**
 * Isolated photo sub-component so that onError state is per-render,
 * and does not mutate the DOM directly (safe in React SSR contexts).
 */
function RoomPhoto({ src, alt }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        className="text-muted fw-semibold fs-5"
        role="img"
        aria-label="No photo available"
      >
        📷 No Photo
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      onError={() => setErrored(true)}
    />
  );
}
