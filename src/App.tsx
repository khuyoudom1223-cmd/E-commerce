import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Home } from './pages/Customer/Home.tsx';
import { Shop } from './pages/Customer/Shop.tsx';
import { ProductDetail } from './pages/Customer/ProductDetail.tsx';
import { Cart } from './pages/Customer/Cart.tsx';
import { Checkout } from './pages/Customer/Checkout.tsx';
import { OrderTracking } from './pages/Customer/OrderTracking.tsx';
import { Profile } from './pages/Customer/Profile.tsx';
import { Login } from './pages/Customer/Login.tsx';
import { RiderDashboard } from './pages/Rider/RiderDashboard.tsx';
import { VendorDashboard } from './pages/Vendor/VendorDashboard.tsx';
import { AdminDashboard } from './pages/Admin/AdminDashboard.tsx';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Search and catalog filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Styling & Dark mode
  const [dark, setDark] = useState<boolean>(true);

  // Global custom sliding notification alerts
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const triggerAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type });
    // Slide alert away after 4 seconds
    setTimeout(() => {
      setAlert(null);
    }, 4000);
  };

  // Sync dark mode class lists on html container
  useEffect(() => {
    const root = window.document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [dark]);

  // Proactive post-login actor routing redirections!
  useEffect(() => {
    if (user) {
      if (user.role === 'rider') {
        setCurrentView('rider-dashboard');
      } else if (user.role === 'vendor') {
        setCurrentView('vendor-dashboard');
      } else if (user.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        // Customer
        if (currentView === 'login') {
          setCurrentView('home');
        }
      }
    } else {
      // If signed out, force home on dashboard pages
      if (['rider-dashboard', 'vendor-dashboard', 'admin-dashboard', 'profile', 'checkout'].includes(currentView)) {
        setCurrentView('home');
      }
    }
  }, [user]);

  const handleNavigateToDetail = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('detail');
  };

  const handleToggleTheme = () => {
    setDark(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans flex flex-col">

      {/* 1. Header Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        dark={dark}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. Global Universal Alert Notification Banner */}
      {alert && (
        <div className="fixed top-20 right-4 z-[99999] animate-slide-up">
          <div className={`glass py-3 px-4 rounded-2xl shadow-xl flex items-center gap-3 border ${alert.type === 'success'
              ? 'border-emerald-500/25 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
              : 'border-rose-500/25 text-rose-600 dark:text-rose-450 bg-rose-500/10'
            }`}>
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 animate-pulse-subtle shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse-subtle shrink-0" />
            )}
            <span className="text-xs font-semibold leading-snug max-w-[280px]">{alert.msg}</span>
          </div>
        </div>
      )}

      {/* 3. Main Views Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
        {currentView === 'home' && (
          <Home
            onNavigate={setCurrentView}
            onNavigateToDetail={handleNavigateToDetail}
            onSearchQuery={setSearchQuery}
            onSelectCategory={setSelectedCategory}
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'shop' && (
          <Shop
            searchQuery={searchQuery}
            onSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onNavigateToDetail={handleNavigateToDetail}
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'detail' && (
          <ProductDetail
            productId={selectedProductId}
            onBack={() => setCurrentView('shop')}
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'cart' && (
          <Cart
            onNavigate={setCurrentView}
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'checkout' && (
          <Checkout
            onNavigate={setCurrentView}
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'orders' && (
          <OrderTracking
            onNavigate={setCurrentView}
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'profile' && (
          <Profile
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'login' && (
          <Login
            onSuccess={() => triggerAlert('Session authenticated successfully.', 'success')}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'rider-dashboard' && (
          <RiderDashboard
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'vendor-dashboard' && (
          <VendorDashboard
            onAlert={triggerAlert}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            onAlert={triggerAlert}
          />
        )}
      </main>

      {/* 4. Elegant Footer */}
      <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/40 py-6 mt-16 text-center text-[10px] font-medium text-slate-400 dark:text-slate-500">
        <p>© 2026 Dom Store Logistics. Phnom Penh Same-Day Delivery Networks.</p>
        <p className="mt-1 font-mono text-[9px] text-slate-500 dark:text-slate-600">Secure Sandboxed KHQR & PayPal payments enabled.</p>
      </footer>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;

