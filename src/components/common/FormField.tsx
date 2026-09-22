import React from 'react';

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  children?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helpText,
  prefix,
  suffix,
  id,
  className = '',
  children,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        <span>{label}</span>
        {required && <span className="form-label-required">*</span>}
      </label>

      {children ? (
        children
      ) : (
        <div className="form-input-container">
          {prefix && (
            <span className="form-affix form-prefix">
              {prefix}
            </span>
          )}
          <input
            id={inputId}
            className={`form-input ${prefix ? 'form-input-with-prefix' : ''} ${suffix ? 'form-input-with-suffix' : ''} ${error ? 'form-input-error' : ''} ${className}`.trim()}
            {...props}
          />
          {suffix && (
            <span className="form-affix form-suffix">
              {suffix}
            </span>
          )}
        </div>
      )}

      {error && <div className="form-error-msg">{error}</div>}
      {!error && helpText && <div className="form-help-text">{helpText}</div>}
    </div>
  );
};

