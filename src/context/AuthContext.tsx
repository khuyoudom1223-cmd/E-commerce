import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor' | 'rider' | 'customer';
  phone: string;
  avatarUrl: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string, phone: string) => Promise<void>;
  logout: () => void;
  socialLogin: (name: string, email: string, avatarUrl: string, provider: string) => Promise<void>;
  updateProfile: (name: string, phone: string) => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const savedToken = localStorage.getItem('sleekcart_token');
    const savedUser = localStorage.getItem('sleekcart_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Verify token is still valid with backend
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token expired');
      })
      .then(userData => {
        setUser(userData);
        localStorage.setItem('sleekcart_user', JSON.stringify(userData));
      })
      .catch(() => {
        // Clear expired session
        logout();
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sleekcart_token', data.token);
    localStorage.setItem('sleekcart_user', JSON.stringify(data.user));
  };

  const register = async (name: string, email: string, password: string, role: string, phone: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, phone })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sleekcart_token', data.token);
    localStorage.setItem('sleekcart_user', JSON.stringify(data.user));
  };

  const socialLogin = async (name: string, email: string, avatarUrl: string, provider: string) => {
    const res = await fetch('/api/auth/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, avatarUrl, provider })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Social sign-in failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('sleekcart_token', data.token);
    localStorage.setItem('sleekcart_user', JSON.stringify(data.user));
  };

  const updateProfile = async (name: string, phone: string) => {
    if (!token) return;
    const res = await fetch('/api/profile/update', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, phone })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');

    const updatedUser = { ...user!, name: data.user.name, phone: data.user.phone };
    setUser(updatedUser);
    localStorage.setItem('sleekcart_user', JSON.stringify(updatedUser));
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!token) return;
    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ avatarUrl })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Avatar upload failed');

    const updatedUser = { ...user!, avatarUrl: data.avatarUrl };
    setUser(updatedUser);
    localStorage.setItem('sleekcart_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sleekcart_token');
    localStorage.removeItem('sleekcart_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, socialLogin, updateProfile, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
