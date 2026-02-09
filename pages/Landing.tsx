import React from 'react';
import { Button } from '../components/Button';
import { ArrowRight, ShoppingBag, TrendingUp, ShieldCheck, Users } from 'lucide-react';
import { LOGO_URL } from '../constants';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 -z-10 bg-slate-50 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-yellow-50/30 opacity-60"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-60 -left-20 w-72 h-72 bg-[#fde047]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navbar */}
      <nav className="w-full px-8 py-6 flex items-center justify-between glass-card sticky top-0 z-50 border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100">
            <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain" />
          </div>
          <span className="font-black text-2xl text-[#1e3a8a] hidden md:block tracking-tighter">SPS Corner</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="font-bold text-[#1e3a8a]" onClick={() => onNavigate('login')}>Login Seller</Button>
          <Button className="bg-[#1e3a8a] px-8 rounded-full shadow-blue-900/20" onClick={() => onNavigate('shop')}>Mulai Belanja</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center px-8 py-20 max-w-7xl mx-auto gap-16">
        <div className="flex-1 space-y-10 animate-slide-up">
          <div className="inline-block px-6 py-2 rounded-full bg-blue-100 text-[#1e3a8a] text-xs font-black uppercase tracking-widest border border-blue-200 shadow-sm">
            ✨ Koperasi Digital Federasi
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[1.1] text-slate-900 tracking-tighter">
            Kantin Pintar,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-blue-500 animate-gradient">
              Lebih Berkah.
            </span>
          </h1>
          <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
            Platform belanja mandiri eksklusif Serikat Pekerja. 
            Cepat, transparan, dan terpercaya dengan teknologi AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Button size="lg" onClick={() => onNavigate('shop')} className="group px-10 rounded-2xl bg-[#1e3a8a] shadow-xl shadow-blue-900/20">
              Belanja Sekarang
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate('login')} className="px-10 rounded-2xl border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-blue-50">
              Kelola Dashboard
            </Button>
          </div>
        </div>
        
        <div className="flex-1 relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="relative z-10 bg-white p-6 rounded-[3rem] shadow-2xl transform md:rotate-3 hover:rotate-0 transition-all duration-700 border border-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Kiosk App" 
              className="rounded-[2rem] w-full h-auto object-cover shadow-inner"
            />
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-float border border-slate-50">
              <div className="bg-green-100 p-3 rounded-2xl text-green-600 shadow-sm">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaksi Aktif</p>
                <p className="font-black text-2xl text-[#1e3a8a] tracking-tighter">+ 1.2k</p>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-gradient-to-r from-[#1e3a8a]/10 to-[#fde047]/10 rounded-full blur-[100px] -z-10"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-4">
             <div className="bg-white p-2 rounded-xl shadow-lg">
               <img src={LOGO_URL} alt="Logo" className="h-10 w-auto object-contain" />
             </div>
             <div className="flex flex-col">
                <span className="font-black text-2xl tracking-tighter">SPS Corner</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Digitalized Cooperation</span>
             </div>
          </div>
          <div className="text-slate-500 text-sm font-medium">
            © 2026 Kantin Federasi Digital. Dikembangkan dengan ❤️ oleh Alif Irfansyah.
          </div>
        </div>
      </footer>
    </div>
  );
};