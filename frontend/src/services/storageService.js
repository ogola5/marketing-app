// src/services/storageService.js
import { STORAGE_KEYS, LOCAL_STORAGE_KEYS } from '../constants';

class StorageService {
  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
    this.isSessionStorageAvailable = this.checkSessionStorageAvailability();
    this.memoryFallback = new Map(); // Fallback for when storage is not available
  }

  // Check if localStorage is available
  checkLocalStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('localStorage is not available, using memory fallback');
      return false;
    }
  }

  // Check if sessionStorage is available
  checkSessionStorageAvailability() {
    try {
      const testKey = '__session_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('sessionStorage is not available, using memory fallback');
      return false;
    }
  }

  // Local Storage Methods
  setLocal(key, value, encrypt = false) {
    try {
      const stringValue = JSON.stringify(value);
      const finalValue = encrypt ? this.encrypt(stringValue) : stringValue;

      if (this.isLocalStorageAvailable) {
        localStorage.setItem(key, finalValue);
      } else {
        this.memoryFallback.set(`local_${key}`, finalValue);
      }

      return true;
    } catch (error) {
      console.error(`Failed to set localStorage key "${key}":`, error);
      return false;
    }
  }

  getLocal(key, defaultValue = null, decrypt = false) {
    try {
      let value;

      if (this.isLocalStorageAvailable) {
        value = localStorage.getItem(key);
      } else {
        value = this.memoryFallback.get(`local_${key}`);
      }

      if (value === null || value === undefined) {
        return defaultValue;
      }

      const finalValue = decrypt ? this.decrypt(value) : value;
      return JSON.parse(finalValue);
    } catch (error) {
      console.error(`Failed to get localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  removeLocal(key) {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.removeItem(key);
      } else {
        this.memoryFallback.delete(`local_${key}`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to remove localStorage key "${key}":`, error);
      return false;
    }
  }

  clearLocal() {
    try {
      if (this.isLocalStorageAvailable) {
        localStorage.clear();
      } else {
        // Clear only local storage keys from memory fallback
        for (const key of this.memoryFallback.keys()) {
          if (key.startsWith('local_')) {
            this.memoryFallback.delete(key);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }

  // Session Storage Methods
  setSession(key, value) {
    try {
      const stringValue = JSON.stringify(value);

      if (this.isSessionStorageAvailable) {
        sessionStorage.setItem(key, stringValue);
      } else {
        this.memoryFallback.set(`session_${key}`, stringValue);
      }

      return true;
    } catch (error) {
      console.error(`Failed to set sessionStorage key "${key}":`, error);
      return false;
    }
  }

  getSession(key, defaultValue = null) {
    try {
      let value;

      if (this.isSessionStorageAvailable) {
        value = sessionStorage.getItem(key);
      } else {
        value = this.memoryFallback.get(`session_${key}`);
      }

      if (value === null || value === undefined) {
        return defaultValue;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error(`Failed to get sessionStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  removeSession(key) {
    try {
      if (this.isSessionStorageAvailable) {
        sessionStorage.removeItem(key);
      } else {
        this.memoryFallback.delete(`session_${key}`);
      }
      return true;
    } catch (error) {
      console.error(`Failed to remove sessionStorage key "${key}":`, error);
      return false;
    }
  }

  clearSession() {
    try {
      if (this.isSessionStorageAvailable) {
        sessionStorage.clear();
      } else {
        // Clear only session storage keys from memory fallback
        for (const key of this.memoryFallback.keys()) {
          if (key.startsWith('session_')) {
            this.memoryFallback.delete(key);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
      return false;
    }
  }

  // App-specific convenience methods

  // User preferences
  setUserPreferences(preferences) {
    return this.setLocal(LOCAL_STORAGE_KEYS.USER_PREFERENCES, preferences);
  }

  getUserPreferences(defaultPreferences = {}) {
    return this.getLocal(LOCAL_STORAGE_KEYS.USER_PREFERENCES, defaultPreferences);
  }

  updateUserPreference(key, value) {
    const currentPreferences = this.getUserPreferences();
    currentPreferences[key] = value;
    return this.setUserPreferences(currentPreferences);
  }

  // Theme preferences
  setTheme(theme) {
    return this.setLocal(LOCAL_STORAGE_KEYS.THEME, theme);
  }

  getTheme(defaultTheme = 'light') {
    return this.getLocal(LOCAL_STORAGE_KEYS.THEME, defaultTheme);
  }

  // Language preferences
  setLanguage(language) {
    return this.setLocal(LOCAL_STORAGE_KEYS.LANGUAGE, language);
  }

  getLanguage(defaultLanguage = 'en') {
    return this.getLocal(LOCAL_STORAGE_KEYS.LANGUAGE, defaultLanguage);
  }

  // Draft campaigns
  saveDraftCampaign(campaignData) {
    const drafts = this.getDraftCampaigns();
    const newDraft = {
      ...campaignData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    // Keep only last 10 drafts
    const updatedDrafts = [newDraft, ...drafts].slice(0, 10);
    return this.setLocal(LOCAL_STORAGE_KEYS.DRAFT_CAMPAIGNS, updatedDrafts);
  }

  getDraftCampaigns() {
    return this.getLocal(LOCAL_STORAGE_KEYS.DRAFT_CAMPAIGNS, []);
  }

  removeDraftCampaign(draftId) {
    const drafts = this.getDraftCampaigns();
    const updatedDrafts = drafts.filter((draft) => draft.id !== draftId);
    return this.setLocal(LOCAL_STORAGE_KEYS.DRAFT_CAMPAIGNS, updatedDrafts);
  }

  clearDraftCampaigns() {
    return this.removeLocal(LOCAL_STORAGE_KEYS.DRAFT_CAMPAIGNS);
  }

  // Recent searches
  addRecentSearch(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return false;

    const recentSearches = this.getRecentSearches();
    const trimmedTerm = searchTerm.trim();

    // Remove if already exists and add to front
    const updatedSearches = [
      trimmedTerm,
      ...recentSearches.filter((term) => term !== trimmedTerm),
    ].slice(0, 10); // Keep only last 10 searches

    return this.setLocal(LOCAL_STORAGE_KEYS.RECENT_SEARCHES, updatedSearches);
  }

  getRecentSearches() {
    return this.getLocal(LOCAL_STORAGE_KEYS.RECENT_SEARCHES, []);
  }

  clearRecentSearches() {
    return this.removeLocal(LOCAL_STORAGE_KEYS.RECENT_SEARCHES);
  }

  // Auth token management (sensitive data)
  setAuthToken(token) {
    return this.setLocal(STORAGE_KEYS.TOKEN, token, true); // encrypted
  }

  getAuthToken() {
    return this.getLocal(STORAGE_KEYS.TOKEN, null, true); // decrypt
  }

  removeAuthToken() {
    return this.removeLocal(STORAGE_KEYS.TOKEN);
  }

  // User data
  setUserData(userData) {
    return this.setLocal(STORAGE_KEYS.USER, userData);
  }

  getUserData() {
    return this.getLocal(STORAGE_KEYS.USER, null);
  }

  removeUserData() {
    return this.removeLocal(STORAGE_KEYS.USER);
  }

  // Aliases for backward compatibility with AuthContext.js
  setUser(userData) {
    return this.setUserData(userData);
  }

  getUser() {
    return this.getUserData();
  }

  removeUser() {
    return this.removeUserData();
  }

  // Form data persistence (for multi-step forms)
  saveFormData(formKey, formData) {
    return this.setSession(`form_${formKey}`, formData);
  }

  getFormData(formKey) {
    return this.getSession(`form_${formKey}`, {});
  }

  clearFormData(formKey) {
    return this.removeSession(`form_${formKey}`);
  }

  // Onboarding progress
  setOnboardingStep(step) {
    return this.setSession(STORAGE_KEYS.ONBOARDING_STEP, step);
  }

  getOnboardingStep() {
    return this.getSession(STORAGE_KEYS.ONBOARDING_STEP, 0);
  }

  clearOnboardingStep() {
    return this.removeSession(STORAGE_KEYS.ONBOARDING_STEP);
  }

  // Cache management with expiration
  setCache(key, data, expirationMinutes = 60) {
    const cacheData = {
      data,
      expiration: Date.now() + expirationMinutes * 60 * 1000,
      timestamp: Date.now(),
    };

    return this.setSession(`cache_${key}`, cacheData);
  }

  getCache(key) {
    const cacheData = this.getSession(`cache_${key}`);

    if (!cacheData) return null;

    // Check if cache has expired
    if (Date.now() > cacheData.expiration) {
      this.removeSession(`cache_${key}`);
      return null;
    }

    return cacheData.data;
  }

  clearCache(key = null) {
    if (key) {
      return this.removeSession(`cache_${key}`);
    }

    // Clear all cache entries
    if (this.isSessionStorageAvailable) {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith('cache_')) {
          sessionStorage.removeItem(key);
        }
      });
    } else {
      // Clear cache entries from memory fallback
      for (const key of this.memoryFallback.keys()) {
        if (key.startsWith('session_cache_')) {
          this.memoryFallback.delete(key);
        }
      }
    }

    return true;
  }

  // Storage usage statistics
  getStorageStats() {
    const stats = {
      localStorage: {
        available: this.isLocalStorageAvailable,
        used: 0,
        remaining: 0,
        items: 0,
      },
      sessionStorage: {
        available: this.isSessionStorageAvailable,
        used: 0,
        remaining: 0,
        items: 0,
      },
      memoryFallback: {
        items: this.memoryFallback.size,
      },
    };

    if (this.isLocalStorageAvailable) {
      try {
        let used = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length + key.length;
          }
        }
        stats.localStorage.used = used;
        stats.localStorage.items = localStorage.length;
        // Estimate remaining (localStorage limit is usually 5-10MB)
        stats.localStorage.remaining = Math.max(0, 5 * 1024 * 1024 - used);
      } catch (error) {
        console.error('Failed to calculate localStorage stats:', error);
      }
    }

    if (this.isSessionStorageAvailable) {
      try {
        let used = 0;
        for (let key in sessionStorage) {
          if (sessionStorage.hasOwnProperty(key)) {
            used += sessionStorage[key].length + key.length;
          }
        }
        stats.sessionStorage.used = used;
        stats.sessionStorage.items = sessionStorage.length;
        stats.sessionStorage.remaining = Math.max(0, 5 * 1024 * 1024 - used);
      } catch (error) {
        console.error('Failed to calculate sessionStorage stats:', error);
      }
    }

    return stats;
  }

  // Basic encryption/decryption (for sensitive data)
  // Note: This is basic obfuscation, not cryptographically secure
  encrypt(text) {
    try {
      return btoa(encodeURIComponent(text));
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  }

  decrypt(encryptedText) {
    try {
      return decodeURIComponent(atob(encryptedText));
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  }

  // Cleanup expired cache entries
  cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    if (this.isSessionStorageAvailable) {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith('cache_')) {
          try {
            const cacheData = JSON.parse(sessionStorage.getItem(key));
            if (cacheData && cacheData.expiration && now > cacheData.expiration) {
              sessionStorage.removeItem(key);
              cleanedCount++;
            }
          } catch (error) {
            // Remove invalid cache entries
            sessionStorage.removeItem(key);
            cleanedCount++;
          }
        }
      });
    } else {
      // Cleanup memory fallback
      for (const [key, value] of this.memoryFallback.entries()) {
        if (key.startsWith('session_cache_')) {
          try {
            const cacheData = JSON.parse(value);
            if (cacheData && cacheData.expiration && now > cacheData.expiration) {
              this.memoryFallback.delete(key);
              cleanedCount++;
            }
          } catch (error) {
            this.memoryFallback.delete(key);
            cleanedCount++;
          }
        }
      }
    }

    return cleanedCount;
  }

  // Clear all app data (for logout or reset)
  clearAllAppData() {
    try {
      // Clear auth data
      this.removeAuthToken();
      this.removeUserData();
      this.removeUser(); // Also clear using alias

      // Clear app-specific data
      this.clearDraftCampaigns();
      this.clearRecentSearches();
      this.clearOnboardingStep();
      this.clearCache();

      // Clear form data
      if (this.isSessionStorageAvailable) {
        const keys = Object.keys(sessionStorage);
        keys.forEach((key) => {
          if (key.startsWith('form_')) {
            sessionStorage.removeItem(key);
          }
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to clear all app data:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const storageService = new StorageService();

// Auto-cleanup expired cache every 30 minutes
setInterval(() => {
  const cleanedCount = storageService.cleanupExpiredCache();
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired cache entries`);
  }
}, 30 * 60 * 1000);

export { storageService };
export default storageService;