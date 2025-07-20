// utils/constants.js

// Date/Time constants
export const TIME_UNITS = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
};

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  US: 'MM/DD/YYYY',
  EU: 'DD/MM/YYYY',
  LONG: 'MMMM DD, YYYY',
  SHORT: 'MMM DD',
  TIME_12: 'hh:mm A',
  TIME_24: 'HH:mm',
  DATETIME: 'MMM DD, YYYY HH:mm'
};

// File size constants
export const FILE_SIZES = {
  BYTE: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024
};

export const MAX_FILE_SIZES = {
  AVATAR: 2 * FILE_SIZES.MB,
  DOCUMENT: 10 * FILE_SIZES.MB,
  IMAGE: 5 * FILE_SIZES.MB,
  VIDEO: 100 * FILE_SIZES.MB
};

// Text length limits
export const TEXT_LIMITS = {
  TWEET: 280,
  LINKEDIN_POST: 3000,
  INSTAGRAM_CAPTION: 2200,
  FACEBOOK_POST: 63206,
  EMAIL_SUBJECT: 50,
  META_DESCRIPTION: 155,
  BLOG_TITLE: 60,
  CAMPAIGN_TITLE: 200,
  CAMPAIGN_CONTENT: 10000
};

// Common regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_US: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  PHONE_INTERNATIONAL: /^\+?[1-9]\d{1,14}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  HASHTAG: /#[\w]+/g,
  MENTION: /@[\w]+/g,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
};

// HTTP status codes for frontend handling
export const HTTP_STATUS_CODES = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Error types for consistent error handling
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
};

// Loading states
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Local storage keys (to avoid conflicts with existing constants)
export const LOCAL_STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  DRAFT_CAMPAIGNS: 'draft_campaigns',
  RECENT_SEARCHES: 'recent_searches',
  THEME: 'theme_preference',
  LANGUAGE: 'language_preference'
};

// Debounce/throttle delays (in milliseconds)
export const DELAYS = {
  SEARCH_DEBOUNCE: 300,
  AUTO_SAVE: 1000,
  TYPING_INDICATOR: 500,
  TOOLTIP_SHOW: 200,
  TOOLTIP_HIDE: 100,
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
  ITEMS_PER_PAGE_OPTIONS: [10, 20, 50, 100]
};

// Social media platform limits
export const SOCIAL_MEDIA_LIMITS = {
  TWITTER: {
    POST_LENGTH: 280,
    HASHTAGS_MAX: 2,
    MENTIONS_MAX: 10
  },
  LINKEDIN: {
    POST_LENGTH: 3000,
    HASHTAGS_MAX: 5,
    MENTIONS_MAX: 5
  },
  INSTAGRAM: {
    CAPTION_LENGTH: 2200,
    HASHTAGS_MAX: 30,
    MENTIONS_MAX: 20
  },
  FACEBOOK: {
    POST_LENGTH: 63206,
    HASHTAGS_MAX: 3,
    MENTIONS_MAX: 50
  }
};

// Campaign performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  EMAIL: {
    OPEN_RATE: {
      EXCELLENT: 25,
      GOOD: 20,
      AVERAGE: 15,
      POOR: 10
    },
    CLICK_RATE: {
      EXCELLENT: 5,
      GOOD: 3,
      AVERAGE: 2,
      POOR: 1
    },
    BOUNCE_RATE: {
      EXCELLENT: 2,
      GOOD: 5,
      AVERAGE: 10,
      POOR: 15
    }
  },
  SOCIAL_MEDIA: {
    ENGAGEMENT_RATE: {
      EXCELLENT: 6,
      GOOD: 3,
      AVERAGE: 1.5,
      POOR: 1
    }
  }
};

// Color palette for charts and status indicators
export const CHART_COLORS = {
  PRIMARY: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
  NEUTRAL: '#6b7280'
};

// Animation easing functions
export const EASING = {
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

// API retry configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000,
  MAX_DELAY: 5000,
  BACKOFF_FACTOR: 2,
  RETRYABLE_STATUS_CODES: [408, 429, 500, 502, 503, 504]
};

// Feature flags for development
export const FEATURE_FLAGS = {
  DEVELOPMENT: process.env.NODE_ENV === 'development',
  BETA_FEATURES: process.env.REACT_APP_BETA_FEATURES === 'true',
  DEBUG_MODE: process.env.REACT_APP_DEBUG === 'true',
  ANALYTICS: process.env.REACT_APP_ANALYTICS === 'true'
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SAVE: 'Ctrl+S',
  COPY: 'Ctrl+C',
  PASTE: 'Ctrl+V',
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Y',
  SEARCH: 'Ctrl+K',
  NEW_CAMPAIGN: 'Ctrl+N',
  ESCAPE: 'Escape',
  ENTER: 'Enter'
};

// Browser detection helpers
export const BROWSER_FEATURES = {
  CLIPBOARD_API: 'clipboard' in navigator,
  NOTIFICATIONS: 'Notification' in window,
  LOCAL_STORAGE: (() => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  })(),
  WEBRTC: 'RTCPeerConnection' in window,
  SERVICE_WORKER: 'serviceWorker' in navigator
};