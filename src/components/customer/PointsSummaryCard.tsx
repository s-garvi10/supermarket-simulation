import React from 'react';
import { Customer, Membership } from '../../types';
import { DefinitionList } from '../common/DefinitionList';
import { Stat } from '../common/Stat';
import { formatPoints, formatCurrency } from '../../utils/formatters';

interface PointsSummaryCardProps {
  customer: Customer;
  membership: Membership;
}

export const PointsSummaryCard: React.FC<PointsSummaryCardProps> = ({
  customer,
  membership,
}) => {
  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
    }}>
      {/* Points hero */}
      <div style={{ marginBottom: 20 }}>
        <Stat
          label="Points balance"
          value={formatPoints(membership.points)}
          caption={`Worth ${formatCurrency(membership.points * 0.25)} in bill discounts (1 pt = ₹0.25)`}
        />
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', marginBottom: 16 }} />

      {/* Membership details */}
      <DefinitionList
        items={[
          { term: 'Member name', value: customer.name },
          { term: 'Your tier', value: membership.tier },
          {
            term: 'Card number',
            value: membership.card_number,
            mono: true,
          },
          { term: 'Mobile', value: customer.phone },
        ]}
      />
    </div>
  );
};
