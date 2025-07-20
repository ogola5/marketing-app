// constants/ui.js

// App Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ONBOARDING: '/onboarding', 
  DASHBOARD: '/dashboard',
  CAMPAIGNS: '/campaigns',
  LEADS: '/leads',
  PROFILE: '/profile',
};

// Status Colors - Tailwind CSS classes
export const STATUS_COLORS = {
  // Campaign statuses
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  sending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sent: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-purple-100 text-purple-800 border-purple-200',
  paused: 'bg-orange-100 text-orange-800 border-orange-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  
  // Lead statuses
  cold: 'bg-blue-100 text-blue-800 border-blue-200',
  warm: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hot: 'bg-red-100 text-red-800 border-red-200',
  converted: 'bg-green-100 text-green-800 border-green-200',
};

// Button Variants
export const BUTTON_VARIANTS = {
  PRIMARY: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  SECONDARY: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  SUCCESS: 'bg-green-600 hover:bg-green-700 text-white',
  DANGER: 'bg-red-600 hover:bg-red-700 text-white',
  WARNING: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  OUTLINE: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
};

// Button Sizes
export const BUTTON_SIZES = {
  SM: 'px-3 py-1.5 text-sm',
  MD: 'px-4 py-2 text-sm', 
  LG: 'px-6 py-3 text-base',
  XL: 'px-8 py-4 text-lg',
};

// Card Styles
export const CARD_STYLES = {
  DEFAULT: 'bg-white rounded-lg shadow-sm border border-gray-200',
  HOVER: 'bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow',
  ELEVATED: 'bg-white rounded-xl shadow-lg border border-gray-100',
};

// Input Styles
export const INPUT_STYLES = {
  DEFAULT: 'w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none',
  ERROR: 'w-full p-3 border border-red-300 rounded-lg focus:border-red-600 focus:outline-none bg-red-50',
  SUCCESS: 'w-full p-3 border border-green-300 rounded-lg focus:border-green-600 focus:outline-none',
};

// Animation Classes
export const ANIMATIONS = {
  SPIN: 'animate-spin',
  PULSE: 'animate-pulse',
  BOUNCE: 'animate-bounce',
  FADE_IN: 'animate-fade-in',
  SLIDE_UP: 'animate-slide-up',
  SLIDE_DOWN: 'animate-slide-down',
};

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 10,
  STICKY: 20,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
};

// Breakpoints (matches Tailwind CSS)
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px', 
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
};

// Spacing Scale (matches Tailwind CSS)
export const SPACING = {
  XS: '0.25rem',   // 1
  SM: '0.5rem',    // 2
  MD: '1rem',      // 4
  LG: '1.5rem',    // 6
  XL: '2rem',      // 8
  '2XL': '3rem',   // 12
};

// Icon Sizes
export const ICON_SIZES = {
  XS: 'w-3 h-3',
  SM: 'w-4 h-4',
  MD: 'w-5 h-5',
  LG: 'w-6 h-6',
  XL: 'w-8 h-8',
  '2XL': 'w-10 h-10',
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Modal Sizes
export const MODAL_SIZES = {
  SM: 'max-w-md',
  MD: 'max-w-lg',
  LG: 'max-w-2xl',
  XL: 'max-w-4xl',
  FULL: 'max-w-full',
};

// Campaign Type Icons
export const CAMPAIGN_TYPE_ICONS = {
  email: '📧',
  social_media: '📱',
  direct_message: '💬',
  sms: '📲',
};

// Dashboard Stats Icons
export const STATS_ICONS = {
  campaigns: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  leads: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  hot_leads: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    </svg>
  ),
  warm_leads: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

// Default Avatar
export const DEFAULT_AVATAR = 'https://via.placeholder.com/32';

// App Metadata
export const APP_METADATA = {
  NAME: process.env.REACT_APP_APP_NAME || 'AI Marketing Agent',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  DESCRIPTION: 'Generate powerful marketing campaigns with AI',
};