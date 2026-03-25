import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  saveTokens,
  saveUser,
  clearSession,
  getUser,
  getAccessToken,
  getRefreshToken,
  getDashboardRoute,
} from '../utils/tokenUtils';
import { logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,         setUser]         = useState(() => getUser());
  const [accessToken,  setAccessToken]  = useState(() => getAccessToken());
  const [isFirstLogin, setIsFirstLogin] = useState(() => getUser()?.isFirstLogin ?? false);

  /** Called right after a successful /auth/login response */
  const handleLoginSuccess = useCallback((response) => {
    const { accessToken, refreshToken } = response;
    const src = response.user ?? response;   // support both { user:{...} } and flat shapes
    const user = {
      id:         src.id         ?? null,
      email:      src.email      ?? null,
      fullName:   src.name ?? src.fullName ?? null,
      role:       src.role       ?? null,
      department: src.department ?? null,
    };
    saveTokens({ accessToken, refreshToken });
    saveUser(user);
    setAccessToken(accessToken);
    setUser(user);
    return getDashboardRoute(user.role);
  }, []);

  /** Called after a successful /auth/change-password (first-login reset) */
  const handlePasswordChanged = useCallback(() => {
    setIsFirstLogin(false);
    const updated = { ...getUser(), isFirstLogin: false };
    saveUser(updated);
    setUser(updated);
  }, []);

  const handleLogout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) await apiLogout(refreshToken);
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      clearSession();
      setUser(null);
      setAccessToken(null);
      setIsFirstLogin(false);
    }
  }, []);

  const value = {
    user,
    accessToken,
    isFirstLogin,
    isAuthenticated:      !!accessToken,
    handleLoginSuccess,
    handlePasswordChanged,
    handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
};
