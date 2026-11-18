import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer, Membership } from '../../types';
import { Field } from '../common/Field';
import { Button } from '../common/Button';
import { DefinitionList } from '../common/DefinitionList';
import { formatDate } from '../../utils/formatters';

interface CustomerProfileProps {
  customer: Customer;
  membership: Membership;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer,
  membership,
}) => {
  const { updateCustomerProfile } = useDatabase();

  const [name, setName] = useState(customer.name);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile(customer.customer_id, name, email, phone);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--ink)',
          margin: '0 0 4px',
          letterSpacing: '-0.015em',
        }}>
          Account &amp; profile
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
          Update your contact details for the loyalty program.
        </p>
      </div>

      {/* Membership details */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px 24px',
      }}>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 12px' }}>
          Membership details
        </p>
        <DefinitionList
          items={[
            { term: 'Your tier', value: membership.tier },
            { term: 'Card number', value: membership.card_number, mono: true },
            { term: 'Member since', value: formatDate(membership.joined_on) },
          ]}
        />
      </div>

      {/* Edit form */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
      }}>
        <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 20px' }}>
          Contact information
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field id="profileName" label="Full name" required>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </Field>

          <Field id="profilePhone" label="Mobile number">
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              autoComplete="tel"
            />
          </Field>

          <Field id="profileEmail" label="Email address">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>

          <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }}>
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
};
