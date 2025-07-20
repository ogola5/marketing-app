// services/api.js
import axios from 'axios';
import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS, HTTP_STATUS_CODES } from '../constants';
import { getErrorMessage, retry } from '../utils';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Call: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for unified error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized - clear auth and redirect to login
      if (status === HTTP_STATUS_CODES.UNAUTHORIZED) {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/';
        }
      }
      
      // Handle 429 Too Many Requests - implement retry with backoff
      if (status === HTTP_STATUS_CODES.TOO_MANY_REQUESTS && !originalRequest._retry) {
        originalRequest._retry = true;
        const retryAfter = error.response.headers['retry-after'] || 1;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return api(originalRequest);
      }
      
      // Log detailed error information
      console.error(`❌ API Error ${status}:`, {
        url: originalRequest.url,
        method: originalRequest.method,
        data: data,
        message: getErrorMessage(error)
      });
      
    } else if (error.request) {
      // Network error - no response received
      console.error('❌ Network Error:', {
        url: originalRequest.url,
        message: 'No response from server'
      });
    } else {
      // Something else went wrong
      console.error('❌ Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to build URL with parameters
const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
  // Replace URL parameters (e.g., /campaigns/{id} -> /campaigns/123)
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, params[key]);
  });
  
  return url;
};

// Generic API methods with error handling and retry logic
export const apiMethods = {
  // GET request
  get: async (endpoint, params = {}, options = {}) => {
    try {
      const response = await api.get(endpoint, {
        params,
        ...options
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },
  
  // POST request
  post: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await api.post(endpoint, data, options);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },
  
  // PUT request
  put: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await api.put(endpoint, data, options);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },
  
  // DELETE request
  delete: async (endpoint, options = {}) => {
    try {
      const response = await api.delete(endpoint, options);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },
  
  // POST with retry logic (for critical operations)
  postWithRetry: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await retry(
        () => api.post(endpoint, data, options),
        API_CONFIG.RETRY_ATTEMPTS
      );
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  }
};

// Authentication API calls
export const authAPI = {
  // Get Google login URL
  getGoogleLoginUrl: () => apiMethods.get(API_ENDPOINTS.AUTH.GOOGLE_LOGIN),
  
  // Simple email login
  login: (email) => apiMethods.post(API_ENDPOINTS.AUTH.LOGIN, { email }),
  
  // Simple email registration
  register: (email, name) => apiMethods.post(API_ENDPOINTS.AUTH.REGISTER, { email, name }),
  
  // Get user profile
  getProfile: () => apiMethods.get(API_ENDPOINTS.USER.PROFILE),
  
  // Update user profile
  updateProfile: (data) => apiMethods.put(API_ENDPOINTS.USER.PROFILE, data),
  
  // Complete onboarding
  completeOnboarding: (data) => apiMethods.post(API_ENDPOINTS.USER.ONBOARDING, data),
};

// Campaign API calls
export const campaignAPI = {
  // Get all campaigns
  getCampaigns: () => apiMethods.get(API_ENDPOINTS.CAMPAIGNS.BASE),
  
  // Get single campaign
  getCampaign: (id) => apiMethods.get(API_ENDPOINTS.CAMPAIGNS.BY_ID(id)),
  
  // Generate new campaign
  generateCampaign: (data) => apiMethods.postWithRetry(API_ENDPOINTS.CAMPAIGNS.GENERATE, data),
  
  // Update campaign
  updateCampaign: (id, data) => apiMethods.put(API_ENDPOINTS.CAMPAIGNS.BY_ID(id), data),
  
  // Delete campaign
  deleteCampaign: (id) => apiMethods.delete(API_ENDPOINTS.CAMPAIGNS.BY_ID(id)),
  
  // Send email campaign
  sendEmailCampaign: (id, recipients) => 
    apiMethods.post(API_ENDPOINTS.CAMPAIGNS.SEND_EMAIL(id), { recipients }),
};

// Lead API calls
export const leadAPI = {
  // Get all leads
  getLeads: () => apiMethods.get(API_ENDPOINTS.LEADS.BASE),
  
  // Update lead status
  updateLeadStatus: (id, status) => 
    apiMethods.put(API_ENDPOINTS.LEADS.UPDATE_STATUS(id), { status }),
};

// Dashboard API calls
export const dashboardAPI = {
  // Get dashboard data
  getDashboardData: () => apiMethods.get(API_ENDPOINTS.DASHBOARD),
};

// System API calls
export const systemAPI = {
  // Health check
  healthCheck: () => apiMethods.get(API_ENDPOINTS.SYSTEM.HEALTH),
  
  // Root endpoint
  getRoot: () => apiMethods.get(API_ENDPOINTS.SYSTEM.ROOT),
};

// File upload utilities
export const uploadAPI = {
  // Generic file upload
  uploadFile: async (file, endpoint, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: getErrorMessage(error) };
    }
  },
  
  // Avatar upload
  uploadAvatar: (file, onProgress) => uploadAPI.uploadFile(file, '/upload/avatar', onProgress),
  
  // Document upload
  uploadDocument: (file, onProgress) => uploadAPI.uploadFile(file, '/upload/document', onProgress),
};

// Utility functions for API configuration
export const apiUtils = {
  // Set authentication token
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  },
  
  // Clear authentication
  clearAuth: () => {
    apiUtils.setAuthToken(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
  
  // Update base URL (useful for environment switching)
  setBaseUrl: (baseUrl) => {
    api.defaults.baseURL = baseUrl;
  },
  
  // Get current base URL
  getBaseUrl: () => api.defaults.baseURL,
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
  
  // Get current auth token
  getAuthToken: () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }
};

// Export the configured axios instance as default
export default api;