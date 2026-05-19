import React, { useEffect, useState } from 'react';
import { Star, ShoppingCart, ArrowLeft, RefreshCw, Send, ShieldCheck, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface ProductDetailProps {
  productId: string;
  onBack: () => void;
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  productId,
  onBack,
  onAlert
}) => {
  const { addToCart } = useCart();
  const { token, user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  // Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadProductDetails = () => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error('Listing not located');
        return res.json();
      })
      .then(data => setProduct(data))
      .catch(err => {
        onAlert('Could not locate product details', 'error');
        onBack();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!token) {
      onAlert('Please sign in to add items to your cart.', 'error');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, qty);
      onAlert(`Successfully added ${qty}x "${product.name}" to cart!`, 'success');
    } catch (err: any) {
      onAlert(err.message || 'Add to cart failed', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onAlert('Please login to leave product ratings and comments.', 'error');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });

      if (res.ok) {
        onAlert('Thank you! Your product review has been successfully submitted.', 'success');
        setReviewComment('');
        // Reload details to refresh scores
        loadProductDetails();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Could not post review');
      }
    } catch (err: any) {
      onAlert(err.message || 'Review post failed', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Retrieving product catalog specs...</span>
      </div>
    );
  }

  const discountPercent = product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      {/* 1. Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors mb-6 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </button>

      {/* 2. Main Product Info Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        
        {/* Left Column: Image Canvas */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm aspect-[4/3] flex items-center justify-center p-4">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="max-h-[360px] max-w-full object-contain rounded-2xl hover:scale-102 transition-transform duration-300"
          />
          {discountPercent > 0 && (
            <span className="absolute top-4 left-4 bg-rose-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md">
              PROMO -{discountPercent}%
            </span>
          )}
        </div>

        {/* Right Column: Spec and Action Form */}
        <div className="flex flex-col gap-5 justify-center">
          <div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1 rounded-full border border-emerald-500/20">
              🏪 Storefront: {product.vendor?.storeName || 'Sleek Merchant'}
            </span>
            
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-800 dark:text-white mt-3.5 mb-1.5 leading-tight">
              {product.name}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-3.5 h-3.5 ${star <= Math.round(product.rating) ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-800'}`} 
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">|</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {product.reviews?.length || 0} customer reviews
              </span>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-4">
            {product.description}
          </p>

          {/* Pricing Box */}
          <div className="flex items-baseline gap-2 pt-2">
            <span className="font-display font-extrabold text-2xl text-slate-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice > product.price && (
              <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Quantifier and Cart Submits */}
          <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-2xl p-1 bg-white/40 dark:bg-slate-900/40">
              <button 
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
              >
                -
              </button>
              <span className="w-10 text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                {qty}
              </span>
              <button 
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className="flex-grow btn-premium py-2.8 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding to Cart...' : 'Add to Shopping Cart'}
            </button>
          </div>

          {/* Extra delivery tags */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold mt-2">
            <span className="flex items-center gap-1">🚀 Fast Same-Day Zone Delivery</span>
            <span>•</span>
            <span className="flex items-center gap-1">🛡️ Secured Payment Verification</span>
          </div>

        </div>
      </div>

      {/* 3. Product Reviews & Ratings Feed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-slate-200 dark:border-slate-800/80 pt-10">
        
        {/* Left Sub-Column: Add Review Form */}
        <div className="md:col-span-1">
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm sticky top-24">
            <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mb-4">
              Write Product Review
            </h3>

            {token ? (
              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                {/* Star Score Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Review Score</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-amber-400 hover:scale-110 active:scale-90 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-200 dark:text-slate-800'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Comment</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Share details of your experience with this item..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full btn-premium-accent py-2 rounded-xl text-xs font-bold shadow-md shadow-violet-500/10 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 p-4">
                <span className="text-2xl">🔒</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2">
                  Review Submission Restricted
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  You must be registered and logged into an active session to leave ratings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sub-Column: Historic Reviews List */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mb-2">
            Verified Customer Reviews ({product.reviews?.length || 0})
          </h3>

          {product.reviews?.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-8 text-center shadow-sm">
              <span className="text-3xl">⭐</span>
              <p className="text-xs font-bold text-slate-500 mt-2">No Reviews Posted Yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Be the very first customer to write a review for this listing.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {product.reviews.map((rev: any) => (
                <div 
                  key={rev.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={rev.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'} 
                        alt={rev.user?.name} 
                        className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-500/10"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rev.user?.name}</h4>
                        <p className="text-[9px] text-slate-400 leading-none mt-0.5">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-400 bg-amber-500/5 dark:bg-amber-400/5 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {rev.rating}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10.5">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
