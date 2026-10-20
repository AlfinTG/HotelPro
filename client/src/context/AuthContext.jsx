import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

/**
 * Provides auth state (currentUser, token) and helpers (login, logout).
 * Token and safe user object are persisted in localStorage.
 * Validates session against GET /api/auth/me on mount to handle expired or invalidated tokens.
 *
 * NOTE: localStorage is used based on project conventions (D-04).
 * Tokens expire server-side after 24 hours.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem('hotelpro_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    localStorage.removeItem('hotelpro_token');
    localStorage.removeItem('hotelpro_user');
    setCurrentUser(null);
  }, []);

  const login = useCallback((token, user) => {
    localStorage.setItem('hotelpro_token', token);
    localStorage.setItem('hotelpro_user', JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  // Validate session against backend on mount
  useEffect(() => {
    const token = localStorage.getItem('hotelpro_token');
    if (!token) return;

    api
      .get('/api/auth/me')
      .then((res) => {
        if (res.data?.user) {
          setCurrentUser(res.data.user);
          localStorage.setItem('hotelpro_user', JSON.stringify(res.data.user));
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          logout();
        }
      });
  }, [logout]);

  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
