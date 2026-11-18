import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer, Purchase } from '../../types';
import { ReceiptModal } from '../pos/ReceiptModal';
import { Modal } from '../common/Modal';
import { DataTable, DataTableColumn } from '../common/DataTable';
import { DefinitionList } from '../common/DefinitionList';
import { Button } from '../common/Button';
import { Printer } from 'lucide-react';
import { formatCurrency, formatDate, formatPoints, formatShortDate } from '../../utils/formatters';

interface CustomerPurchasesProps {
  customer: Customer;
}

export const CustomerPurchases: React.FC<CustomerPurchasesProps> = ({ customer }) => {
  const { purchases } = useDatabase();
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const customerPurchases = purchases.filter(
    (p) => p.customer_id === customer.customer_id
  );

  const columns: DataTableColumn<Purchase>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (p) => (
        <span style={{ color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {formatDate(p.purchase_date)}
        </span>
      ),
    },
    {
      key: 'bill_id',
      header: 'Bill ID',
      render: (p) => (
        <span style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}>
          {p.purchase_id}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Tender',
      render: (p) => <span style={{ color: 'var(--ink-muted)' }}>{p.payment_method}</span>,
    },
    {
      key: 'amount',
      header: 'Total',
      align: 'right',
      render: (p) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          {formatCurrency(p.total_amount)}
        </span>
      ),
    },
    {
      key: 'points',
      header: 'Points earned',
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
          Purchase history
        </h2>
        <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: 0 }}>
          {customerPurchases.length} {customerPurchases.length === 1 ? 'transaction' : 'transactions'} on record
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}>
        <DataTable
          columns={columns}
          rows={customerPurchases}
          getKey={(p) => p.purchase_id}
          emptyMessage={`No purchases recorded. Quote ${customer.phone} at the counter to earn points.`}
          onRowClick={(p) => setSelectedPurchase(p)}
        />
      </div>

      {/* Bill detail modal */}
      {selectedPurchase && (
        <Modal
          isOpen={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          title="Bill details"
          maxWidth="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <DefinitionList
              items={[
                { term: 'Bill ID', value: selectedPurchase.purchase_id },
                { term: 'Date', value: formatDate(selectedPurchase.purchase_date) },
                { term: 'Tender', value: selectedPurchase.payment_method },
                ...(selectedPurchase.gross_amount && selectedPurchase.gross_amount !== selectedPurchase.total_amount
                  ? [{ term: 'Gross amount', value: formatCurrency(selectedPurchase.gross_amount) }]
                  : []),
                ...(selectedPurchase.discount > 0
                  ? [{ term: 'Discount', value: `−${formatCurrency(selectedPurchase.discount)}` }]
                  : []),
                { term: 'Total paid', value: formatCurrency(selectedPurchase.total_amount) },
                ...(selectedPurchase.points_earned > 0
                  ? [{ term: 'Points earned', value: `+${formatPoints(selectedPurchase.points_earned)}` }]
                  : []),
              ]}
            />

            {/* Bill line items */}
            {selectedPurchase.items && selectedPurchase.items.length > 0 && (
              <div>
                <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '0 0 8px' }}>
                  Line items ({selectedPurchase.items.length})
                </p>
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                }}>
                  {selectedPurchase.items.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        borderBottom: idx < selectedPurchase.items!.length - 1 ? '1px solid var(--border)' : 'none',
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: 'var(--ink)' }}>{item.description || item.product_name}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>
                        {formatCurrency(item.amount || (item.quantity * item.price))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsReceiptModalOpen(true)}
              >
                <Printer size={14} strokeWidth={1.5} />
                Print receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Printable receipt */}
      {isReceiptModalOpen && selectedPurchase && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          purchase={selectedPurchase}
        />
      )}
    </div>
  );
};
