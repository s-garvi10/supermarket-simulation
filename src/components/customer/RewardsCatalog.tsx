import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer, Membership, Reward } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DefinitionList } from '../common/DefinitionList';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatPoints, formatCurrency } from '../../utils/formatters';

interface RewardsCatalogProps {
  customer: Customer;
  membership: Membership;
  onGoToRedemptions?: () => void;
}

export const RewardsCatalog: React.FC<RewardsCatalogProps> = ({
  customer,
  membership,
  onGoToRedemptions,
}) => {
  const { rewards, redeemReward, showToast } = useDatabase();

  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [claimedVoucherCode, setClaimedVoucherCode] = useState<string | null>(null);

  const activeRewards = rewards.filter((r) => r.is_active);

  const handleStartRedeem = (reward: Reward) => {
    if (membership.points < reward.points_cost) {
      showToast(
        `You need ${formatPoints(reward.points_cost - membership.points)} more points for this reward.`,
        'error'
      );
      return;
    }
    setSelectedReward(reward);
    setClaimedVoucherCode(null);
  };

  const handleConfirmRedeem = () => {
    if (!selectedReward) return;

    setIsConfirming(true);
    const result = redeemReward(customer.customer_id, selectedReward.reward_id);
    setIsConfirming(false);

    if (result.success && result.redemption) {
      setClaimedVoucherCode(result.redemption.voucher_code);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }
    }
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
          Rewards catalog
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
          Redeem points for bill discounts at ₹0.25 per point. You have{' '}
          <strong style={{ color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {formatPoints(membership.points)}
          </strong>{' '}
          points (worth {formatCurrency(membership.points * 0.25)}).
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {activeRewards.map((reward, idx) => {
          const canAfford = membership.points >= reward.points_cost;
          const deficit = reward.points_cost - membership.points;

          return (
            <div
              key={reward.reward_id}
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: idx === 0
                  ? '6px 6px 0 0'
                  : idx === activeRewards.length - 1
                    ? '0 0 6px 6px'
                    : '0',
                borderTop: idx > 0 ? 'none' : '1px solid var(--border)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                opacity: canAfford ? 1 : 0.65,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  marginBottom: 4,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                    {reward.name}
                  </span>
                  <span style={{
                    fontSize: 12,
                    color: 'var(--ink-muted)',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}>
                    {formatPoints(reward.points_cost)} points
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 4px' }}>
                  {reward.description}
                </p>
                <span style={{
                  fontSize: 13,
                  color: 'var(--accent)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatCurrency(reward.discount)} off your bill
                </span>
              </div>

              <div style={{ flexShrink: 0 }}>
                {canAfford ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartRedeem(reward)}
                  >
                    Redeem
                  </Button>
                ) : (
                  <span style={{
                    fontSize: 12,
                    color: 'var(--error)',
                  }}>
                    Need {formatPoints(deficit)} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation modal */}
      {selectedReward && (
        <Modal
          isOpen={!!selectedReward}
          onClose={() => {
            setSelectedReward(null);
            setClaimedVoucherCode(null);
          }}
          title={claimedVoucherCode ? 'Reward claimed' : 'Confirm redemption'}
          maxWidth="md"
        >
          {!claimedVoucherCode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: '0 0 4px' }}>
                  {selectedReward.name}
                </p>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
                  {selectedReward.description}
                </p>
              </div>

              <DefinitionList
                items={[
                  {
                    term: 'Current balance',
                    value: `${formatPoints(membership.points)} points`,
                  },
                  {
                    term: 'Points to deduct',
                    value: `−${formatPoints(selectedReward.points_cost)} points`,
                  },
                  {
                    term: 'Balance after redemption',
                    value: `${formatPoints(membership.points - selectedReward.points_cost)} points`,
                  },
                  {
                    term: 'Discount value',
                    value: formatCurrency(selectedReward.discount),
                  },
                ]}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  variant="secondary"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedReward(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  style={{ flex: 1 }}
                  disabled={isConfirming}
                  onClick={handleConfirmRedeem}
                >
                  {isConfirming ? 'Claiming…' : 'Confirm & deduct points'}
                </Button>
              </div>
            </div>
          ) : (
            /* Success state */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '2px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Check size={24} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
              </div>

              <div>
                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  margin: '0 0 6px',
                }}>
                  Voucher generated
                </h3>
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0, maxWidth: 300 }}>
                  Quote this code at the billing counter to apply your discount.
                </p>
              </div>

              <div style={{
                width: '100%',
                padding: '16px 24px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--ink)',
                textAlign: 'center',
              }}>
                {claimedVoucherCode}
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  setSelectedReward(null);
                  setClaimedVoucherCode(null);
                  if (onGoToRedemptions) onGoToRedemptions();
                }}
              >
                View my vouchers
              </Button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
