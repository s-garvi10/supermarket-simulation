import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer, Membership, PaymentMethod, Purchase, Reward } from '../../types';
import { TierBadge } from '../common/TierBadge';
import { ReceiptModal } from '../pos/ReceiptModal';
import { Modal } from '../common/Modal';
import { EnrolPage } from '../public/EnrolPage';
import { Field } from '../common/Field';
import { Button } from '../common/Button';
import { DefinitionList } from '../common/DefinitionList';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { Stat } from '../common/Stat';
import { Nav } from '../common/Nav';
import {
  UserX,
  UserPlus,
  Plus,
  Trash2,
  Printer,
} from 'lucide-react';
import { formatCurrency, formatPoints, formatDate } from '../../utils/formatters';

const navItems = [
  { id: 'billing', label: 'New bill' },
  { id: 'recent', label: 'Recent bills' },
];

export const BillEntryTerminal: React.FC = () => {
  const { currentUser } = useAuth();
  const { customers, memberships, rewards, purchases, createBill, lookupMember, showToast } = useDatabase();

  const isDev = import.meta.env.DEV;

  const [activeTab, setActiveTab] = useState<'billing' | 'recent'>('billing');

  // Customer search & attachment
  const [memberQuery, setMemberQuery] = useState('');
  const [attachedMember, setAttachedMember] = useState<{
    customer: Customer;
    membership: Membership;
  } | null>(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [isEnrolModalOpen, setIsEnrolModalOpen] = useState(false);

  // Bill inputs
  const [grossAmount, setGrossAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Bill items breakdown (optional)
  const [lineItems, setLineItems] = useState<{ id: string; description: string; amount: number }[]>([]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmt, setNewItemAmt] = useState('');

  // Reward application
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  // Receipt Modal
  const [lastBill, setLastBill] = useState<Purchase | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const grossNum = parseFloat(grossAmount) || 0;
  const discountNum = selectedReward ? Math.min(grossNum, selectedReward.discount) : 0;
  const netPayable = Math.max(0, grossNum - discountNum);

  // Points earned: 1 pt per Rs 10 spent (only if customer attached)
  const pointsToEarn = attachedMember ? Math.floor(netPayable / 10) : 0;

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - netPayable);

  const handleMemberSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = memberQuery.trim();
    if (!q) return;

    const res = lookupMember(q);
    if (res) {
      setAttachedMember(res);
      setMemberNotFound(false);
      setMemberQuery('');
      showToast(`Member identified: ${res.customer.name} (${res.membership.tier})`, 'success');
    } else {
      setMemberNotFound(true);
      showToast(`No member found for "${q}"`, 'error');
    }
  };

  const handleClearMember = () => {
    setAttachedMember(null);
    setSelectedReward(null);
    setMemberNotFound(false);
  };

  const handleAddLineItem = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newItemAmt) || 0;
    if (!newItemDesc.trim() || amt <= 0) return;

    const updated = [
      ...lineItems,
      { id: Date.now().toString(), description: newItemDesc.trim(), amount: amt },
    ];
    setLineItems(updated);

    // Sum line items to gross amount
    const sum = updated.reduce((acc, curr) => acc + curr.amount, 0);
    setGrossAmount(sum.toString());

    setNewItemDesc('');
    setNewItemAmt('');
  };

  const handleRemoveLineItem = (id: string) => {
    const updated = lineItems.filter((i) => i.id !== id);
    setLineItems(updated);
    if (updated.length > 0) {
      const sum = updated.reduce((acc, curr) => acc + curr.amount, 0);
      setGrossAmount(sum.toString());
    }
  };

  const handleCompleteBill = () => {
    if (grossNum <= 0) {
      alert('Please enter a valid bill amount greater than 0.');
      return;
    }

    if (paymentMethod === 'Cash' && tenderedNum < netPayable && tenderedNum > 0) {
      alert('Cash tendered is less than the net payable amount!');
      return;
    }

    const bill = createBill({
      customerId: attachedMember ? attachedMember.customer.customer_id : null,
      cashierName: currentUser?.name || 'Cashier Staff',
      grossAmount: grossNum,
      rewardId: selectedReward?.reward_id || null,
      paymentMethod,
      notes: notes.trim() || undefined,
      items: lineItems,
    });

    setLastBill(bill);
    setIsReceiptOpen(true);

    // Reset current form for next customer
    setGrossAmount('');
    setNotes('');
    setLineItems([]);
    setCashTendered('');
    setSelectedReward(null);
    setAttachedMember(null);
  };

  // Cashier's recent bills
  const recentBills = purchases.slice(0, 10);

  // Recent bills table columns
  const recentCols: DataTableColumn<Purchase>[] = [
    {
      key: 'invoice',
      header: 'Bill ID',
      render: (b) => (
        <span style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {b.purchase_id}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (b) => (
        <span style={{ color: 'var(--ink-muted)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {formatDate(b.purchase_date)}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (b) =>
        b.customer_name ? (
          <span style={{ fontSize: 13 }}>{b.customer_name}</span>
        ) : (
          <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}>Guest</span>
        ),
    },
    {
      key: 'tender',
      header: 'Tender',
      render: (b) => <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}>{b.payment_method}</span>,
    },
    {
      key: 'discount',
      header: 'Discount',
      align: 'right',
      render: (b) => (
        <span style={{ color: b.discount > 0 ? 'var(--accent)' : 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {b.discount > 0 ? `−${formatCurrency(b.discount)}` : '—'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (b) => (
        <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {formatCurrency(b.total_amount)}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'Points',
      align: 'right',
      render: (b) => (
        <span style={{ color: b.points_earned > 0 ? 'var(--accent)' : 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {b.points_earned > 0 ? `+${formatPoints(b.points_earned)}` : '—'}
        </span>
      ),
    },
    {
      key: 'receipt',
      header: '',
      align: 'right',
      render: (b) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLastBill(b);
            setIsReceiptOpen(true);
          }}
        >
          <Printer size={14} strokeWidth={1.5} />
          Print
        </Button>
      ),
    },
  ];

  /* ─── Payment method selector styles ─── */
  const paymentOpts: { id: PaymentMethod; label: string }[] = [
    { id: 'UPI', label: 'UPI / QR' },
    { id: 'Card', label: 'Card' },
    { id: 'Cash', label: 'Cash' },
  ];

  return (
    <div style={{
      flex: 1,
      maxWidth: 1040,
      margin: '0 auto',
      width: '100%',
      padding: '32px 24px 64px',
    }}>
      {/* Page heading + nav */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 26,
          fontWeight: 600,
          color: 'var(--ink)',
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
        }}>
          Billing counter
        </h1>
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <Nav
            items={navItems}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as 'billing' | 'recent')}
          />
        </div>
      </div>

      {activeTab === 'billing' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
          gap: 24,
        }}>
          {/* Left column: customer + bill details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 1. Member lookup */}
            <section style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
            }}>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 16px' }}>
                Member account <span style={{ color: 'var(--ink-muted)' }}>· 1 point per ₹10</span>
              </p>

              {!attachedMember ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <form onSubmit={handleMemberSearch} style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={memberQuery}
                        onChange={(e) => {
                          setMemberQuery(e.target.value);
                          if (memberNotFound) setMemberNotFound(false);
                        }}
                        placeholder="Mobile number or card number"
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          fontSize: 14,
                          fontFamily: 'var(--font-sans)',
                          color: 'var(--ink)',
                          backgroundColor: 'var(--surface)',
                          border: `1px solid ${memberNotFound ? 'var(--error)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius)',
                          outline: 'none',
                          minHeight: 44,
                          transition: 'border-color var(--transition-fast)',
                          boxSizing: 'border-box',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = memberNotFound ? 'var(--error)' : 'var(--accent)')}
                        onBlur={e => (e.currentTarget.style.borderColor = memberNotFound ? 'var(--error)' : 'var(--border)')}
                      />
                    </div>
                    <Button type="submit" variant="primary">
                      Find member
                    </Button>
                  </form>

                  {memberNotFound && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      fontSize: 13,
                      color: 'var(--ink-muted)',
                    }}>
                      <span>No member found. Enrol a new member?</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsEnrolModalOpen(true)}
                      >
                        <UserPlus size={14} strokeWidth={1.5} />
                        Enrol
                      </Button>
                    </div>
                  )}

                  {/* Dev-only quick-fill */}
                  {isDev && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--ink-muted)' }}>
                      <span style={{ opacity: 0.6 }}>dev</span>
                      {[
                        { label: 'Rahul (Gold · 620 pts)', phone: '9876543210' },
                        { label: 'Priya (Platinum · 1850 pts)', phone: '9812345678' },
                      ].map(({ label, phone }) => (
                        <button
                          key={phone}
                          type="button"
                          onClick={() => {
                            const r = lookupMember(phone);
                            if (r) setAttachedMember(r);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 11,
                            color: 'var(--ink-muted)',
                            padding: '2px 0',
                            fontFamily: 'var(--font-sans)',
                            transition: 'color var(--transition-fast)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Attached member row */
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--bg)',
                }}>
                  <DefinitionList
                    items={[
                      { term: 'Member', value: attachedMember.customer.name },
                      {
                        term: 'Tier / points',
                        value: (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TierBadge tier={attachedMember.membership.tier} size="sm" />
                            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {formatPoints(attachedMember.membership.points)} pts
                            </span>
                          </span>
                        ),
                      },
                      {
                        term: 'Card',
                        value: attachedMember.membership.card_number,
                        mono: true,
                      },
                    ]}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleClearMember}
                    title="Remove member (guest checkout)"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--ink-muted)',
                      padding: 8,
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 44,
                      transition: 'color var(--transition-fast)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                  >
                    <UserX size={16} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </section>

            {/* 2. Bill amount & items */}
            <section style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
            }}>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 16px' }}>
                Bill amount
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field id="grossAmount" label="Gross bill amount (₹)" required>
                  <input
                    type="number"
                    min={1}
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    placeholder="e.g. 1450"
                    style={{ fontSize: 20, fontFamily: 'var(--font-sans)', fontWeight: 500 }}
                  />
                </Field>

                {/* Optional line items */}
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: lineItems.length > 0 || true ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      Line items ({lineItems.length}) — optional, auto-sums into gross
                    </span>
                  </div>

                  <form onSubmit={handleAddLineItem} style={{
                    display: 'flex',
                    gap: 8,
                    padding: '12px 14px',
                    borderBottom: lineItems.length > 0 ? '1px solid var(--border)' : 'none',
                    backgroundColor: 'var(--bg)',
                  }}>
                    <input
                      type="text"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      placeholder="Item description"
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        fontSize: 13,
                        fontFamily: 'var(--font-sans)',
                        color: 'var(--ink)',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        outline: 'none',
                        minHeight: 36,
                      }}
                    />
                    <input
                      type="number"
                      value={newItemAmt}
                      onChange={(e) => setNewItemAmt(e.target.value)}
                      placeholder="₹ amount"
                      style={{
                        width: 96,
                        padding: '8px 12px',
                        fontSize: 13,
                        fontFamily: 'var(--font-sans)',
                        color: 'var(--ink)',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        outline: 'none',
                        minHeight: 36,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      <Plus size={14} strokeWidth={1.5} />
                      Add
                    </Button>
                  </form>

                  {lineItems.length > 0 && (
                    <div>
                      {lineItems.map((item, idx) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderBottom: idx < lineItems.length - 1 ? '1px solid var(--border)' : 'none',
                            fontSize: 13,
                          }}
                        >
                          <span style={{ color: 'var(--ink)' }}>{item.description}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>
                              {formatCurrency(item.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--ink-muted)',
                                padding: 2,
                                display: 'flex',
                                transition: 'color var(--transition-fast)',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                              aria-label="Remove line item"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Field id="billNotes" label="Remarks (optional)">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Express checkout"
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* Right column: reward, payment, summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* 3. Reward */}
            <section style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
            }}>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 12px' }}>
                Reward discount
              </p>

              {attachedMember ? (
                selectedReward ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg)',
                    fontSize: 13,
                  }}>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                        {selectedReward.name}
                      </div>
                      <div style={{ color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        −{formatCurrency(discountNum)} · {formatPoints(selectedReward.points_cost)} pts
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReward(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        color: 'var(--ink-muted)',
                        fontFamily: 'var(--font-sans)',
                        transition: 'color var(--transition-fast)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-muted)')}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    style={{ width: '100%' }}
                    onClick={() => setIsRewardModalOpen(true)}
                  >
                    Choose reward ({formatPoints(attachedMember.membership.points)} pts · {formatCurrency(attachedMember.membership.points * 0.25)} value)
                  </Button>
                )
              ) : (
                <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
                  Attach a member account to apply a reward.
                </p>
              )}
            </section>

            {/* 4. Payment method */}
            <section style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
            }}>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 12px' }}>
                Payment method
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {paymentOpts.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      padding: '10px 8px',
                      border: `1px solid ${paymentMethod === m.id ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: paymentMethod === m.id ? 500 : 400,
                      color: paymentMethod === m.id ? 'var(--accent)' : 'var(--ink-muted)',
                      backgroundColor: paymentMethod === m.id ? 'var(--bg)' : 'transparent',
                      transition: 'border-color var(--transition-fast), color var(--transition-fast)',
                      minHeight: 44,
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'Cash' && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--ink-muted)' }}>Cash received (₹)</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={`Min ₹${netPayable}`}
                      style={{
                        width: 112,
                        padding: '6px 10px',
                        fontSize: 13,
                        fontFamily: 'var(--font-sans)',
                        color: 'var(--ink)',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        outline: 'none',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                  </div>
                  {tenderedNum > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 8,
                      borderTop: '1px solid var(--border)',
                      fontSize: 13,
                    }}>
                      <span style={{ color: 'var(--ink-muted)' }}>Change due</span>
                      <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>
                        {formatCurrency(changeDue)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 5. Bill summary + complete action */}
            <section style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>
                Bill summary
              </p>

              <DefinitionList
                items={[
                  { term: 'Gross bill', value: formatCurrency(grossNum) },
                  ...(selectedReward
                    ? [{ term: 'Reward discount', value: `−${formatCurrency(discountNum)}` }]
                    : []),
                  ...(attachedMember && pointsToEarn > 0
                    ? [{ term: 'Points to award', value: `+${formatPoints(pointsToEarn)}` }]
                    : []),
                ]}
              />

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <Stat
                  label="Total"
                  value={formatCurrency(netPayable)}
                />
              </div>

              {!attachedMember && (
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>
                  Guest checkout — no points awarded
                </p>
              )}

              <Button
                variant="primary"
                disabled={grossNum <= 0}
                onClick={handleCompleteBill}
                style={{ width: '100%' }}
              >
                Save bill &amp; generate receipt
              </Button>
            </section>
          </div>
        </div>
      ) : (
        /* Recent bills tab */
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
              Recent bills
            </span>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
              {purchases.length} processed
            </span>
          </div>
          <DataTable
            columns={recentCols}
            rows={recentBills}
            getKey={(b) => b.purchase_id}
            emptyMessage="No bills processed yet."
          />
        </div>
      )}

      {/* Reward selection modal */}
      {isRewardModalOpen && attachedMember && (
        <Modal
          isOpen={isRewardModalOpen}
          onClose={() => setIsRewardModalOpen(false)}
          title={`Rewards for ${attachedMember.customer.name}`}
          maxWidth="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--ink-muted)' }}>Points balance (1 pt = ₹0.25)</span>
              <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {formatPoints(attachedMember.membership.points)} pts ({formatCurrency(attachedMember.membership.points * 0.25)})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 320, overflowY: 'auto' }}>
              {rewards
                .filter((r) => r.is_active)
                .map((reward, idx, arr) => {
                  const canAfford = attachedMember.membership.points >= reward.points_cost;
                  return (
                    <div
                      key={reward.reward_id}
                      onClick={() => {
                        if (canAfford) {
                          setSelectedReward(reward);
                          setIsRewardModalOpen(false);
                          showToast(`Applied ${reward.name} (−${formatCurrency(reward.discount)})`, 'success');
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        border: '1px solid var(--border)',
                        borderRadius: idx === 0 ? '6px 6px 0 0' : idx === arr.length - 1 ? '0 0 6px 6px' : '0',
                        borderTop: idx > 0 ? 'none' : '1px solid var(--border)',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                        opacity: canAfford ? 1 : 0.5,
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={e => { if (canAfford) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
                          {reward.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{reward.description}</div>
                        <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                          −{formatCurrency(reward.discount)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                        <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--ink-muted)' }}>
                          {formatPoints(reward.points_cost)} pts
                        </span>
                        {!canAfford && (
                          <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 2 }}>
                            Need {formatPoints(reward.points_cost - attachedMember.membership.points)} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Modal>
      )}

      {/* Enrol modal */}
      {isEnrolModalOpen && (
        <Modal
          isOpen={isEnrolModalOpen}
          onClose={() => setIsEnrolModalOpen(false)}
          title="Enrol new member"
          maxWidth="md"
        >
          <EnrolPage
            onEnrolSuccess={(cust, mem) => {
              setAttachedMember({ customer: cust, membership: mem });
              setIsEnrolModalOpen(false);
            }}
          />
        </Modal>
      )}

      {/* Receipt modal */}
      {isReceiptOpen && lastBill && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          purchase={lastBill}
        />
      )}
    </div>
  );
};
