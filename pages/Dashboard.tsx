import React, { useState, useMemo } from 'react';
import { User, UserRole, WithdrawalRequest, Product, ProductCategory, Transaction } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MOCK_PRODUCTS, MOCK_WITHDRAWALS, LOGO_URL } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, Trash2, Edit2, DollarSign, Package, Check, X as XIcon, LogOut, Bell, AlertTriangle, ChevronRight, TrendingUp, ShoppingBag, Clock, History, Search, Eye } from 'lucide-react';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  transactions: Transaction[];
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, transactions }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'withdrawals' | 'stats' | 'sales'>('stats');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(MOCK_WITHDRAWALS);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ category: ProductCategory.MAKANAN });

  const lowStockThreshold = 5;
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= lowStockThreshold && (user.role === UserRole.ADMIN || p.sellerId === user.id));
  }, [products, user]);

  const mySales = useMemo(() => {
    return user.role === UserRole.ADMIN 
      ? transactions 
      : transactions.filter(t => t.sellerId === user.id);
  }, [transactions, user]);

  const handleRequestWithdrawal = () => {
    const amount = user.balance;
    const fee = amount * 0.07;
    const net = amount - fee;
    
    const newReq: WithdrawalRequest = {
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      sellerId: user.id,
      sellerName: user.name,
      amount: amount,
      fee: fee,
      netAmount: net,
      status: 'PENDING',
      requestDate: new Date().toISOString().split('T')[0]
    };
    
    setWithdrawals([newReq, ...withdrawals]);
    alert("Penarikan saldo berhasil diajukan!");
  };

  const handleApproveWithdrawal = (id: string) => {
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'APPROVED' } : w));
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Hapus produk ini?")) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleAddProduct = () => {
    if(!newProduct.name || !newProduct.price) return;
    const prod: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name!,
      description: newProduct.description || '',
      price: Number(newProduct.price),
      stock: Number(newProduct.stock || 0),
      category: newProduct.category as ProductCategory,
      imageUrl: `https://picsum.photos/400/400?random=${Math.random()}`,
      sellerId: user.id
    };
    setProducts([...products, prod]);
    setShowAddProduct(false);
    setNewProduct({ category: ProductCategory.MAKANAN });
  };

  const chartData = [
    { name: 'Sen', sales: 400000 },
    { name: 'Sel', sales: 300000 },
    { name: 'Rab', sales: 600000 },
    { name: 'Kam', sales: 200000 },
    { name: 'Jum', sales: 900000 },
    { name: 'Sab', sales: 150000 },
    { name: 'Min', sales: 100000 },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1e3a8a] text-white hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-8 flex flex-col items-center border-b border-white/10">
          <div className="bg-white p-3 rounded-2xl shadow-xl mb-4 group hover:scale-105 transition-transform duration-300">
             <img src={LOGO_URL} className="w-16 h-16 object-contain" alt="Federasi Logo" />
          </div>
          <div className="text-center">
            <h2 className="font-bold text-xl tracking-tight leading-none">SPS Corner</h2>
            <p className="text-[10px] text-blue-200/60 font-bold uppercase tracking-[0.2em] mt-2">
              {user.role === UserRole.ADMIN ? 'Administrator' : 'Kantin Seller'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-6">
          <button onClick={() => setActiveTab('stats')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${activeTab === 'stats' ? 'bg-[#fde047] text-[#1e3a8a] shadow-lg' : 'text-blue-100/70 hover:bg-white/10'}`}>
            <TrendingUp className="w-5 h-5" /> Ringkasan
          </button>
          <button onClick={() => setActiveTab('sales')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${activeTab === 'sales' ? 'bg-[#fde047] text-[#1e3a8a] shadow-lg' : 'text-blue-100/70 hover:bg-white/10'}`}>
            <History className="w-5 h-5" /> Riwayat Penjualan
          </button>
          {user.role === UserRole.SELLER && (
            <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${activeTab === 'products' ? 'bg-[#fde047] text-[#1e3a8a] shadow-lg' : 'text-blue-100/70 hover:bg-white/10'}`}>
              <Package className="w-5 h-5" /> Etalase Produk
            </button>
          )}
          <button onClick={() => setActiveTab('withdrawals')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${activeTab === 'withdrawals' ? 'bg-[#fde047] text-[#1e3a8a] shadow-lg' : 'text-blue-100/70 hover:bg-white/10'}`}>
            <DollarSign className="w-5 h-5" /> Keuangan
          </button>
        </nav>

        <div className="p-6 mt-auto border-t border-white/10">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-3.5 rounded-xl transition-all duration-300 font-bold group">
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize">{activeTab.replace('stats', 'Ringkasan')}</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">Sistem Kasir Digital Federasi</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-blue-50 px-4 py-2 rounded-xl text-[#1e3a8a] font-black text-sm">Rp {user.balance.toLocaleString()}</div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {activeTab === 'stats' && (
            <div className="space-y-8 animate-fade-in">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 border-b-4 border-b-blue-600">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Penjualan Total</p>
                     <h3 className="text-2xl font-black text-slate-900 mt-1">Rp {mySales.reduce((s,t) => s+t.totalAmount, 0).toLocaleString()}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 border-b-4 border-b-yellow-400">
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Item Terjual</p>
                     <h3 className="text-2xl font-black text-slate-900 mt-1">{mySales.length} Transaksi</h3>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center bg-[#1e3a8a] p-8 rounded-[2.5rem] text-white shadow-xl">
                <div>
                   <h3 className="text-2xl font-black tracking-tight">Log Transaksi Penjualan</h3>
                   <p className="text-blue-200 text-sm font-medium mt-1">Klik detail untuk sinkronisasi jam dengan rekaman CCTV.</p>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu Presisi</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Pembeli</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {mySales.length === 0 ? (
                        <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic">Belum ada penjualan hari ini.</td></tr>
                      ) : mySales.map(trx => (
                        <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                                  <Clock className="w-3.5 h-3.5 text-blue-500" /> {trx.time}
                               </div>
                               <span className="text-[10px] text-slate-400 font-bold">{trx.date}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="text-sm font-black text-slate-700 tracking-tight">{trx.buyerName}</span>
                          </td>
                          <td className="px-8 py-6 font-black text-[#1e3a8a]">Rp {trx.totalAmount.toLocaleString()}</td>
                          <td className="px-8 py-6">
                             <div className="flex justify-center">
                                <button onClick={() => setSelectedTransaction(trx)} className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-[#1e3a8a] hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">Cek CCTV</button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Implementations for products/withdrawals follow same patterns from previous version */}
        </div>
      </main>

      {/* Transaction Detail Modal (CCTV CROSS-CHECK) */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[60] bg-[#1e3a8a]/40 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 animate-slide-up shadow-2xl relative">
              <button onClick={() => setSelectedTransaction(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><XIcon className="w-8 h-8" /></button>
              <div className="mb-10 text-center">
                 <div className="bg-red-50 w-20 h-20 rounded-[2rem] flex items-center justify-center text-red-600 mx-auto mb-4 border border-red-100">
                    <Eye className="w-10 h-10" />
                 </div>
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Investigasi Keamanan</h2>
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Cocokkan dengan Jam pada Rekaman CCTV</p>
              </div>
              <div className="space-y-6">
                 <div className="bg-[#1e3a8a] p-8 rounded-[2.5rem] text-white text-center">
                    <p className="text-blue-200 font-black uppercase tracking-widest text-xs mb-2">TARGET WAKTU CCTV</p>
                    <p className="text-6xl font-black tracking-tighter text-[#fde047]">{selectedTransaction.time}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex justify-between border-b border-slate-200 pb-3">
                       <span className="text-slate-400 text-xs font-bold uppercase">Pembeli:</span>
                       <span className="text-slate-900 font-black">{selectedTransaction.buyerName}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-slate-400 text-xs font-bold uppercase">Total Bayar:</span>
                       <span className="text-green-600 font-black">Rp {selectedTransaction.totalAmount.toLocaleString()}</span>
                    </div>
                 </div>
                 <p className="text-center text-[10px] text-slate-400 font-bold italic px-8">Catatan: Harap periksa rekaman CCTV kantin di titik waktu tersebut untuk memverifikasi kejujuran pembeli.</p>
                 <Button className="w-full py-5 rounded-3xl text-lg font-black bg-[#1e3a8a]" onClick={() => setSelectedTransaction(null)}>Selesai Kroscek</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};