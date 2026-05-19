import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Product } from '../models/product.model.js';
import { Order } from '../models/order.model.js';

/**
 * Seeds MongoDB collections with high-quality, premium mock data.
 * Checks for existing documents first to avoid duplicates.
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('[MongoDB Seeder] Checking if database requires seeding...');

    // 1. Seed Categories
    const categoryCount = await Category.countDocuments();
    let seededCategories: any[] = [];
    
    if (categoryCount === 0) {
      console.log('[MongoDB Seeder] Seeding premium categories...');
      const categoriesData = [
        { name: 'Electronics & Gadgets', slug: 'electronics', icon: 'Cpu' },
        { name: 'Fashion & Apparel', slug: 'fashion', icon: 'Shirt' },
        { name: 'Organic Groceries', slug: 'groceries', icon: 'ShoppingBag' },
        { name: 'Beauty & Cosmetics', slug: 'beauty', icon: 'Sparkles' },
        { name: 'Home & Living', slug: 'home-living', icon: 'Home' }
      ];
      seededCategories = await Category.insertMany(categoriesData);
      console.log(`[MongoDB Seeder] Seeded ${seededCategories.length} categories.`);
    } else {
      seededCategories = await Category.find({});
      console.log('[MongoDB Seeder] Categories already exist. Skipping category seeding.');
    }

    // 2. Seed Users
    const userCount = await User.countDocuments();
    let seededUsers: any[] = [];
    
    if (userCount === 0) {
      console.log('[MongoDB Seeder] Seeding system users...');
      const usersData = [
        {
          name: 'Sovereign Admin',
          email: 'admin@sleekcart.com',
          passwordHash: 'pbkdf2_hashed_admin',
          role: 'admin',
          phone: '+855 12 345 678',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        },
        {
          name: 'Dara (ElectroWorld Store)',
          email: 'vendor1@sleekcart.com',
          passwordHash: 'pbkdf2_hashed_vendor',
          role: 'vendor',
          phone: '+855 16 888 999',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
        },
        {
          name: 'Makara Sok',
          email: 'customer@sleekcart.com',
          passwordHash: 'pbkdf2_hashed_customer',
          role: 'customer',
          phone: '+855 10 999 888',
          avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
        }
      ];
      seededUsers = await User.insertMany(usersData);
      console.log(`[MongoDB Seeder] Seeded ${seededUsers.length} users.`);
    } else {
      seededUsers = await User.find({});
      console.log('[MongoDB Seeder] Users already exist. Skipping user seeding.');
    }

    // 3. Seed Products
    const productCount = await Product.countDocuments();
    let seededProducts: any[] = [];

    if (productCount === 0 && seededCategories.length > 0) {
      console.log('[MongoDB Seeder] Seeding premium product listings...');
      
      const electronicsCat = seededCategories.find(c => c.slug === 'electronics');
      const fashionCat = seededCategories.find(c => c.slug === 'fashion');
      const groceriesCat = seededCategories.find(c => c.slug === 'groceries');

      const productsData = [
        {
          vendorId: 'vnd_1',
          categoryId: electronicsCat?._id,
          name: 'Nebula Pro Wireless Headset',
          description: 'Experience ultra-premium hybrid active noise cancellation (ANC), 60-hour battery life, spatial audio, and high-fidelity sound drivers wrapped in lightweight premium carbon-fiber leather.',
          price: 189.00,
          compareAtPrice: 249.00,
          stock: 45,
          rating: 4.8,
          isFeatured: true,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
        },
        {
          vendorId: 'vnd_1',
          categoryId: electronicsCat?._id,
          name: 'Apex Mechanical Keyboard',
          description: 'Hot-swappable tactile linear switches, dual-shot PBT keycaps, dynamic per-key sound dampening, custom RGB matrix lighting, and seamless triple-mode connection.',
          price: 120.00,
          compareAtPrice: 150.00,
          stock: 30,
          rating: 4.6,
          isFeatured: true,
          imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80'
        },
        {
          vendorId: 'vnd_2',
          categoryId: fashionCat?._id,
          name: 'Minimalist Sand Suede Trench Coat',
          description: 'Premium tailored slim-fit autumn trench jacket. Water-repellent suede fibers, tortoiseshell button details, custom interior silk linings, and dual windbreak flaps.',
          price: 135.00,
          compareAtPrice: 199.00,
          stock: 25,
          rating: 4.7,
          isFeatured: true,
          imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80'
        },
        {
          vendorId: 'vnd_3',
          categoryId: groceriesCat?._id,
          name: 'Fresh Organic Berry Medley Box',
          description: 'A hand-selected sweet blend of direct-from-farm strawberries, rich black raspberries, wild blueberries, and plump tart blackberries. 100% pesticide-free.',
          price: 12.50,
          compareAtPrice: 15.00,
          stock: 120,
          rating: 4.9,
          isFeatured: true,
          imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?auto=format&fit=crop&w=600&q=80'
        }
      ];

      seededProducts = await Product.insertMany(productsData);
      console.log(`[MongoDB Seeder] Seeded ${seededProducts.length} products.`);
    } else {
      console.log('[MongoDB Seeder] Products already exist. Skipping product seeding.');
    }

    // 4. Seed Orders
    const orderCount = await Order.countDocuments();
    if (orderCount === 0 && seededProducts.length > 0 && seededUsers.length > 0) {
      console.log('[MongoDB Seeder] Seeding initial test orders...');
      
      const customer = seededUsers.find(u => u.role === 'customer');
      const product1 = seededProducts[0];
      const product2 = seededProducts[1];

      const ordersData = [
        {
          userId: customer?._id,
          vendorId: 'vnd_1',
          items: [
            { productId: product1?._id, price: product1?.price, quantity: 1 },
            { productId: product2?._id, price: product2?.price, quantity: 2 }
          ],
          totalAmount: 429.00,
          discountAmount: 10.00,
          deliveryFee: 2.50,
          couponCode: 'SLEEK10',
          status: 'confirmed'
        }
      ];

      const seededOrders = await Order.insertMany(ordersData);
      console.log(`[MongoDB Seeder] Seeded ${seededOrders.length} orders.`);
    } else {
      console.log('[MongoDB Seeder] Orders already exist. Skipping order seeding.');
    }

    console.log('[MongoDB Seeder] Database seeding check complete.');
  } catch (error) {
    console.error('[MongoDB Seeder] Seeding error encountered:', error);
  }
};
export default seedDatabase;
