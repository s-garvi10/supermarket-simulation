import {
  Customer,
  Membership,
  Reward,
  Purchase,
  Redemption,
  PaymentMethod,
  BillLineItem,
} from '../types';

export interface HealthStatus {
  status: string;
  message: string;
  engine: 'postgresql' | 'sqlite' | 'none';
  database: string;
  uptime: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  invoiceCount: number;
  totalMembers: number;
  totalPointsIssued: number;
  totalRedemptions: number;
}

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Health
  checkHealth: async (): Promise<HealthStatus> => {
    return request<HealthStatus>('/health');
  },

  // Analytics
  getAnalytics: async (): Promise<AnalyticsData> => {
    return request<AnalyticsData>('/analytics');
  },

  // Customers
  getCustomers: async (): Promise<Customer[]> => {
    return request<Customer[]>('/customers');
  },

  enrolCustomer: async (name: string, email: string, phone: string): Promise<{ customer: Customer; membership: Membership }> => {
    return request<{ customer: Customer; membership: Membership }>('/customers', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone }),
    });
  },

  updateCustomer: async (id: string, name: string, email: string, phone: string): Promise<Customer> => {
    return request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, email, phone }),
    });
  },

  // Memberships
  getMemberships: async (): Promise<Membership[]> => {
    return request<Membership[]>('/memberships');
  },

  lookupMember: async (query: string): Promise<{ customer: Customer; membership: Membership }> => {
    return request<{ customer: Customer; membership: Membership }>(`/memberships/lookup?q=${encodeURIComponent(query)}`);
  },

  // Rewards
  getRewards: async (): Promise<Reward[]> => {
    return request<Reward[]>('/rewards');
  },

  createReward: async (reward: Omit<Reward, 'reward_id'>): Promise<Reward> => {
    return request<Reward>('/rewards', {
      method: 'POST',
      body: JSON.stringify(reward),
    });
  },

  updateReward: async (reward: Reward): Promise<Reward> => {
    return request<Reward>(`/rewards/${reward.reward_id}`, {
      method: 'PUT',
      body: JSON.stringify(reward),
    });
  },

  toggleRewardStatus: async (rewardId: string): Promise<Reward> => {
    return request<Reward>(`/rewards/${rewardId}/toggle`, {
      method: 'PATCH',
    });
  },

  // Purchases
  getPurchases: async (): Promise<Purchase[]> => {
    return request<Purchase[]>('/purchases');
  },

  createPurchase: async (params: {
    customerId: string | null;
    cashierName: string;
    grossAmount: number;
    rewardId?: string | null;
    paymentMethod: PaymentMethod;
    notes?: string;
    items?: BillLineItem[];
  }): Promise<Purchase> => {
    return request<Purchase>('/purchases', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Redemptions
  getRedemptions: async (): Promise<Redemption[]> => {
    return request<Redemption[]>('/redemptions');
  },

  createRedemption: async (customerId: string, rewardId: string): Promise<Redemption & { remaining_points: number; new_tier: string }> => {
    return request<Redemption & { remaining_points: number; new_tier: string }>('/redemptions', {
      method: 'POST',
      body: JSON.stringify({ customerId, rewardId }),
    });
  },

  // Reset database demo state
  resetDatabase: async (): Promise<{ message: string; engine: string }> => {
    return request<{ message: string; engine: string }>('/reset', {
      method: 'POST',
    });
  },
};
