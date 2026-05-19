import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
    vendorId: string;
  };
}

export interface Coupon {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  appliedCoupon: Coupon | null;
  couponError: string | null;
  deliveryType: 'standard' | 'express';
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  applyCouponCode: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setDeliveryType: (type: 'standard' | 'express') => void;
  clearCartState: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [deliveryType, setDeliveryState] = useState<'standard' | 'express'>('standard');

  const fetchCart = async () => {
    if (!token || user?.role !== 'customer') return;
    setLoading(true);
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'customer') {
      fetchCart();
    } else {
      setCart([]);
      setAppliedCoupon(null);
    }
  }, [token, user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!token) throw new Error('Authentication required to shop');
    
    // Add cart pop visual trigger on badge
    const badge = document.getElementById('cart-icon-badge');
    if (badge) {
      badge.classList.remove('badge-pop');
      void badge.offsetWidth; // Trigger reflow
      badge.classList.add('badge-pop');
    }

    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity })
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Could not update cart');
    }

    await fetchCart();
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!token) return;
    
    // Optimistic state update
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));

    const res = await fetch('/api/cart/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ id, quantity })
    });

    if (!res.ok) {
      fetchCart(); // Rollback if error
    }
  };

  const removeFromCart = async (id: string) => {
    if (!token) return;

    // Optimistic remove
    setCart(prev => prev.filter(item => item.id !== id));

    const res = await fetch(`/api/cart/remove/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      fetchCart(); // Rollback if error
    }
  };

  const applyCouponCode = async (code: string): Promise<boolean> => {
    if (!token) return false;
    setCouponError(null);

    try {
      const res = await fetch(`/api/coupons/validate?code=${code}&spend=${subtotal}`);
      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.message || 'Coupon invalid');
        setAppliedCoupon(null);
        return false;
      }

      setAppliedCoupon({
        code: data.code,
        discount: data.discount,
        discountType: data.discountType,
        discountValue: data.discountValue
      });
      return true;
    } catch (err) {
      setCouponError('Error processing coupon verification');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const setDeliveryType = (type: 'standard' | 'express') => {
    setDeliveryState(type);
  };

  const clearCartState = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponError(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  
  const deliveryFee = subtotal === 0 ? 0 : (deliveryType === 'express' ? 3.50 : 2.00);

  let discount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = parseFloat((subtotal * (appliedCoupon.discountValue / 100)).toFixed(2));
    } else {
      discount = Math.min(subtotal, appliedCoupon.discountValue);
    }
  }

  const total = parseFloat(Math.max(0, subtotal + deliveryFee - discount).toFixed(2));

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      appliedCoupon,
      couponError,
      deliveryType,
      subtotal,
      discount,
      deliveryFee,
      total,
      fetchCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      applyCouponCode,
      removeCoupon,
      setDeliveryType,
      clearCartState
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
