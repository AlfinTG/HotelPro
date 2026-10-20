import React from 'react';

/**
 * Reusable status badge. Renders text with Bootstrap badge color.
 * Active → green, Cancelled → secondary grey.
 */
export default function StatusBadge({ status }) {
  const colorMap = {
    Active: 'success',
    Cancelled: 'secondary',
    Canceled: 'secondary',
  };
  const bg = colorMap[status] || 'secondary';
  return <span className={`badge bg-${bg}`}>{status}</span>;
}
