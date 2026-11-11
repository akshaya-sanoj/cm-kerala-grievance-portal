import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('kerala_portal_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('kerala_portal_token')));

  useEffect(() => {
    const token = localStorage.getItem('kerala_portal_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('kerala_portal_user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('kerala_portal_token');
        localStorage.removeItem('kerala_portal_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function setSession(token, userData) {
    localStorage.setItem('kerala_portal_token', token);
    localStorage.setItem('kerala_portal_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('kerala_portal_token');
    localStorage.removeItem('kerala_portal_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
