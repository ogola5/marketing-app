// src/contexts/AuthContext.js
import { createContext, useState, useEffect } from 'react';
import { storageService, authService } from '../services';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(storageService.getUser() || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      await authService.initialize();
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    initializeAuth();
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleGoogleCallback(code);
    }
  }, []);

  const handleGoogleCallback = async (code) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8001/api/auth/google/callback?code=${code}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Failed to process Google OAuth callback');
      }
      const userData = await response.json();
      login(userData);
      // Clear URL params after login
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Google OAuth callback failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    try {
      storageService.setUser(userData); // Now works with the alias
      setUser(userData);
      authService.loginSuccess(userData, userData.token);
    } catch (error) {
      console.error('Failed to set user in storage:', error);
      setError(error.message);
    }
  };

  const logout = () => {
    try {
      storageService.removeUser();
      setUser(null);
      authService.logout();
    } catch (error) {
      console.error('Failed to logout:', error);
      setError(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};