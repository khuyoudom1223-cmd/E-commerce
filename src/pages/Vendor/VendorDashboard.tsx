import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Coins, 
  Sparkles, 
  Package, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Tag
} from 'lucide-react';

interface VendorDashboardProps {
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({ onAlert }) => {
  const { token, user } = useAuth();
  const { t } = useLanguage();
  
  // Dashboard states
  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New product form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('50');
  const [imageUrl, setImageUrl] = useState('');

  // Image presets for the builder
  const presets = [
    { label: 'Gadget', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80' },
    { label: 'Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80' },
    { label: 'Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80' },
    { label: 'Groceries', url: 'https://images.unsplash.com/photo-1610348725531-843dff14f93a?auto=format&fit=crop&w=400&q=80' }
  ];

  const loadVendorData = () => {
    if (!token) return;
    setLoading(true);
    
    Promise.all([
      fetch('/api/vendor/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ])
      .then(([dashboardData, categoriesData]) => {
        setMetrics(dashboardData.metrics || null);
        setProducts(dashboardData.products || []);
        setOrders(dashboardData.orders || []);
        setVendor(dashboardData.vendor || null);

        setCategories(categoriesData || []);
        if (categoriesData && categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVendorData();
  }, [token]);

  // Prepared status click handler (pending -> confirmed -> packing)
  const markPrepared = async (orderId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}/prepare`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        onAlert('Invoice packages preparations complete! Shipping rider notified.', 'success');
        loadVendorData();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      onAlert(err.message || 'Prep step failed', 'error');
    }
  };

  // Add listing
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!imageUrl) {
      onAlert('Please select or specify a product image preset.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          compareAtPrice: parseFloat(comparePrice) || parseFloat(price),
          categoryId,
          stock: parseInt(stock),
          imageUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        onAlert(`"${name}" listing added successfully to your store inventory!`, 'success');
        
        // Reset form
        setName('');
        setDescription('');
        setPrice('');
        setComparePrice('');
        setImageUrl('');
        setStock('50');

        loadVendorData();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      onAlert(err.message || 'Product creation failed', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this listing from your active inventory?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        onAlert('Product listing successfully deleted.', 'success');
        loadVendorData();
      } else {
        const data = await res.json();
        throw new Error(data.message || 'Delete failed');
      }
    } catch (err: any) {
      onAlert(err.message || 'Delete failed', 'error');
    }
  };

  if (loading && products.length === 0 && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Retrieving storefront inventory...</span>
      </div>
    );
  }

  if (vendor && vendor.status !== 'active') {
    return (
      <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-12 flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]">
        <div className="w-full max-w-lg glass rounded-3xl p-8 text-center border border-slate-200/50 dark:border-slate-800/60 shadow-2xl relative overflow-hidden">
          {/* Decorative blur blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
          
          <div className="inline-flex w-16 h-16 bg-gradient-to-tr from-amber-500 to-orange-400 rounded-2xl items-center justify-center text-white shadow-lg shadow-amber-500/15 mb-6">
            <AlertCircle className="w-8 h-8 animate-pulse" />
          </div>
          
          <h2 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white mb-3">
            {vendor.status === 'pending' ? 'Application Under Audit' : 'Application Rejected'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
            {vendor.status === 'pending' 
              ? `Your vendor store "${vendor.storeName}" has been successfully enrolled! However, active inventory publishing is currently locked awaiting administrative audit from our Phnom Penh Same-Day Delivery central dispatch.` 
              : `Your vendor application for "${vendor.storeName}" has been reviewed and rejected by the administration audit. Please reach out to merchant-support@sleekcart.com for additional coordination details.`}
          </p>
          
          {/* Dynamic progress bar to look extremely polished and interactive */}
          {vendor.status === 'pending' && (
            <div className="mb-6 max-w-xs mx-auto">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1.5">
                <span>AUDIT VERIFICATION</span>
                <span className="text-amber-500 animate-pulse">45% IN PROGRESS</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/20">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full animate-pulse" style={{ width: '45%' }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={loadVendorData}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 hover:bg-slate-100 text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6.5 h-6.5 text-emerald-500 animate-pulse-subtle" />
            {t('vendor.portal')}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('vendor.portal_desc')}
          </p>
        </div>
        <button
          onClick={loadVendorData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-emerald-500 hover:bg-slate-50 active:scale-95 shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 1. VENDOR ANALYTICS STATS */}
      {metrics && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {/* Sales Revenue */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-emerald-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('vendor.store_revenue')}</span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">${metrics.totalEarnings.toFixed(2)}</span>
            <span className="text-[9px] text-emerald-500 font-semibold mt-1">{t('vendor.revenue_sub')}</span>
          </div>

          {/* Pending preparations list */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('vendor.prep_queue')}</span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">
              {metrics.pendingPreps} {t('vendor.prep_queue')}
            </span>
            <span className="text-[9px] text-amber-500 font-semibold mt-1">{t('vendor.prep_sub')}</span>
          </div>

          {/* Listings count */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-violet-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('vendor.catalog_inventory')}</span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">
              {products.length} {t('home.all_products')}
            </span>
            <span className="text-[9px] text-violet-500 font-semibold mt-1">{t('vendor.catalog_sub')}</span>
          </div>

          {/* Satisfaction score */}
          <div className="relative glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col justify-between h-28 group overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('vendor.store_rating')}</span>
            <span className="font-display font-extrabold text-xl text-slate-800 dark:text-white mt-2">4.9 / 5.0</span>
            <span className="text-[9px] text-blue-500 font-semibold mt-1">{t('vendor.rating_sub')}</span>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* 2. Left Column: Preparation Order lists & inventory controls */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Preparation Queue List */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              {t('vendor.prep_manager')} ({orders.filter(o => o.status === 'confirmed').length})
            </h3>

            {orders.filter(o => o.status === 'confirmed').length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <span className="text-3xl">🍲</span>
                <p className="text-xs font-bold mt-2">{t('vendor.prep_clear')}</p>
                <p className="text-[10px] text-slate-450 mt-0.5">{t('vendor.prep_clear_desc')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.filter(o => o.status === 'confirmed').map((ord) => (
                  <div 
                    key={ord.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/40 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{t('ui.cart')} #{ord.id.substring(4)}</h4>
                      
                      {/* item counts details */}
                      <div className="flex flex-col gap-1 mt-1.5 pl-1.5 border-l-2 border-slate-200 dark:border-slate-800">
                        {ord.items?.map((item: any) => (
                          <p key={item.id} className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                            - {item.product?.name} (Qty: <b>x{item.quantity}</b>)
                          </p>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => markPrepared(ord.id)}
                      className="btn-premium px-4 py-2 rounded-xl text-[10px] font-bold active:scale-95 transition-transform flex items-center justify-center gap-1 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t('vendor.mark_prepared')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Inventory Products list */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
              {t('vendor.active_listings')} ({products.length})
            </h3>

            {products.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <span className="text-3xl">🪹</span>
                <p className="text-xs font-bold mt-2">{t('vendor.no_listings')}</p>
                <p className="text-[10px] text-slate-450 mt-0.5">{t('vendor.no_listings_desc')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/40 dark:border-slate-800/60 flex gap-3 shadow-sm text-xs group relative"
                  >
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200/50 p-1 shrink-0 flex items-center justify-center">
                      <img src={item.imageUrl} alt="" className="max-h-full max-w-full object-contain rounded" />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white truncate pr-6 group-hover:text-emerald-500 transition-colors">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">${item.price.toFixed(2)}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{t('vendor.stock')}: <b>{item.stock}</b></p>
                    </div>

                    <button
                      onClick={() => deleteProduct(item.id)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Remove item listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 3. Right Column: Create new product form */}
        <div className="lg:col-span-1 glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
          <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <Plus className="w-4 h-4 text-emerald-500" />
            {t('vendor.create_listing')}
          </h3>

          <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('vendor.product_title')}</label>
              <input
                type="text" required placeholder="e.g. UltraBass Nebula headset"
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">{t('vendor.description')}</label>
              <textarea
                rows={3} required placeholder="Detail the listing features, sizes or specs..."
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('vendor.retail_price')}</label>
                <input
                  type="number" step="0.01" required placeholder="49.99"
                  value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                />
              </div>

              {/* Compare price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('vendor.compare_price')}</label>
                <input
                  type="number" step="0.01" placeholder="e.g. 69.99"
                  value={comparePrice} onChange={(e) => setComparePrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('vendor.department')}</label>
                <select
                  value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-2 py-2.2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-[11px] font-bold"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="text-slate-850 bg-white dark:bg-slate-950 font-semibold">{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Stock */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t('vendor.stock')}</label>
                <input
                  type="number" required placeholder="50"
                  value={stock} onChange={(e) => setStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                />
              </div>
            </div>

            {/* Image Upload, Custom URL, and Presets */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Product Image (Upload or URL)</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste external image URL..."
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-grow px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                />
                
                <label className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-xs font-bold transition-all flex items-center gap-1 active:scale-95 text-slate-600 dark:text-slate-350 shrink-0">
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Presets Grid */}
              <div className="mt-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1.5">{t('vendor.image_preset')}</span>
                <div className="grid grid-cols-4 gap-2">
                  {presets.map((pr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(pr.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-102 active:scale-95 ${
                        imageUrl === pr.url ? 'border-emerald-500 shadow-md shadow-emerald-500/15' : 'border-slate-200/40 hover:border-slate-350'
                      }`}
                      title={pr.label}
                    >
                      <img src={pr.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Thumbnail Preview Area */}
              {imageUrl && (
                <div className="relative mt-3 w-full h-32 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-955 flex items-center justify-center p-2 shadow-inner">
                  <img src={imageUrl} alt="Listing preview" className="max-h-full max-w-full object-contain rounded" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-all shadow-md active:scale-90"
                    title="Remove Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full btn-premium py-2.8 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1 active:scale-95 mt-3"
            >
              <Plus className="w-4 h-4" />
              {t('vendor.submit_listing')}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
