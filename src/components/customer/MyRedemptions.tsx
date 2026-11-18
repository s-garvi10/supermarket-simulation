import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer } from '../../types';
import { Copy, Check } from 'lucide-react';
import { formatDate, formatPoints } from '../../utils/formatters';

interface MyRedemptionsProps {
  customer: Customer;
}

export const MyRedemptions: React.FC<MyRedemptionsProps> = ({ customer }) => {
  const { redemptions, showToast } = useDatabase();
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const customerRedemptions = redemptions.filter(
    (r) => r.customer_id === customer.customer_id
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Voucher code ${code} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--ink)',
          margin: '0 0 4px',
          letterSpacing: '-0.015em',
        }}>
          My vouchers
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
          Quote these codes at the billing counter to apply discounts.
        </p>
      </div>

      {customerRedemptions.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>
            No vouchers claimed yet. Browse the rewards catalog to redeem points.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}>
          {customerRedemptions.map((red, idx) => {
            const isCopied = copiedCode === red.voucher_code;

            return (
              <div
                key={red.redemption_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: '16px 24px',
                  borderBottom: idx < customerRedemptions.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                      {red.reward_name}
                    </span>
                    {/* Small status tag */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '1px 8px',
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--ink-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      lineHeight: 1.6,
                    }}>
                      {red.status}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(red.redeemed_at)} · {formatPoints(red.points_spent)} points spent
                  </span>
                </div>

                {/* Voucher code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: 'var(--ink)',
                    padding: '6px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg)',
                  }}>
                    {red.voucher_code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(red.voucher_code)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      color: isCopied ? 'var(--accent)' : 'var(--ink-muted)',
                      padding: '6px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 36,
                      transition: 'color var(--transition-fast)',
                    }}
                    title="Copy voucher code"
                    aria-label="Copy voucher code"
                  >
                    {isCopied
                      ? <Check size={14} strokeWidth={1.5} />
                      : <Copy size={14} strokeWidth={1.5} />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
