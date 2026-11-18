import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { useDatabase } from './DatabaseContext';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: AuthUser | null;
  loginCashier: (email: string) => boolean;
  loginAdmin: (email: string) => boolean;
  loginCustomer: (phoneOrEmail: string) => Promise<boolean>;
  quickLogin: (user: AuthUser) => void;
  logout: () => void;
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
}

const AUTH_STORAGE_KEY = 'freshmart_auth_user_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { customers, memberships, showToast } = useDatabase();

  // Load persistent user credentials from localStorage across sessions
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

  // Keep credentials saved permanently in localStorage until user explicitly clicks logout
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [currentUser]);

  // Keep customer profile & tier updated when live database changes, without logging out
  useEffect(() => {
    if (currentUser?.role === 'customer' && currentUser.customer_id) {
      const match = customers.find((c) => c.customer_id === currentUser.customer_id);
      if (match && (match.name !== currentUser.name || match.phone !== currentUser.phone || match.email !== currentUser.email)) {
        setCurrentUser((prev) => (prev ? { ...prev, name: match.name, phone: match.phone, email: match.email } : prev));
      }
    }
  }, [customers, currentUser]);

  const loginCashier = (email: string): boolean => {
    const user: AuthUser = {
      id: 'cashier_1',
      name: 'Sunil Verma',
      email: email || 'cashier1@freshmart.com',
      role: 'cashier',
    };
    setCurrentUser(user);
    showToast(`Welcome back, Cashier ${user.name}! Terminal ready.`, 'success');
    return true;
  };

  const loginAdmin = (email: string): boolean => {
    const user: AuthUser = {
      id: 'admin_1',
      name: 'Pooja Nair (Store Manager)',
      email: email || 'manager@freshmart.com',
      role: 'admin',
    };
    setCurrentUser(user);
    showToast(`Manager session started: ${user.name}`, 'success');
    return true;
  };

  const loginCustomer = async (phoneOrEmail: string): Promise<boolean> => {
    const clean = phoneOrEmail.trim().toLowerCase();
    if (!clean) {
      showToast('Please enter your mobile number or email.', 'error');
      return false;
    }

    // 1. Try finding in loaded customer state
    let cust = customers.find(
      (c) => c.phone === clean || c.email.toLowerCase() === clean
    );

    // 2. If not found locally, query live backend database directly
    if (!cust) {
      try {
        const lookup = await api.lookupMember(clean);
        if (lookup && lookup.customer) {
          cust = lookup.customer;
        }
      } catch {
        // Continue to check
      }
    }

    if (!cust) {
      showToast(`No loyalty account found for "${phoneOrEmail}". Please sign up!`, 'error');
      return false;
    }

    const mem = memberships.find((m) => m.customer_id === cust.customer_id);

    const user: AuthUser = {
      id: cust.customer_id,
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      role: 'customer',
      customer_id: cust.customer_id,
    };

    setCurrentUser(user);
    showToast(`Welcome, ${cust.name}! Tier: ${mem?.tier || 'Silver'} (${mem?.points || 0} pts)`, 'success');
    return true;
  };

  const quickLogin = (user: AuthUser) => {
    setCurrentUser(user);
    showToast(`Signed in as ${user.name} (${user.role.toUpperCase()})`, 'success');
  };

  // Only logs out when the user explicitly triggers this function
  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore
    }
    showToast('Signed out successfully.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loginCashier,
        loginAdmin,
        loginCustomer,
        quickLogin,
        logout,
        isMobileFrame,
        setIsMobileFrame,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
