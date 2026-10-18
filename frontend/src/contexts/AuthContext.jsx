import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('intellmeet-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('intellmeet-token') || '');

  useEffect(() => {
    if (user) {
      localStorage.setItem('intellmeet-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('intellmeet-user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('intellmeet-token', token);
    } else {
      localStorage.removeItem('intellmeet-token');
    }
  }, [token]);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    const nextUser = response.data.user;
    setToken(response.data.token);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    const nextUser = response.data.user;
    setToken(response.data.token);
    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, login, register, logout, setUser }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
