import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Mail, Lock, User as UserIcon, Phone, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
  onNavigate: (view: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigate }) => {
  const { login, register, socialLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor' | 'rider'>('customer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isForgot) {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          setIsForgot(false);
        } else {
          throw new Error(data.message);
        }
      } else if (isRegister) {
        await register(name, email, password, role, phone);
        onSuccess();
      } else {
        await login(email, password);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'google' | 'facebook') => {
    setError(null);
    setLoading(true);
    try {
      const mockName = provider === 'google' ? 'Google User' : 'Facebook User';
      const mockEmail = `${provider}_user@sleekcart.com`;
      const mockAvatar = provider === 'google' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' 
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
      
      await socialLogin(mockName, mockEmail, mockAvatar, provider);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Social authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center relative px-4 py-8 overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none animate-pulse-subtle"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-500/10 blur-[100px] pointer-events-none animate-pulse-subtle"></div>

      {/* Main Glass Form Card */}
      <div className="w-full max-w-md glass rounded-3xl shadow-2xl p-8 relative z-10 transition-all duration-300 animate-slide-up">
        
        {/* Banner Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl items-center justify-center text-white shadow-lg shadow-emerald-500/15 mb-3">
            <ShieldCheck className="w-6.5 h-6.5" />
          </div>
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-slate-800 dark:text-white">
            {isForgot ? 'Recover Password' : isRegister ? 'Create Pro Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            {isForgot 
              ? 'Reset credentials code' 
              : isRegister ? 'Join our multi-vendor logistics platform' : 'Access your customized dashboard portal'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/40 p-3 rounded-2xl text-xs text-rose-600 dark:text-rose-400 mb-5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Register-only Username Field */}
          {!isForgot && isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Makara Sok"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-all"
                />
              </div>
            </div>
          )}

          {/* Email Address Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-all"
              />
            </div>
          </div>

          {/* Register-only Phone Number Field */}
          {!isForgot && isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  required
                  placeholder="+855 12 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-all"
                />
              </div>
            </div>
          )}

          {/* Password Input (Hidden for Forgot Password flow) */}
          {!isForgot && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Password</label>
                {!isRegister && (
                  <button 
                    type="button"
                    onClick={() => setIsForgot(true)}
                    className="text-[10px] font-bold text-emerald-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs transition-all"
                />
              </div>
            </div>
          )}

          {/* Register-only Role Select Buttons */}
          {!isForgot && isRegister && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Choose Platform Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(['customer', 'vendor', 'rider'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold capitalize transition-all duration-200 active:scale-95 ${
                      role === r 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20' 
                        : 'border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'customer' ? 'Customer' : r === 'vendor' ? 'Vendor' : 'Delivery Rider'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-premium py-2.8 rounded-2xl text-xs font-bold shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 transition-all mt-2 disabled:opacity-50 disabled:scale-100"
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {isForgot ? 'Request Reset Instructions' : isRegister ? 'Enroll Account' : 'Sign In To Account'}
          </button>
        </form>

        {/* Divider line for Google/Facebook Sign Ins */}
        {!isForgot && (
          <>
            <div className="flex items-center gap-3 my-5">
              <span className="h-[1px] bg-slate-200 dark:bg-slate-800/80 flex-grow" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Or Continue With</span>
              <span className="h-[1px] bg-slate-200 dark:bg-slate-800/80 flex-grow" />
            </div>

            {/* Social Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocial('google')}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <img src="https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=40&q=80" alt="G" className="w-4 h-4 rounded-full object-cover" />
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocial('facebook')}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <img src="https://images.unsplash.com/photo-1627843563095-f6e94f7d9045?auto=format&fit=crop&w=40&q=80" alt="F" className="w-4 h-4 rounded-full object-cover" />
                Facebook
              </button>
            </div>
          </>
        )}

        {/* Footer Navigation (Switch Forms) */}
        <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          {isForgot ? (
            <button 
              onClick={() => setIsForgot(false)}
              className="font-bold text-emerald-500 hover:underline"
            >
              Return to Sign In
            </button>
          ) : isRegister ? (
            <span>
              Already possess an account?{' '}
              <button 
                onClick={() => { setIsRegister(false); setError(null); }}
                className="font-bold text-emerald-500 hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to SleekCart?{' '}
              <button 
                onClick={() => { setIsRegister(true); setError(null); }}
                className="font-bold text-emerald-500 hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
