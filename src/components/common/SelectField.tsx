import React, { useState, useEffect, useRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  required?: boolean;
  error?: string;
  helpText?: string;
  placeholder?: string;
  allowOther?: boolean;
  otherPlaceholder?: string;
  otherOptionLabel?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  required,
  error,
  helpText,
  placeholder,
  allowOther = true,
  otherPlaceholder,
  otherOptionLabel = 'Other (Specify custom...)',
  id,
  className = '',
  value,
  defaultValue,
  onChange,
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const customInputRef = useRef<HTMLInputElement>(null);

  // Helper: check if a value matches one of the predefined options
  const isPredefined = (val: any) => {
    if (val === undefined || val === null || val === '') return false;
    return options.some(opt => String(opt.value) === String(val));
  };

  const initialVal = value !== undefined ? value : defaultValue;
  const isInitialOther = Boolean(initialVal && !isPredefined(initialVal)) || initialVal === '__OTHER__';

  const [isOther, setIsOther] = useState<boolean>(isInitialOther);
  const [customText, setCustomText] = useState<string>(isInitialOther && initialVal !== '__OTHER__' ? String(initialVal) : '');

  // Keep state in sync with external value changes
  useEffect(() => {
    if (value !== undefined) {
      if (value === '__OTHER__') {
        setIsOther(true);
      } else if (isPredefined(value)) {
        setIsOther(false);
      } else if (value !== '' && value !== null) {
        // External value is custom (not in predefined options)
        setIsOther(true);
        setCustomText(String(value));
      }
      // Note: If value is '' and isOther is already true, we stay in isOther mode
    }
  }, [value, options]);

  // Append Other option if allowOther is enabled and not already in options
  const selectOptions = React.useMemo(() => {
    if (!allowOther) return options;
    const hasOther = options.some(opt => opt.value === '__OTHER__' || String(opt.value).toLowerCase() === 'other');
    if (hasOther) return options;
    return [...options, { value: '__OTHER__', label: otherOptionLabel }];
  }, [options, allowOther, otherOptionLabel]);

  // Handle dropdown selection change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    if (selectedVal === '__OTHER__') {
      setIsOther(true);
      setTimeout(() => {
        if (customInputRef.current) {
          customInputRef.current.focus();
        }
      }, 50);

      // Trigger onChange with current custom text
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            name: props.name || selectId,
            value: customText
          }
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    } else {
      setIsOther(false);
      setCustomText('');
      if (onChange) {
        onChange(e);
      }
    }
  };

  // Handle typing inside the custom "Other" text input
  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCustomText(text);
    if (onChange) {
      const syntheticEvent = {
        target: {
          name: props.name || selectId,
          value: text
        },
        currentTarget: {
          name: props.name || selectId,
          value: text
        },
        type: 'change'
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  // Compute what the <select> element's value should be
  const currentSelectValue = isOther ? '__OTHER__' : (value !== undefined ? value : undefined);

  return (
    <div className="form-group">
      <label htmlFor={selectId} className="form-label">
        <span>{label}</span>
        {required && <span className="form-label-required">*</span>}
      </label>

      <select
        id={selectId}
        className={`form-select ${error ? 'form-input-error' : ''} ${className}`.trim()}
        value={currentSelectValue}
        defaultValue={defaultValue !== undefined && !value ? (isInitialOther ? '__OTHER__' : defaultValue) : undefined}
        onChange={handleSelectChange}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {selectOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Dynamic text field when "Other" is active */}
      {isOther && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ position: 'relative' }}>
            <input
              ref={customInputRef}
              type="text"
              className={`form-input ${error ? 'form-input-error' : ''}`}
              placeholder={otherPlaceholder || `Type custom ${label.toLowerCase()} here...`}
              value={customText}
              onChange={handleCustomTextChange}
              style={{
                borderColor: 'var(--color-brand-primary)',
                backgroundColor: '#ffffff',
                paddingLeft: '32px'
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                color: 'var(--color-brand-primary)',
                pointerEvents: 'none'
              }}
            >
              ✏️
            </span>
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'var(--color-brand-primary)',
              marginTop: '4px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Custom value for <strong>{label}</strong> is saved directly.</span>
          </div>
        </div>
      )}

      {error && <div className="form-error-msg">{error}</div>}
      {!error && helpText && !isOther && <div className="form-help-text">{helpText}</div>}
    </div>
  );
};
