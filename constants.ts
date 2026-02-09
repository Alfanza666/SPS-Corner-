import { Product, ProductCategory, User, UserRole, WithdrawalRequest, Transaction } from './types';

// Updated to a high-quality SVG Data URI based on the user-provided image
export const LOGO_URL = "data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='400' fill='%230072bc'/%3E%3Crect y='80' width='400' height='10' fill='%23ffff00'/%3E%3Ctext x='200' y='65' font-family='Arial, sans-serif' font-weight='900' font-size='42' text-anchor='middle' fill='black'%3EFEDERASI%3C/text%3E%3Cpath id='curve' d='M 60 210 A 140 140 0 0 1 340 210' fill='transparent'/%3E%3Ctext font-family='Arial, sans-serif' font-weight='900' font-size='32' fill='black'%3E%3CtextPath href='%23curve' startOffset='50%25' text-anchor='middle'%3ESERIKAT PEKERJA%3C/textPath%3E%3C/text%3E%3Ccircle cx='200' cy='205' r='45' fill='%23000' stroke='white' stroke-width='2'/%3E%3Cpath d='M180 205c5-5 25-5 30 0l10 5-10 10-20-5-10-10z' fill='white'/%3E%3Cpath d='M220 205c-5-5-25-5-30 0l-10 5 10 10 20-5 10-10z' fill='%23999'/%3E%3Crect x='60' y='260' width='280' height='80' fill='white' stroke='black' stroke-width='2'/%3E%3Ctext x='200' y='315' font-family='Arial, sans-serif' font-weight='900' font-size='56' text-anchor='middle' fill='black'%3ESUKSES%3C/text%3E%3Ctext x='200' y='380' font-family='Arial, sans-serif' font-weight='900' font-size='16' text-anchor='middle' fill='black'%3EPT. NIPPON INDOSARI CORPINDO, TBK.%3C/text%3E%3C/svg%3E";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Roti Coklat Spesial',
    description: 'Roti lembut dengan isian coklat lumer.',
    price: 5000,
    stock: 3, 
    category: ProductCategory.MAKANAN,
    imageUrl: 'https://picsum.photos/400/400?random=1',
    sellerId: 'seller1'
  },
  {
    id: '2',
    name: 'Es Kopi Susu Gula Aren',
    description: 'Segar dan manis pas.',
    price: 12000,
    stock: 50,
    category: ProductCategory.MINUMAN,
    imageUrl: 'https://picsum.photos/400/400?random=2',
    sellerId: 'seller1'
  },
  {
    id: '3',
    name: 'Keripik Pisang',
    description: 'Renyah dan gurih.',
    price: 15000,
    stock: 2, 
    category: ProductCategory.SNACK,
    imageUrl: 'https://picsum.photos/400/400?random=3',
    sellerId: 'seller2'
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'seller1',
    name: 'Budi Santoso',
    email: 'budi@federasi.com',
    role: UserRole.SELLER,
    balance: 450000
  },
  {
    id: 'admin1',
    name: 'Admin SPS',
    email: 'admin@federasi.com',
    role: UserRole.ADMIN,
    balance: 0
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-9821',
    date: '2023-11-20',
    time: '14:22:05',
    buyerName: 'Ahmad Subarjo',
    totalAmount: 25000,
    sellerId: 'seller1',
    status: 'COMPLETED',
    items: [
      { ...MOCK_PRODUCTS[0], quantity: 5 }
    ]
  },
  {
    id: 'TRX-9822',
    date: '2023-11-20',
    time: '15:10:45',
    buyerName: 'Siti Aminah',
    totalAmount: 12000,
    sellerId: 'seller1',
    status: 'COMPLETED',
    items: [
      { ...MOCK_PRODUCTS[1], quantity: 1 }
    ]
  },
  {
    id: 'TRX-9825',
    date: '2023-11-21',
    time: '09:05:12',
    buyerName: 'Eko Prasetyo',
    totalAmount: 50000,
    sellerId: 'seller1',
    status: 'COMPLETED',
    items: [
      { ...MOCK_PRODUCTS[0], quantity: 10 }
    ]
  }
];

export const MOCK_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd1',
    sellerId: 'seller1',
    sellerName: 'Budi Santoso',
    amount: 100000,
    fee: 7000,
    netAmount: 93000,
    status: 'PENDING',
    requestDate: '2023-10-25'
  }
];

export const QRIS_STATIC_URL = "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg";