import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Fresh Bananas',
    price: 60,
    image: '/images/demo/bananas.svg',
    rfid_code: 'RF001',
    barcode: '1234567890123',
    weight: 120,
    category: 'fruits',
    description: 'Fresh, sweet bananas from Tamil Nadu. Perfect for breakfast, smoothies, and Indian desserts.',
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
      'Natural source of energy',
      'Rich in vitamin B6 and vitamin C',
      'Supports digestive health'
    ],
    allergens: [],
    origin: 'Tamil Nadu',
    brand: 'Fresh Farm'
  },
  {
    id: '2',
    name: 'Basmati Rice (1kg)',
    price: 150,
    image: '/images/demo/bread.svg',
    rfid_code: 'RF002',
    barcode: '2345678901234',
    weight: 1000,
    category: 'grains',
    description: 'Premium quality basmati rice from Punjab. Long grain, aromatic rice perfect for biryanis and pulao.',
    ingredients: ['Basmati Rice'],
    nutrition: {
      calories: 354,
      protein: 7.1,
      carbs: 78,
      fat: 0.7,
      fiber: 1.3,
      sugar: 0.1
    },
    healthBenefits: [
      'Good source of carbohydrates for energy',
      'Low in fat and cholesterol-free',
      'Contains essential amino acids',
      'Gluten-free grain option'
    ],
    allergens: [],
    origin: 'Punjab',
    brand: 'India Gate'
  },
  {
    id: '3',
    name: 'Amul Fresh Milk (1L)',
    price: 68,
    image: '/images/demo/milk.svg',
    rfid_code: 'RF003',
    barcode: '3456789012345',
    weight: 1000,
    category: 'dairy',
    description: 'Fresh toned milk from Amul. Perfect for tea, coffee, and daily consumption.',
    ingredients: ['Toned Milk', 'Vitamin A', 'Vitamin D'],
    nutrition: {
      calories: 58,
      protein: 3.2,
      carbs: 4.7,
      fat: 3.0,
      fiber: 0,
      sugar: 4.7
    },
    healthBenefits: [
      'Excellent source of calcium',
      'High-quality protein',
      'Rich in vitamin A and D',
      'Supports bone health'
    ],
    allergens: ['Milk', 'Lactose'],
    origin: 'Gujarat',
    brand: 'Amul'
  },
  {
    id: '4',
    name: 'Red Apples (1kg)',
    price: 180,
    image: '/images/demo/apples.svg',
    rfid_code: 'RF004',
    barcode: '4567890123456',
    weight: 1000,
    category: 'fruits',
    description: 'Fresh, crisp red apples from Kashmir. Sweet and juicy, perfect for eating fresh or making juice.',
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
      'High in dietary fiber',
      'Helps reduce cholesterol',
      'Good for heart health'
    ],
    allergens: [],
    origin: 'Kashmir',
    brand: 'Kashmir Fresh'
  },
  {
    id: '5',
    name: 'Amul Cheese Slices',
    price: 160,
    image: '/images/demo/cheese.svg',
    rfid_code: 'RF005',
    barcode: '5678901234567',
    weight: 200,
    category: 'dairy',
    description: 'Processed cheese slices from Amul. Perfect for sandwiches, burgers, and quick snacks.',
    ingredients: ['Milk', 'Cheese', 'Emulsifier', 'Salt', 'Citric Acid'],
    nutrition: {
      calories: 321,
      protein: 20,
      carbs: 4.1,
      fat: 25,
      fiber: 0,
      sugar: 2.1
    },
    healthBenefits: [
      'Good source of calcium and protein',
      'Rich in vitamin A',
      'Supports bone health',
      'Quick energy source'
    ],
    allergens: ['Milk', 'Lactose'],
    origin: 'Gujarat',
    brand: 'Amul'
  },
  {
    id: '6',
    name: 'Britannia Good Day Cookies',
    price: 25,
    image: '/images/demo/croissants.svg',
    rfid_code: 'RF006',
    barcode: '6789012345678',
    weight: 75,
    category: 'bakery',
    description: 'Crispy and delicious butter cookies from Britannia. Perfect teatime snack for the family.',
    ingredients: ['Wheat Flour', 'Sugar', 'Edible Oil', 'Butter', 'Salt', 'Leavening Agents'],
    nutrition: {
      calories: 456,
      protein: 6.5,
      carbs: 68,
      fat: 18,
      fiber: 2.1,
      sugar: 22
    },
    healthBenefits: [
      'Quick energy source',
      'Contains carbohydrates',
      'Good for instant hunger relief',
      'Perfect teatime companion'
    ],
    allergens: ['Gluten', 'Wheat', 'Milk'],
    origin: 'Maharashtra',
    brand: 'Britannia'
  },
  {
    id: '7',
    name: 'Real Mango Juice (1L)',
    price: 120,
    image: '/images/demo/juice.svg',
    rfid_code: 'RF007',
    barcode: '7890123456789',
    weight: 1000,
    category: 'beverages',
    description: 'Delicious mango juice made from Alphonso mangoes. No artificial flavors, just pure mango goodness.',
    ingredients: ['Mango Pulp', 'Water', 'Sugar', 'Citric Acid', 'Vitamin C'],
    nutrition: {
      calories: 54,
      protein: 0.4,
      carbs: 13.7,
      fat: 0.1,
      fiber: 0.6,
      sugar: 13.1
    },
    healthBenefits: [
      'Rich in vitamin A and C',
      'Good source of antioxidants',
      'Supports immune system',
      'Natural energy booster'
    ],
    allergens: [],
    origin: 'Maharashtra',
    brand: 'Dabur Real'
  },
  {
    id: '8',
    name: 'Fresh Chicken (1kg)',
    price: 220,
    image: '/images/demo/chicken.svg',
    rfid_code: 'RF008',
    barcode: '8901234567890',
    weight: 1000,
    category: 'meat',
    description: 'Fresh, farm-raised chicken. Perfect for curries, tandoor, and biryanis. Halal certified.',
    ingredients: ['Fresh Chicken'],
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
      'Rich in B vitamins',
      'Supports muscle development',
      'Low in fat'
    ],
    allergens: [],
    origin: 'Punjab',
    brand: 'Farm Fresh'
  },
  {
    id: '9',
    name: 'Tata Tea Gold (250g)',
    price: 85,
    image: '/images/demo/croissants.svg',
    rfid_code: 'RF009',
    barcode: '9012345678901',
    weight: 250,
    category: 'beverages',
    description: 'Premium quality tea blend from Assam and Darjeeling. Perfect for your morning cup of chai.',
    ingredients: ['Black Tea'],
    nutrition: {
      calories: 2,
      protein: 0,
      carbs: 0.7,
      fat: 0,
      fiber: 0,
      sugar: 0
    },
    healthBenefits: [
      'Rich in antioxidants',
      'May improve heart health',
      'Supports mental alertness',
      'Traditional wellness benefits'
    ],
    allergens: [],
    origin: 'Assam',
    brand: 'Tata Tea'
  },
  {
    id: '10',
    name: 'Maggi Noodles (4-Pack)',
    price: 56,
    image: '/images/demo/bread.svg',
    rfid_code: 'RF010',
    barcode: '0123456789012',
    weight: 280,
    category: 'packaged-food',
    description: '2-minute Maggi noodles with masala flavor. Quick and tasty meal solution.',
    ingredients: ['Wheat Flour', 'Palm Oil', 'Spices', 'Salt', 'Flavor Enhancer'],
    nutrition: {
      calories: 205,
      protein: 6.5,
      carbs: 30,
      fat: 7.2,
      fiber: 2.1,
      sugar: 1.8
    },
    healthBenefits: [
      'Quick energy source',
      'Contains protein',
      'Convenient meal option',
      'Fortified with vitamins'
    ],
    allergens: ['Gluten', 'Wheat'],
    origin: 'Himachal Pradesh',
    brand: 'Maggi'
  }
];