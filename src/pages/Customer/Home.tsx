import React, { useEffect, useState } from 'react';
import { ProductCard } from '../../components/ProductCard.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { 
  Search, 
  Cpu, 
  Shirt, 
  ShoppingBag, 
  Sparkles, 
  Home as HomeIcon,
  Tag,
  ArrowRight,
  TrendingUp,
  Percent,
  Coins
} from 'lucide-react';

interface HomeProps {
  onNavigate: (view: string) => void;
  onNavigateToDetail: (id: string) => void;
  onSearchQuery: (query: string) => void;
  onSelectCategory: (id: string | null) => void;
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  onNavigateToDetail,
  onSearchQuery,
  onSelectCategory,
  onAlert
}) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch featured products
  useEffect(() => {
    setLoading(true);
    // Fetch featured
    fetch('/api/products?featured=true')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));

    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVal.trim()) return;
    onSearchQuery(searchVal);
    onNavigate('shop');
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Shirt': return <Shirt className="w-5 h-5" />;
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Home': return <HomeIcon className="w-5 h-5" />;
      default: return <ShoppingBag className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-10 pb-16 bg-slate-50 dark:bg-slate-950">
      
      {/* 1. HERO VIBRANT GRADIENT BLOCK */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white py-14 px-6 md:px-12 mt-4 shadow-xl border border-slate-800/40 animate-fade-in mx-4">
        {/* Abstract glowing graphics */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/25 mb-4 animate-bounce-subtle">
            <Sparkles className="w-3.5 h-3.5" />
            {t('home.badge')}
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            {t('home.hero_title')} <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {t('home.hero_subtitle')}
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed mb-8">
            {t('home.hero_desc')}
          </p>

          {/* Large Hero Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl max-w-lg border border-slate-200/20">
            <div className="flex items-center gap-2 pl-2 flex-grow text-slate-400">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t('home.search_ph')}
                className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-white text-xs py-1"
              />
            </div>
            <button 
              type="submit"
              className="btn-premium px-5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 active:scale-95"
            >
              {t('home.search')}
            </button>
          </form>

          {/* Quick tags */}
          <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-semibold">
            <span>{t('home.trending_searches')}</span>
            <button onClick={() => { setSearchVal('Nebula'); onSearchQuery('Nebula'); onNavigate('shop'); }} className="hover:text-emerald-400">#Headset</button>
            <span>•</span>
            <button onClick={() => { setSearchVal('Trench'); onSearchQuery('Trench'); onNavigate('shop'); }} className="hover:text-emerald-400">#Coat</button>
            <span>•</span>
            <button onClick={() => { setSearchVal('Organic'); onSearchQuery('Organic'); onNavigate('shop'); }} className="hover:text-emerald-400">#Berries</button>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC HORIZONTAL CATEGORIES */}
      <section className="px-4">
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-500" />
              {t('home.categories_title')}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('home.categories_subtitle')}</p>
          </div>
          <button 
            onClick={() => { onSelectCategory(null); onNavigate('shop'); }}
            className="text-xs font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-0.5 hover:underline"
          >
            {t('home.all_products')} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-thin scrollbar-track-transparent">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { onSelectCategory(cat.id); onNavigate('shop'); }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group shrink-0 active:scale-95"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                {getCategoryIcon(cat.icon)}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors leading-none">
                  {cat.name}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Browse items
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      <section className="px-4">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-display font-extrabold text-xl text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500 animate-bounce-subtle" />
              {t('home.picks_title')}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">{t('home.picks_subtitle')}</p>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 rounded border border-slate-200/40 dark:border-slate-700/40">
            {t('home.updated_hourly')}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-4 animate-pulse flex flex-col gap-4">
                <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-950 rounded-2xl"></div>
                <div className="h-4 bg-slate-100 dark:bg-slate-950 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-950 rounded w-1/2"></div>
                <div className="flex justify-between items-center mt-auto">
                  <div className="h-5 bg-slate-100 dark:bg-slate-950 rounded w-1/3"></div>
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-950 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard 
                key={p.id}
                product={p}
                onNavigateToDetail={onNavigateToDetail}
                onAlert={onAlert}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. PREMIUM LOYALTY & CASHBACK HIGHLIGHT BANNERS */}
      <section className="px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Affiliate Box */}
        <div className="relative glass rounded-3xl p-6 border border-emerald-500/20 dark:border-emerald-500/20 shadow-sm overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
          <div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Coins className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-200">{t('home.rewards_title')}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              {t('home.rewards_desc')}
            </p>
          </div>
          <span className="text-[10px] text-emerald-500 font-bold mt-4 flex items-center gap-1 cursor-pointer hover:underline">
            View loyalty panel <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Cashback Box */}
        <div className="relative glass rounded-3xl p-6 border border-violet-500/20 dark:border-violet-500/20 shadow-sm overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
          <div>
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-slate-800 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
              <Percent className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-200">{t('home.affiliate_title')}</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              {t('home.affiliate_desc')}
            </p>
          </div>
          <span className="text-[10px] text-violet-500 font-bold mt-4 flex items-center gap-1 cursor-pointer hover:underline">
            Generate referral link <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* AI Recommendations Box */}
        <div className="relative glass rounded-3xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-500/10 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
          <div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-4">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-200">AI Recommendation Engine</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              Our neural networking algorithm reviews your historical browses to recommend local items perfectly fitted to your daily lifestyle.
            </p>
          </div>
          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-4 flex items-center gap-1">
            Running in background
          </span>
        </div>

      </section>

    </div>
  );
};
