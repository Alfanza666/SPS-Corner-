
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingCart, ShoppingBag, Search, Plus, Minus, CreditCard, CheckCircle, AlertCircle, X, Camera, RefreshCw, ChevronLeft, Store, ArrowRight, Scan, Home, Smartphone, QrCode, Loader2 } from 'lucide-react';
import { QRIS_STATIC_URL, LOGO_URL } from '../constants';
import { CartItem, Product, ProductCategory, Transaction } from '../types';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { validatePaymentProof } from '../services/geminiService';
import { supabase } from '../lib/supabase';

interface ShopProps {
  onNavigate: (page: string) => void;
  onPurchaseSuccess?: (trx: Transaction) => void;
}

interface FlyingItem {
  id: number;
  imageUrl: string;
  startX: number;
  startY: number;
  tx: number;
  ty: number;
}

export const Shop: React.FC<ShopProps> = ({ onNavigate, onPurchaseSuccess }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment' | 'validating' | 'success' | 'error'>('review');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [buyerName, setBuyerName] = useState<string>('');
  
  // Animation States
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartBumping, setIsCartBumping] = useState(false);
  const cartIconRef = useRef<HTMLButtonElement>(null);
  const mobileCartRef = useRef<HTMLDivElement>(null);
  
  // Camera related state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [focusPoint, setFocusPoint] = useState<{x: number, y: number} | null>(null);

  const categories = ['All', ...Object.values(ProductCategory)];

  // Fetch products from DB
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*');
      
      if (data) {
        // Map snake_case from DB to camelCase for UI
        const mappedProducts: Product[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          category: p.category as ProductCategory,
          imageUrl: p.image_url || `https://picsum.photos/400/400?random=${p.id}`,
          sellerId: p.seller_id
        }));
        setProducts(mappedProducts);
      }
      setIsLoadingProducts(false);
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory, products]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!isCartOpen) {
      stopCamera();
    }
  }, [isCartOpen]);

  const triggerAddToCartAnimation = (e: React.MouseEvent, product: Product) => {
    let targetRect: DOMRect | null = null;
    if (window.innerWidth < 768 && mobileCartRef.current) {
         targetRect = mobileCartRef.current.getBoundingClientRect();
    } else if (cartIconRef.current) {
         targetRect = cartIconRef.current.getBoundingClientRect();
    }
    if (!targetRect) return;

    const startRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const tx = endX - startX;
    const ty = endY - startY;

    const newItem: FlyingItem = {
      id: Date.now(),
      imageUrl: product.imageUrl,
      startX: startRect.left,
      startY: startRect.top,
      tx,
      ty
    };
    setFlyingItems(prev => [...prev, newItem]);
    setTimeout(() => {
       setIsCartBumping(true);
       setTimeout(() => setIsCartBumping(false), 300);
    }, 700);
    setTimeout(() => {
      setFlyingItems(prev => prev.filter(item => item.id !== newItem.id));
    }, 800);
  };

  const addToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); 
    triggerAddToCartAnimation(e, product);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const startCamera = async () => {
    setPaymentProof(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera. Mohon berikan izin kamera pada browser Anda.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPaymentProof(imageDataUrl);
        stopCamera();
        handleVerify(imageDataUrl);
      }
    }
  };

  const handleVerify = async (imageUrl: string) => {
    setCheckoutStep('validating');
    try {
      const result = await validatePaymentProof(imageUrl, totalAmount, buyerName);
      if (result.isValid) {
        const now = new Date();
        const newTrx: Transaction = {
          id: `TRX-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          date: now.toISOString().split('T')[0],
          time: now.toLocaleTimeString('id-ID'),
          items: [...cart],
          totalAmount: totalAmount,
          buyerName: buyerName,
          sellerId: cart[0]?.sellerId || 'seller1',
          status: 'COMPLETED'
        };

        if (onPurchaseSuccess) {
          onPurchaseSuccess(newTrx);
        }

        setCheckoutStep('success');
        setCart([]);
      } else {
        setCheckoutStep('error');
        setValidationError(result.reason || "Pembayaran tidak terbaca. Pastikan nominal dan nama sesuai.");
      }
    } catch (err) {
      setCheckoutStep('error');
      setValidationError("Gagal memvalidasi. Coba foto bukti bayar kembali.");
    }
  };

  const handleVideoClick = async (e: React.MouseEvent<HTMLVideoElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1000);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
      } catch (err) { console.debug("Focus constraint not supported", err); }
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const closeCart = () => {
    setIsCartOpen(false);
    setCheckoutStep('review');
    setPaymentProof(null);
    setBuyerName('');
    stopCamera();
  };

  const handleBackToMenu = () => {
    if (cart.length > 0) {
      if (window.confirm("Keranjang belanja akan dikosongkan. Kembali ke menu utama?")) {
        onNavigate('landing');
      }
    } else {
      onNavigate('landing');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans text-slate-800">
      {flyingItems.map(item => (
        <img
          key={item.id}
          src={item.imageUrl}
          className="flying-product"
          style={{ top: item.startY, left: item.startX, '--tx': `${item.tx}px`, '--ty': `${item.ty}px` } as React.CSSProperties}
          alt=""
        />
      ))}

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate('landing')}>
             <div className="bg-white p-1.5 md:p-2 rounded-xl shadow-sm border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                <img src={LOGO_URL} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
             </div>
             <div>
                <h1 className="text-base md:text-xl font-black text-[#1e3a8a] leading-none tracking-tight">SPS Corner</h1>
                <p className="text-[9px] md:text-xs text-slate-500 font-bold tracking-widest uppercase mt-0.5">Digital Kiosk</p>
             </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
             <button 
               onClick={handleBackToMenu} 
               className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl bg-[#fde047] text-[#1e3a8a] shadow-md shadow-yellow-500/10 hover:bg-[#1e3a8a] hover:text-[#fde047] transition-all font-black text-xs md:text-sm active:scale-95"
             >
                <Home className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline uppercase tracking-wider">MENU</span>
             </button>
             <button 
               ref={cartIconRef}
               onClick={() => setIsCartOpen(true)}
               className={`relative bg-white p-2 md:p-3 rounded-2xl border border-slate-200 text-[#1e3a8a] hover:text-blue-600 shadow-sm transition-all active:scale-95 ${isCartBumping ? 'animate-pop ring-4 ring-yellow-100' : ''}`}
             >
               <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
               {totalItems > 0 && (
                 <span className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-red-600 text-white text-[9px] md:text-xs font-black w-4 h-4 md:w-6 md:h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-white transform transition-transform duration-300">
                   {totalItems}
                 </span>
               )}
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-4 md:py-8 w-full">
        <div className="mb-6 space-y-4 md:space-y-6">
          <div className="relative max-w-2xl mx-auto md:mx-0 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 md:w-6 md:h-6 group-focus-within:text-[#1e3a8a] transition-colors" />
            <input 
              type="text"
              placeholder="Cari menu segar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl md:rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] shadow-sm transition-all text-sm md:text-lg font-medium"
            />
          </div>
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 md:px-7 md:py-2.5 rounded-full text-xs md:text-base font-black whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat 
                    ? 'bg-[#1e3a8a] text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <Loader2 className="w-12 h-12 animate-spin mb-4" />
             <p className="font-bold tracking-widest uppercase text-xs">Menyiapkan Etalase...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
             <ShoppingBag className="w-20 h-20 opacity-20 mb-4" />
             <p className="font-bold text-lg italic">Belum ada produk yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5 pb-32">
            {filteredProducts.map((product, idx) => (
              <div 
                key={product.id} 
                className="group relative bg-white rounded-xl md:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 border border-slate-100 flex flex-col h-full animate-fade-in"
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="absolute top-2 left-2">
                     <span className="inline-block px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-[7px] md:text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest shadow-sm">
                       {product.category}
                     </span>
                  </div>

                  <button 
                    onClick={(e) => addToCart(e, product)}
                    className="absolute bottom-2 right-2 md:bottom-4 md:right-4 bg-[#fde047] text-[#1e3a8a] p-2 md:p-3.5 rounded-lg md:rounded-2xl shadow-xl hover:bg-[#1e3a8a] hover:text-white transition-all transform scale-0 group-hover:scale-100 group-hover:rotate-0 rotate-12 duration-500 ease-out flex items-center justify-center z-10 active:scale-90 hover:shadow-[0_10px_20px_rgba(253,224,71,0.4)]"
                  >
                    <Plus className="w-4 h-4 md:w-6 md:h-6 stroke-[4px]" />
                  </button>
                </div>

                <div className="p-2.5 md:p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-1 mb-1">
                     <Store className="w-2 h-2 md:w-2.5 md:h-2.5 text-blue-500" />
                     <span className="text-[6px] md:text-[8px] font-bold text-slate-400 truncate uppercase tracking-tight">Kantin Federasi</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-[10px] md:text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-[#1e3a8a] transition-colors">{product.name}</h3>
                  
                  <div className="flex items-end justify-between pt-2 md:pt-3 border-t border-dashed border-slate-200 mt-auto">
                    <div className="flex flex-col">
                       <span className="text-[6px] md:text-[8px] text-slate-400 font-black uppercase tracking-widest">HARGA</span>
                       <span className="font-black text-[11px] md:text-base text-[#1e3a8a]">Rp {product.price.toLocaleString()}</span>
                    </div>
                    <span className={`text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded-full ${product.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>{product.stock} STOK</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {cart.length > 0 && !isCartOpen && (
        <div ref={mobileCartRef} className="fixed bottom-4 left-4 right-4 z-40 animate-slide-up max-w-3xl mx-auto">
           <div 
             onClick={() => setIsCartOpen(true)}
             className={`bg-[#1e3a8a] text-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] shadow-2xl flex justify-between items-center cursor-pointer border border-white/10 group transform transition-all duration-300 hover:-translate-y-1 ${isCartBumping ? 'scale-[1.02] ring-8 ring-[#fde047]/10' : ''}`}
           >
              <div className="flex items-center gap-3 md:gap-5">
                 <div className="bg-[#fde047] text-[#1e3a8a] w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-sm md:text-xl shadow-inner">
                    {totalItems}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] md:text-xs text-blue-300 font-black uppercase tracking-[0.1em]">KERANJANG</span>
                    <span className="text-base md:text-2xl font-black">Rp {totalAmount.toLocaleString()}</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4 pr-1">
                 <span className="font-black text-xs md:text-xl group-hover:scale-105">CHECKOUT</span>
                 <div className="bg-white/10 p-2 md:p-3 rounded-full group-hover:bg-[#fde047] group-hover:text-[#1e3a8a] transition-all">
                    <ArrowRight className="w-4 h-4 md:w-6 md:h-6 stroke-[3px]" />
                 </div>
              </div>
           </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-[#1e3a8a]/60 backdrop-blur-md flex items-center justify-center p-2 md:p-6 lg:p-12 animate-fade-in">
          <div className="bg-white w-full max-w-7xl h-[98vh] md:h-[90vh] rounded-3xl md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-slide-up">
            <button onClick={closeCart} className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 rounded-full bg-slate-100 text-slate-400 hover:text-red-500 z-50 transition-all active:scale-90 shadow-sm">
               <X className="w-6 h-6 md:w-8 md:h-8" />
            </button>

            {isCameraActive ? (
               <div className="w-full h-full bg-black relative flex flex-col animate-fade-in">
                  <video ref={videoRef} autoPlay playsInline muted onClick={handleVideoClick} className="w-full h-full object-cover"></video>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-64 h-64 md:w-96 md:h-96 border-4 border-white/20 rounded-[2.5rem] md:rounded-[3rem] relative">
                          <div className="absolute top-0 left-0 w-8 h-8 md:w-12 md:h-12 border-t-8 border-l-8 border-[#fde047] rounded-tl-[2.5rem] md:rounded-tl-[3rem] -mt-2 -ml-2"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 md:w-12 md:h-12 border-t-8 border-r-8 border-[#fde047] rounded-tr-[2.5rem] md:rounded-tr-[3rem] -mt-2 -mr-2"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 md:w-12 md:h-12 border-b-8 border-l-8 border-[#fde047] rounded-bl-[2.5rem] md:rounded-bl-[3rem] -mb-2 -ml-2"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 md:w-12 md:h-12 border-b-8 border-r-8 border-[#fde047] rounded-br-[2.5rem] md:rounded-br-[3rem] -mb-2 -mr-2"></div>
                          <div className="absolute top-0 left-0 w-full h-1 md:h-2 bg-gradient-to-r from-transparent via-[#fde047] to-transparent shadow-[0_0_20px_rgba(253,224,71,0.6)] animate-[scan_2s_ease-in-out_infinite]"></div>
                      </div>
                      <div className="mt-8 px-6 py-3 bg-black/60 backdrop-blur-xl rounded-full text-white font-black text-xs md:text-lg border border-white/20 uppercase tracking-widest">AMBIL FOTO BUKTI BAYAR</div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 md:p-12 md:pb-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between z-30">
                     <button onClick={stopCamera} className="p-4 md:p-5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"><ChevronLeft className="w-6 h-6 md:w-8 md:h-8" /></button>
                     <button onClick={captureImage} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-8 border-white/20 bg-white/10 flex items-center justify-center active:scale-90 transition-all group">
                        <div className="w-14 h-14 md:w-20 md:h-20 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-95"></div>
                     </button>
                     <div className="w-12 md:w-16"></div>
                  </div>
               </div>
            ) : (
               <>
                  <div className="w-full md:w-1/2 bg-slate-50/50 flex flex-col border-r border-slate-100 h-1/3 md:h-full">
                     <div className="p-4 md:p-8 border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="bg-blue-100 p-2 md:p-3 rounded-xl text-[#1e3a8a]"><ShoppingCart className="w-5 h-5 md:w-8 md:h-8" /></div>
                           <h2 className="text-sm md:text-2xl font-black text-slate-800 tracking-tight">Keranjang Belanja</h2>
                        </div>
                        <div className="bg-[#fde047] px-3 py-1 md:px-5 md:py-2 rounded-full text-[10px] md:text-sm text-[#1e3a8a] font-black">{totalItems} ITEM</div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-3 md:space-y-4">
                        {cart.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                              <ShoppingBag className="w-10 h-10 md:w-20 md:h-20 opacity-20" />
                              <p className="text-sm md:text-xl font-bold text-center">Keranjang belanja kosong</p>
                           </div>
                        ) : (
                           cart.map(item => (
                              <div key={item.id} className="flex gap-3 md:gap-5 p-3 md:p-4 bg-white rounded-2xl shadow-sm border border-slate-100 items-center animate-fade-in transition-all hover:border-blue-200">
                                 <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0"><img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /></div>
                                 <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-800 text-[10px] md:text-base truncate">{item.name}</h3>
                                    <p className="text-[#1e3a8a] font-black text-xs md:text-lg">Rp {(item.price * item.quantity).toLocaleString()}</p>
                                 </div>
                                 <div className="flex items-center gap-2 md:gap-3 bg-slate-50 p-1 md:p-2 rounded-xl md:rounded-2xl border border-slate-200">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 md:p-2 bg-white rounded-lg shadow-sm hover:text-red-500 transition-all"><Minus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                    <span className="text-[10px] md:text-lg font-black w-4 md:w-6 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 md:p-2 bg-[#1e3a8a] text-white rounded-lg"><Plus className="w-3 h-3 md:w-4 md:h-4" /></button>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>

                  <div className="w-full md:w-1/2 bg-white flex flex-col h-2/3 md:h-full relative overflow-hidden">
                     <div className="flex-1 flex flex-col h-full p-5 md:p-10 lg:p-14 overflow-y-auto">
                        {cart.length > 0 && (
                           <>
                              <div className="mb-4 md:mb-8">
                                 <h2 className="text-xl md:text-4xl font-black text-[#1e3a8a] tracking-tighter mb-1 uppercase">Pembayaran</h2>
                                 <p className="text-slate-400 font-bold text-[10px] md:text-lg leading-tight">Ikuti langkah mudah di bawah ini.</p>
                              </div>

                              {checkoutStep === 'review' && (
                                 <div className="flex-1 flex flex-col justify-center animate-slide-up space-y-4 md:space-y-10">
                                    <div className="bg-[#1e3a8a] p-5 md:p-10 rounded-2xl md:rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                                       <span className="text-blue-300 font-black uppercase tracking-[0.2em] text-[8px] md:text-xs">TOTAL BELANJA</span>
                                       <div className="text-3xl md:text-6xl font-black tracking-tighter mt-1">Rp {totalAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl md:rounded-[2rem] p-4 md:p-8 border border-slate-200">
                                       <Input label="NAMA LENGKAP" placeholder="Siapa Nama Anda?" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="py-2.5 md:py-4 text-xs md:text-xl font-bold rounded-xl" />
                                    </div>
                                    <Button size="lg" className="w-full py-4 md:py-6 text-sm md:text-2xl font-black rounded-xl md:rounded-[2rem] shadow-xl" onClick={() => setCheckoutStep('payment')} disabled={!buyerName.trim()}>BAYAR SEKARANG <ArrowRight className="ml-2 w-4 h-4 md:w-8 md:h-8 stroke-[3px]" /></Button>
                                 </div>
                              )}

                              {checkoutStep === 'payment' && !paymentProof && (
                                 <div className="flex-1 flex flex-col animate-fade-in space-y-4 md:space-y-8 pb-4">
                                    <div className="bg-blue-50/50 rounded-2xl p-4 md:p-6 lg:p-8 border border-blue-100 space-y-3">
                                       <h3 className="font-black text-[#1e3a8a] flex items-center gap-2 text-[10px] md:text-base uppercase tracking-wider"><Smartphone className="w-3.5 h-3.5 md:w-6 md:h-6" /> Cara Pembayaran:</h3>
                                       <div className="space-y-2 md:space-y-3">
                                          {[
                                            "Buka aplikasi e-wallet atau mobile banking.",
                                            `Scan kode QRIS & bayar Rp ${totalAmount.toLocaleString()}.`,
                                            "Gunakan tombol kamera di bawah untuk foto bukti sukses."
                                          ].map((text, i) => (
                                            <div key={i} className="flex gap-2 items-start">
                                               <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-black text-[8px] md:text-xs flex-shrink-0">{i+1}</div>
                                               <p className="text-slate-600 font-bold text-[9px] md:text-sm">{text}</p>
                                            </div>
                                          ))}
                                       </div>
                                    </div>

                                    <div className="flex flex-col items-center flex-1 justify-center py-4">
                                       <div className="flex flex-col items-center w-full max-w-sm md:max-w-md lg:max-w-lg">
                                          <div className="w-full bg-[#1e3a8a] text-[#fde047] px-6 py-3 rounded-t-[2.5rem] font-black text-xs md:text-base shadow-lg border-x-4 border-t-4 border-white tracking-[0.2em] flex items-center justify-center gap-3 relative z-10 -mb-2">
                                             <QrCode className="w-5 h-5 md:w-7 md:h-7" /> SCAN QRIS DISINI
                                          </div>
                                          
                                          <div className="bg-white p-6 md:p-10 lg:p-12 rounded-b-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.2)] border-x-4 border-b-4 border-white mb-8 md:mb-12 w-full flex justify-center group hover:scale-[1.02] transition-transform duration-700 ease-out">
                                             <img 
                                               src={QRIS_STATIC_URL} 
                                               alt="QRIS" 
                                               className="w-full max-w-[320px] md:max-w-[420px] aspect-square object-contain" 
                                             />
                                          </div>
                                       </div>
                                       
                                       <Button size="lg" className="w-full py-5 md:py-8 text-base md:text-3xl font-black rounded-2xl md:rounded-[2.5rem] bg-slate-900 shadow-2xl hover:bg-[#1e3a8a] transition-all transform hover:-translate-y-1 active:scale-95" onClick={startCamera}>
                                          <Camera className="mr-3 w-6 h-6 md:w-10 md:h-10" /> FOTO BUKTI SEKARANG
                                       </Button>
                                       <button onClick={() => setCheckoutStep('review')} className="mt-4 text-slate-400 font-bold text-[10px] md:text-sm hover:text-[#1e3a8a] uppercase tracking-widest">KEMBALI KE DATA DIRI</button>
                                    </div>
                                 </div>
                              )}

                              {checkoutStep === 'validating' && (
                                 <div className="flex-1 flex flex-col items-center justify-center animate-fade-in text-center space-y-4 md:space-y-8">
                                    <div className="relative">
                                       <div className="w-24 h-24 md:w-40 md:h-40 border-6 md:border-8 border-slate-50 border-t-[#1e3a8a] rounded-full animate-spin"></div>
                                       <div className="absolute inset-0 flex items-center justify-center"><Scan className="w-8 h-8 md:w-16 md:h-16 text-[#1e3a8a] animate-pulse" /></div>
                                    </div>
                                    <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">Sedang Memvalidasi...</h3>
                                    <p className="text-slate-400 font-bold text-sm md:text-xl max-w-sm leading-tight">AI sedang memproses foto bukti bayar Anda secara otomatis. Mohon tidak menutup halaman ini.</p>
                                 </div>
                              )}

                              {checkoutStep === 'success' && (
                                 <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in space-y-4 md:space-y-8">
                                    <div className="w-24 h-24 md:w-40 md:h-40 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-xl animate-bounce border-4 border-white"><CheckCircle className="w-14 h-14 md:w-24 md:h-24" /></div>
                                    <h3 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase">PEMBAYARAN SUKSES! 🎉</h3>
                                    <div className="bg-slate-50 p-6 md:p-10 rounded-3xl md:rounded-[3rem] border-2 border-slate-100 shadow-inner">
                                       <p className="text-slate-600 font-bold text-sm md:text-2xl leading-snug">
                                          Terima kasih <b className="text-[#1e3a8a]">{buyerName}</b>,<br/>
                                          Silakan ambil barang belanjaan Anda!
                                       </p>
                                    </div>
                                    <Button size="lg" className="w-full py-5 md:py-8 text-base md:text-3xl font-black rounded-2xl md:rounded-[3rem] bg-[#1e3a8a] shadow-xl" onClick={closeCart}>KEMBALI KE TOKO</Button>
                                 </div>
                              )}

                              {checkoutStep === 'error' && (
                                 <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in space-y-4 md:space-y-8">
                                    <div className="w-20 h-20 md:w-32 md:h-32 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white"><AlertCircle className="w-10 h-10 md:w-16 md:h-16" /></div>
                                    <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">VERIFIKASI GAGAL</h3>
                                    <div className="bg-red-50 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border-2 border-red-100 w-full shadow-inner"><p className="text-red-600 font-bold text-xs md:text-xl leading-tight">{validationError}</p></div>
                                    <div className="w-full space-y-3 md:space-y-4">
                                       <Button size="lg" className="w-full py-4 md:py-6 text-sm md:text-2xl font-black rounded-xl md:rounded-3xl bg-slate-900 shadow-xl" onClick={startCamera}><RefreshCw className="mr-3 w-5 h-5 md:w-8 md:h-8" /> COBA FOTO ULANG</Button>
                                       <button onClick={() => setCheckoutStep('payment')} className="text-slate-400 font-black text-[10px] md:text-sm hover:text-[#1e3a8a] uppercase tracking-[0.2em] transition-all">BATALKAN TRANSAKSI</button>
                                    </div>
                                 </div>
                              )}
                           </>
                        )}
                     </div>
                  </div>
               </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
