import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Customer,
  Membership,
  Reward,
  Purchase,
  Redemption,
  PaymentMethod,
  Tier,
  BillLineItem,
} from '../types';
import { api } from '../services/api';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface BackendStatus {
  connected: boolean;
  engine: string;
  database?: string;
}

interface DatabaseContextType {
  customers: Customer[];
  memberships: Membership[];
  rewards: Reward[];
  purchases: Purchase[];
  redemptions: Redemption[];
  toasts: ToastInfo[];
  backendStatus: BackendStatus;
  refreshFromBackend: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  enrolMember: (name: string, email: string, phone: string) => {
    success: boolean;
    error?: string;
    customer?: Customer;
    membership?: Membership;
  };
  lookupMember: (query: string) => { customer: Customer; membership: Membership } | null;
  getMembershipForCustomer: (customerId: string) => Membership | undefined;
  getCustomerById: (customerId: string) => Customer | undefined;
  createBill: (params: {
    customerId: string | null;
    cashierName: string;
    grossAmount: number;
    rewardId?: string | null;
    paymentMethod: PaymentMethod;
    notes?: string;
    items?: BillLineItem[];
  }) => Purchase;
  redeemReward: (customerId: string, rewardId: string) => {
    success: boolean;
    error?: string;
    redemption?: Redemption;
  };
  addReward: (reward: Omit<Reward, 'reward_id'>) => Reward;
  updateReward: (reward: Reward) => void;
  toggleRewardStatus: (rewardId: string) => void;
  updateCustomerProfile: (customerId: string, name: string, email: string, phone: string) => boolean;
  resetDemoData: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

// Clear any old static mock data from previous runs
try {
  const keysToRemove = [
    'freshmart_rewards_only_v1_customers',
    'freshmart_rewards_only_v1_memberships',
    'freshmart_rewards_only_v1_rewards',
    'freshmart_rewards_only_v1_purchases',
    'freshmart_rewards_only_v1_redemptions',
  ];
  keysToRemove.forEach((k) => localStorage.removeItem(k));
} catch {
  // Ignore local storage error in sandboxed/restricted environments
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Pure live state — No static hardcoded seed data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>({
    connected: false,
    engine: 'connecting',
  });

  const isFetchingRef = useRef(false);

  // Sync with Backend API in Real Time
  const refreshFromBackend = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const health = await api.checkHealth();
      if (health.status === 'ok') {
        setBackendStatus({
          connected: true,
          engine: health.engine,
          database: health.database,
        });

        // Parallel fetch of all live database entities
        const [c, m, r, p, red] = await Promise.all([
          api.getCustomers().catch(() => null),
          api.getMemberships().catch(() => null),
          api.getRewards().catch(() => null),
          api.getPurchases().catch(() => null),
          api.getRedemptions().catch(() => null),
        ]);

        if (Array.isArray(c)) setCustomers(c);
        if (Array.isArray(m)) setMemberships(m);
        if (Array.isArray(r)) setRewards(r);
        if (Array.isArray(p)) setPurchases(p);
        if (Array.isArray(red)) setRedemptions(red);
      }
    } catch {
      setBackendStatus({
        connected: false,
        engine: 'offline',
      });
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  // Real-Time Polling & Window Focus sync (Every 3 seconds)
  useEffect(() => {
    refreshFromBackend();

    const interval = setInterval(() => {
      refreshFromBackend();
    }, 3000);

    const onFocus = () => {
      refreshFromBackend();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refreshFromBackend]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getMembershipForCustomer = (customerId: string): Membership | undefined => {
    return memberships.find((m) => m.customer_id === customerId);
  };

  const getCustomerById = (customerId: string): Customer | undefined => {
    return customers.find((c) => c.customer_id === customerId);
  };

  const determineTier = (points: number): Tier => {
    if (points >= 1200) return 'Platinum';
    if (points >= 400) return 'Gold';
    return 'Silver';
  };

  const enrolMember = (name: string, email: string, phone: string) => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName) {
      return { success: false, error: 'Full name is required.' };
    }

    if (cleanPhone.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const existingPhone = customers.find((c) => c.phone === cleanPhone);
    if (existingPhone) {
      return { success: false, error: `Mobile number ${cleanPhone} is already enrolled with ${existingPhone.name}.` };
    }

    if (cleanEmail) {
      const existingEmail = customers.find((c) => c.email.toLowerCase() === cleanEmail);
      if (existingEmail) {
        return { success: false, error: `Email ${cleanEmail} is already registered.` };
      }
    }

    const customerId = `cust_${Date.now()}`;
    const membershipId = `mem_${Date.now()}`;
    const randomCardDigits = Math.floor(100000 + Math.random() * 900000);
    const cardNumber = `SM-${randomCardDigits}`;

    const newCustomer: Customer = {
      customer_id: customerId,
      name: cleanName,
      email: cleanEmail || `${cleanPhone}@loyalty.freshmart.com`,
      phone: cleanPhone,
      created_at: new Date().toISOString(),
    };

    const newMembership: Membership = {
      membership_id: membershipId,
      customer_id: customerId,
      card_number: cardNumber,
      tier: 'Silver',
      points: 0,
      joined_on: new Date().toISOString(),
    };

    // Optimistic immediate update
    setCustomers((prev) => [newCustomer, ...prev]);
    setMemberships((prev) => [newMembership, ...prev]);
    showToast(`Loyalty membership activated for ${cleanName}! Card: ${cardNumber}`, 'success');

    // Real-time backend persistence
    api.enrolCustomer(cleanName, cleanEmail, cleanPhone)
      .then((res) => {
        if (res && res.customer && res.membership) {
          setCustomers((prev) => prev.map((c) => (c.customer_id === customerId ? res.customer : c)));
          setMemberships((prev) => prev.map((m) => (m.membership_id === membershipId ? res.membership : m)));
        }
        refreshFromBackend();
      })
      .catch((err) => {
        console.warn('Real-time enrolment sync notice:', err.message);
      });

    return {
      success: true,
      customer: newCustomer,
      membership: newMembership,
    };
  };

  const lookupMember = (query: string): { customer: Customer; membership: Membership } | null => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchCust = customers.find(
      (c) => c.phone.includes(q) || c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );

    if (matchCust) {
      const mem = memberships.find((m) => m.customer_id === matchCust.customer_id);
      if (mem) return { customer: matchCust, membership: mem };
    }

    const matchMem = memberships.find((m) => m.card_number.toLowerCase().includes(q));
    if (matchMem) {
      const cust = customers.find((c) => c.customer_id === matchMem.customer_id);
      if (cust) return { customer: cust, membership: matchMem };
    }

    return null;
  };

  const createBill = ({
    customerId,
    cashierName,
    grossAmount,
    rewardId,
    paymentMethod,
    notes,
    items,
  }: {
    customerId: string | null;
    cashierName: string;
    grossAmount: number;
    rewardId?: string | null;
    paymentMethod: PaymentMethod;
    notes?: string;
    items?: BillLineItem[];
  }): Purchase => {
    let discount = 0;
    let appliedReward: Reward | undefined;

    if (rewardId) {
      appliedReward = rewards.find((r) => r.reward_id === rewardId);
      if (appliedReward) {
        discount = Math.min(grossAmount, appliedReward.discount);
      }
    }

    const totalAmount = Math.max(0, grossAmount - discount);
    const pointsEarned = customerId ? Math.floor(totalAmount / 10) : 0;
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const linkedCust = customerId ? customers.find((c) => c.customer_id === customerId) : null;

    const newPurchase: Purchase = {
      purchase_id: invoiceNumber,
      customer_id: customerId,
      customer_name: linkedCust?.name,
      customer_phone: linkedCust?.phone,
      cashier_name: cashierName,
      purchase_date: new Date().toISOString(),
      gross_amount: grossAmount,
      discount,
      total_amount: totalAmount,
      points_earned: pointsEarned,
      payment_method: paymentMethod,
      reward_id: rewardId || null,
      reward_name: appliedReward?.name || null,
      notes: notes || undefined,
      items: items || [],
    };

    // Optimistic UI updates
    if (customerId) {
      setMemberships((prev) =>
        prev.map((mem) => {
          if (mem.customer_id === customerId) {
            let updatedPoints = mem.points;
            if (appliedReward) {
              updatedPoints = Math.max(0, updatedPoints - appliedReward.points_cost);
            }
            updatedPoints += pointsEarned;
            const newTier = determineTier(updatedPoints);
            return {
              ...mem,
              points: updatedPoints,
              tier: newTier,
            };
          }
          return mem;
        })
      );

      if (appliedReward) {
        const newRedemption: Redemption = {
          redemption_id: `red_${Date.now()}`,
          customer_id: customerId,
          reward_id: appliedReward.reward_id,
          reward_name: appliedReward.name,
          points_spent: appliedReward.points_cost,
          redeemed_at: new Date().toISOString(),
          voucher_code: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'used',
        };
        setRedemptions((prev) => [newRedemption, ...prev]);
      }
    }

    setPurchases((prev) => [newPurchase, ...prev]);
    showToast(
      `Bill ${invoiceNumber} saved! Total: ₹${totalAmount.toLocaleString('en-IN')}${
        pointsEarned > 0 ? ` (+${pointsEarned} pts awarded)` : ''
      }`,
      'success'
    );

    // Real-time backend persistence
    api.createPurchase({
      customerId,
      cashierName,
      grossAmount,
      rewardId,
      paymentMethod,
      notes,
      items,
    })
      .then((saved) => {
        if (saved && saved.purchase_id) {
          setPurchases((prev) =>
            prev.map((p) => (p.purchase_id === invoiceNumber ? saved : p))
          );
        }
        refreshFromBackend();
      })
      .catch((err) => {
        console.warn('Real-time purchase sync notice:', err.message);
      });

    return newPurchase;
  };

  const redeemReward = (customerId: string, rewardId: string) => {
    const mem = memberships.find((m) => m.customer_id === customerId);
    if (!mem) {
      return { success: false, error: 'Membership not found.' };
    }

    const reward = rewards.find((r) => r.reward_id === rewardId);
    if (!reward) {
      return { success: false, error: 'Reward no longer available.' };
    }

    if (mem.points < reward.points_cost) {
      return {
        success: false,
        error: `Insufficient points! You have ${mem.points} pts, but need ${reward.points_cost} pts (${reward.points_cost - mem.points} more).`,
      };
    }

    const newPoints = mem.points - reward.points_cost;
    const newTier = determineTier(newPoints);

    setMemberships((prev) =>
      prev.map((m) => (m.customer_id === customerId ? { ...m, points: newPoints, tier: newTier } : m))
    );

    const voucherCode = `FM-RDM-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRedemption: Redemption = {
      redemption_id: `red_${Date.now()}`,
      customer_id: customerId,
      reward_id: reward.reward_id,
      reward_name: reward.name,
      points_spent: reward.points_cost,
      redeemed_at: new Date().toISOString(),
      voucher_code: voucherCode,
      status: 'available',
    };

    setRedemptions((prev) => [newRedemption, ...prev]);
    showToast(`Claimed "${reward.name}"! Voucher code: ${voucherCode}`, 'success');

    // Real-time backend persistence
    api.createRedemption(customerId, rewardId)
      .then((saved) => {
        if (saved && saved.voucher_code) {
          setRedemptions((prev) =>
            prev.map((r) => (r.redemption_id === newRedemption.redemption_id ? saved : r))
          );
        }
        refreshFromBackend();
      })
      .catch((err) => {
        console.warn('Real-time redemption sync notice:', err.message);
      });

    return {
      success: true,
      redemption: newRedemption,
    };
  };

  const addReward = (rewData: Omit<Reward, 'reward_id'>): Reward => {
    const newRew: Reward = {
      ...rewData,
      reward_id: `rew_${Date.now()}`,
    };
    setRewards((prev) => [...prev, newRew]);
    showToast(`Added reward "${newRew.name}"`, 'success');

    api.createReward(rewData)
      .then(() => refreshFromBackend())
      .catch((err) => {
        console.warn('Real-time reward creation sync notice:', err.message);
      });

    return newRew;
  };

  const updateReward = (updated: Reward) => {
    setRewards((prev) => prev.map((r) => (r.reward_id === updated.reward_id ? updated : r)));
    showToast(`Reward updated`, 'success');

    api.updateReward(updated)
      .then(() => refreshFromBackend())
      .catch((err) => {
        console.warn('Real-time reward update sync notice:', err.message);
      });
  };

  const toggleRewardStatus = (rewardId: string) => {
    setRewards((prev) =>
      prev.map((r) => (r.reward_id === rewardId ? { ...r, is_active: !r.is_active } : r))
    );
    showToast(`Reward offer visibility changed`, 'info');

    api.toggleRewardStatus(rewardId)
      .then(() => refreshFromBackend())
      .catch((err) => {
        console.warn('Real-time reward toggle sync notice:', err.message);
      });
  };

  const updateCustomerProfile = (customerId: string, name: string, email: string, phone: string) => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      showToast('Phone must be 10 digits', 'error');
      return false;
    }
    setCustomers((prev) =>
      prev.map((c) =>
        c.customer_id === customerId
          ? { ...c, name: name.trim(), email: email.trim(), phone: cleanPhone }
          : c
      )
    );
    showToast('Customer profile updated', 'success');

    api.updateCustomer(customerId, name, email, cleanPhone)
      .then(() => refreshFromBackend())
      .catch((err) => {
        console.warn('Real-time customer update sync notice:', err.message);
      });

    return true;
  };

  const resetDemoData = () => {
    setPurchases([]);
    setRedemptions([]);
    setMemberships((prev) => prev.map((m) => ({ ...m, points: 0, tier: 'Silver' })));
    showToast('Transactions cleared and points reset!', 'info');

    api.resetDatabase()
      .then(() => refreshFromBackend())
      .catch((err) => {
        console.warn('Real-time reset notice:', err.message);
      });
  };

  return (
    <DatabaseContext.Provider
      value={{
        customers,
        memberships,
        rewards,
        purchases,
        redemptions,
        toasts,
        backendStatus,
        refreshFromBackend,
        showToast,
        removeToast,
        enrolMember,
        lookupMember,
        getMembershipForCustomer,
        getCustomerById,
        createBill,
        redeemReward,
        addReward,
        updateReward,
        toggleRewardStatus,
        updateCustomerProfile,
        resetDemoData,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
