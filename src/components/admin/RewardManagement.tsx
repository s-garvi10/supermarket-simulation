import React, { useState } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Reward } from '../../types';
import { Gift, Plus, Edit2, Sparkles, Check, X } from 'lucide-react';
import { Modal } from '../common/Modal';

export const RewardManagement: React.FC = () => {
  const { rewards, addReward, updateReward, toggleRewardStatus } = useDatabase();

  const [isAdding, setIsAdding] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [name, setName] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [discount, setDiscount] = useState('');
  const [description, setDescription] = useState('');

  const openAdd = () => {
    setName('');
    setPointsCost('200');
    setDiscount('50');
    setDescription('');
    setIsAdding(true);
  };

  const handlePointsChange = (val: string) => {
    setPointsCost(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setDiscount((num * 0.25).toString());
    }
  };

  const openEdit = (rew: Reward) => {
    setEditingReward(rew);
    setName(rew.name);
    setPointsCost(rew.points_cost.toString());
    setDiscount(rew.discount.toString());
    setDescription(rew.description);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const costNum = parseInt(pointsCost, 10) || 50;
    const discNum = parseFloat(discount) || 50;

    if (editingReward) {
      updateReward({
        ...editingReward,
        name: name.trim(),
        points_cost: costNum,
        discount: discNum,
        description: description.trim(),
      });
      setEditingReward(null);
    } else {
      addReward({
        name: name.trim(),
        points_cost: costNum,
        discount: discNum,
        description: description.trim(),
        is_active: true,
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Loyalty Rewards Management</h2>
          <p className="text-xs text-slate-500">
            Define point redemption offers, bill discounts, and customer reward incentives
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Reward Offer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((rew) => (
          <div
            key={rew.reward_id}
            className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              rew.is_active ? 'border-slate-200 shadow-2xs' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleRewardStatus(rew.reward_id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      rew.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {rew.is_active ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    onClick={() => openEdit(rew)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-extrabold text-slate-900">{rew.name}</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rew.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{rew.points_cost} Points</span>
              </span>

              <span className="font-mono font-extrabold text-sm text-emerald-700">
                -₹{rew.discount} Discount
              </span>
            </div>
          </div>
        ))}
      </div>

      {(isAdding || editingReward) && (
        <Modal
          isOpen={isAdding || !!editingReward}
          onClose={() => {
            setIsAdding(false);
            setEditingReward(null);
          }}
          title={editingReward ? 'Edit Reward Offer' : 'Create New Loyalty Reward'}
          maxWidth="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reward Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ₹200 Supermarket Cash Voucher"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Points Cost
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={pointsCost}
                  onChange={(e) => handlePointsChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">1 pt = ₹0.25 value</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Discount Value (₹)
                </label>
                <input
                  type="number"
                  required
                  min={0.25}
                  step={0.25}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">
                  = ₹{(parseFloat(discount) || 0).toFixed(2)} off bill
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide terms or qualifying product categories..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingReward(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {editingReward ? 'Save Reward' : 'Publish Reward'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
