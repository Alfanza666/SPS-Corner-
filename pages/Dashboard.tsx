import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, WithdrawalRequest, Product, ProductCategory, Transaction, TransactionDB, ProductDB } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LOGO_URL } from '../constants';
import { Plus, Trash2, DollarSign, Package, LogOut, Clock, History, TrendingUp, Eye, X as XIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'withdrawals' | 'stats' | 'sales'>('stats');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Product Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ category: ProductCategory.MAKANAN });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch Products
    const { data: prodData } = await supabase.from('products').select('*');
    if (prodData) {
      setProducts(prodData.map((p: ProductDB) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        category: p.category as ProductCategory,
        imageUrl: p.image_url,
        sellerId: p.seller_id
      })));
    }

    // Fetch Transactions
    let trxQuery = supabase.from('transactions').select('*').order('created_at', { ascending: false });
    if (user.role !== UserRole.ADMIN) {
      trxQuery = trxQuery.eq('seller_id', user.id);
    }
    const { data: trxData } = await trxQuery;
    
    if (trxData) {
      setTransactions(trxData.map((t: TransactionDB) => {
        const dateObj = new Date(t.created_at || Date.now());
        return {
            id: t.id,
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toLocaleTimeString('id-ID'),
            items: t.items,
            totalAmount: t.total_amount,
            buyerName: t.buyer_name,
            sellerId: t.seller_id,
            status: 'COMPLETED'
        };
      }));
    }
    setIsLoading(false);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    setIsSubmittingProduct(true);
    
    try {
      const { error } = await supabase.from('products').insert({
        name: newProduct.name,
        description: newProduct.description || '',
        price: Number(newProduct.price),
        stock: Number(newProduct.stock || 0),
        category: newProduct.category,
        image_url: `https://picsum.photos/400/400?random=${Math.random()}`,
        seller_id: user.id
      });
      
      if (error) throw error;
      setShowAddProduct(false);
      setNewProduct({ category: ProductCategory.MAKANAN });
    } catch (err) {
      alert("Gagal menambah produk");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Hapus produk ini dari database?")) {
      await supabase.from('products').delete().eq('id', id);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1e3a8a] text-white hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-8 flex flex-col items-center border-b border-white/10">
          <div className="bg-white p-3 rounded-2xl shadow-xl mb-4">
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
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 font-bold text-sm ${activeTab === 'products' ? 'bg-[#fde047] text-[#1e3a8a] shadow-lg' : 'text-blue-100/70 hover:bg-white/10'}`}>
            <Package className="w-5 h-5" /> Kelola Produk
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
             {isLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
             <div className="bg-blue-50 px-4 py-2 rounded-xl text-[#1e3a8a] font-black text-sm">Saldo: Rp {transactions.reduce((acc, t) => acc + t.totalAmount, 0).toLocaleString()}</div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 border-b-4 border-b-blue-600">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Penjualan</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">Rp {transactions.reduce((acc, t) => acc + t.totalAmount, 0).toLocaleString()}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 border-b-4 border-b-yellow-400">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Transaksi Berhasil</p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{transactions.length}</h3>
                </div>
            </div>
          )}

          {activeTab === 'products' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold">Daftar Produk</h2>
                   <Button onClick={() => setShowAddProduct(true)}><Plus className="w-4 h-4 mr-2" /> Tambah Produk</Button>
                </div>
                
                {showAddProduct && (
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-slide-up mb-6">
                    <h3 className="font-bold mb-4">Input Produk Baru</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <Input label="Nama Produk" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                      <Input label="Harga (Rp)" type="number" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} />
                      <Input label="Stok Awal" type="number" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                        <select 
                          className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl"
                          value={newProduct.category}
                          onChange={e => setNewProduct({...newProduct, category: e.target.value as ProductCategory})}
                        >
                          {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setShowAddProduct(false)}>Batal</Button>
                      <Button onClick={handleAddProduct} isLoading={isSubmittingProduct}>Simpan Produk</Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {products.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                         <img src={p.imageUrl} alt={p.name} className="w-20 h-20 rounded-xl object-cover bg-slate-100" />
                         <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{p.name}</h4>
                            <p className="text-blue-600 font-black text-sm">Rp {p.price.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-1">Stok: {p.stock}</p>
                         </div>
                         <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Waktu</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Pembeli</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Total</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">CCTV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(trx => (
                      <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{trx.time}</span>
                              <span className="text-[10px] text-slate-500">{trx.date}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 font-medium">{trx.buyerName}</td>
                        <td className="px-8 py-6 font-black text-[#1e3a8a]">Rp {trx.totalAmount.toLocaleString()}</td>
                        <td className="px-8 py-6 text-center">
                           <button onClick={() => setSelectedTransaction(trx)} className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider border border-blue-200 px-3 py-1 rounded-lg hover:bg-blue-50">Cek</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CCTV Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[60] bg-[#1e3a8a]/40 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 animate-slide-up shadow-2xl relative">
              <button onClick={() => setSelectedTransaction(null)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500"><XIcon className="w-8 h-8" /></button>
              <div className="text-center space-y-6">
                 <Eye className="w-16 h-16 text-[#1e3a8a] mx-auto" />
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Cocokkan CCTV</h2>
                 <div className="bg-[#fde047] p-8 rounded-[2rem] text-[#1e3a8a]">
                    <p className="text-xs font-black uppercase tracking-widest mb-2">WAKTU TRANSAKSI</p>
                    <p className="text-6xl font-black tracking-tighter">{selectedTransaction.time}</p>
                 </div>
                 <p className="text-slate-500">Cari rekaman pada jam diatas untuk memverifikasi.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};