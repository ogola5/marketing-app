import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService, storageService } from '../services';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(storageService.getAuthToken());
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback((userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    storageService.setAuthToken(userToken);
    storageService.setUser(userData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    authService.logout();
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
    storageService.setUser({ ...user, ...updates });
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const callbackToken = urlParams.get('token');
    const userEmail = urlParams.get('user');
    const userName = urlParams.get('name');
    const userPicture = urlParams.get('picture');
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Auth error:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (callbackToken && userEmail && userName) {
      const userData = {
        email: userEmail,
        name: userName,
        picture: userPicture || null,
        isOnboarded: false
      };
      
      login(userData, callbackToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    fetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};