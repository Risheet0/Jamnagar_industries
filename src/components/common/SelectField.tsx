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

  // Check if initial value is custom (not among predefined options)
  const isValueInOptions = (val: any) => {
    if (val === undefined || val === null || val === '') return true;
    return options.some(opt => String(opt.value) === String(val));
  };

  const initialVal = value !== undefined ? value : defaultValue;
  const isInitialCustom = initialVal !== undefined && initialVal !== '' && !isValueInOptions(initialVal);

  const [isOther, setIsOther] = useState<boolean>(isInitialCustom || initialVal === '__OTHER__');
  const [customText, setCustomText] = useState<string>(isInitialCustom ? String(initialVal) : '');

  // Keep in sync when external value prop changes
  useEffect(() => {
    if (value !== undefined) {
      const inOptions = isValueInOptions(value);
      if (!inOptions && value !== '') {
        setIsOther(true);
        setCustomText(String(value));
      } else if (inOptions && value !== '__OTHER__') {
        setIsOther(false);
      }
    }
  }, [value, options]);

  // Append Other option if allowOther is enabled and not already present
  const selectOptions = React.useMemo(() => {
    if (!allowOther) return options;
    const hasOther = options.some(opt => opt.value === '__OTHER__' || String(opt.value).toLowerCase() === 'other');
    if (hasOther) return options;
    return [...options, { value: '__OTHER__', label: otherOptionLabel }];
  }, [options, allowOther, otherOptionLabel]);

  // Determine current selected value for <select>
  const currentSelectValue = isOther ? '__OTHER__' : (value !== undefined ? value : undefined);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    if (selectedVal === '__OTHER__') {
      setIsOther(true);
      // Focus custom input after render
      setTimeout(() => {
        if (customInputRef.current) {
          customInputRef.current.focus();
        }
      }, 50);

      // Trigger onChange with current custom text or empty
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
      if (onChange) {
        onChange(e);
      }
    }
  };

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

  return (
    <div className="form-group">
      <label htmlFor={selectId} className="form-label">
        <span>{label}</span>
        {required && <span className="form-label-required">*</span>}
      </label>

      <select
        id={selectId}
        className={`form-select ${error ? 'form-input-error' : ''} ${className}`.trim()}
        value={value !== undefined ? currentSelectValue : undefined}
        defaultValue={defaultValue !== undefined && !value ? (isInitialCustom ? '__OTHER__' : defaultValue) : undefined}
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

      {/* Conditionally rendered custom text field when "Other" is selected */}
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
            <span>Custom value will be saved automatically for <strong>{label}</strong>.</span>
          </div>
        </div>
      )}

      {error && <div className="form-error-msg">{error}</div>}
      {!error && helpText && !isOther && <div className="form-help-text">{helpText}</div>}
    </div>
  );
};
