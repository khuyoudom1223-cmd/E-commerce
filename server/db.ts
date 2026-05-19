import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

// --- DATABASE INTERFACES ---

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'vendor' | 'rider' | 'customer';
  phone: string;
  avatarUrl: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  userId: string;
  storeName: string;
  storeLogo: string;
  storeDescription: string;
  address: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Product {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  rating: number;
  isFeatured: boolean;
  imageUrl: string;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  vendorId: string;
  totalAmount: number;
  discountAmount: number;
  deliveryFee: number;
  couponCode: string;
  status: 'pending' | 'confirmed' | 'packing' | 'shipping' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  price: number;
  quantity: number;
}

export interface Payment {
  id: string;
  orderId: string;
  paymentMethod: 'cod' | 'khqr' | 'bakong' | 'wing' | 'paypal';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionNumber: string;
  amount: number;
  createdAt: string;
}

export interface Rider {
  id: string;
  userId: string;
  vehicleType: 'moto' | 'car' | 'tuktuk';
  vehiclePlate: string;
  status: 'active' | 'busy' | 'offline';
  currentLat: number;
  currentLng: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  riderId: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverEmail: string;
  deliveryAddress: string;
  provinceCity: string;
  districtKhan: string;
  communeSangkat: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  deliveryStatus: 'pending' | 'confirmed' | 'packing' | 'shipping' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  deliveryFee: number;
  estimatedDeliveryTime: string; // in minutes
  trackingNumber: string;
  deliveryNotes: string;
}

export interface DeliveryTracking {
  id: string;
  deliveryId: string;
  status: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  note: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend: number;
  expiryDate: string;
  active: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'payment' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  vendors: Vendor[];
  products: Product[];
  categories: Category[];
  productImages: ProductImage[];
  carts: CartItem[];
  orders: Order[];
  orderItems: OrderItem[];
  payments: Payment[];
  riders: Rider[];
  deliveries: Delivery[];
  deliveryTracking: DeliveryTracking[];
  coupons: Coupon[];
  notifications: Notification[];
  reviews: Review[];
  wishlists: WishlistItem[];
}

