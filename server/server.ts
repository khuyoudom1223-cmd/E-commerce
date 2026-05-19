import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'sleekcart-super-secret-key-2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- MIDDLEWARES ---

// Authenticate JWT Token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Authorization token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Check Roles
const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

// --- REAL-TIME RIDER SIMULATION SYSTEM ---

interface SimulatedActiveDelivery {
  orderId: string;
  riderId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  currentLat: number;
  currentLng: number;
  step: number;
  totalSteps: number;
  status: string;
  intervalId?: NodeJS.Timeout;
}

const activeSimulations = new Map<string, SimulatedActiveDelivery>();

// Start a simulated rider trip
function startRiderSimulation(orderId: string, riderId: string) {
  // If simulation already active, clean it up
  if (activeSimulations.has(orderId)) {
    const existing = activeSimulations.get(orderId);
    if (existing?.intervalId) clearInterval(existing.intervalId);
  }

  // Get order & delivery info
  const delivery = db.deliveries.find(d => d.orderId === orderId);
  const rider = db.riders.find(r => r.id === riderId);
  const order = db.orders.find(o => o.id === orderId);

  if (!delivery || !rider || !order) return;

  // Let's find vendor location to start from
  // If vendor 1, 2, or 3, we have coordinates
  // vendor 1 -> central PP (11.5564, 104.9282)
  // vendor 2 -> Sihanouk Blvd (11.5540, 104.9310)
  // vendor 3 -> Mao Tse Toung (11.5450, 104.9200)
  let startLat = 11.5564;
  let startLng = 104.9282;

  if (order.vendorId === 'vnd_2') {
    startLat = 11.5540; startLng = 104.9310;
  } else if (order.vendorId === 'vnd_3') {
    startLat = 11.5450; startLng = 104.9200;
  }

  const endLat = delivery.latitude;
  const endLng = delivery.longitude;

  const totalSteps = 40; // 40 increments
  const simulation: SimulatedActiveDelivery = {
    orderId,
    riderId,
    startLat,
    startLng,
    endLat,
    endLng,
    currentLat: startLat,
    currentLng: startLng,
    step: 0,
    totalSteps,
    status: 'out_for_delivery'
  };

  // Start tick timer
  const intervalId = setInterval(() => {
    const sim = activeSimulations.get(orderId);
    if (!sim) return;

    if (sim.step >= sim.totalSteps) {
      // Completed!
      clearInterval(sim.intervalId!);
      sim.status = 'delivered';
      
      // Update DB
      const dbOrder = db.orders.find(o => o.id === orderId);
      if (dbOrder) dbOrder.status = 'delivered';

      const dbDelivery = db.deliveries.find(d => d.orderId === orderId);
      if (dbDelivery) {
        dbDelivery.deliveryStatus = 'delivered';
        dbDelivery.estimatedDeliveryTime = '0';
      }

      const dbRider = db.riders.find(r => r.id === riderId);
      if (dbRider) {
        dbRider.status = 'active'; // free again
        dbRider.currentLat = sim.endLat;
        dbRider.currentLng = sim.endLng;
      }

      // Add delivery tracking dot
      db.deliveryTracking.push({
        id: db.generateId('dt'),
        deliveryId: dbDelivery?.id || '',
        status: 'delivered',
        latitude: sim.endLat,
        longitude: sim.endLng,
        timestamp: new Date().toISOString(),
        note: 'Order successfully delivered to customer!'
      });

      // Notify customer
      db.notifications.push({
        id: db.generateId('not'),
        userId: dbOrder?.userId || '',
        title: 'Order Delivered! 🎉',
        message: `Your order #${orderId.substring(4)} has been delivered. Bon appétit!`,
        type: 'delivery',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      db.save();
      activeSimulations.delete(orderId);
      console.log(`Simulation finished for order ${orderId} - status Delivered`);
      return;
    }

    // Move step closer
    sim.step++;
    const t = sim.step / sim.totalSteps;
    sim.currentLat = sim.startLat + (sim.endLat - sim.startLat) * t;
    sim.currentLng = sim.startLng + (sim.endLng - sim.startLng) * t;

    // Update Rider coordinates in DB
    const dbRider = db.riders.find(r => r.id === riderId);
    if (dbRider) {
      dbRider.currentLat = sim.currentLat;
      dbRider.currentLng = sim.currentLng;
    }

    // Dynamic remaining ETA calculation
    const dbDelivery = db.deliveries.find(d => d.orderId === orderId);
    if (dbDelivery) {
      const remainingTime = Math.max(1, Math.round(25 * (1 - t)));
      dbDelivery.estimatedDeliveryTime = remainingTime.toString();
    }

    // Random dynamic notes in tracking
    if (sim.step === 10) {
      db.deliveryTracking.push({
        id: db.generateId('dt'),
        deliveryId: dbDelivery?.id || '',
        status: 'shipping',
        latitude: sim.currentLat,
        longitude: sim.currentLng,
        timestamp: new Date().toISOString(),
        note: 'Rider picked up packages from the vendor and is route-planning.'
      });
    } else if (sim.step === 25) {
      db.deliveryTracking.push({
        id: db.generateId('dt'),
        deliveryId: dbDelivery?.id || '',
        status: 'out_for_delivery',
        latitude: sim.currentLat,
        longitude: sim.currentLng,
        timestamp: new Date().toISOString(),
        note: 'Rider is approaching your street intersection.'
      });
    }

    db.save();
    activeSimulations.set(orderId, sim);
  }, 1500); // Ticks every 1.5 seconds

  simulation.intervalId = intervalId;
  activeSimulations.set(orderId, simulation);
  console.log(`Rider Simulation started for order ${orderId} by Rider ${riderId}`);
}

// --- AUTHENTICATION ROUTES ---

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const emailTrimmed = email ? email.trim() : '';
  const user = db.users.find(u => u.email.toLowerCase() === emailTrimmed.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'No account associated with this email address' });
  }

  // Simple password check (seeding uses 'pbkdf2_role' or standard passwords)
  const isValid = password === 'password' || user.passwordHash.includes('pbkdf2') || password === 'admin';
  if (!isValid) {
    return res.status(401).json({ message: 'Incorrect password details' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl
    }
  });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const emailTrimmed = email ? email.trim() : '';
  const existing = db.users.find(u => u.email.toLowerCase() === emailTrimmed.toLowerCase());

  if (existing) {
    return res.status(400).json({ message: 'An account is already registered with this email' });
  }

  const userId = db.generateId('usr');
  const newUser: User = {
    id: userId,
    name,
    email: emailTrimmed,
    passwordHash: 'pbkdf2_custom',
    role: role || 'customer',
    phone: phone || '',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // If registering as a vendor, create a vendor profile automatically
  if (role === 'vendor') {
    const storeName = `${name}'s Store`;
    db.vendors.push({
      id: db.generateId('vnd'),
      userId,
      storeName,
      storeLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80',
      storeDescription: 'Welcome to our shop! Enjoy high quality listings.',
      address: 'Phnom Penh Center, Cambodia',
      status: 'pending'
    });
  }

  // If registering as a rider, create a rider profile automatically
  if (role === 'rider') {
    db.riders.push({
      id: db.generateId('rdr'),
      userId,
      vehicleType: 'moto',
      vehiclePlate: 'PP 1AI-' + Math.floor(1000 + Math.random() * 9000),
      status: 'active',
      currentLat: 11.5564,
      currentLng: 104.9282
    });
  }

  db.save();

  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      avatarUrl: newUser.avatarUrl
    }
  });
});

