import React from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import {
  TrendingUp,
  Receipt,
  Users,
  Sparkles,
  ArrowUpRight,
  Gift,
  FileText,
  CreditCard,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { purchases, customers, memberships, rewards, redemptions } = useDatabase();

  const totalSalesRevenue = purchases.reduce((acc, p) => acc + p.total_amount, 0);
  const totalPointsIssued = memberships.reduce((acc, m) => acc + m.points, 0);
  const totalPointsRedeemed = redemptions.reduce((acc, r) => acc + r.points_spent, 0);
  const totalBills = purchases.length;
  const totalCustomers = customers.length;

  return (
    <div className="space-y-6">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Purchases</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              ₹{totalSalesRevenue.toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% this week</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bills Processed</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">{totalBills}</div>
            <div className="text-[11px] text-slate-400 mt-1">Total completed receipts</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Members</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">{totalCustomers}</div>

          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points Balance</div>
            <div className="text-2xl font-black font-mono text-amber-600 mt-1">
              {totalPointsIssued.toLocaleString()} pts
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {totalPointsRedeemed} pts redeemed ({redemptions.length} vouchers)
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Sales Trend Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Weekly Revenue & Volume</h3>
              <p className="text-xs text-slate-400">7-day performance overview across counters</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              Last 7 Days
            </span>
          </div>

          {/* SVG Trend Chart */}
          <div className="h-56 w-full flex flex-col justify-end">
            <div className="flex items-end justify-between h-44 gap-2 pt-4 px-2 border-b border-slate-200">
              {[
                { day: 'Mon', rev: 4200, height: '40%' },
                { day: 'Tue', rev: 5800, height: '55%' },
                { day: 'Wed', rev: 3900, height: '35%' },
                { day: 'Thu', rev: 7200, height: '70%' },
                { day: 'Fri', rev: 8900, height: '85%' },
                { day: 'Sat', rev: 11400, height: '98%' },
                { day: 'Sun', rev: 9800, height: '90%' },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-xs whitespace-nowrap pointer-events-none z-10">
                    ₹{item.rev.toLocaleString('en-IN')}
                  </div>

                  {/* Bar */}
                  <div
                    className="w-full max-w-[36px] bg-emerald-500/80 group-hover:bg-emerald-600 rounded-t-lg transition-all"
                    style={{ height: item.height }}
                  />

                  {/* Day Label */}
                  <span className="text-[11px] font-semibold text-slate-500">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Purchases & Quick Nav (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Latest Processed Bills</h3>
              <button
                onClick={() => onNavigateTab('sales')}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                View All ({purchases.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {purchases.slice(0, 4).map((p) => (
                <div key={p.purchase_id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">
                      {p.customer_name ? p.customer_name : 'Guest Checkout'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.purchase_id} • {p.payment_method}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-slate-900 font-mono">
                      ₹{p.total_amount.toLocaleString('en-IN')}
                    </div>
                    {p.points_earned > 0 && (
                      <div className="text-[10px] text-amber-600 font-bold font-mono">
                        +{p.points_earned} pts
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
            <button
              onClick={() => onNavigateTab('sales')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Bills Ledger</span>
            </button>
            <button
              onClick={() => onNavigateTab('customers')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-sky-600" />
              <span>Customers</span>
            </button>
            <button
              onClick={() => onNavigateTab('rewards')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
            >
              <Gift className="w-4 h-4 text-purple-600" />
              <span>Rewards ({rewards.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
