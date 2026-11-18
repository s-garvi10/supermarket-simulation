import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { Nav } from '../common/Nav';
import { Field } from '../common/Field';
import { Button } from '../common/Button';
import confetti from 'canvas-confetti';

type AuthTab = 'customer' | 'cashier' | 'admin' | 'enrol';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: 'var(--bg)',
  display: 'flex',
  flexDirection: 'column',
};

const formWrap: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '48px 24px',
};

const formCard: React.CSSProperties = {
  width: '100%',
  maxWidth: 480,
  margin: '0 auto',
};

export const AuthPage: React.FC = () => {
  const { loginCashier, loginAdmin, loginCustomer, quickLogin } = useAuth();
  const { enrolMember } = useDatabase();

  const [activeTab, setActiveTab] = useState<AuthTab>('customer');
  const isDev = import.meta.env.DEV;

  // Customer
  const [customerPhone, setCustomerPhone] = useState('');

  // Cashier
  const [cashierEmail, setCashierEmail] = useState('cashier1@freshmart.com');
  const [cashierPassword, setCashierPassword] = useState('cashier123');

  // Admin
  const [adminEmail, setAdminEmail] = useState('manager@freshmart.com');
  const [adminPassword, setAdminPassword] = useState('admin123');

  // Enrol
  const [enrolName, setEnrolName] = useState('');
  const [enrolPhone, setEnrolPhone] = useState('');
  const [enrolEmail, setEnrolEmail] = useState('');
  const [enrolError, setEnrolError] = useState<string | null>(null);

  const handleCashierSubmit = (e: React.FormEvent) => { e.preventDefault(); loginCashier(cashierEmail); };
  const handleAdminSubmit = (e: React.FormEvent) => { e.preventDefault(); loginAdmin(adminEmail); };
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginCustomer(customerPhone);
  };

  const handleEnrolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrolError(null);
    const res = enrolMember(enrolName, enrolEmail, enrolPhone);
    if (!res.success) { setEnrolError(res.error || 'Failed to enrol member.'); return; }
    if (res.customer && res.membership) {
      try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch { /* ignore */ }
      quickLogin({ id: res.customer.customer_id, name: res.customer.name, email: res.customer.email, phone: res.customer.phone, role: 'customer', customer_id: res.customer.customer_id });
    }
  };

  const navItems = [
    { id: 'customer', label: 'Member' },
    { id: 'cashier', label: 'Cashier' },
    { id: 'admin', label: 'Manager' },
    { id: 'enrol', label: 'Sign up' },
  ];

  const inputProps = (value: string, onChange: (v: string) => void, type = 'text'): React.InputHTMLAttributes<HTMLInputElement> => ({
    type, value, onChange: e => onChange(e.target.value),
  });

  const sep: React.CSSProperties = { borderTop: '1px solid var(--border)', margin: '24px 0 0' };

  return (
    <div style={pageStyle}>
      {/* Top bar */}
      <header style={{ padding: '0 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>FreshMart</span>
          <Nav
            items={navItems}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as AuthTab)}
          />
        </div>
      </header>

      <div style={formWrap}>
        <div style={formCard}>

          {/* Customer Login */}
          {activeTab === 'customer' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Sign in to your rewards
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 32px' }}>
                Enter your registered mobile number to view points and purchases.
              </p>
              <form onSubmit={handleCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field id="customerPhone" label="Mobile number or email" required>
                  <input {...inputProps(customerPhone, setCustomerPhone)} autoComplete="tel" />
                </Field>
                <Button type="submit" style={{ width: '100%' }}>Sign in</Button>
              </form>
            </div>
          )}

          {/* Cashier Login */}
          {activeTab === 'cashier' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Cashier sign in
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 32px' }}>
                Sign in to ring up purchases and issue receipts.
              </p>
              <form onSubmit={handleCashierSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field id="cashierEmail" label="Email">
                  <input {...inputProps(cashierEmail, setCashierEmail, 'email')} autoComplete="email" />
                </Field>
                <Field id="cashierPassword" label="Password">
                  <input {...inputProps(cashierPassword, setCashierPassword, 'password')} autoComplete="current-password" />
                </Field>
                <Button type="submit" style={{ width: '100%' }}>Sign in</Button>
              </form>
              {isDev && (
                <div style={sep}>
                  <button type="button" onClick={() => loginCashier('cashier1@freshmart.com')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-muted)', padding: '6px 0', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
                  >
                    Demo — Sunil Verma, cashier1@freshmart.com
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manager Login */}
          {activeTab === 'admin' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Manager sign in
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 32px' }}>
                Access reports, member directory, and reward management.
              </p>
              <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field id="adminEmail" label="Email">
                  <input {...inputProps(adminEmail, setAdminEmail, 'email')} autoComplete="email" />
                </Field>
                <Field id="adminPassword" label="Password">
                  <input {...inputProps(adminPassword, setAdminPassword, 'password')} autoComplete="current-password" />
                </Field>
                <Button type="submit" style={{ width: '100%' }}>Sign in</Button>
              </form>
              {isDev && (
                <div style={sep}>
                  <button type="button" onClick={() => loginAdmin('manager@freshmart.com')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--ink-muted)', padding: '6px 0', fontFamily: 'var(--font-sans)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-muted)'}
                  >
                    Demo — Pooja Nair, manager@freshmart.com
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sign Up */}
          {activeTab === 'enrol' && (
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Join FreshMart Rewards
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 32px' }}>
                Earn 1 point per ₹10 spent and redeem them for bill discounts.
              </p>
              <form onSubmit={handleEnrolSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {enrolError && (
                  <div role="alert" aria-live="polite" style={{ fontSize: 13, color: 'var(--error)', padding: '10px 14px', border: '1px solid var(--error-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--error-bg)' }}>
                    {enrolError}
                  </div>
                )}
                <Field id="enrolName" label="Full name" required>
                  <input {...inputProps(enrolName, setEnrolName)} autoComplete="name" placeholder="e.g. Meera Nambiar" />
                </Field>
                <Field id="enrolPhone" label="Mobile number" required hint="Used at checkout for fast lookup">
                  <input type="tel" value={enrolPhone} onChange={e => setEnrolPhone(e.target.value.replace(/\D/g, ''))} maxLength={10} autoComplete="tel" placeholder="10-digit mobile number" />
                </Field>
                <Field id="enrolEmail" label="Email address (optional)">
                  <input {...inputProps(enrolEmail, setEnrolEmail, 'email')} autoComplete="email" placeholder="e.g. meera@example.com" />
                </Field>
                <Button type="submit" style={{ width: '100%' }}>Create membership</Button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};