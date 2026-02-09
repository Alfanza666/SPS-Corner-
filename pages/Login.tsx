
import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserRole, User } from '../types';
import { LOGO_URL } from '../constants';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Query database for the user with this email
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (dbError || !data) {
        throw new Error("Akun tidak ditemukan. Hubungi Admin SPS.");
      }

      const loggedInUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        balance: data.balance
      };

      // In a real app, you'd verify password here. 
      // For this internal kiosk, we use email-based session for simplicity.
      onLogin(loggedInUser);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
       <div className="absolute top-0 left-0 w-full h-full">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px] animate-float"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-100/30 blur-[120px] animate-float" style={{animationDelay: '2s'}}></div>
       </div>

       <div className="bg-white/70 backdrop-blur-3xl w-full max-w-md p-10 rounded-[3rem] shadow-2xl border border-white relative z-10 animate-slide-up">
          <div className="text-center mb-10">
            <div className="bg-white w-24 h-24 p-4 rounded-[2rem] shadow-xl mx-auto mb-6 flex items-center justify-center border border-slate-50">
               <img src={LOGO_URL} alt="Federasi Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-black text-[#1e3a8a] tracking-tighter">Portal Seller</h2>
            <p className="text-slate-500 font-medium mt-1">Masuk untuk mengelola stok & keuangan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Alamat Email Terdaftar" 
              type="email" 
              placeholder="nama@federasi.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={error ? '' : undefined}
              className="py-4 rounded-2xl bg-white shadow-inner"
            />
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100 animate-pop">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <p className="text-xs font-bold leading-tight">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full py-5 rounded-2xl text-lg font-black bg-[#1e3a8a] shadow-xl" isLoading={isLoading}>
              Masuk Dashboard
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
             <button onClick={() => onNavigate('landing')} className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-[#1e3a8a] transition-colors flex items-center justify-center gap-2 mx-auto group">
               <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Kembali ke Kiosk
             </button>
          </div>
       </div>
    </div>
  );
};
