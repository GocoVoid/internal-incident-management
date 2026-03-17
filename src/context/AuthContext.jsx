import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  saveTokens,
  saveUser,
  clearSession,
  getUser,
  getAccessToken,
  getDashboardRoute,
} from '../utils/tokenUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(() => getUser());
  const [accessToken,   setAccessToken]   = useState(() => getAccessToken());
  const [isFirstLogin,  setIsFirstLogin]  = useState(false);

  /* Called right after a successful /auth/login response */
  const handleLoginSuccess = useCallback((response) => {
    const { accessToken, refreshToken, user } = response;

    saveTokens({ accessToken, refreshToken });
    saveUser(user);

    setAccessToken(accessToken);
    setUser(user);
    setIsFirstLogin(user.isFirstLogin ?? false);

    return getDashboardRoute(user.role);
  }, []);

  sessionStorage.setItem('iimp_access_token', 'mock_token');
  sessionStorage.setItem('iimp_user', JSON.stringify({
    id: 1001,
    email: 'tushar.mukherjee@pratiti.com',
    fullName: 'Tushar Mukherjee',
    role: 'EMPLOYEE',        // change to SUPPORT_STAFF / MANAGER / ADMIN
    department: 'IT',
    isFirstLogin: false
  }));

  const handleLogout = useCallback(() => {
    clearSession();
    setUser(null);
    setAccessToken(null);
    setIsFirstLogin(false);
  }, []);

  const value = {
    user,
    accessToken,
    isFirstLogin,
    isAuthenticated: !!accessToken,
    handleLoginSuccess,
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
