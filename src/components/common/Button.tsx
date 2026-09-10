import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'danger-outline' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const variantClass = `btn-${variant}`;
  const iconOnlyClass = !children && icon ? 'btn-icon-only' : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${iconOnlyClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
        </>
      )}
    </button>
  );
};
