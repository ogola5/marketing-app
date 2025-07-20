// constants/api.js

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// API Endpoints - matches your backend routes exactly
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    GOOGLE_LOGIN: '/api/auth/google/login',
    GOOGLE_CALLBACK: '/api/auth/google/callback',
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
  },
  
  // User endpoints
  USER: {
    PROFILE: '/api/profile',
    ONBOARDING: '/api/onboarding',
  },
  
  // Campaign endpoints
  CAMPAIGNS: {
    BASE: '/api/campaigns',
    GENERATE: '/api/campaigns/generate',
    BY_ID: (id) => `/api/campaigns/${id}`,
    SEND_EMAIL: (id) => `/api/campaigns/${id}/send-email`,
  },
  
  // Lead endpoints
  LEADS: {
    BASE: '/api/leads',
    UPDATE_STATUS: (id) => `/api/leads/${id}/status`,
  },
  
  // Dashboard endpoints
  DASHBOARD: '/api/dashboard',
  
  // System endpoints
  SYSTEM: {
    HEALTH: '/api/health',
    ROOT: '/api/',
  },
  
  // Debug endpoints
  DEBUG: {
    GOOGLE_CONFIG: '/api/debug/google-config',
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  ONBOARDING_STEP: 'onboarding_step',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// Request Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};