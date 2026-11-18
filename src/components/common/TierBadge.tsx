import React from 'react';
import { Tier } from '../../types';

interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md';
  className?: string;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md' }) => {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 8px' : '3px 10px',
      fontSize: 11,
      fontWeight: 500,
      color: 'var(--ink-muted)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      fontFamily: 'var(--font-sans)',
      letterSpacing: '0.01em',
    }}>
      {tier}
    </span>
  );
};
