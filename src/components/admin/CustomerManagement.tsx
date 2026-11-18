import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer, Membership, Tier } from '../../types';
import { TierBadge } from '../common/TierBadge';
import { Search, UserCheck, Eye, Phone, Mail, Calendar, Sparkles, ShoppingBag } from 'lucide-react';
import { Modal } from '../common/Modal';

export const CustomerManagement: React.FC = () => {
  const { customers, memberships, purchases, redemptions } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [inspectCustomer, setInspectCustomer] = useState<{
    customer: Customer;
    membership: Membership;
  } | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const mem = memberships.find((m) => m.customer_id === c.customer_id);
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mem && mem.card_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === 'all' || (mem && mem.tier === tierFilter);
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Loyalty Customer Directory</h2>
          <p className="text-xs text-slate-500">
            {customers.length} registered shoppers enrolled in FreshMart Rewards
          </p>
        </div>

        {/* Tier Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['all', 'Silver', 'Gold', 'Platinum'].map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tierFilter === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t === 'all' ? 'All Tiers' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search member by name, phone, email, or card number..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-3">Card No.</th>
                <th className="py-3 px-3">Tier</th>
                <th className="py-3 px-3 text-right">Points</th>
                <th className="py-3 px-3">Enrolled</th>
                <th className="py-3 px-3 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No customers found matching "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const mem = memberships.find((m) => m.customer_id === c.customer_id);
                  const customerOrders = purchases.filter((p) => p.customer_id === c.customer_id);
                  const totalSpent = customerOrders.reduce((sum, p) => sum + p.total_amount, 0);

                  return (
                    <tr key={c.customer_id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{c.phone}</div>
                      </td>

                      {/* Card Number */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {mem?.card_number || '—'}
                      </td>

                      {/* Tier */}
                      <td className="py-3 px-3">
                        {mem ? <TierBadge tier={mem.tier} size="sm" /> : '—'}
                      </td>

                      {/* Points */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">
                        {mem?.points.toLocaleString()} pts
                      </td>

                      {/* Enrolled Date */}
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(c.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Orders & Spend */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800">{customerOrders.length}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          (₹{totalSpent.toLocaleString('en-IN')})
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => mem && setInspectCustomer({ customer: c, membership: mem })}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Drilldown</span>
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

      {/* Customer Detail Drawer / Modal */}
      {inspectCustomer && (
        <Modal
          isOpen={!!inspectCustomer}
          onClose={() => setInspectCustomer(null)}
          title={`Member Profile: ${inspectCustomer.customer.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Summary Header */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">{inspectCustomer.customer.name}</span>
                  <TierBadge tier={inspectCustomer.membership.tier} size="sm" />
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1 space-x-3">
                  <span>Card: {inspectCustomer.membership.card_number}</span>
                  <span>•</span>
                  <span>{inspectCustomer.customer.phone}</span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[10px] text-slate-400 uppercase">Current Balance</div>
                <div className="text-2xl font-black font-mono text-amber-400">
                  {inspectCustomer.membership.points} Points
                </div>
              </div>
            </div>

            {/* Purchase History of this customer */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Order Activity
              </h4>
              {purchases.filter((p) => p.customer_id === inspectCustomer.customer.customer_id).length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  No purchases yet for this member.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {purchases
                    .filter((p) => p.customer_id === inspectCustomer.customer.customer_id)
                    .map((p) => (
                      <div
                        key={p.purchase_id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">
                            ₹{p.total_amount.toLocaleString('en-IN')}
                            <span className="text-slate-400 font-normal ml-2 font-mono">
                              #{p.purchase_id}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(p.purchase_date).toLocaleString('en-IN')} • {p.payment_method}
                          </div>
                        </div>
                        <div className="text-amber-700 font-bold font-mono text-[11px]">
                          +{p.points_earned} pts
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Redemptions of this customer */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Reward Redemptions
              </h4>
              {redemptions.filter((r) => r.customer_id === inspectCustomer.customer.customer_id).length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                  No rewards redeemed yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {redemptions
                    .filter((r) => r.customer_id === inspectCustomer.customer.customer_id)
                    .map((r) => (
                      <div
                        key={r.redemption_id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{r.reward_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Code: {r.voucher_code} • {new Date(r.redeemed_at).toLocaleDateString('en-IN')}
                          </div>
                        </div>
                        <div className="font-bold text-rose-600 font-mono">
                          -{r.points_spent} pts
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
