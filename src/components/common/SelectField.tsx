import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  required?: boolean;
  error?: string;
  helpText?: string;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  required,
  error,
  helpText,
  placeholder,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="form-group">
      <label htmlFor={selectId} className="form-label">
        <span>{label}</span>
        {required && <span className="form-label-required">*</span>}
      </label>

      <select
        id={selectId}
        className={`form-select ${error ? 'form-input-error' : ''} ${className}`.trim()}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <div className="form-error-msg">{error}</div>}
      {!error && helpText && <div className="form-help-text">{helpText}</div>}
    </div>
  );
};
