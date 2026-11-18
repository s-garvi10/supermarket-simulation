import React from 'react';
import { Membership } from '../../types';
import { Check } from 'lucide-react';

interface TierProgressProps {
  membership: Membership;
}

export const TierProgress: React.FC<TierProgressProps> = ({ membership }) => {
  const { tier, points } = membership;

  // Tier thresholds — same logic as DatabaseContext.determineTier
  let nextTierName = 'Gold';
  let targetPoints = 400;
  let prevPoints = 0;

  if (tier === 'Gold') {
    nextTierName = 'Platinum';
    targetPoints = 1200;
    prevPoints = 400;
  } else if (tier === 'Platinum') {
    nextTierName = 'Platinum';
    targetPoints = 1200;
    prevPoints = 1200;
  }

  const isMaxTier = tier === 'Platinum';
  const pointsRemaining = Math.max(0, targetPoints - points);
  const progressPct = isMaxTier
    ? 100
    : Math.min(100, Math.max(2, ((points - prevPoints) / (targetPoints - prevPoints)) * 100));

  const sentence = isMaxTier
    ? "You're at the top tier."
    : `${pointsRemaining.toLocaleString('en-IN')} points to ${nextTierName}.`;

  const benefits: { label: string; enabled: boolean }[] = [
    { label: '1 point per ₹10 spent', enabled: true },
    { label: 'Redemption value: 1 pt = ₹0.25', enabled: true },
    { label: 'Birthday voucher', enabled: true },
    { label: 'Express checkout', enabled: tier !== 'Silver' },
    { label: '2× points weekends', enabled: tier === 'Platinum' },
  ];

  return (
    <div>
      {/* Tier name + progress */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>Your tier — {tier}</span>
        {!isMaxTier && (
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            {points.toLocaleString('en-IN')} / {targetPoints.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Thin flat progress bar */}
      <div style={{
        height: 3,
        backgroundColor: 'var(--border)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 8,
      }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          backgroundColor: 'var(--accent)',
          borderRadius: 2,
        }} />
      </div>

      <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 16px' }}>{sentence}</p>

      {/* Benefits */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        {benefits.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check
              size={13}
              strokeWidth={2}
              style={{ color: b.enabled ? 'var(--accent)' : 'var(--border)', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: b.enabled ? 'var(--ink-muted)' : 'var(--border)' }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
