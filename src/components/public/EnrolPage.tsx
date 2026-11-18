import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Customer, Membership } from '../../types';
import { TierBadge } from '../common/TierBadge';
import { User, Phone, Mail, CheckCircle2, CreditCard, ArrowRight, Printer, Sparkles, Store } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EnrolPageProps {
  onEnrolSuccess?: (customer: Customer, membership: Membership) => void;
  onGoToPos?: () => void;
}

export const EnrolPage: React.FC<EnrolPageProps> = ({ onEnrolSuccess, onGoToPos }) => {
  const { enrolMember } = useDatabase();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state with newly generated card
  const [newMemberData, setNewMemberData] = useState<{
    customer: Customer;
    membership: Membership;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = enrolMember(name, email, phone);

    if (!result.success) {
      setError(result.error || 'Failed to enrol member.');
      setIsSubmitting(false);
      return;
    }

    if (result.customer && result.membership) {
      setNewMemberData({
        customer: result.customer,
        membership: result.membership,
      });

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if canvas not supported
      }

      if (onEnrolSuccess) {
        onEnrolSuccess(result.customer, result.membership);
      }
    }

    setIsSubmitting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setError(null);
    setNewMemberData(null);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      {!newMemberData ? (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-emerald-100 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Free Instant Membership</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Join FreshMart Rewards</h1>
            <p className="text-emerald-100/90 text-sm mt-1.5">
              Earn 1 point for every ₹10 spent, unlock tier privileges, and claim instant bill discounts.
            </p>
          </div>

          {/* Enrolment Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikramaditya Rao"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number (10 Digits) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono tracking-wider transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Used at POS checkout for fast 1-click member lookup.</p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. vikram@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Member Benefits Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Immediate Starter Privileges:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>1 pt per ₹10 spent</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Digital Loyalty Card</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant Bill Discounts</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Fast POS Lookup</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-700/20 hover:shadow-emerald-700/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />
              <span>Create Membership Card</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Workflow 4.1 Step 6: Show Membership Card */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8 text-center space-y-6">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-800">Registration Successful!</h2>
              <p className="text-sm text-slate-500 mt-1">
                Your FreshMart loyalty membership is now active and ready to earn points.
              </p>
            </div>

            {/* Visual Loyalty Card */}
            <div
              id="printable-receipt"
              className="relative w-full max-w-sm mx-auto rounded-2xl p-6 bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 text-white shadow-2xl border border-emerald-500/30 overflow-hidden text-left"
            >
              {/* Background ambient light */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                    FreshMart Club
                  </div>
                  <div className="text-lg font-black tracking-tight text-white">Loyalty Card</div>
                </div>
                <TierBadge tier={newMemberData.membership.tier} size="md" />
              </div>

              {/* Card Number */}
              <div className="my-6">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Card Number</div>
                <div className="text-2xl font-mono font-bold tracking-widest text-emerald-300">
                  {newMemberData.membership.card_number}
                </div>
              </div>

              {/* Member details footer */}
              <div className="flex justify-between items-end pt-2 border-t border-white/10">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Cardholder</div>
                  <div className="text-sm font-bold text-white capitalize">{newMemberData.customer.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Current Balance</div>
                  <div className="text-sm font-mono font-bold text-amber-300">
                    {newMemberData.membership.points} pts
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Card</span>
              </button>

              {onGoToPos && (
                <button
                  onClick={onGoToPos}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  <Store className="w-4 h-4" />
                  <span>Start Sale at POS</span>
                </button>
              )}

              <button
                onClick={handleResetForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors"
              >
                <span>Enrol Another Member</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
