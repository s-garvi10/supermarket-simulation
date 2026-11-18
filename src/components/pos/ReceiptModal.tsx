import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Purchase } from '../../types';
import { Modal } from '../common/Modal';
import { Printer, CheckCircle, Store, Sparkles } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: Purchase | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  purchase,
}) => {
  const { customers, memberships } = useDatabase();

  if (!purchase) return null;

  const customer = purchase.customer_id
    ? customers.find((c) => c.customer_id === purchase.customer_id)
    : null;
  const membership = customer
    ? memberships.find((m) => m.customer_id === customer.customer_id)
    : null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(purchase.purchase_date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const gross = purchase.gross_amount ?? (purchase as any).subtotal ?? purchase.total_amount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supermarket Tax Invoice / Bill" maxWidth="md">
      <div className="space-y-4">
        {/* Printable Receipt Paper Container */}
        <div
          id="printable-receipt"
          className="bg-white border border-slate-300 rounded-xl p-6 font-mono text-xs text-slate-800 shadow-xs space-y-4 max-w-sm mx-auto"
        >
          {/* Supermarket Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-sans font-black text-base text-slate-900 tracking-tight">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>FRESHMART SUPERMARKET</span>
            </div>
            <div className="text-[10px] text-slate-500">Retail Outlet #04 • Sector 14, Main Road</div>
            <div className="text-[10px] text-slate-500">GSTIN: 07AAAAA0000A1Z5 • TEL: 1800-419-8800</div>
          </div>

          {/* Invoice Meta */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice:</span>
              <span className="font-bold">{purchase.purchase_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{purchase.cashier_name || 'Terminal 01 (Staff)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Tender:</span>
              <span className="font-bold">{purchase.payment_method}</span>
            </div>

            {/* Member info if linked */}
            {customer && membership && (
              <div className="pt-1 mt-1 border-t border-slate-200">
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Customer:</span>
                  <span>{customer.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Card No:</span>
                  <span>{membership.card_number} ({membership.tier})</span>
                </div>
              </div>
            )}
          </div>

          {/* Line items or Bill details */}
          <div>
            <div className="flex justify-between font-bold text-[10px] text-slate-400 border-b border-slate-200 pb-1 mb-1">
              <span>PURCHASE DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>
            <div className="space-y-1.5">
              {purchase.items && purchase.items.length > 0 ? (
                purchase.items.map((item: any, idx) => (
                  <div key={item.id || item.item_id || idx} className="flex justify-between text-[11px]">
                    <span className="font-bold text-slate-800">
                      {item.description || item.product_name}
                    </span>
                    <span className="font-bold">
                      ₹{item.amount || (item.quantity * item.price)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-slate-800">
                    {purchase.notes || 'Supermarket Groceries & Household Essentials'}
                  </span>
                  <span className="font-bold">₹{gross.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Total:</span>
              <span>₹{gross.toLocaleString('en-IN')}</span>
            </div>
            {purchase.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Loyalty Discount:</span>
                <span>-₹{purchase.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black border-t border-slate-300 pt-1 text-slate-900">
              <span>TOTAL PAID:</span>
              <span>₹{purchase.total_amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Loyalty Points Earning Section */}
          {customer && membership && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>FRESHMART REWARDS SUMMARY</span>
              </div>
              <div className="text-xs font-bold text-emerald-900">
                Points Earned This Trip: +{purchase.points_earned} pts
              </div>
              <div className="text-[11px] text-slate-600">
                New Total Balance: <span className="font-bold text-amber-700">{membership.points} Points</span>
              </div>
            </div>
          )}

          {/* Barcode & Footer */}
          <div className="text-center pt-2 space-y-1 text-slate-400 text-[10px]">
            <div className="font-mono tracking-widest text-xs font-bold text-slate-700">
              ||| | ||||| || |||| ||||| |||
            </div>
            <div>Thank you for shopping at FreshMart!</div>
            <div>Please keep this bill for returns/loyalty inquiries.</div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Bill</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
