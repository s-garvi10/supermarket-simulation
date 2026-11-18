import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { PaymentMethod, Purchase } from '../../types';
import { ReceiptModal } from '../pos/ReceiptModal';
import { Download, Search, Eye, Filter } from 'lucide-react';

export const SalesReport: React.FC = () => {
  const { purchases, customers, showToast } = useDatabase();

  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceiptPurchase, setSelectedReceiptPurchase] = useState<Purchase | null>(null);

  const filteredPurchases = purchases.filter((p) => {
    const cust = p.customer_id
      ? customers.find((c) => c.customer_id === p.customer_id)
      : null;
    const matchesSearch =
      p.purchase_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cust && cust.phone.includes(searchTerm));
    const matchesPayment =
      paymentFilter === 'all' || p.payment_method === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const handleExportCSV = () => {
    const headers = [
      'Invoice ID',
      'Date',
      'Customer',
      'Cashier',
      'Tender',
      'Gross Amount',
      'Discount',
      'Total Amount',
      'Points Earned',
    ];
    const rows = filteredPurchases.map((p) => {
      const cust = p.customer_id
        ? customers.find((c) => c.customer_id === p.customer_id)
        : null;
      const gross = p.gross_amount ?? (p as any).subtotal ?? p.total_amount;
      return [
        p.purchase_id,
        p.purchase_date,
        cust ? cust.name : 'Guest',
        p.cashier_name || 'Counter 1',
        p.payment_method,
        gross,
        p.discount,
        p.total_amount,
        p.points_earned,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FreshMart_Purchases_Ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Purchases & Bills CSV generated and downloaded', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Purchases & Bills Ledger</h2>
          <p className="text-xs text-slate-500">
            {purchases.length} total supermarket transactions processed across cash, card, and UPI
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice ID or customer name/phone..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Payment Methods</option>
          <option value="UPI">UPI / QR</option>
          <option value="Card">Card</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-3">Date / Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Tender</th>
                <th className="py-3 px-3 text-right">Gross</th>
                <th className="py-3 px-3 text-right">Discount</th>
                <th className="py-3 px-3 text-right">Total Paid</th>
                <th className="py-3 px-3 text-center">Points</th>
                <th className="py-3 px-4 text-right">Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No transactions found matching filters.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const cust = p.customer_id
                    ? customers.find((c) => c.customer_id === p.customer_id)
                    : null;
                  const gross = p.gross_amount ?? (p as any).subtotal ?? p.total_amount;

                  return (
                    <tr key={p.purchase_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {p.purchase_id}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(p.purchase_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        {cust ? (
                          <div>
                            <span className="font-bold text-slate-900">{cust.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {cust.phone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Guest Checkout</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {p.cashier_name || 'Staff'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-[10px]">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        ₹{gross.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700">
                        {p.discount > 0 ? `-₹${p.discount}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900">
                        ₹{p.total_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {p.points_earned > 0 ? (
                          <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                            +{p.points_earned}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceiptPurchase(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="View Supermarket Bill"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptModal
        isOpen={!!selectedReceiptPurchase}
        onClose={() => setSelectedReceiptPurchase(null)}
        purchase={selectedReceiptPurchase}
      />
    </div>
  );
};
