import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    positive: boolean;
    text: string;
  };
}

// Thin wrapper kept for backward-compat; renders using Stat-style token layout.
// icon prop is accepted but not rendered (banned colored icon tiles).
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '20px 24px',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 400 }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 28,
        fontWeight: 600,
        color: 'var(--ink)',
        lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      {trend && (
        <span style={{
          fontSize: 12,
          color: trend.positive ? 'var(--accent)' : 'var(--error)',
          marginTop: 2,
        }}>
          {trend.text}
        </span>
      )}
      {subtext && !trend && (
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{subtext}</span>
      )}
    </div>
  );
};
