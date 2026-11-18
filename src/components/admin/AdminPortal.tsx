import React, { useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { CustomerManagement } from './CustomerManagement';
import { RewardManagement } from './RewardManagement';
import { SalesReport } from './SalesReport';
import {
  LayoutDashboard,
  Users,
  Gift,
  FileText,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const tabs: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'sales', label: 'Purchases & Bills Ledger', icon: <FileText className="w-4 h-4" /> },
    { id: 'customers', label: 'Loyalty Members Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'rewards', label: 'Reward Offers & Discounts', icon: <Gift className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
      {/* Admin Subheader & Navigation Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
            Supermarket Back-Office Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Store Manager Administration
          </h1>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all">
        {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={setActiveTab} />}
        {activeTab === 'sales' && <SalesReport />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'rewards' && <RewardManagement />}
      </div>
    </div>
  );
};
