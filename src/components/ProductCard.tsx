import React, { useState } from 'react';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    compareAtPrice: number;
    rating: number;
    imageUrl: string;
    vendor?: { storeName: string };
  };
  onNavigateToDetail: (id: string) => void;
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigateToDetail,
  onAlert
}) => {
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  const calculateDiscount = () => {
    if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
    const diff = product.compareAtPrice - product.price;
    return Math.round((diff / product.compareAtPrice) * 100);
  };

  const discount = calculateDiscount();

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      onAlert('Please sign in to add items to your shopping cart.', 'error');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      onAlert(`"${product.name}" added to cart successfully!`, 'success');
    } catch (err: any) {
      onAlert(err.message || 'Could not add to cart', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      onAlert('Please sign in to manage your wishlist.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      });
      const data = await res.json();
      if (res.ok) {
        setWishlisted(data.wishlisted);
        onAlert(data.message, 'success');
      }
    } catch (err) {
      onAlert('Could not update wishlist', 'error');
    }
  };

  return (
    <div 
      onClick={() => onNavigateToDetail(product.id)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500/20 dark:hover:border-emerald-500/20 transition-all duration-300 cursor-pointer flex flex-col glow-card active:scale-[0.99]"
    >
      {/* Visual Badges (Discount, Wishlist) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {discount > 0 && (
          <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
            SAVE {discount}%
          </span>
        )}
      </div>

      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 p-2 rounded-full glass hover:bg-white dark:hover:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
        aria-label="Save to Wishlist"
      >
        <Heart className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
      </button>

      {/* Card Image Cover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        <img 
          src={product.imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info Container */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Vendor and ratings line */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1">
          <span className="truncate max-w-[120px]">
            🏪 {product.vendor?.storeName || 'Sleek Vendor'}
          </span>
          <span className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-[9px]">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        {/* Product title */}
        <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors line-clamp-1 mb-1">
          {product.name}
        </h3>

        {/* Brief description snippet */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>

        {/* Price and Cart button line */}
        <div className="mt-auto flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-extrabold text-base text-slate-900 dark:text-slate-50">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice > product.price && (
                <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={adding}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-300 shadow-sm active:scale-95 disabled:opacity-50"
            aria-label="Add product to cart"
          >
            <ShoppingCart className={`w-4 h-4 ${adding ? 'animate-pulse' : ''}`} />
          </button>
        </div>

      </div>
    </div>
  );
};
