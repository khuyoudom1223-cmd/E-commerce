import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Trash2, ShoppingCart, Percent, AlertCircle, Sparkles, Navigation, ArrowRight, ArrowLeft } from 'lucide-react';

interface CartProps {
  onNavigate: (view: string) => void;
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const Cart: React.FC<CartProps> = ({ onNavigate, onAlert }) => {
  const { token } = useAuth();
  const {
    cart,
    loading,
    subtotal,
    discount,
    deliveryFee,
    total,
    appliedCoupon,
    couponError,
    deliveryType,
    updateQuantity,
    removeFromCart,
    applyCouponCode,
    removeCoupon,
    setDeliveryType
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setSubmittingCoupon(true);
    const success = await applyCouponCode(couponInput);
    setSubmittingCoupon(false);
    if (success) {
      onAlert(`Promo Code "${couponInput.toUpperCase()}" successfully applied!`, 'success');
      setCouponInput('');
    } else {
      onAlert('Invalid coupon code details.', 'error');
    }
  };

  const handleCheckoutRedirect = () => {
    if (cart.length === 0) {
      onAlert('Your shopping cart is empty.', 'error');
      return;
    }
    onNavigate('checkout');
  };

  if (loading && cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-semibold">Syncing cart items...</span>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-5.5 h-5.5 text-emerald-500" />
            Shopping Cart Bag
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Review your items and proceed with payment processing
          </p>
        </div>
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs font-bold text-slate-500 hover:text-emerald-500 flex items-center gap-1 hover:underline transition-colors active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
        </button>
      </div>

      {cart.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center border border-slate-200/50 dark:border-slate-800/60 shadow-sm max-w-md mx-auto mt-6">
          <span className="text-4xl">🛒</span>
          <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mt-4">Your Cart Bag is Empty</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Browse our multi-vendor catalog and add custom electronics, apparel or groceries to your checklist!
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="btn-premium px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 mt-5 active:scale-95"
          >
            Explore Marketplace Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Items List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.map((item) => (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-3xl p-4 shadow-sm flex items-center gap-4 group"
              >
                {/* Product thumbnail */}
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40 shrink-0 flex items-center justify-center p-2">
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name} 
                    className="max-h-full max-w-full object-contain rounded"
                  />
                </div>

                {/* Details */}
                <div className="flex-grow flex flex-col min-w-0">
                  <h3 className="font-display font-bold text-xs md:text-sm text-slate-800 dark:text-slate-200 line-clamp-1 leading-snug">
                    {item.product.name}
                  </h3>
                  
                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">${item.product.price.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 leading-none">
                      x{item.quantity} = ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Quantifier Adjuster */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-0.5 bg-slate-50/50 dark:bg-slate-950/50">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-[10px] font-bold text-slate-800 dark:text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      aria-label="Remove item from shopping bag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Right Column: Order Pricing Summary aggregates */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Delivery option card */}
            <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
              <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Navigation className="w-4 h-4 text-emerald-500 animate-pulse-subtle" />
                Delivery Options
              </h3>
              
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryType('standard')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                    deliveryType === 'standard'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">Standard Zone Delivery</p>
                    <p className="text-[10px] text-slate-400 font-medium">Same day logistics. Zone flat fee.</p>
                  </div>
                  <span>$2.00</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('express')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                    deliveryType === 'express'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100/50'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">Express Delivery</p>
                    <p className="text-[10px] text-slate-400 font-medium">Urgent dispatch. Under 30 minutes.</p>
                  </div>
                  <span>$3.50</span>
                </button>
              </div>
            </div>

            {/* Coupons Card */}
            <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
              <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Percent className="w-4 h-4 text-emerald-500" />
                Apply Promotional Coupon
              </h3>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    Promo Code: <b>{appliedCoupon.code}</b> (-${discount.toFixed(2)})
                  </span>
                  <button 
                    onClick={removeCoupon}
                    className="text-[10px] font-extrabold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded shadow-sm active:scale-90 transition-transform"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter SLEEK10 or FREEFEES"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all uppercase placeholder:normal-case font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={submittingCoupon}
                    className="btn-premium px-4 py-2 rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </form>
              )}

              {couponError && (
                <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-bold mt-2 pl-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Price breakdown and checkout click */}
            <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col gap-3">
              <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mb-2">
                Order Sum Total
              </h3>

              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>Subtotal Items</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Coupon Discount</span>
                  <span className="font-semibold">-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>Logistic Delivery Fee</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">${deliveryFee.toFixed(2)}</span>
              </div>

              <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80 my-1" />

              <div className="flex justify-between items-baseline mb-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-white">Net Total Due</span>
                <span className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                  ${total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckoutRedirect}
                className="w-full btn-premium py-3 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95 transition-all mt-1"
              >
                Proceed To Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