// --- DATABASE CONTROLLER CLASS ---

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.getEmptySchema();
    this.load();
  }

  private getEmptySchema(): DatabaseSchema {
    return {
      users: [],
      vendors: [],
      products: [],
      categories: [],
      productImages: [],
      carts: [],
      orders: [],
      orderItems: [],
      payments: [],
      riders: [],
      deliveries: [],
      deliveryTracking: [],
      coupons: [],
      notifications: [],
      reviews: [],
      wishlists: [],
    };
  }

  // Load database from file
  public load(): void {
    try {
      if (fs.existsSync(DB_PATH)) {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = this.getEmptySchema();
        this.save();
        this.seed();
      }
    } catch (err) {
      console.error('Error loading database, initializing empty', err);
      this.data = this.getEmptySchema();
    }
  }

  // Save database to file
  public save(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file', err);
    }
  }

  // Helper getters for tables
  public get users() { return this.data.users; }
  public get vendors() { return this.data.vendors; }
  public get products() { return this.data.products; }
  public get categories() { return this.data.categories; }
  public get productImages() { return this.data.productImages; }
  public get carts() { return this.data.carts; }
  public get orders() { return this.data.orders; }
  public get orderItems() { return this.data.orderItems; }
  public get payments() { return this.data.payments; }
  public get riders() { return this.data.riders; }
  public get deliveries() { return this.data.deliveries; }
  public get deliveryTracking() { return this.data.deliveryTracking; }
  public get coupons() { return this.data.coupons; }
  public get notifications() { return this.data.notifications; }
  public get reviews() { return this.data.reviews; }
  public get wishlists() { return this.data.wishlists; }

  // Generic ID generator
  public generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Database Seeder
  public seed(): void {
    console.log('Seeding Database with premium e-commerce content...');
    
    // 1. Seed Users (with hashed password placeholders: "password" -> direct mock verification)
    const users: User[] = [
      { id: 'usr_admin', name: 'Sovereign Admin', email: 'admin@sleekcart.com', passwordHash: 'pbkdf2_admin', role: 'admin', phone: '+855 12 345 678', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() },
      
      { id: 'usr_vendor1', name: 'Dara (ElectroWorld Store)', email: 'vendor1@sleekcart.com', passwordHash: 'pbkdf2_vendor', role: 'vendor', phone: '+855 16 888 999', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() },
      { id: 'usr_vendor2', name: 'Sophy (StyleHub Premium)', email: 'vendor2@sleekcart.com', passwordHash: 'pbkdf2_vendor', role: 'vendor', phone: '+855 15 777 666', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() },
      { id: 'usr_vendor3', name: 'Borith (FreshGrains Organic)', email: 'vendor3@sleekcart.com', passwordHash: 'pbkdf2_vendor', role: 'vendor', phone: '+855 99 555 444', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() },
      
      { id: 'usr_rider1', name: 'Piseth Delivery', email: 'rider1@sleekcart.com', passwordHash: 'pbkdf2_rider', role: 'rider', phone: '+855 93 111 222', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() },
      { id: 'usr_rider2', name: 'Chanthou Express', email: 'rider2@sleekcart.com', passwordHash: 'pbkdf2_rider', role: 'rider', phone: '+855 77 333 444', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() },
      { id: 'usr_rider3', name: 'Vichea Courier', email: 'rider3@sleekcart.com', passwordHash: 'pbkdf2_rider', role: 'rider', phone: '+855 88 444 555', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() },
      
      { id: 'usr_customer', name: 'Makara Sok', email: 'customer@sleekcart.com', passwordHash: 'pbkdf2_customer', role: 'customer', phone: '+855 10 999 888', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', createdAt: new Date().toISOString() }
    ];
    this.data.users = users;

    // 2. Seed Vendors
    const vendors: Vendor[] = [
      { id: 'vnd_1', userId: 'usr_vendor1', storeName: 'ElectroWorld Store', storeLogo: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=100&q=80', storeDescription: 'Your premium hub for all things electronic, gadgets, high-fidelity sound systems and smartphones.', address: 'Preah Monivong Blvd (93), Phnom Penh, Cambodia', status: 'active' },
      { id: 'vnd_2', userId: 'usr_vendor2', storeName: 'StyleHub Premium', storeLogo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=100&q=80', storeDescription: 'Curated modern fashion, outfits, streetwear, and premium luxury accessories.', address: 'Sihanouk Blvd (274), Phnom Penh, Cambodia', status: 'active' },
      { id: 'vnd_3', userId: 'usr_vendor3', storeName: 'FreshGrains Organic', storeLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80', storeDescription: 'Locally grown organic farm fruits, fresh green groceries, healthy grains, and dairy products.', address: 'Mao Tse Toung Blvd (245), Phnom Penh, Cambodia', status: 'active' }
    ];
    this.data.vendors = vendors;

    // 3. Seed Categories
    const categories: Category[] = [
      { id: 'cat_electronics', name: 'Electronics & Gadgets', slug: 'electronics', icon: 'Cpu' },
      { id: 'cat_fashion', name: 'Fashion & Apparel', slug: 'fashion', icon: 'Shirt' },
      { id: 'cat_groceries', name: 'Organic Groceries', slug: 'groceries', icon: 'ShoppingBag' },
      { id: 'cat_beauty', name: 'Beauty & Cosmetics', slug: 'beauty', icon: 'Sparkles' },
      { id: 'cat_home', name: 'Home & Living', slug: 'home-living', icon: 'Home' }
    ];
    this.data.categories = categories;

    // 4. Seed Products
    const products: Product[] = [
      // Electronics (vendor 1)
      {
        id: 'prd_1',
        vendorId: 'vnd_1',
        categoryId: 'cat_electronics',
        name: 'Nebula Pro Wireless Headset',
        description: 'Experience ultra-premium hybrid active noise cancellation (ANC), 60-hour battery life, spatial audio, and high-fidelity sound drivers wrapped in lightweight premium carbon-fiber leather.',
        price: 189.00,
        compareAtPrice: 249.00,
        stock: 45,
        rating: 4.8,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'prd_2',
        vendorId: 'vnd_1',
        categoryId: 'cat_electronics',
        name: 'Apex Mechanical Keyboard',
        description: 'Hot-swappable tactile linear switches, dual-shot PBT keycaps, dynamic per-key sound dampening, custom RGB matrix lighting, and seamless triple-mode connection (2.4Ghz, Bluetooth, USB-C).',
        price: 120.00,
        compareAtPrice: 150.00,
        stock: 30,
        rating: 4.6,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'prd_3',
        vendorId: 'vnd_1',
        categoryId: 'cat_electronics',
        name: 'UltraWide 4K IPS Gaming Monitor',
        description: 'Immersive 34-inch curved screen featuring a rapid 144Hz refresh rate, HDR400 color clarity, absolute 99% sRGB profile, and USB-C power delivery output.',
        price: 499.00,
        compareAtPrice: 599.00,
        stock: 12,
        rating: 4.9,
        isFeatured: false,
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date().toISOString()
      },

      // Fashion (vendor 2)
      {
        id: 'prd_4',
        vendorId: 'vnd_2',
        categoryId: 'cat_fashion',
        name: 'Minimalist Sand Suede Trench Coat',
        description: 'Premium tailored slim-fit autumn trench jacket. Water-repellent suede fibers, tortoiseshell button details, custom interior silk linings, and dual windbreak flaps.',
        price: 135.00,
        compareAtPrice: 199.00,
        stock: 25,
        rating: 4.7,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'prd_5',
        vendorId: 'vnd_2',
        categoryId: 'cat_fashion',
        name: 'Classic White Leather Sneakers',
        description: 'Handcrafted full-grain Italian white leather footwear with orthopedic cork insoles and durable vulcanized rubber soles. Timeless streetwear aesthetic.',
        price: 89.00,
        compareAtPrice: 110.00,
        stock: 50,
        rating: 4.5,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
      },

      // Groceries (vendor 3)
      {
        id: 'prd_6',
        vendorId: 'vnd_3',
        categoryId: 'cat_groceries',
        name: 'Fresh Organic Berry Medley Box',
        description: 'A hand-selected sweet blend of direct-from-farm strawberries, rich black raspberries, wild blueberries, and plump tart blackberries. 100% pesticide-free.',
        price: 12.50,
        compareAtPrice: 15.00,
        stock: 120,
        rating: 4.9,
        isFeatured: true,
        imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'prd_7',
        vendorId: 'vnd_3',
        categoryId: 'cat_groceries',
        name: 'Cold-Pressed Extra Virgin Olive Oil',
        description: 'Exquisite single-origin Greek olive oil. Cold pressed within hours of harvest to retain healthy antioxidants and a smooth peppery aroma.',
        price: 24.00,
        compareAtPrice: 30.00,
        stock: 60,
        rating: 4.8,
        isFeatured: false,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date().toISOString()
      }
    ];
    this.data.products = products;

    // 5. Seed Product Images
    const productImages: ProductImage[] = products.map((p, idx) => ({
      id: `img_${idx}`,
      productId: p.id,
      imageUrl: p.imageUrl
    }));
    this.data.productImages = productImages;

    // 6. Seed Riders
    const riders: Rider[] = [
      // Current positions around central Phnom Penh (e.g. Orussey Market, Aeon Mall 1, Toul Sleng)
      { id: 'rdr_1', userId: 'usr_rider1', vehicleType: 'moto', vehiclePlate: 'Phnom Penh 1AI-9999', status: 'active', currentLat: 11.5540, currentLng: 104.9180 },
      { id: 'rdr_2', userId: 'usr_rider2', vehicleType: 'tuktuk', vehiclePlate: 'Phnom Penh 2CC-8888', status: 'active', currentLat: 11.5620, currentLng: 104.9350 },
      { id: 'rdr_3', userId: 'usr_rider3', vehicleType: 'car', vehiclePlate: 'Phnom Penh 2AB-7777', status: 'offline', currentLat: 11.5450, currentLng: 104.9200 }
    ];
    this.data.riders = riders;

    // 7. Seed Coupons
    const coupons: Coupon[] = [
      { id: 'cp_1', code: 'SLEEK10', discountType: 'percentage', discountValue: 10, minSpend: 20, expiryDate: '2027-12-31T23:59:59Z', active: true },
      { id: 'cp_2', code: 'FREEFEES', discountType: 'fixed', discountValue: 3.5, minSpend: 15, expiryDate: '2027-12-31T23:59:59Z', active: true },
      { id: 'cp_3', code: 'SAVENEW20', discountType: 'fixed', discountValue: 20.0, minSpend: 100, expiryDate: '2027-12-31T23:59:59Z', active: true }
    ];
    this.data.coupons = coupons;

    // 8. Seed Reviews
    const reviews: Review[] = [
      { id: 'rev_1', userId: 'usr_customer', productId: 'prd_1', rating: 5, comment: 'Hands down the best headphones I have ever owned! The ANC completely blocks out city traffic and acoustic instrument separation is perfect.', createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
      { id: 'rev_2', userId: 'usr_customer', productId: 'prd_4', rating: 4, comment: 'Stunning trench coat! Tailoring is immaculate and fits perfectly. The material is thick, premium, and keeps the wind out.', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() }
    ];
    this.data.reviews = reviews;

    // 9. Seed Orders, Order Items, Payments & Deliveries (Seeded for Gorgeous Admin Dashboard Analytics!)
    // Let's seed 5 completed/delivered orders from various points of the past week, and 1 active pending order
    const sampleDates = [
      new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    ];

    const seededOrders: Order[] = [
      { id: 'ord_seeded1', userId: 'usr_customer', vendorId: 'vnd_1', totalAmount: 201.50, discountAmount: 10.00, deliveryFee: 2.50, couponCode: 'SLEEK10', status: 'delivered', createdAt: sampleDates[0] },
      { id: 'ord_seeded2', userId: 'usr_customer', vendorId: 'vnd_2', totalAmount: 135.00, discountAmount: 0, deliveryFee: 3.50, couponCode: '', status: 'delivered', createdAt: sampleDates[1] },
      { id: 'ord_seeded3', userId: 'usr_customer', vendorId: 'vnd_3', totalAmount: 39.00, discountAmount: 3.50, deliveryFee: 0, couponCode: 'FREEFEES', status: 'delivered', createdAt: sampleDates[2] },
      { id: 'ord_seeded4', userId: 'usr_customer', vendorId: 'vnd_1', totalAmount: 122.50, discountAmount: 0, deliveryFee: 2.50, couponCode: '', status: 'delivered', createdAt: sampleDates[3] },
      { id: 'ord_seeded5', userId: 'usr_customer', vendorId: 'vnd_2', totalAmount: 207.50, discountAmount: 20.00, deliveryFee: 3.50, couponCode: 'SAVENEW20', status: 'delivered', createdAt: sampleDates[4] }
    ];
    this.data.orders = seededOrders;

    const seededOrderItems: OrderItem[] = [
      // ord_seeded1
      { id: 'item_s1', orderId: 'ord_seeded1', productId: 'prd_1', price: 189.00, quantity: 1 },
      { id: 'item_s2', orderId: 'ord_seeded1', productId: 'prd_6', price: 12.50, quantity: 1 },
      // ord_seeded2
      { id: 'item_s3', orderId: 'ord_seeded2', productId: 'prd_4', price: 135.00, quantity: 1 },
      // ord_seeded3
      { id: 'item_s4', orderId: 'ord_seeded3', productId: 'prd_7', price: 24.00, quantity: 1 },
      { id: 'item_s5', orderId: 'ord_seeded3', productId: 'prd_6', price: 12.50, quantity: 1 },
      // ord_seeded4
      { id: 'item_s6', orderId: 'ord_seeded4', productId: 'prd_2', price: 120.00, quantity: 1 },
      // ord_seeded5
      { id: 'item_s7', orderId: 'ord_seeded5', productId: 'prd_4', price: 135.00, quantity: 1 },
      { id: 'item_s8', orderId: 'ord_seeded5', productId: 'prd_5', price: 89.00, quantity: 1 }
    ];
    this.data.orderItems = seededOrderItems;

    const seededPayments: Payment[] = [
      { id: 'pay_s1', orderId: 'ord_seeded1', paymentMethod: 'khqr', paymentStatus: 'paid', transactionNumber: 'TXN-98218-ABA', amount: 201.50, createdAt: sampleDates[0] },
      { id: 'pay_s2', orderId: 'ord_seeded2', paymentMethod: 'paypal', paymentStatus: 'paid', transactionNumber: 'PAYPAL-881274-PP', amount: 135.00, createdAt: sampleDates[1] },
      { id: 'pay_s3', orderId: 'ord_seeded3', paymentMethod: 'bakong', paymentStatus: 'paid', transactionNumber: 'TXN-32918-BAK', amount: 39.00, createdAt: sampleDates[2] },
      { id: 'pay_s4', orderId: 'ord_seeded4', paymentMethod: 'wing', paymentStatus: 'paid', transactionNumber: 'TXN-77218-WNG', amount: 122.50, createdAt: sampleDates[3] },
      { id: 'pay_s5', orderId: 'ord_seeded5', paymentMethod: 'khqr', paymentStatus: 'paid', transactionNumber: 'TXN-44919-ABA', amount: 207.50, createdAt: sampleDates[4] }
    ];
    this.data.payments = seededPayments;

    const seededDeliveries: Delivery[] = [
      {
        id: 'del_s1',
        orderId: 'ord_seeded1',
        riderId: 'rdr_1',
        receiverName: 'Makara Sok',
        receiverPhone: '+855 10 999 888',
        receiverEmail: 'customer@sleekcart.com',
        deliveryAddress: 'House 14B, Street 310, Boeung Keng Kang 1',
        provinceCity: 'Phnom Penh',
        districtKhan: 'Boeung Keng Kang',
        communeSangkat: 'Boeung Keng Kang Ti Muoy',
        postalCode: '120101',
        latitude: 11.5512,
        longitude: 104.9221,
        deliveryStatus: 'delivered',
        deliveryFee: 2.50,
        estimatedDeliveryTime: '25',
        trackingNumber: 'TRK-98127391',
        deliveryNotes: 'Please call 10 minutes before arrival.'
      },
      {
        id: 'del_s2',
        orderId: 'ord_seeded2',
        riderId: 'rdr_2',
        receiverName: 'Makara Sok',
        receiverPhone: '+855 10 999 888',
        receiverEmail: 'customer@sleekcart.com',
        deliveryAddress: 'Vattanac Tower Floor 18, Preah Monivong',
        provinceCity: 'Phnom Penh',
        districtKhan: 'Daun Penh',
        communeSangkat: 'Wat Phnom',
        postalCode: '120211',
        latitude: 11.5721,
        longitude: 104.9202,
        deliveryStatus: 'delivered',
        deliveryFee: 3.50,
        estimatedDeliveryTime: '30',
        trackingNumber: 'TRK-77123992',
        deliveryNotes: 'Drop at the receptionist desk on ground floor.'
      },
      {
        id: 'del_s3',
        orderId: 'ord_seeded3',
        riderId: 'rdr_1',
        receiverName: 'Makara Sok',
        receiverPhone: '+855 10 999 888',
        receiverEmail: 'customer@sleekcart.com',
        deliveryAddress: 'Condo 102, Street 51, BKK1',
        provinceCity: 'Phnom Penh',
        districtKhan: 'Chamkar Mon',
        communeSangkat: 'Tonle Bassac',
        postalCode: '120102',
        latitude: 11.5540,
        longitude: 104.9310,
        deliveryStatus: 'delivered',
        deliveryFee: 0,
        estimatedDeliveryTime: '20',
        trackingNumber: 'TRK-29182390',
        deliveryNotes: ''
      },
      {
        id: 'del_s4',
        orderId: 'ord_seeded4',
        riderId: 'rdr_2',
        receiverName: 'Makara Sok',
        receiverPhone: '+855 10 999 888',
        receiverEmail: 'customer@sleekcart.com',
        deliveryAddress: 'TK Avenue Plaza Block 3',
        provinceCity: 'Phnom Penh',
        districtKhan: 'Tuol Kork',
        communeSangkat: 'Boeung Kak Ti Muoy',
        postalCode: '120401',
        latitude: 11.5890,
        longitude: 104.8970,
        deliveryStatus: 'delivered',
        deliveryFee: 2.50,
        estimatedDeliveryTime: '35',
        trackingNumber: 'TRK-38198273',
        deliveryNotes: 'Ring bell'
      },
      {
        id: 'del_s5',
        orderId: 'ord_seeded5',
        riderId: 'rdr_3',
        receiverName: 'Makara Sok',
        receiverPhone: '+855 10 999 888',
        receiverEmail: 'customer@sleekcart.com',
        deliveryAddress: 'Norea City Villa 45, Chbar Ampov',
        provinceCity: 'Phnom Penh',
        districtKhan: 'Chbar Ampov',
        communeSangkat: 'Chbar Ampov Ti Muoy',
        postalCode: '120501',
        latitude: 11.5390,
        longitude: 104.9540,
        deliveryStatus: 'delivered',
        deliveryFee: 3.50,
        estimatedDeliveryTime: '40',
        trackingNumber: 'TRK-10928374',
        deliveryNotes: 'Call secondary phone if main is busy.'
      }
    ];
    this.data.deliveries = seededDeliveries;

    // 10. Seed Notifications
    const notifications: Notification[] = [
      { id: 'not_1', userId: 'usr_customer', title: 'Welcome to SleekCart!', message: 'Explore our multi-vendor shop and experience our real-time high-fidelity delivery tracker.', type: 'system', isRead: false, createdAt: new Date().toISOString() }
    ];
    this.data.notifications = notifications;

    // Save out the seeded structure
    this.save();
    console.log('Database successfully seeded and saved!');
  }
}

export const db = new Database();
