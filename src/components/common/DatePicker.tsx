import React from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  required,
  error,
  helpText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `date-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        <span>{label}</span>
        {required && <span className="form-label-required">*</span>}
      </label>

      <div className="form-input-container">
        <span className="form-affix form-prefix">
          <Calendar size={15} />
        </span>
        <input
          id={inputId}
          type="date"
          className={`form-input form-input-with-prefix ${error ? 'form-input-error' : ''} ${className}`.trim()}
          {...props}
        />
      </div>

      {error && <div className="form-error-msg">{error}</div>}
      {!error && helpText && <div className="form-help-text">{helpText}</div>}
    </div>
  );
};
