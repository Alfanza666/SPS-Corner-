
import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Shop } from './pages/Shop';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { UserRole, User, Transaction } from './types';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setTransactions(data);
    };

    fetchTransactions();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'transactions' }, 
        (payload) => {
          setTransactions(prev => [payload.new as Transaction, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('landing');
  };

  const handleAddTransaction = async (newTrx: Transaction) => {
    const { error } = await supabase
      .from('transactions')
      .insert([{
        id: newTrx.id,
        buyer_name: newTrx.buyerName,
        total_amount: newTrx.totalAmount,
        items: newTrx.items,
        seller_id: newTrx.sellerId,
        status: 'COMPLETED'
      }]);

    if (error) console.error("Error saving transaction:", error);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={setCurrentPage} />;
      case 'shop':
        return <Shop onNavigate={setCurrentPage} onPurchaseSuccess={handleAddTransaction} />;
      case 'login':
        return <Login onLogin={handleLogin} onNavigate={setCurrentPage} />;
      case 'dashboard':
        return user ? (
          <Dashboard 
            user={user} 
            onLogout={handleLogout} 
            transactions={transactions} 
          />
        ) : (
          <Login onLogin={handleLogin} onNavigate={setCurrentPage} />
        );
      default:
        return <Landing onNavigate={setCurrentPage} />;
    }
  };

  return (
    <>
      {renderPage()}
    </>
  );
};

export default App;
