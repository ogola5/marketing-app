// services/authService.js
import { authAPI, apiUtils } from './api';
import { STORAGE_KEYS } from '../constants';
import { safeLocalStorage } from '../utils';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    this.listeners = new Set();
  }
  
  // Initialize auth service - call this on app startup
  async initialize() {
    try {
      const token = this.getStoredToken();
      if (token) {
        apiUtils.setAuthToken(token);
        const result = await this.getCurrentUser();
        if (result.success) {
          this.currentUser = result.user;
        } else {
          // Token is invalid, clear it
          this.clearAuth();
        }
      }
      this.isInitialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuth();
      this.isInitialized = true;
    }
  }
  
  // Authentication state listeners
  addAuthListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          user: this.currentUser,
          isAuthenticated: !!this.currentUser,
          isInitialized: this.isInitialized
        });
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }
  
  // Google OAuth login
  async initiateGoogleLogin() {
    try {
      const { data, error } = await authAPI.getGoogleLoginUrl();
      
      if (error) {
        return { success: false, error };
      }
      
      if (data?.auth_url) {
        // Redirect to Google OAuth
        window.location.href = data.auth_url;
        return { success: true };
      } else {
        return { success: false, error: 'No authentication URL received' };
      }
    } catch (error) {
      console.error('Google login initiation failed:', error);
      return { success: false, error: 'Failed to initiate Google login' };
    }
  }
  
  // Handle OAuth callback (called when user returns from Google)
  handleOAuthCallback(urlParams) {
    try {
      const { token, user, name, picture, error } = urlParams;
      
      if (error) {
        return { success: false, error: `Authentication failed: ${error}` };
      }
      
      if (token && user && name) {
        const userData = {
          email: user,
          name: name,
          picture: picture || null,
          onboarding_completed: false // Will be updated after profile fetch
        };
        
        return this.loginSuccess(userData, token);
      }
      
      return { success: false, error: 'Incomplete authentication data' };
    } catch (error) {
      console.error('OAuth callback handling failed:', error);
      return { success: false, error: 'Failed to process authentication' };
    }
  }
  
  // Simple email login
  async loginWithEmail(email) {
    try {
      const { data, error } = await authAPI.login(email);
      
      if (error) {
        return { success: false, error };
      }
      
      if (data?.user && data?.token) {
        return this.loginSuccess(data.user, data.token);
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Email login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }
  
  // Simple email registration
  async registerWithEmail(email, name) {
    try {
      const { data, error } = await authAPI.register(email, name);
      
      if (error) {
        return { success: false, error };
      }
      
      if (data?.user && data?.token) {
        return this.loginSuccess(data.user, data.token);
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Email registration failed:', error);
      return { success: false, error: 'Registration failed' };
    }
  }
  
  // Handle successful login (common for all login methods)
  loginSuccess(userData, token) {
    try {
      // Set auth token
      apiUtils.setAuthToken(token);
      
      // Store user data
      this.currentUser = userData;
      safeLocalStorage.set(STORAGE_KEYS.USER, userData);
      
      // Notify listeners
      this.notifyListeners();
      
      return { 
        success: true, 
        user: userData,
        requiresOnboarding: !userData.onboarding_completed
      };
    } catch (error) {
      console.error('Login success handling failed:', error);
      return { success: false, error: 'Failed to complete login' };
    }
  }
  
  // Get current user profile from server
  async getCurrentUser() {
    try {
      const { data, error } = await authAPI.getProfile();
      
      if (error) {
        return { success: false, error };
      }
      
      if (data) {
        this.currentUser = data;
        safeLocalStorage.set(STORAGE_KEYS.USER, data);
        this.notifyListeners();
        return { success: true, user: data };
      } else {
        return { success: false, error: 'No user data received' };
      }
    } catch (error) {
      console.error('Get current user failed:', error);
      return { success: false, error: 'Failed to fetch user profile' };
    }
  }
  
  // Update user profile
  async updateProfile(profileData) {
    try {
      const { data, error } = await authAPI.updateProfile(profileData);
      
      if (error) {
        return { success: false, error };
      }
      
      // Update current user data
      this.currentUser = { ...this.currentUser, ...profileData };
      safeLocalStorage.set(STORAGE_KEYS.USER, this.currentUser);
      this.notifyListeners();
      
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
  
  // Complete onboarding
  async completeOnboarding(onboardingData) {
    try {
      const { data, error } = await authAPI.completeOnboarding(onboardingData);
      
      if (error) {
        return { success: false, error };
      }
      
      // Update user to mark onboarding as completed
      if (this.currentUser) {
        this.currentUser.onboarding_completed = true;
        this.currentUser = { ...this.currentUser, ...onboardingData };
        safeLocalStorage.set(STORAGE_KEYS.USER, this.currentUser);
        this.notifyListeners();
      }
      
      return { success: true, user: this.currentUser };
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      return { success: false, error: 'Failed to complete onboarding' };
    }
  }
  
  // Logout user
  logout() {
    try {
      this.clearAuth();
      this.notifyListeners();
      
      // Redirect to login page
      window.location.href = '/';
      
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: 'Failed to logout' };
    }
  }
  
  // Clear all authentication data
  clearAuth() {
    this.currentUser = null;
    apiUtils.clearAuth();
    safeLocalStorage.remove(STORAGE_KEYS.USER);
  }
  
  // Utility methods
  isAuthenticated() {
    return !!this.currentUser && !!this.getStoredToken();
  }
  
  requiresOnboarding() {
    return this.isAuthenticated() && !this.currentUser?.onboarding_completed;
  }
  
  getStoredToken() {
    return safeLocalStorage.get(STORAGE_KEYS.TOKEN);
  }
  
  getStoredUser() {
    return safeLocalStorage.get(STORAGE_KEYS.USER);
  }
  
  getCurrentUser() {
    return this.currentUser;
  }
  
  // Check if user has specific permissions (for future use)
  hasPermission(permission) {
    if (!this.isAuthenticated()) return false;
    
    // For now, all authenticated users have all permissions
    // This can be extended based on user roles
    return true;
  }
  
  // Session management
  isSessionValid() {
    const token = this.getStoredToken();
    if (!token) return false;
    
    try {
      // Basic token format validation
      // In a real app, you might want to check token expiration
      return token.length > 0;
    } catch {
      return false;
    }
  }
  
  // Refresh session (call periodically to keep session alive)
  async refreshSession() {
    if (!this.isAuthenticated()) return { success: false, error: 'Not authenticated' };
    
    try {
      const result = await this.getCurrentUser();
      if (result.success) {
        return { success: true, user: result.user };
      } else {
        // Session is invalid, logout user
        this.logout();
        return { success: false, error: 'Session expired' };
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      return { success: false, error: 'Failed to refresh session' };
    }
  }
  
  // Auto-logout after inactivity (optional feature)
  setupAutoLogout(timeoutMinutes = 60) {
    let timeoutId;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('Auto-logout due to inactivity');
        this.logout();
      }, timeoutMinutes * 60 * 1000);
    };
    
    // Reset timeout on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });
    
    // Initial timeout
    resetTimeout();
    
    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }
}

// Create and export singleton instance
const authService = new AuthService();

export { authService };
export default authService;