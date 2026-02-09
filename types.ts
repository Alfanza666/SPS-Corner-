export enum UserRole {
  GUEST = 'GUEST', // Kiosk Mode
  SELLER = 'SELLER', // Karyawan
  ADMIN = 'ADMIN' // SPS Account
}

export enum ProductCategory {
  MAKANAN = 'Makanan',
  MINUMAN = 'Minuman',
  SNACK = 'Snack',
  LAINNYA = 'Lainnya'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  imageUrl: string;
  sellerId: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number; // Current sales balance
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number; // Gross amount
  fee: number; // 7-8%
  netAmount: number; // Amount to transfer
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
  proofImageUrl?: string;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  items: CartItem[];
  totalAmount: number;
  buyerName: string;
  sellerId: string;
  status: 'COMPLETED';
}