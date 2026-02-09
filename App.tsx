
import React, { useState, useEffect } from 'react';
import { Landing } from './pages/Landing';
import { Shop } from './pages/Shop';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { User, Transaction } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AlertTriangle, Database, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dbError, setDbError] = useState<string>('');

  // Fetch transactions dari REAL Database
  const fetchTransactions = async () => {
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err: any) {
      console.error("Database Error:", err);
      // Don't show error immediately on load to prevent jarring UX if tables just empty
      // But if it's a connection error, we might want to know
      if (err.message?.includes('fetch') || err.message?.includes('url')) {
        setDbError('Gagal terhubung ke Database. Cek koneksi internet atau konfigurasi URL.');
      }
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchTransactions();

      // Realtime Subscription
      const channel = supabase
        .channel('public:transactions')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'transactions' }, 
          (payload: any) => {
            setTransactions(prev => [payload.new, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
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
    try {
      // Data yang dikirim harus sesuai dengan nama kolom di Tabel Supabase
      const { error } = await supabase
        .from('transactions')
        .insert([{
          id: newTrx.id,
          date: newTrx.date,
          time: newTrx.time,
          buyer_name: newTrx.buyerName, // Pastikan kolom di DB snake_case
          total_amount: newTrx.totalAmount,
          seller_id: newTrx.sellerId,
          items: newTrx.items,
          status: 'COMPLETED'
        }]);
      
      if (error) throw error;
      
      // Jika realtime jalan, kita tidak perlu manual fetch, tapi untuk safety:
      fetchTransactions();
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
      alert("Gagal menyimpan transaksi ke database cloud.");
    }
  };

  // --- CONFIGURATION CHECK GUARD ---
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-red-500/10 p-6 rounded-full mb-6 ring-4 ring-red-500/20">
           <Database className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-black mb-4">Koneksi Database Diperlukan</h1>
        <p className="max-w-xl text-slate-400 mb-8 leading-relaxed">
          Aplikasi ini berjalan dalam <strong>Mode Produksi (Real App)</strong> dan membutuhkan koneksi ke Supabase Cloud.
          <br/><br/>
          Silakan buat file <code className="bg-slate-800 px-2 py-1 rounded text-yellow-400 font-mono text-sm">.env</code> di root project Anda dengan isi berikut:
        </p>
        
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 font-mono text-left text-sm text-green-400 w-full max-w-2xl shadow-2xl overflow-x-auto">
          <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=your-anon-key-here</p>
          <p>VITE_GOOGLE_API_KEY=your-gemini-api-key</p>
        </div>

        <p className="mt-8 text-xs text-slate-500 uppercase tracking-widest font-bold">
          Setelah file dibuat, restart terminal/server (npm run dev).
        </p>
      </div>
    );
  }

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