// Switch active user role on-the-fly (for testing current custom sessions)
app.post('/api/auth/switch-role', authenticateToken, (req: any, res) => {
  const { role } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User session not active' });
  }

  // Update active user role in DB
  user.role = role;

  // Auto-generate vendor profile if needed
  if (role === 'vendor') {
    const hasVendor = db.vendors.some(v => v.userId === user.id);
    if (!hasVendor) {
      db.vendors.push({
        id: db.generateId('vnd'),
        userId: user.id,
        storeName: `${user.name}'s Shop`,
        storeLogo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80',
        storeDescription: 'Welcome to our shop! Enjoy high quality listings.',
        address: 'Phnom Penh Center, Cambodia',
        status: 'pending'
      });
    }
  }

  // Auto-generate rider profile if needed
  if (role === 'rider') {
    const hasRider = db.riders.some(r => r.userId === user.id);
    if (!hasRider) {
      db.riders.push({
        id: db.generateId('rdr'),
        userId: user.id,
        vehicleType: 'moto',
        vehiclePlate: 'PP 1AI-' + Math.floor(1000 + Math.random() * 9000),
        status: 'active',
        currentLat: 11.5564,
        currentLng: 104.9282
      });
    }
  }

  db.save();

  // Sign a new token reflecting the upgraded role
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl
    }
  });
});

// Mock Forgot Password
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: 'No account located for that email' });
  }

  res.json({ message: 'Password recovery instructions have been successfully dispatched to your email.' });
});

// Mock Social SSO (Google / Facebook)
app.post('/api/auth/social', (req, res) => {
  const { name, email, avatarUrl, provider } = req.body;
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: db.generateId('usr'),
      name,
      email,
      passwordHash: 'pbkdf2_social',
      role: 'customer',
      phone: '',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    db.save();
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl
    }
  });
});

// Check Logged In Profile
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User profile not found' });
  res.json(user);
});

// --- CUSTOMER PROFILE & ORDER HISTORY ---

// Edit Profile
app.put('/api/profile/update', authenticateToken, (req: any, res) => {
  const { name, phone } = req.body;
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ message: 'User not found' });

  if (name) user.name = name;
  if (phone) user.phone = phone;

  db.save();
  res.json({ message: 'Profile details updated', user });
});

// Upload Avatar
app.post('/api/profile/avatar', authenticateToken, (req: any, res) => {
  const { avatarUrl } = req.body;
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ message: 'User not found' });
  if (avatarUrl) user.avatarUrl = avatarUrl;

  db.save();
  res.json({ message: 'Avatar image updated', avatarUrl });
});

// Order History
app.get('/api/profile/orders', authenticateToken, (req: any, res) => {
  const orders = db.orders.filter(o => o.userId === req.user.id);
  
  // Populate orders with payments, delivery tracking and order items
  const populated = orders.map(order => {
    const items = db.orderItems.filter(oi => oi.orderId === order.id).map(item => {
      const prd = db.products.find(p => p.id === item.productId);
      return { ...item, product: prd };
    });
    const delivery = db.deliveries.find(d => d.orderId === order.id);
    const payment = db.payments.find(p => p.orderId === order.id);
    const vendor = db.vendors.find(v => v.id === order.vendorId);

    let tracking: any[] = [];
    if (delivery) {
      tracking = db.deliveryTracking.filter(dt => dt.deliveryId === delivery.id);
    }

    return {
      ...order,
      items,
      delivery,
      payment,
      vendor,
      tracking
    };
  });

  // Sort descending by date
  populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(populated);
});

// Get Wishlist
app.get('/api/wishlist', authenticateToken, (req: any, res) => {
  const items = db.wishlists.filter(w => w.userId === req.user.id);
  const populated = items.map(w => db.products.find(p => p.id === w.productId)).filter(Boolean);
  res.json(populated);
});

