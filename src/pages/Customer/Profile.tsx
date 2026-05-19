import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { User as UserIcon, Phone, Mail, Camera, Shield, MapPin, CheckCircle2 } from 'lucide-react';

interface ProfileProps {
  onAlert: (msg: string, type: 'success' | 'error') => void;
}

export const Profile: React.FC<ProfileProps> = ({ onAlert }) => {
  const { user, token, updateProfile, updateAvatar } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updating, setUpdating] = useState(false);

  // Avatar presets
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateProfile(name, phone);
      onAlert('Profile details updated successfully!', 'success');
    } catch (err: any) {
      onAlert(err.message || 'Profile update failed', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarSelect = async (url: string) => {
    try {
      await updateAvatar(url);
      onAlert('Avatar updated successfully!', 'success');
    } catch (err: any) {
      onAlert(err.message || 'Avatar change failed', 'error');
    }
  };

  return (
    <div className="pb-16 bg-slate-50 dark:bg-slate-950 px-4 mt-6">
      
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <Shield className="w-6.5 h-6.5 text-emerald-500" />
          Customer Profile Panel
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Manage your personal identifiers, profile pictures, and active logistics records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Avatar updates and roles */}
        <div className="md:col-span-1 glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm flex flex-col items-center text-center">
          <div className="relative group my-4">
            <img 
              src={user?.avatarUrl} 
              alt={user?.name} 
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-emerald-500/20"
            />
            <label className="absolute inset-0 bg-slate-950/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold cursor-pointer transition-opacity">
              <Camera className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleAvatarSelect(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          <h3 className="font-display font-extrabold text-base text-slate-800 dark:text-white leading-tight">
            {user?.name}
          </h3>
          <p className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-0.5 rounded-full border border-emerald-500/20 mt-2 uppercase">
            Platform {user?.role}
          </p>

          {/* Custom Avatar Upload / URL Box */}
          <div className="mt-4 w-full text-left border-t border-slate-100 dark:border-slate-800/80 pt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Custom Profile Picture
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste custom picture URL..."
                value={user?.avatarUrl && user.avatarUrl.startsWith('data:') ? '' : user?.avatarUrl}
                onChange={(e) => handleAvatarSelect(e.target.value)}
                className="flex-grow px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-[10px] transition-all"
              />
              
              <label className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer text-[10px] font-bold transition-all flex items-center gap-1 active:scale-95 text-slate-600 dark:text-slate-355 shrink-0">
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
                        handleAvatarSelect(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Quick avatar selection bubble grids */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 w-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Change Avatar Preset
            </span>
            <div className="grid grid-cols-3 gap-2">
              {avatars.map((av, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAvatarSelect(av)}
                  className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all hover:scale-102 active:scale-95 ${
                    user?.avatarUrl === av ? 'border-emerald-500 shadow-md shadow-emerald-500/15' : 'border-slate-200/40 hover:border-slate-350'
                  }`}
                >
                  <img src={av} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Identifier form editor */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-4">
              <UserIcon className="w-4 h-4 text-emerald-500" />
              Personal Identifiers
            </h3>

            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Full name input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Username Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text" required placeholder="e.g. Makara Sok"
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                    />
                  </div>
                </div>

                {/* Telephone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel" required placeholder="+855 12 345 678"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 outline-none focus:border-emerald-500 text-xs transition-all"
                    />
                  </div>
                </div>

              </div>

              {/* Email Address (disabled profile lock) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address (Locked Account Id)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email" disabled value={user?.email || ''}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/50 text-slate-400 outline-none text-xs"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={updating}
                className="w-full btn-premium py-2.8 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 mt-2"
              >
                {updating ? 'Processing Updates...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Address Book Manager log */}
          <div className="glass rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
            <h3 className="font-display font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/80 pb-2 mb-4">
              <MapPin className="w-4 h-4 text-emerald-500 animate-bounce-subtle" />
              Geocoded Address Book
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    🏠 Primary Residence
                    <span className="text-[8px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/10">Default</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    St 310, Boeung Keng Kang 1 (BKK1), Chamkar Mon, Phnom Penh, Cambodia
                  </p>
                  <p className="font-mono text-[8px] text-slate-400 mt-0.5">GPS Coordinates: 11.5512, 104.9221</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
