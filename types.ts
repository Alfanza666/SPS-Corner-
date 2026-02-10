export enum UserRole {
  GUEST = 'GUEST',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
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
  balance: number;
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
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

// Helper interface for DB inserts/reads
export interface TransactionDB {
  id: string;
  created_at?: string;
  buyer_name: string;
  total_amount: number;
  items: any; // JSONB
  seller_id: string;
  status: string;
}

export interface ProductDB {
  id: string;
  created_at?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
  seller_id: string;
}