// Toggle Wishlist
app.post('/api/wishlist', authenticateToken, (req: any, res) => {
  const { productId } = req.body;
  const index = db.wishlists.findIndex(w => w.userId === req.user.id && w.productId === productId);

  if (index > -1) {
    db.wishlists.splice(index, 1);
    db.save();
    return res.json({ message: 'Removed from wishlist', wishlisted: false });
  } else {
    db.wishlists.push({
      id: db.generateId('wl'),
      userId: req.user.id,
      productId,
      createdAt: new Date().toISOString()
    });
    db.save();
    return res.json({ message: 'Added to wishlist', wishlisted: true });
  }
});

// Get Notifications
app.get('/api/notifications', authenticateToken, (req: any, res) => {
  const items = db.notifications.filter(n => n.userId === req.user.id);
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(items);
});

// Read Notifications
app.post('/api/notifications/read', authenticateToken, (req: any, res) => {
  const items = db.notifications.filter(n => n.userId === req.user.id);
  items.forEach(n => n.isRead = true);
  db.save();
  res.json({ message: 'Notifications marked read' });
});

// --- PRODUCT CATALOG & SHOPPING API ---

// Products List
app.get('/api/products', (req, res) => {
  const { categoryId, search, featured } = req.query;
  let items = [...db.products];

  if (categoryId) {
    items = items.filter(p => p.categoryId === categoryId);
  }

  if (featured === 'true') {
    items = items.filter(p => p.isFeatured);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    items = items.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  // Populate products with vendor details
  const populated = items.map(p => {
    const vendor = db.vendors.find(v => v.id === p.vendorId);
    const category = db.categories.find(c => c.id === p.categoryId);
    return { ...p, vendor, category };
  });

  res.json(populated);
});

// Product Details
app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product listing not found' });

  const vendor = db.vendors.find(v => v.id === product.vendorId);
  const category = db.categories.find(c => c.id === product.categoryId);
  const reviews = db.reviews.filter(r => r.productId === product.id).map(r => {
    const user = db.users.find(u => u.id === r.userId);
    return {
      ...r,
      user: user ? { name: user.name, avatarUrl: user.avatarUrl } : { name: 'Anonymous' }
    };
  });
  const images = db.productImages.filter(pi => pi.productId === product.id);

  res.json({
    ...product,
    vendor,
    category,
    reviews,
    images
  });
});

// Add Product Review
app.post('/api/products/:id/reviews', authenticateToken, (req: any, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;
  const product = db.products.find(p => p.id === productId);

  if (!product) return res.status(404).json({ message: 'Product listing not found' });

  const newReview: Review = {
    id: db.generateId('rev'),
    userId: req.user.id,
    productId,
    rating: Number(rating) || 5,
    comment: comment || '',
    createdAt: new Date().toISOString()
  };

  db.reviews.push(newReview);

  // Re-calculate product overall rating
  const pReviews = db.reviews.filter(r => r.productId === productId);
  const totalRating = pReviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = parseFloat((totalRating / pReviews.length).toFixed(1));

  db.save();
  res.status(201).json(newReview);
});

// Categories List
app.get('/api/categories', (req, res) => {
  res.json(db.categories);
});

// Coupon Validate
app.get('/api/coupons/validate', (req, res) => {
  const { code, spend } = req.query;
  const coupon = db.coupons.find(c => c.code.toUpperCase() === (code as string).toUpperCase() && c.active);

  if (!coupon) {
    return res.status(400).json({ valid: false, message: 'Invalid or deactivated coupon code' });
  }

  const spendNum = Number(spend) || 0;
  if (spendNum < coupon.minSpend) {
    return res.status(400).json({ valid: false, message: `Minimum spend of $${coupon.minSpend.toFixed(2)} required for this discount.` });
  }

  const expiry = new Date(coupon.expiryDate);
  if (expiry.getTime() < Date.now()) {
    return res.status(400).json({ valid: false, message: 'Coupon code has expired' });
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = parseFloat((spendNum * (coupon.discountValue / 100)).toFixed(2));
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    valid: true,
    code: coupon.code,
    discount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue
  });
});

// --- CART MANAGEMENT ---

// Get Cart
app.get('/api/cart', authenticateToken, (req: any, res) => {
  const items = db.carts.filter(c => c.userId === req.user.id);
  const populated = items.map(c => {
    const product = db.products.find(p => p.id === c.productId);
    return {
      ...c,
      product
    };
  }).filter(c => c.product !== undefined);

  res.json(populated);
});

// Add to Cart
app.post('/api/cart/add', authenticateToken, (req: any, res) => {
  const { productId, quantity } = req.body;
  const existing = db.carts.find(c => c.userId === req.user.id && c.productId === productId);

  const addQty = Number(quantity) || 1;

  if (existing) {
    existing.quantity += addQty;
  } else {
    db.carts.push({
      id: db.generateId('crt'),
      userId: req.user.id,
      productId,
      quantity: addQty
    });
  }

  db.save();
  res.json({ message: 'Cart items updated successfully' });
});

// Update Cart Quantity
app.post('/api/cart/update', authenticateToken, (req: any, res) => {
  const { id, quantity } = req.body;
  const item = db.carts.find(c => c.id === id && c.userId === req.user.id);

  if (!item) return res.status(404).json({ message: 'Cart item not found' });

  item.quantity = Math.max(1, Number(quantity));
  db.save();
  res.json({ message: 'Quantity updated' });
});

// Remove Cart Item
app.delete('/api/cart/remove/:id', authenticateToken, (req: any, res) => {
  const index = db.carts.findIndex(c => c.id === req.params.id && c.userId === req.user.id);
  if (index > -1) {
    db.carts.splice(index, 1);
    db.save();
    res.json({ message: 'Item deleted from cart' });
  } else {
    res.status(404).json({ message: 'Cart item not found' });
  }
});

// --- CHECKOUT & ORDER OPERATIONS ---

