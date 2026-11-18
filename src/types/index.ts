// Supermarket Rewards & Loyalty Management System Types

export type Tier = 'Silver' | 'Gold' | 'Platinum';

export type UserRole = 'cashier' | 'customer' | 'admin';

export interface Customer {
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Membership {
  membership_id: string;
  customer_id: string;
  card_number: string;
  tier: Tier;
  points: number;
  joined_on: string;
}

export type PaymentMethod = 'UPI' | 'Card' | 'Cash';

export interface BillLineItem {
  id: string;
  description: string;
  amount: number;
}

export interface Purchase {
  purchase_id: string; // e.g. INV-2026-1042
  customer_id: string | null; // null for guest bills
  customer_name?: string;
  customer_phone?: string;
  cashier_name: string;
  purchase_date: string;
  gross_amount: number;
  discount: number;
  total_amount: number;
  points_earned: number;
  payment_method: PaymentMethod;
  reward_id?: string | null;
  reward_name?: string | null;
  items?: BillLineItem[];
  notes?: string;
}

export interface Reward {
  reward_id: string;
  name: string;
  points_cost: number;
  discount: number;
  description: string;
  is_active: boolean;
}

export interface Redemption {
  redemption_id: string;
  customer_id: string;
  reward_id: string;
  reward_name: string;
  points_spent: number;
  redeemed_at: string;
  voucher_code: string;
  status: 'available' | 'used';
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  customer_id?: string;
}
