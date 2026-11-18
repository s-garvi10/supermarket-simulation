import React from 'react';
import { DatabaseProvider } from './context/DatabaseContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/common/Layout';
import { ToastContainer } from './components/common/Toast';
import { AuthPage } from './components/auth/AuthPage';
import { BillEntryTerminal } from './components/cashier/BillEntryTerminal';
import { CustomerApp } from './components/customer/CustomerApp';
import { AdminPortal } from './components/admin/AdminPortal';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <>
        <AuthPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <Layout>
      {currentUser.role === 'cashier' && <BillEntryTerminal />}
      {currentUser.role === 'customer' && <CustomerApp />}
      {currentUser.role === 'admin' && <AdminPortal />}
      <ToastContainer />
    </Layout>
  );
};

export const App: React.FC = () => (
  <DatabaseProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </DatabaseProvider>
);

export default App;
