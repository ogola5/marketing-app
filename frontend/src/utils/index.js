// src/utils/index.js

// Re-export specific functions from helpers
export {
  formatDate, // Now defined in helpers.js
  getUrlParams, // For LoginPage.js
  getErrorMessage, // For api.js
  retry, // For api.js
  safeLocalStorage, // For authService.js and campaignService.js
  formatNumber as formatNumberFromHelpers,
  buildUrl,
  calculatePercentage,
  capitalizeFirst,
  capitalizeWords,
  cleanString,
  copyToClipboard,
  countWords,
  debounce,
  deepClone,
  delay,
  downloadAsFile,
  estimateReadingTime,
  extractEmailsFromText,
  extractHashtags,
  formatBytes,
  generateCampaignTitle,
  groupBy,
  isEmpty,
  isNetworkError,
  maskEmail,
  omitKeys,
  pickKeys,
  randomBetween,
  removeDuplicates,
  slugify,
  sortBy,
  throttle,
  truncateText,
} from './helpers';

// Re-export specific functions from formatters
export {
  formatNumber as formatNumberFromFormatters,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
} from './formatters';

// Re-export all validators and constants
export * from './validators';
export * from './constants';