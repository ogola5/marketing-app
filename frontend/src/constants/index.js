// src/constants/index.js

// Define constants FIRST
export const STATUS_COLORS = {
  active: "#4CAF50",     // Green
  inactive: "#F44336",   // Red
  pending: "#FFC107",    // Amber
  draft: "#9E9E9E",      // Grey
  completed: "#2196F3",  // Blue
  archived: "#607D8B"    // Blue Grey
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_DATA: "userData",
  USER_ROLE: "userRole",
  THEME_PREFERENCE: "themePreference",
  APP_SETTINGS: "appSettings",
  LAST_ACTIVE: "lastActiveTime"
};

// Now export other modules
export * from './api';
export * from './forms';
export * from './ui';

// Export aliases AFTER definitions
export const LEAD_STATUS_COLORS = STATUS_COLORS;
export const HTTP_STATUS_CODES = HTTP_STATUS;
export const LOCAL_STORAGE_KEYS = STORAGE_KEYS;