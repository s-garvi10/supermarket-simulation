import React from 'react';

interface FieldProps {
  id: string;
  label: string;
  error?: string | null;
  hint?: string;
  required?: boolean;
  children: React.ReactElement<any>;
}

export const Field: React.FC<FieldProps> = ({ id, label, error, hint, required, children }) => {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy = [
    error ? errorId : null,
    hint ? hintId : null,
  ].filter(Boolean).join(' ') || undefined;

  const child = React.cloneElement(children, {
    id,
    'aria-describedby': describedBy,
    'aria-required': required,
    'aria-invalid': error ? 'true' : undefined,
    style: {
      width: '100%',
      padding: '11px 14px',
      fontSize: 14,
      fontFamily: 'var(--font-sans)',
      color: 'var(--ink)',
      backgroundColor: 'var(--surface)',
      border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      outline: 'none',
      minHeight: 44,
      transition: 'border-color var(--transition-fast)',
      boxSizing: 'border-box',
      ...(children.props.style || {}),
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--accent)';
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = error ? 'var(--error)' : 'var(--border)';
      children.props.onBlur?.(e);
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 400 }}
      >
        {label}{required && <span aria-hidden="true" style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
      </label>
      {child}
      {hint && !error && (
        <span id={hintId} style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{hint}</span>
      )}
      {error && (
        <span
          id={errorId}
          role="alert"
          aria-live="polite"
          style={{ fontSize: 12, color: 'var(--error)' }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
