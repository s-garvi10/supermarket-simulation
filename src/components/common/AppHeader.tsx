import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { TierBadge } from './TierBadge';
import {
  Store,
  LogOut,
  User,
  Sparkles,
  Smartphone,
  Monitor,
  RotateCcw,
  ShieldCheck,
  Receipt,
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { currentUser, logout, isMobileFrame, setIsMobileFrame } = useAuth();
  const { memberships, resetDemoData } = useDatabase();

  if (!currentUser) return null;

  const customerMembership =
    currentUser.role === 'customer' && currentUser.customer_id
      ? memberships.find((m) => m.customer_id === currentUser.customer_id)
      : undefined;

  const getRoleLabel = () => {
    switch (currentUser.role) {
      case 'cashier':
        return { label: 'Cashier Staff', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'admin':
        return { label: 'Store Manager', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'customer':
      default:
        return { label: 'Loyalty Member', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
  };

  const roleInfo = getRoleLabel();

  const handleReset = () => {
    if (window.confirm('Reset the entire rewards & purchases database back to initial factory state?')) {
      resetDemoData();
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-4 sm:px-6 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">FreshMart</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Rewards System
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Supermarket Customer Purchases & Loyalty Engine
            </div>
          </div>
        </div>

        {/* Authenticated User Profile & Actions */}
        <div className="flex items-center gap-3">
          {/* Customer Mobile Frame Toggle */}
          {currentUser.role === 'customer' && (
            <button
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isMobileFrame
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Toggle smartphone simulation frame"
            >
              {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
              <span>{isMobileFrame ? 'Desktop' : 'Phone'}</span>
            </button>
          )}

          {/* User Profile Card */}
          <div className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white max-w-[130px] sm:max-w-[180px] truncate">
                  {currentUser.name}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded border ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
              </div>

              {/* Customer Points & Tier */}
              {customerMembership && (
                <div className="flex items-center gap-2 text-[10px] mt-0.5 font-mono">
                  <span className="text-amber-300 font-bold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    {customerMembership.points} pts
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-emerald-300 font-semibold">{customerMembership.tier}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reset Demo Data discreet button */}
          <button
            onClick={handleReset}
            className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1.5 rounded-lg border border-slate-700 transition-colors"
            title="Reset database to demo initial state"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span className="text-[11px]">Reset</span>
          </button>

          {/* Log Out Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600 px-3 py-1.5 rounded-xl border border-rose-500/30 transition-all cursor-pointer"
            title="Sign out of current account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
