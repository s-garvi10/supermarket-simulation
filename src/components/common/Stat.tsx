import React from 'react';

interface StatProps {
  label: string;
  value: React.ReactNode;
  caption?: string;
}

export const Stat: React.FC<StatProps> = ({ label, value, caption }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 400 }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 32,
        fontWeight: 600,
        color: 'var(--ink)',
        lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </span>
      {caption && (
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{caption}</span>
      )}
    </div>
  );
};
