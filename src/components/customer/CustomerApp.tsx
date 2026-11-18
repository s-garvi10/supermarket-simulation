import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { PointsSummaryCard } from './PointsSummaryCard';
import { TierProgress } from './TierProgress';
import { CustomerPurchases } from './CustomerPurchases';
import { RewardsCatalog } from './RewardsCatalog';
import { MyRedemptions } from './MyRedemptions';
import { CustomerProfile } from './CustomerProfile';
import { Nav } from '../common/Nav';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { formatCurrency, formatShortDate, formatPoints } from '../../utils/formatters';
import { Purchase } from '../../types';

type Tab = 'home' | 'history' | 'rewards' | 'vouchers' | 'profile';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'history', label: 'Bills' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'vouchers', label: 'Vouchers' },
  { id: 'profile', label: 'Profile' },
];

export const CustomerApp: React.FC = () => {
  const { currentUser } = useAuth();
  const { getCustomerById, getMembershipForCustomer, purchases, rewards, redemptions } = useDatabase();

  const [activeTab, setActiveTab] = useState<Tab>('home');

  const customerId = currentUser?.customer_id || 'cust_1';
  const customer = getCustomerById(customerId);
  const membership = customer ? getMembershipForCustomer(customer.customer_id) : undefined;

  if (!customer || !membership) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-muted)' }}>
        Loyalty account not found. Please sign in again.
      </div>
    );
  }

  const customerPurchases = purchases.filter((p) => p.customer_id === customer.customer_id);
  const customerRedemptions = redemptions.filter((r) => r.customer_id === customer.customer_id);
  const availableVouchers = customerRedemptions.filter((r) => r.status === 'available');

  // Recent purchases columns for home tab
  const recentCols: DataTableColumn<Purchase>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (p) => (
        <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
          {formatShortDate(p.purchase_date)}
        </span>
      ),
    },
    {
      key: 'bill',
      header: 'Bill ID',
      render: (p) => (
        <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{p.purchase_id}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (p) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(p.total_amount)}</span>,
    },
    {
      key: 'points',
      header: 'Points',
      align: 'right',
      render: (p) =>
        p.points_earned > 0 ? (
          <span style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
            +{formatPoints(p.points_earned)}
          </span>
        ) : (
          <span style={{ color: 'var(--ink-muted)' }}>—</span>
        ),
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'history':
        return <CustomerPurchases customer={customer} />;
      case 'rewards':
        return (
          <RewardsCatalog
            customer={customer}
            membership={membership}
            onGoToRedemptions={() => setActiveTab('vouchers')}
          />
        );
      case 'vouchers':
        return <MyRedemptions customer={customer} />;
      case 'profile':
        return <CustomerProfile customer={customer} membership={membership} />;
      case 'home':
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Points hero + membership details */}
            <PointsSummaryCard customer={customer} membership={membership} />

            {/* Tier progress */}
            <div style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}>
              <TierProgress membership={membership} />
            </div>

            {/* Recent purchases */}
            {customerPurchases.length > 0 && (
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                    Recent purchases
                  </span>
                  <button
                    onClick={() => setActiveTab('history')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-sans)',
                      padding: '4px 0',
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
                  >
                    All bills ({customerPurchases.length})
                  </button>
                </div>
                <DataTable
                  columns={recentCols}
                  rows={customerPurchases.slice(0, 3)}
                  getKey={(p) => p.purchase_id}
                  emptyMessage="No purchases yet."
                />
              </div>
            )}

            {/* Rewards link */}
            {rewards.length > 0 && (
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                    Rewards catalog
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    {rewards.filter(r => r.is_active && membership.points >= r.points_cost).length} rewards available to redeem
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('rewards')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-sans)',
                    padding: '4px 0',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
                >
                  Browse rewards
                </button>
              </div>
            )}

            {/* Vouchers count */}
            {availableVouchers.length > 0 && (
              <div style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                    Vouchers
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    {availableVouchers.length} unused {availableVouchers.length === 1 ? 'voucher' : 'vouchers'} ready to use
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('vouchers')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-sans)',
                    padding: '4px 0',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--accent)')}
                >
                  View vouchers
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div style={{
      flex: 1,
      maxWidth: 1040,
      margin: '0 auto',
      width: '100%',
      padding: '32px 24px 64px',
    }}>
      {/* Section nav */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        <Nav
          items={navItems}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as Tab)}
        />
      </div>

      {/* Page content */}
      <main>
        {renderContent()}
      </main>
    </div>
  );
};