// Checkout Order
app.post('/api/orders/checkout', authenticateToken, (req: any, res) => {
  const {
    receiverName,
    receiverPhone,
    receiverEmail,
    deliveryAddress,
    provinceCity,
    districtKhan,
    communeSangkat,
    postalCode,
    latitude,
    longitude,
    couponCode,
    paymentMethod,
    deliveryType,
    deliveryNotes
  } = req.body;

  // Retrieve cart items
  const cartItems = db.carts.filter(c => c.userId === req.user.id);
  if (cartItems.length === 0) {
    return res.status(400).json({ message: 'Shopping cart is empty' });
  }

  // Group cart items by vendor (we will support single checkout, but technically, orders map to vendors)
  // To keep it simple and multi-vendor compliant, let's grab the primary vendor of the first product
  const firstProduct = db.products.find(p => p.id === cartItems[0].productId);
  if (!firstProduct) return res.status(404).json({ message: 'Products in cart no longer exist' });

  const vendorId = firstProduct.vendorId;

  // Calculate order items totals
  let subtotal = 0;
  const itemsToCreate = cartItems.map(item => {
    const product = db.products.find(p => p.id === item.productId);
    if (!product) throw new Error('Product not found');
    subtotal += product.price * item.quantity;
    return {
      id: db.generateId('oi'),
      productId: product.id,
      price: product.price,
      quantity: item.quantity
    };
  });

  // Calculate delivery fee
  // standard zone pricing: Same day -> $2.00, Express -> $3.50, regular default distance pricing
  let deliveryFee = 2.00;
  if (deliveryType === 'express') {
    deliveryFee = 3.50;
  }

  // Discount from coupon
  let discount = 0;
  if (couponCode) {
    const coupon = db.coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
    if (coupon && subtotal >= coupon.minSpend) {
      if (coupon.discountType === 'percentage') {
        discount = parseFloat((subtotal * (coupon.discountValue / 100)).toFixed(2));
      } else {
        discount = coupon.discountValue;
      }
    }
  }

  const finalTotal = parseFloat((subtotal + deliveryFee - discount).toFixed(2));

  // 1. Create the Order
  const orderId = db.generateId('ord');
  const newOrder: Order = {
    id: orderId,
    userId: req.user.id,
    vendorId,
    totalAmount: finalTotal,
    discountAmount: discount,
    deliveryFee,
    couponCode: couponCode || '',
    status: paymentMethod === 'cod' ? 'confirmed' : 'pending', // Online payments are 'pending' until verified
    createdAt: new Date().toISOString()
  };

  db.orders.push(newOrder);

  // 2. Create Order Items
  itemsToCreate.forEach(item => {
    db.orderItems.push({
      ...item,
      orderId
    });

    // Deduct inventory stock!
    const product = db.products.find(p => p.id === item.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  });

  // 3. Create the Delivery Record
  const deliveryId = db.generateId('del');
  const trackingNumber = 'TRK-' + Math.floor(10000000 + Math.random() * 90000000);
  const newDelivery: Delivery = {
    id: deliveryId,
    orderId,
    riderId: null, // assigned later by admin or rider accept
    receiverName,
    receiverPhone,
    receiverEmail,
    deliveryAddress,
    provinceCity,
    districtKhan,
    communeSangkat,
    postalCode: postalCode || '',
    latitude: Number(latitude) || 11.5564,
    longitude: Number(longitude) || 104.9282,
    deliveryStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    deliveryFee,
    estimatedDeliveryTime: '30',
    trackingNumber,
    deliveryNotes: deliveryNotes || ''
  };

  db.deliveries.push(newDelivery);

  // 4. Create the Payment Record
  const paymentId = db.generateId('pay');
  const newPayment: Payment = {
    id: paymentId,
    orderId,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending', // paid upon KHQR scan
    transactionNumber: paymentMethod === 'cod' ? 'COD-PAYMENT' : 'TXN-' + Math.floor(10000 + Math.random() * 90000) + '-PENDING',
    amount: finalTotal,
    createdAt: new Date().toISOString()
  };

  db.payments.push(newPayment);

  // 5. Create Initial Tracking Log
  db.deliveryTracking.push({
    id: db.generateId('dt'),
    deliveryId,
    status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    latitude: Number(latitude) || 11.5564,
    longitude: Number(longitude) || 104.9282,
    timestamp: new Date().toISOString(),
    note: paymentMethod === 'cod' ? 'Order confirmed (Cash on Delivery).' : 'Order created. Awaiting online payment clearance.'
  });

  // 6. Delete Cart items for user
  const otherCarts = db.carts.filter(c => c.userId !== req.user.id);
  db.data.carts = otherCarts;

  // 7. Push system notification
  db.notifications.push({
    id: db.generateId('not'),
    userId: req.user.id,
    title: 'Order Registered successfully! 📦',
    message: `Your order #${orderId.substring(4)} has been registered. Total: $${finalTotal.toFixed(2)}.`,
    type: 'order',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.save();

  res.status(201).json({
    orderId,
    deliveryId,
    paymentId,
    amount: finalTotal,
    paymentMethod
  });
});

// --- PAYMENT INTEGRATION VERIFIER ---

// Verify Scan Payment
app.post('/api/payments/verify', (req, res) => {
  const { orderId, transactionNumber } = req.body;
  const order = db.orders.find(o => o.id === orderId);
  const payment = db.payments.find(p => p.orderId === orderId);
  const delivery = db.deliveries.find(d => d.orderId === orderId);

  if (!order || !payment) return res.status(404).json({ message: 'Order or Payment record not located.' });

  // Update Statuses
  payment.paymentStatus = 'paid';
  payment.transactionNumber = transactionNumber || 'TXN-' + Math.floor(10000 + Math.random() * 90000) + '-PAID';
  
  order.status = 'confirmed';
  if (delivery) {
    delivery.deliveryStatus = 'confirmed';
    
    // Add tracking point
    db.deliveryTracking.push({
      id: db.generateId('dt'),
      deliveryId: delivery.id,
      status: 'confirmed',
      latitude: delivery.latitude,
      longitude: delivery.longitude,
      timestamp: new Date().toISOString(),
      note: 'Payment successfully cleared. Order queued for Packing & Shipping.'
    });
  }

  // Push notification
  db.notifications.push({
    id: db.generateId('not'),
    userId: order.userId,
    title: 'Payment Cleared! 💳',
    message: `Payment of $${order.totalAmount.toFixed(2)} was successfully processed for Order #${orderId.substring(4)}.`,
    type: 'payment',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.save();
  res.json({ message: 'Payment successfully captured and verified.', paymentStatus: 'paid' });
});

// Refund Payment
app.post('/api/payments/refund', authenticateToken, requireRole(['admin']), (req, res) => {
  const { orderId } = req.body;
  const order = db.orders.find(o => o.id === orderId);
  const payment = db.payments.find(p => p.orderId === orderId);
  const delivery = db.deliveries.find(d => d.orderId === orderId);

  if (!order || !payment) return res.status(404).json({ message: 'Records not found' });

  payment.paymentStatus = 'refunded';
  order.status = 'returned';
  if (delivery) delivery.deliveryStatus = 'returned';

  db.notifications.push({
    id: db.generateId('not'),
    userId: order.userId,
    title: 'Refund Dispatched 💸',
    message: `A full refund of $${order.totalAmount.toFixed(2)} has been credited back to your account for Order #${orderId.substring(4)}.`,
    type: 'payment',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.save();
  res.json({ message: 'Refund processed successfully', order });
});

// --- RIDER / DRIVER APP ENDPOINTS ---

// Get active deliveries/requests for riders
app.get('/api/rider/orders', authenticateToken, requireRole(['rider']), (req: any, res) => {
  // Find rider profile
  const rider = db.riders.find(r => r.userId === req.user.id);
  if (!rider) return res.status(404).json({ message: 'Rider registration details not found.' });

  // Return deliveries that are pending assignment (confirmed or packing)
  // or deliveries assigned to this rider
  const assigned = db.deliveries.filter(d => d.riderId === rider.id);
  const pool = db.deliveries.filter(d => d.riderId === null && ['confirmed', 'packing'].includes(d.deliveryStatus));

  // Populate products and details
  const mapDelivery = (d: Delivery) => {
    const order = db.orders.find(o => o.id === d.orderId);
    const vendor = order ? db.vendors.find(v => v.id === order.vendorId) : null;
    const items = db.orderItems.filter(oi => oi.orderId === d.orderId).map(oi => {
      const p = db.products.find(prd => prd.id === oi.productId);
      return { ...oi, product: p };
    });
    return { ...d, order, vendor, items };
  };

  res.json({
    assigned: assigned.map(mapDelivery),
    availablePool: pool.map(mapDelivery)
  });
});

// Rider accept delivery request
app.post('/api/rider/orders/:id/accept', authenticateToken, requireRole(['rider']), (req: any, res) => {
  const deliveryId = req.params.id;
  const rider = db.riders.find(r => r.userId === req.user.id);
  const delivery = db.deliveries.find(d => d.id === deliveryId);

  if (!rider) return res.status(404).json({ message: 'Rider details not found' });
  if (!delivery) return res.status(404).json({ message: 'Delivery assignment request not found' });

  if (delivery.riderId !== null) {
    return res.status(400).json({ message: 'This trip request has already been claimed by another rider.' });
  }

  // Update Rider & Delivery status
  rider.status = 'busy';
  delivery.riderId = rider.id;
  delivery.deliveryStatus = 'packing';

  const order = db.orders.find(o => o.id === delivery.orderId);
  if (order) order.status = 'packing';

  // Add tracking dot
  db.deliveryTracking.push({
    id: db.generateId('dt'),
    deliveryId,
    status: 'packing',
    latitude: rider.currentLat,
    longitude: rider.currentLng,
    timestamp: new Date().toISOString(),
    note: `Rider ${rider.vehicleType.toUpperCase()} (${rider.vehiclePlate}) is assigned and driving to vendor for pickup.`
  });

  db.notifications.push({
    id: db.generateId('not'),
    userId: order?.userId || '',
    title: 'Rider Assigned! 🛵',
    message: `Rider ${req.user.name} has accepted your order request and is route-planning.`,
    type: 'delivery',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.save();
  res.json({ message: 'Trip successfully accepted.', delivery });
});

// Rider update status
app.post('/api/rider/orders/:id/update-status', authenticateToken, requireRole(['rider']), (req: any, res) => {
  const deliveryId = req.params.id;
  const { status } = req.body; // 'shipping', 'out_for_delivery', 'delivered', 'failed'
  const rider = db.riders.find(r => r.userId === req.user.id);
  const delivery = db.deliveries.find(d => d.id === deliveryId);

  if (!rider || !delivery) return res.status(404).json({ message: 'Delivery or Rider records not located.' });

  delivery.deliveryStatus = status;
  const order = db.orders.find(o => o.id === delivery.orderId);
  if (order) order.status = status;

  let trackingNote = `Status updated to ${status}.`;
  if (status === 'shipping') {
    trackingNote = 'Packages processed. Transit to final destination initiated.';
  } else if (status === 'out_for_delivery') {
    trackingNote = 'Rider is carrying items and starting GPS navigation path.';
    // Start active real-time movement simulation on the server!
    startRiderSimulation(delivery.orderId, rider.id);
  } else if (status === 'delivered') {
    trackingNote = 'Items successfully handed over to receiver.';
    rider.status = 'active';
  } else if (status === 'failed') {
    trackingNote = 'Delivery failed. Receiver unreachable / bad address coordinates.';
    rider.status = 'active';
  }

  // Add tracking point
  db.deliveryTracking.push({
    id: db.generateId('dt'),
    deliveryId,
    status,
    latitude: rider.currentLat,
    longitude: rider.currentLng,
    timestamp: new Date().toISOString(),
    note: trackingNote
  });

  db.notifications.push({
    id: db.generateId('not'),
    userId: order?.userId || '',
    title: `Order Status: ${status.replace('_', ' ').toUpperCase()} 🚀`,
    message: `Your package status is updated to "${status.replace('_', ' ')}" - Note: ${trackingNote}`,
    type: 'delivery',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.save();
  res.json({ message: 'Delivery details updated.', delivery });
});

// --- VENDOR STOREFRONT PORTAL ENDPOINTS ---

// Vendor Dashboard details
app.get('/api/vendor/dashboard', authenticateToken, requireRole(['vendor']), (req: any, res) => {
  const vendor = db.vendors.find(v => v.userId === req.user.id);
  if (!vendor) return res.status(404).json({ message: 'Vendor store details not found.' });

  const products = db.products.filter(p => p.vendorId === vendor.id);
  const pIds = products.map(p => p.id);

  // Find orders containing this vendor's items
  const orders = db.orders.filter(order => {
    const items = db.orderItems.filter(oi => oi.orderId === order.id);
    return items.some(item => pIds.includes(item.productId));
  }).map(order => {
    const items = db.orderItems.filter(oi => oi.orderId === order.id && pIds.includes(oi.productId)).map(oi => {
      const p = db.products.find(prd => prd.id === oi.productId);
      return { ...oi, product: p };
    });
    return { ...order, items };
  });

  const totalEarnings = orders.reduce((sum, o) => {
    const isPaid = db.payments.find(p => p.orderId === o.id && p.paymentStatus === 'paid');
    return sum + (isPaid ? o.totalAmount - o.deliveryFee : 0);
  }, 0);

  const pendingPreps = orders.filter(o => o.status === 'confirmed').length;

  res.json({
    metrics: {
      totalEarnings,
      pendingPreps
    },
    products,
    orders,
    vendor
  });
});

// Vendor mark order package prepared
app.post('/api/vendor/orders/:id/prepare', authenticateToken, requireRole(['vendor']), (req, res) => {
  const orderId = req.params.id;
  const order = db.orders.find(o => o.id === orderId);
  const delivery = db.deliveries.find(d => d.orderId === orderId);

  if (!order) return res.status(404).json({ message: 'Order invoice not located.' });

  order.status = 'packing';
  if (delivery) {
    delivery.deliveryStatus = 'packing';

    db.deliveryTracking.push({
      id: db.generateId('dt'),
      deliveryId: delivery.id,
      status: 'packing',
      latitude: delivery.latitude,
      longitude: delivery.longitude,
      timestamp: new Date().toISOString(),
      note: 'Merchant has prepared your order! Package transferred to SlickCart Courier hub.'
    });
  }

  db.notifications.push({
    id: db.generateId('not'),
    userId: order.userId,
    title: 'Order Prepared! 🍔',
    message: `Your package for Order #${orderId.substring(4)} has been prepared and packed. Dispatch is pending.`,
    type: 'order',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.save();
  res.json({ message: 'Order successfully marked as prepared and packing.' });
});

// --- ADMIN DISPATCH CONSOLE ENDPOINTS ---

// Unified Admin Dashboard
app.get('/api/admin/dashboard', authenticateToken, requireRole(['admin']), (req, res) => {
  const orders = db.orders.map(order => {
    const items = db.orderItems.filter(oi => oi.orderId === order.id).map(item => {
      const prd = db.products.find(p => p.id === item.productId);
      return { ...item, product: prd };
    });
    const delivery = db.deliveries.find(d => d.orderId === order.id);
    const payment = db.payments.find(p => p.orderId === order.id);
    return { ...order, items, delivery, payment };
  });

  const riders = db.riders.map(r => {
    const u = db.users.find(usr => usr.id === r.userId);
    return {
      id: r.id,
      name: u?.name || 'Rider',
      avatarUrl: u?.avatarUrl,
      phone: u?.phone,
      vehiclePlate: r.vehiclePlate,
      vehicleType: r.vehicleType,
      isAvailable: r.status === 'active',
      latitude: r.currentLat,
      longitude: r.currentLng
    };
  });

  const grossSales = db.payments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const userCount = db.users.length;

  res.json({
    metrics: {
      grossSales,
      userCount
    },
    orders,
    riders
  });
});

// Unified manual dispatch assignment
app.post('/api/admin/orders/:id/assign', authenticateToken, requireRole(['admin']), (req, res) => {
  const { riderId } = req.body;
  const orderId = req.params.id;
  const delivery = db.deliveries.find(d => d.orderId === orderId);
  const rider = db.riders.find(r => r.id === riderId);

  if (!delivery) return res.status(404).json({ message: 'Delivery record not found.' });
  if (!rider) return res.status(404).json({ message: 'Courier not located.' });

  delivery.riderId = rider.id;
  delivery.deliveryStatus = 'packing';
  rider.status = 'busy';

  const order = db.orders.find(o => o.id === orderId);
  if (order) order.status = 'packing';

  db.deliveryTracking.push({
    id: db.generateId('dt'),
    deliveryId: delivery.id,
    status: 'packing',
    latitude: rider.currentLat,
    longitude: rider.currentLng,
    timestamp: new Date().toISOString(),
    note: `Courier ${rider.vehiclePlate} has been assigned to your order by administration.`
  });

  db.notifications.push({
    id: db.generateId('not'),
    userId: order?.userId || '',
    title: 'Courier Dispatched! 🛵',
    message: `Rider ${rider.vehiclePlate} is prepping for delivery.`,
    type: 'delivery',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  db.save();
  res.json({ message: 'Courier successfully assigned.' });
});

// --- ADMIN DASHBOARD ENDPOINTS ---


// Admin analytics dashboard aggregation
app.get('/api/admin/analytics', authenticateToken, requireRole(['admin']), (req, res) => {
  const orders = db.orders;
  const payments = db.payments;
  const users = db.users;
  const vendors = db.vendors;
  const products = db.products;
  const riders = db.riders;

  // 1. Core KPIs
  const totalRevenue = payments.filter(p => p.paymentStatus === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalOrdersCount = orders.length;
  const successDeliveries = orders.filter(o => o.status === 'delivered').length;
  const activeUsersCount = users.length;

  // 2. Revenue Curve by date (weekly breakdown)
  const salesByDateMap = new Map<string, number>();
  orders.forEach(o => {
    const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const paidAmount = payments.find(p => p.orderId === o.id && p.paymentStatus === 'paid')?.amount || 0;
    salesByDateMap.set(dateStr, (salesByDateMap.get(dateStr) || 0) + paidAmount);
  });
  
  const salesHistory = Array.from(salesByDateMap.entries()).map(([date, revenue]) => ({
    date,
    revenue: parseFloat(revenue.toFixed(2))
  })).slice(-7); // Keep last 7 active days

  // 3. Category distribution (products in each category)
  const categoryChart = db.categories.map(cat => {
    const count = products.filter(p => p.categoryId === cat.id).length;
    return {
      name: cat.name,
      value: count
    };
  });

  // 4. Rider Status count
  const activeRiders = riders.filter(r => r.status === 'active').length;
  const busyRiders = riders.filter(r => r.status === 'busy').length;
  const offlineRiders = riders.filter(r => r.status === 'offline').length;

  // 5. Vendor Shares
  const vendorShares = vendors.map(v => {
    const vendorOrders = orders.filter(o => o.vendorId === v.id);
    const vendorSales = vendorOrders.reduce((sum, o) => {
      const isPaid = payments.find(p => p.orderId === o.id && p.paymentStatus === 'paid');
      return sum + (isPaid ? o.totalAmount - o.deliveryFee : 0);
    }, 0);

    return {
      storeName: v.storeName,
      sales: parseFloat(vendorSales.toFixed(2)),
      orders: vendorOrders.length
    };
  });

  res.json({
    kpis: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalOrdersCount,
      successDeliveries,
      activeUsersCount,
      vendorCount: vendors.length,
      riderCount: riders.length,
      productCount: products.length
    },
    salesHistory,
    categoryChart,
    riderStatus: { active: activeRiders, busy: busyRiders, offline: offlineRiders },
    vendorShares
  });
});

// Admin Users Manager
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json(db.users);
});

// Admin Update User Role
app.post('/api/admin/users/:id/role', authenticateToken, requireRole(['admin']), (req, res) => {
  const { role } = req.body;
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = role;
  db.save();
  res.json({ message: 'User role changed successfully', user });
});

// Admin Vendors Manager
app.get('/api/admin/vendors', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json(db.vendors.map(v => {
    const owner = db.users.find(u => u.id === v.userId);
    return { ...v, ownerName: owner?.name, ownerEmail: owner?.email };
  }));
});

// Admin Update Vendor Status
app.post('/api/admin/vendors/:id/status', authenticateToken, requireRole(['admin']), (req, res) => {
  const { status } = req.body;
  const vendor = db.vendors.find(v => v.id === req.params.id);

  if (!vendor) return res.status(404).json({ message: 'Vendor store not found' });
  vendor.status = status;
  db.save();
  res.json({ message: 'Vendor store status updated', vendor });
});

// Admin Riders List
app.get('/api/admin/riders', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json(db.riders.map(r => {
    const user = db.users.find(u => u.id === r.userId);
    return { ...r, name: user?.name, avatarUrl: user?.avatarUrl, phone: user?.phone };
  }));
});

// Admin Assign Rider to Order
app.post('/api/admin/orders/:orderId/assign-rider', authenticateToken, requireRole(['admin']), (req, res) => {
  const { riderId } = req.body;
  const orderId = req.params.orderId;
  const delivery = db.deliveries.find(d => d.orderId === orderId);
  const rider = db.riders.find(r => r.id === riderId);

  if (!delivery) return res.status(404).json({ message: 'Delivery invoice not found for this order.' });
  if (!rider) return res.status(404).json({ message: 'Rider details not found.' });

  delivery.riderId = rider.id;
  delivery.deliveryStatus = 'packing';
  rider.status = 'busy';

  const order = db.orders.find(o => o.id === orderId);
  if (order) order.status = 'packing';

  db.deliveryTracking.push({
    id: db.generateId('dt'),
    deliveryId: delivery.id,
    status: 'packing',
    latitude: rider.currentLat,
    longitude: rider.currentLng,
    timestamp: new Date().toISOString(),
    note: `Rider ${rider.vehicleType.toUpperCase()} assigned directly by Sovereign Administration.`
  });

  db.save();
  res.json({ message: 'Rider successfully assigned to order delivery.' });
});

// Admin/Vendor Product CRUD (Add Product)
app.post('/api/products', authenticateToken, requireRole(['admin', 'vendor']), (req: any, res) => {
  const { name, description, price, compareAtPrice, stock, categoryId, imageUrl, vendorId } = req.body;
  
  // Find vendor profile associated with this user
  const vendor = db.vendors.find(v => v.userId === req.user.id);
  const activeVendorId = vendorId || (vendor ? vendor.id : 'vnd_1');

  const newProduct: Product = {
    id: db.generateId('prd'),
    vendorId: activeVendorId,
    categoryId,
    name,
    description,
    price: Number(price),
    compareAtPrice: Number(compareAtPrice) || Number(price),
    stock: Number(stock),
    rating: 5.0,
    isFeatured: false,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  db.save();
  res.status(201).json(newProduct);
});

app.post('/api/admin/products', authenticateToken, requireRole(['admin', 'vendor']), (req, res) => {
  const { name, description, price, compareAtPrice, stock, categoryId, imageUrl, vendorId } = req.body;
  
  const newProduct: Product = {
    id: db.generateId('prd'),
    vendorId: vendorId || 'vnd_1',
    categoryId,
    name,
    description,
    price: Number(price),
    compareAtPrice: Number(compareAtPrice) || 0,
    stock: Number(stock),
    rating: 5.0,
    isFeatured: false,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    createdAt: new Date().toISOString()
  };

  db.products.push(newProduct);
  db.save();
  res.status(201).json(newProduct);
});

// Admin/Vendor Product Delete
app.delete('/api/products/:id', authenticateToken, requireRole(['admin', 'vendor']), (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx > -1) {
    db.products.splice(idx, 1);
    db.save();
    res.json({ message: 'Product listing deleted' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

app.delete('/api/admin/products/:id', authenticateToken, requireRole(['admin', 'vendor']), (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx > -1) {
    db.products.splice(idx, 1);
    db.save();
    res.json({ message: 'Product listing deleted' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});


// Admin Orders/Deliveries List
app.get('/api/admin/orders', authenticateToken, requireRole(['admin']), (req, res) => {
  const populated = db.orders.map(order => {
    const items = db.orderItems.filter(oi => oi.orderId === order.id).map(item => {
      const prd = db.products.find(p => p.id === item.productId);
      return { ...item, product: prd };
    });
    const delivery = db.deliveries.find(d => d.orderId === order.id);
    const payment = db.payments.find(p => p.orderId === order.id);
    const vendor = db.vendors.find(v => v.id === order.vendorId);
    const customer = db.users.find(u => u.id === order.userId);
    
    let rider = null;
    if (delivery && delivery.riderId) {
      const r = db.riders.find(riderObj => riderObj.id === delivery.riderId);
      if (r) {
        const u = db.users.find(usrObj => usrObj.id === r.userId);
        rider = { ...r, name: u?.name };
      }
    }

    return {
      ...order,
      items,
      delivery,
      payment,
      vendor,
      customer,
      rider
    };
  });
  
  populated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(populated);
});

// --- SERVER-SENT EVENTS (SSE) FOR LIVE ORDER TRACKING ---

app.get('/api/tracking/stream/:orderId', (req, res) => {
  const { orderId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  console.log(`Client subscribed to SSE tracking for order: ${orderId}`);

  // Send initial message
  res.write(`data: ${JSON.stringify({ type: 'connected', orderId })}\n\n`);

  // Setup interval to push current simulator coordinates to client
  const streamInterval = setInterval(() => {
    const sim = activeSimulations.get(orderId);
    const delivery = db.deliveries.find(d => d.orderId === orderId);
    const order = db.orders.find(o => o.id === orderId);
    
    // Find active rider coordinate
    let riderLat = delivery?.latitude || 11.5564;
    let riderLng = delivery?.longitude || 104.9282;
    let eta = delivery?.estimatedDeliveryTime || '30';
    let status = delivery?.deliveryStatus || 'pending';

    if (sim) {
      riderLat = sim.currentLat;
      riderLng = sim.currentLng;
      status = sim.status;
    }

    let riderObj = null;
    if (delivery && delivery.riderId) {
      const r = db.riders.find(rd => rd.id === delivery.riderId);
      if (r) {
        const u = db.users.find(usr => usr.id === r.userId);
        riderObj = {
          name: u?.name,
          phone: u?.phone,
          avatarUrl: u?.avatarUrl,
          vehiclePlate: r.vehiclePlate,
          vehicleType: r.vehicleType
        };
      }
    }

    const payload = {
      type: 'update',
      orderId,
      status,
      eta,
      latitude: riderLat,
      longitude: riderLng,
      rider: riderObj,
      customerLat: delivery?.latitude,
      customerLng: delivery?.longitude
    };

    res.write(`data: ${JSON.stringify(payload)}\n\n`);

    // If delivery is closed, terminate client stream
    if (delivery && ['delivered', 'failed', 'returned', 'cancelled'].includes(delivery.deliveryStatus) && !sim) {
      res.write(`data: ${JSON.stringify({ type: 'completed', status: delivery.deliveryStatus })}\n\n`);
      clearInterval(streamInterval);
      res.end();
    }
  }, 1000); // SSE pushes every 1 second

  req.on('close', () => {
    console.log(`SSE connection closed for order: ${orderId}`);
    clearInterval(streamInterval);
  });
});

// --- SHUTDOWN CLEANUP ---
process.on('SIGINT', () => {
  // Clear any open intervals
  activeSimulations.forEach(sim => {
    if (sim.intervalId) clearInterval(sim.intervalId);
  });
  console.log('Shutting down API server safely.');
  process.exit();
});

// --- RUN THE APPLICATION ---
db.connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(` Dom Store backend operational on PORT ${PORT}`);
      console.log(` Connected to MongoDB successfully.`);
      console.log(` Real-time GPS Tracker simulation armed.`);
      console.log(`========================================`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB, falling back to local file DB.', err);
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(` Dom Store backend operational on PORT ${PORT}`);
      console.log(` Connected to fallback local database.`);
      console.log(` Real-time GPS Tracker simulation armed.`);
      console.log(`========================================`);
    });
  });
