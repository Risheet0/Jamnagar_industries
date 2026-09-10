import React from 'react';

export type StatusVariant =
  | 'Active'
  | 'Inactive'
  | 'On Leave'
  | 'Terminated'
  | 'Pending'
  | 'Completed'
  | 'In Production'
  | 'Delayed'
  | 'Quality Check'
  | 'Cancelled'
  | 'Passed'
  | 'Rejected'
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | 'On Order'
  | 'Active Production'
  | 'Sample / Prototype'
  | 'Discontinued'
  | 'On Hold'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  customLabel?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  showDot = true,
  size = 'md',
  className = ''
}) => {
  const normalized = status.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const variantClass = `status-badge-${normalized}`;
  const sizeStyle = size === 'sm' ? { fontSize: '11px', padding: '1px 6px' } : {};

  return (
    <span className={`status-badge ${variantClass} ${className}`.trim()} style={sizeStyle}>
      {showDot && <span className="status-badge-dot" />}
      <span>{customLabel || status}</span>
    </span>
  );
};
