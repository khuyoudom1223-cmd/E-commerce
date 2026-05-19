import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { 
  ShoppingBag, 
  ShoppingCart, 
  User as UserIcon, 
  LogOut, 
  Sun, 
  Moon, 
  Sparkles, 
  Lock,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  dark,
  onToggleTheme
}) => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [profileOpen, setProfileOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Elite developer quick switcher to swap user roles on the fly for easy testing!
  const quickSwitchRole = async (newRole: 'customer' | 'rider' | 'vendor' | 'admin') => {
    setProfileOpen(false);
    if (!user) return;

    const currentToken = localStorage.getItem('sleekcart_token');
    
    // First attempt: If user is on a custom account, switch the role on their active session on-the-fly!
    if (currentToken && user.email !== 'customer@sleekcart.com' && user.email !== 'rider@sleekcart.com' && user.email !== 'vendor@sleekcart.com' && user.email !== 'admin@sleekcart.com') {
      try {
        const res = await fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({ role: newRole })
        });
        
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('sleekcart_token', data.token);
          localStorage.setItem('sleekcart_user', JSON.stringify(data.user));
          window.location.reload();
          return;
        }
      } catch (err) {
        console.error('Error switching active user role:', err);
      }
    }

    // Fallback: Swapping mock pre-seeded accounts
    const email = `${newRole}@sleekcart.com`;
    const password = newRole === 'admin' ? 'admin' : 'password';
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('sleekcart_token', data.token);
        localStorage.setItem('sleekcart_user', JSON.stringify(data.user));
        window.location.reload();
      } else {
        // If account doesn't exist, create it on-the-fly AND login immediately
        const name = `Sovereign ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}`;
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role: newRole, phone: '+855 12 345 678' })
        });
        if (registerRes.ok) {
          const data = await registerRes.json();
          localStorage.setItem('sleekcart_token', data.token);
          localStorage.setItem('sleekcart_user', JSON.stringify(data.user));
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Error quick switching roles:', err);
    }
  };

  return (
    <header className="sticky top-0 z-[1000] w-full glass-nav border-b border-slate-200/50 dark:border-slate-800/40 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => onNavigate(user?.role === 'customer' || !user ? 'home' : `${user.role}-dashboard`)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-5.5 h-5.5" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-1.5">
              Dom Store
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                PRO v1
              </span>
            </span>
          </div>

          {/* Center Navigation Links (Adapts dynamically to roles) */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => onNavigate('home')} 
              className={`text-sm font-medium hover:text-emerald-500 transition-colors ${currentView === 'home' ? 'text-emerald-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {t('nav.home')}
            </button>
            <button 
              onClick={() => onNavigate('shop')} 
              className={`text-sm font-medium hover:text-emerald-500 transition-colors ${currentView === 'shop' ? 'text-emerald-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {t('nav.explore')}
            </button>
            <button 
              onClick={() => onNavigate('orders')} 
              className={`text-sm font-medium hover:text-emerald-500 transition-colors ${currentView === 'orders' ? 'text-emerald-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {t('nav.deliveries')}
            </button>

            {user && user.role === 'vendor' && (
              <button 
                onClick={() => onNavigate('vendor-dashboard')} 
                className={`text-sm font-semibold hover:text-emerald-500 transition-all flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95 ${currentView === 'vendor-dashboard' ? 'ring-2 ring-emerald-500/30' : ''}`}
              >
                🏪 {language === 'en' ? 'Vendor Portal' : 'ទំព័រអ្នកលក់'}
              </button>
            )}

            {user && user.role === 'rider' && (
              <button 
                onClick={() => onNavigate('rider-dashboard')} 
                className={`text-sm font-semibold hover:text-emerald-500 transition-all flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95 ${currentView === 'rider-dashboard' ? 'ring-2 ring-emerald-500/30' : ''}`}
              >
                🏍️ {language === 'en' ? 'Rider Portal' : 'ទំព័រអ្នកដឹក'}
              </button>
            )}

            {user && user.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin-dashboard')} 
                className={`text-sm font-semibold hover:text-emerald-500 transition-all flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 active:scale-95 ${currentView === 'admin-dashboard' ? 'ring-2 ring-emerald-500/30' : ''}`}
              >
                🛡️ {language === 'en' ? 'Admin Portal' : 'ទំព័ររដ្ឋបាល'}
              </button>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-4">
            
            {/* Language Switcher Button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'kh' : 'en')}
              className="px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 active:scale-95 shadow-sm text-xs font-bold flex items-center gap-1.5"
              title={language === 'en' ? 'Translate to Khmer' : 'Translate to English'}
            >
              {language === 'en' ? (
                <>
                  <span className="text-base leading-none">🇰🇭</span>
                  <span>KH</span>
                </>
              ) : (
                <>
                  <span className="text-base leading-none">🇺🇸</span>
                  <span>EN</span>
                </>
              )}
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 active:scale-95 shadow-sm"
              aria-label="Toggle Light/Dark Theme"
            >
              {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => onNavigate('cart')}
              className="relative p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 active:scale-95 shadow-sm group"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              {cartCount > 0 && (
                <span 
                  id="cart-icon-badge"
                  className="absolute -top-1.5 -right-1.5 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/25 border-2 border-white dark:border-slate-950"
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown & Quick Switcher */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name} 
                    className="w-7 h-7 rounded-lg object-cover ring-2 ring-emerald-500/30"
                  />
                  <div className="hidden sm:flex flex-col items-start text-[10px]">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[90px]">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 capitalize leading-none">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </button>

                {/* Dropdown Container */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2.5 w-60 rounded-2xl glass shadow-xl border border-slate-200/80 dark:border-slate-800/80 py-2.5 animate-slide-up z-[9999]">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Authenticated Session</p>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-0.5">{user.email}</p>
                    </div>

                    {/* Developer Master Switcher inside dropdown - ONLY visible to Admin for testing */}
                    {user.role === 'admin' && (
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          {t('nav.portal')}
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 mb-2 leading-tight">
                          Instantly hot-swap actor roles to test full multi-vendor flows:
                        </p>
                        
                        <div className="grid grid-cols-2 gap-1.5">
                          <button 
                            onClick={() => quickSwitchRole('customer')}
                            className={`text-[10px] font-semibold py-1 px-1.5 rounded border transition-colors ${(user.role as string) === 'customer' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                          >
                            Customer
                          </button>
                          <button 
                            onClick={() => quickSwitchRole('rider')}
                            className={`text-[10px] font-semibold py-1 px-1.5 rounded border transition-colors ${(user.role as string) === 'rider' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                          >
                            Rider App
                          </button>
                          <button 
                            onClick={() => quickSwitchRole('vendor')}
                            className={`text-[10px] font-semibold py-1 px-1.5 rounded border transition-colors ${(user.role as string) === 'vendor' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                          >
                            Vendor
                          </button>
                          <button 
                            onClick={() => quickSwitchRole('admin')}
                            className={`text-[10px] font-semibold py-1 px-1.5 rounded border transition-colors ${(user.role as string) === 'admin' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'}`}
                          >
                            Admin Panel
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onNavigate('profile');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-emerald-500 flex items-center gap-2 transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      {t('nav.profile')}
                    </button>
                    
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                        onNavigate('home');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-800/60 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.signout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="btn-premium px-4 py-1.8 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center gap-1 hover:scale-[1.02] active:scale-95 transition-all duration-200"
              >
                <UserIcon className="w-4 h-4" />
                {t('nav.signin')}
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
