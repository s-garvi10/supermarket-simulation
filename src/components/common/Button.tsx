import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  disabled,
  ...rest
}) => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radius)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast)',
    border: '1px solid transparent',
    minHeight: size === 'sm' ? 36 : 44,
    padding: size === 'sm' ? '0 14px' : '0 20px',
    fontSize: size === 'sm' ? 13 : 14,
    opacity: disabled ? 0.5 : 1,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--accent)',
      color: '#fff',
      borderColor: 'var(--accent)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--ink)',
      borderColor: 'var(--border)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--ink-muted)',
      borderColor: 'transparent',
    },
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
      if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--bg)';
      if (variant === 'ghost') e.currentTarget.style.color = 'var(--ink)';
    }
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--accent)';
      if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'transparent';
      if (variant === 'ghost') e.currentTarget.style.color = 'var(--ink-muted)';
    }
    onMouseLeave?.(e);
  };

  return (
    <button
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </button>
  );
};
