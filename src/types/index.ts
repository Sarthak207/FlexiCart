export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rfid_code?: string;
  barcode?: string;
  weight?: number; // Expected weight in grams
  category: string;
  description?: string;
  ingredients?: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  healthBenefits?: string[];
  allergens?: string[];
  origin?: string;
  brand?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
  paymentMethod?: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface WeightReading {
  timestamp: Date;
  weight: number; // in grams
  stable: boolean;
}

export interface ScanResult {
  type: 'rfid' | 'barcode' | 'camera';
  value: string;
  confidence?: number;
  timestamp: Date;
}
