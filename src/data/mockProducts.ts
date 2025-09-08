import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Red Apples',
    price: 2.99,
    image: '/images/demo/apples.svg',
    rfid_code: 'RF001',
    barcode: '1234567890123',
    weight: 150,
    category: 'fruits',
    description: 'Fresh, crisp red apples perfect for snacking or baking. Naturally sweet with a satisfying crunch.',
    ingredients: ['Red Apples'],
    nutrition: {
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      fiber: 2.4,
      sugar: 10.4
    },
    healthBenefits: [
      'Rich in antioxidants and vitamin C',
      'High in dietary fiber for digestive health',
      'May help reduce cholesterol levels',
      'Supports heart health and weight management'
    ],
    allergens: [],
    origin: 'Local Farm',
    brand: 'Fresh Harvest'
  },
  {
    id: '2',
    name: 'Whole Wheat Bread',
    price: 1.99,
    image: '/images/demo/bread.svg',
    rfid_code: 'RF002',
    barcode: '2345678901234',
    weight: 400,
    category: 'bakery',
    description: 'Nutritious whole wheat bread made with 100% whole grain flour. Perfect for sandwiches and toast.',
    ingredients: ['Whole Wheat Flour', 'Water', 'Yeast', 'Salt', 'Honey', 'Olive Oil'],
    nutrition: {
      calories: 247,
      protein: 13,
      carbs: 41,
      fat: 4.2,
      fiber: 6,
      sugar: 1.5
    },
    healthBenefits: [
      'High in fiber for digestive health',
      'Rich in B vitamins and minerals',
      'Helps maintain stable blood sugar levels',
      'Supports heart health'
    ],
    allergens: ['Gluten', 'Wheat'],
    origin: 'Local Bakery',
    brand: 'Artisan Bakers'
  },
  {
    id: '3',
    name: 'Fresh Milk',
    price: 3.49,
    image: '/images/demo/milk.svg',
    rfid_code: 'RF003',
    barcode: '3456789012345',
    weight: 1000,
    category: 'dairy',
    description: 'Pure, fresh whole milk from grass-fed cows. Rich, creamy taste perfect for drinking or cooking.',
    ingredients: ['Whole Milk', 'Vitamin D3'],
    nutrition: {
      calories: 61,
      protein: 3.2,
      carbs: 4.8,
      fat: 3.3,
      fiber: 0,
      sugar: 4.8
    },
    healthBenefits: [
      'Excellent source of calcium for strong bones',
      'High-quality protein for muscle development',
      'Rich in vitamin D and B12',
      'Supports immune system function'
    ],
    allergens: ['Milk', 'Lactose'],
    origin: 'Local Dairy Farm',
    brand: 'Pure Valley'
  },
  {
    id: '4',
    name: 'Bananas',
    price: 1.29,
    image: '/images/demo/bananas.svg',
    rfid_code: 'RF004',
    barcode: '4567890123456',
    weight: 120,
    category: 'fruits',
    description: 'Sweet, ripe bananas perfect for snacking, smoothies, or baking. Naturally rich in potassium.',
    ingredients: ['Bananas'],
    nutrition: {
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12.2
    },
    healthBenefits: [
      'High in potassium for heart health',
      'Natural source of energy from healthy carbs',
      'Rich in vitamin B6 and vitamin C',
      'Supports muscle function and recovery'
    ],
    allergens: [],
    origin: 'Ecuador',
    brand: 'Tropical Fresh'
  },
  {
    id: '5',
    name: 'Cheddar Cheese',
    price: 4.99,
    image: '/images/demo/cheese.svg',
    rfid_code: 'RF005',
    barcode: '5678901234567',
    weight: 250,
    category: 'dairy',
    description: 'Aged sharp cheddar cheese with rich, tangy flavor. Perfect for sandwiches, cooking, or snacking.',
    ingredients: ['Pasteurized Milk', 'Cheese Cultures', 'Salt', 'Enzymes'],
    nutrition: {
      calories: 402,
      protein: 25,
      carbs: 1.3,
      fat: 33,
      fiber: 0,
      sugar: 0.5
    },
    healthBenefits: [
      'Excellent source of calcium and protein',
      'Rich in vitamin A and B12',
      'Supports bone and teeth health',
      'Contains beneficial probiotics'
    ],
    allergens: ['Milk', 'Lactose'],
    origin: 'Vermont',
    brand: 'Artisan Cheese Co.'
  },
  {
    id: '6',
    name: 'Croissants',
    price: 3.99,
    image: '/images/demo/croissants.svg',
    rfid_code: 'RF006',
    barcode: '6789012345678',
    weight: 180,
    category: 'bakery',
    description: 'Buttery, flaky French croissants baked fresh daily. Perfect for breakfast or an afternoon treat.',
    ingredients: ['Wheat Flour', 'Butter', 'Water', 'Sugar', 'Yeast', 'Salt', 'Eggs'],
    nutrition: {
      calories: 406,
      protein: 8.2,
      carbs: 45,
      fat: 21,
      fiber: 2.6,
      sugar: 7
    },
    healthBenefits: [
      'Source of carbohydrates for energy',
      'Contains protein for muscle health',
      'Rich in B vitamins',
      'Provides iron and magnesium'
    ],
    allergens: ['Gluten', 'Wheat', 'Eggs', 'Dairy'],
    origin: 'Local Bakery',
    brand: 'French Artisan'
  },
  {
    id: '7',
    name: 'Orange Juice',
    price: 2.79,
    image: '/images/demo/juice.svg',
    rfid_code: 'RF007',
    barcode: '7890123456789',
    weight: 950,
    category: 'beverages',
    description: '100% pure orange juice with no added sugars. Fresh-squeezed taste packed with vitamin C.',
    ingredients: ['Orange Juice', 'Natural Orange Flavor'],
    nutrition: {
      calories: 45,
      protein: 0.7,
      carbs: 10.4,
      fat: 0.2,
      fiber: 0.2,
      sugar: 8.1
    },
    healthBenefits: [
      'Excellent source of vitamin C',
      'Rich in folate and potassium',
      'Supports immune system health',
      'Natural antioxidants for cell protection'
    ],
    allergens: [],
    origin: 'Florida',
    brand: 'Sunshine Grove'
  },
  {
    id: '8',
    name: 'Chicken Breast',
    price: 7.99,
    image: '/images/demo/chicken.svg',
    rfid_code: 'RF008',
    barcode: '8901234567890',
    weight: 450,
    category: 'meat',
    description: 'Fresh, lean chicken breast from free-range chickens. High in protein and perfect for healthy meals.',
    ingredients: ['Chicken Breast'],
    nutrition: {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0
    },
    healthBenefits: [
      'Excellent source of lean protein',
      'Rich in B vitamins and niacin',
      'Supports muscle growth and repair',
      'Low in saturated fat'
    ],
    allergens: [],
    origin: 'Local Farm',
    brand: 'Farm Fresh Poultry'
  }
];