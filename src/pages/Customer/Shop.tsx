import React, { useEffect, useState } from 'react';
import { ProductCard } from '../../components/ProductCard.tsx';
import { Search, SlidersHorizontal, Tag, RefreshCw } from 'lucide-react';

interface ShopProps {
  searchQuery: string;
  onSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onNavigateToDetail: (id: string) => void;
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const Shop: React.FC<ShopProps> = ({
  searchQuery,
  onSearchQuery,
  selectedCategory,
  onSelectCategory,
  onNavigateToDetail,
  onAlert
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(searchQuery);

  // Sync internal search field with parent query changes
  useEffect(() => {
    setSearchText(searchQuery);
  }, [searchQuery]);

  // Query catalog
  const loadCatalog = () => {
    setLoading(true);
    let url = '/api/products';
    const params: string[] = [];

    if (selectedCategory) {
      params.push(`categoryId=${selectedCategory}`);
    }
    if (searchQuery) {
      params.push(`search=${encodeURIComponent(searchQuery)}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCatalog();
  }, [selectedCategory, searchQuery]);

  // Load category profiles
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchQuery(searchText);
  };

  const handleResetFilters = () => {
    setSearchText('');
    onSearchQuery('');
    onSelectCategory(null);
  };

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      {/* 1. Header Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5.5 h-5.5 text-emerald-500" />
            Marketplace Catalog
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {searchQuery 
              ? `Displaying search results matching "${searchQuery}"` 
              : 'Discover organic groceries, tailormade fashion & futuristic gadgets'}
          </p>
        </div>

        {/* Small inline search bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 p-1.5 rounded-2xl shadow-sm max-w-sm w-full md:w-[260px]">
          <input 
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search items..."
            className="w-full bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 pl-2 py-0.5"
          />
          <button 
            type="submit" 
            className="p-1.5 bg-emerald-500 rounded-xl text-white active:scale-95 transition-transform"
            aria-label="Submit search query"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* 2. Side Filter Menu */}
        <aside className="md:col-span-1 flex flex-col gap-6">
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-500" />
                Category Filters
              </h3>
              {(selectedCategory || searchQuery) && (
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] font-bold text-emerald-500 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="w-3 h-3 animate-spin-slow" />
                  Clear All
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onSelectCategory(null)}
                className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                  selectedCategory === null 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                All Departments
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full text-left py-2 px-3 text-xs font-semibold rounded-xl transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Loyalty points details card in filters */}
            <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-center">
              <p className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold py-1 px-2.5 rounded-full inline-block">
                Loyalty Cashback Active
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                Earn 5% points on all credit and Bakong QR purchases today!
              </p>
            </div>
          </div>
        </aside>

        {/* 3. Product Catalog Grid */}
        <main className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-4 flex flex-col gap-4">
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
          ) : products.length === 0 ? (
            <div className="glass rounded-3xl p-12 text-center border border-slate-200/50 dark:border-slate-800/60 shadow-sm max-w-md mx-auto">
              <span className="text-4xl">🔍</span>
              <h3 className="font-display font-extrabold text-sm text-slate-800 dark:text-white mt-3">No Listings Matches</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                We couldn't locate any products matching your active filters. Try broadening your keywords or department selections.
              </p>
              <button
                onClick={handleResetFilters}
                className="btn-premium px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 mt-5 active:scale-95"
              >
                Reset Marketplace Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
        </main>

      </div>

    </div>
  );
};
