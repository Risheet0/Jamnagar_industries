import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Info,
  Sparkles,
  MinusCircle
} from 'lucide-react';

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
  | 'Pass'
  | 'Rejected'
  | 'Fail'
  | 'Present'
  | 'Absent'
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | 'On Order'
  | 'Active Production'
  | 'Sample / Prototype'
  | 'Discontinued'
  | 'On Hold'
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Normal'
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  customLabel?: string;
  showDot?: boolean;
  icon?: boolean | React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
  showDot = true,
  icon = false,
  size = 'md',
  className = '',
  style
}) => {
  const normalized = status.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const variantClass = `status-badge-${normalized}`;
  const sizeStyle = size === 'sm' ? { fontSize: '11px', padding: '1px 6px' } : {};
  const iconSize = size === 'sm' ? 11 : 13;

  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    if (!icon) return null;

    // Default icon mappings based on status meaning
    const s = normalized;
    if (['active', 'completed', 'passed', 'pass', 'present', 'in-stock', 'active-production', 'success'].includes(s)) {
      return <CheckCircle2 size={iconSize} />;
    }
    if (['rejected', 'fail', 'absent', 'out-of-stock', 'delayed', 'critical', 'terminated', 'danger'].includes(s)) {
      return <XCircle size={iconSize} />;
    }
    if (['pending', 'on-leave', 'on-hold', 'low-stock', 'high', 'warning', 'maintenance'].includes(s)) {
      return <AlertTriangle size={iconSize} />;
    }
    if (['in-production', 'quality-check', 'on-order', 'medium', 'info', 'in-progress'].includes(s)) {
      return <Clock size={iconSize} />;
    }
    if (['sample-prototype', 'sample---prototype', 'purple'].includes(s)) {
      return <Sparkles size={iconSize} />;
    }
    if (['inactive', 'discontinued', 'cancelled', 'normal', 'draft', 'neutral'].includes(s)) {
      return <MinusCircle size={iconSize} />;
    }
    return <Info size={iconSize} />;
  };

  return (
    <span className={`status-badge ${variantClass} ${className}`.trim()} style={{ ...sizeStyle, ...style }}>
      {icon ? (
        renderIcon()
      ) : (
        showDot && <span className="status-badge-dot" />
      )}
      <span>{customLabel || status}</span>
    </span>
  );
};
