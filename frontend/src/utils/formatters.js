// utils/formatters.js

// Date formatting utilities
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    const {
      format = 'short', // short, long, medium, relative, time, datetime
      locale = 'en-US',
      timeZone = undefined
    } = options;
    
    const formatOptions = { timeZone };
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString(locale, {
          ...formatOptions,
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
      case 'long':
        return dateObj.toLocaleDateString(locale, {
          ...formatOptions,
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'medium':
        return dateObj.toLocaleDateString(locale, {
          ...formatOptions,
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'time':
        return dateObj.toLocaleTimeString(locale, {
          ...formatOptions,
          hour: '2-digit',
          minute: '2-digit'
        });
        
      case 'datetime':
        return dateObj.toLocaleString(locale, {
          ...formatOptions,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
      case 'relative':
        return formatRelativeTime(dateObj);
        
      default:
        return dateObj.toLocaleDateString(locale, formatOptions);
    }
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
    
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return '';
  }
};

export const formatTimeAgo = (date) => {
  return formatRelativeTime(date);
};

export const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// Number formatting utilities
export const formatNumber = (number, options = {}) => {
  if (isNaN(number)) return '0';
  
  const {
    decimals = 0,
    locale = 'en-US',
    currency = null,
    percent = false,
    compact = false
  } = options;
  
  try {
    if (currency) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(number);
    }
    
    if (percent) {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(number / 100);
    }
    
    if (compact) {
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(number);
    }
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
    
  } catch (error) {
    console.error('Number formatting error:', error);
    return String(number);
  }
};

export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return formatNumber(amount, { currency, locale });
};

export const formatPercent = (value, decimals = 1) => {
  return formatNumber(value, { percent: true, decimals });
};

export const formatCompactNumber = (number, decimals = 1) => {
  if (isNaN(number)) return '0';
  
  const absNumber = Math.abs(number);
  
  if (absNumber >= 1000000000) {
    return (number / 1000000000).toFixed(decimals) + 'B';
  }
  if (absNumber >= 1000000) {
    return (number / 1000000).toFixed(decimals) + 'M';
  }
  if (absNumber >= 1000) {
    return (number / 1000).toFixed(decimals) + 'K';
  }
  
  return number.toString();
};

// Text formatting utilities
export const formatName = (firstName, lastName, options = {}) => {
  const {
    format = 'full', // full, first, last, initials, firstLast, lastFirst
    capitalize = true
  } = options;
  
  const first = capitalize ? capitalizeFirst(firstName || '') : (firstName || '');
  const last = capitalize ? capitalizeFirst(lastName || '') : (lastName || '');
  
  switch (format) {
    case 'first':
      return first;
    case 'last':
      return last;
    case 'initials':
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    case 'firstLast':
      return `${first} ${last}`.trim();
    case 'lastFirst':
      return `${last}, ${first}`.trim();
    case 'full':
    default:
      return `${first} ${last}`.trim();
  }
};

const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatPhoneNumber = (phone, format = 'US') => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (format === 'US') {
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
  }
  
  return phone; // Return original if can't format
};

export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Campaign specific formatting
export const formatCampaignType = (type) => {
  if (!type) return '';
  
  return type
    .split('_')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

export const formatCampaignStatus = (status) => {
  if (!status) return '';
  
  const statusMap = {
    draft: 'Draft',
    scheduled: 'Scheduled',
    sending: 'Sending',
    sent: 'Sent',
    completed: 'Completed',
    paused: 'Paused',
    cancelled: 'Cancelled'
  };
  
  return statusMap[status] || capitalizeFirst(status);
};

export const formatLeadStatus = (status) => {
  if (!status) return '';
  
  const statusMap = {
    cold: 'Cold',
    warm: 'Warm',
    hot: 'Hot',
    converted: 'Converted'
  };
  
  return statusMap[status] || capitalizeFirst(status);
};

// Content formatting
export const formatTextPreview = (text, maxLength = 150) => {
  if (!text) return '';
  
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  
  // Try to break at a word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

export const formatHashtags = (hashtags) => {
  if (!Array.isArray(hashtags)) return '';
  
  return hashtags
    .filter(tag => tag && tag.trim())
    .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
    .join(' ');
};

export const formatMentions = (mentions) => {
  if (!Array.isArray(mentions)) return '';
  
  return mentions
    .filter(mention => mention && mention.trim())
    .map(mention => mention.startsWith('@') ? mention : `@${mention}`)
    .join(' ');
};

// URL formatting
export const formatUrl = (url) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch {
    // If not a valid URL, try adding https://
    try {
      const urlObj = new URL(`https://${url}`);
      return urlObj.href;
    } catch {
      return url;
    }
  }
};

export const formatDomainName = (url) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

// Performance metrics formatting
export const formatConversionRate = (conversions, total) => {
  if (!total || total === 0) return '0%';
  
  const rate = (conversions / total) * 100;
  return `${rate.toFixed(1)}%`;
};

export const formatClickThroughRate = (clicks, impressions) => {
  return formatConversionRate(clicks, impressions);
};

export const formatEngagementMetrics = (metrics) => {
  if (!metrics) return {};
  
  const {
    sent = 0,
    opened = 0,
    clicked = 0,
    replied = 0,
    bounced = 0
  } = metrics;
  
  return {
    sent: formatCompactNumber(sent),
    opened: formatCompactNumber(opened),
    clicked: formatCompactNumber(clicked),
    replied: formatCompactNumber(replied),
    bounced: formatCompactNumber(bounced),
    openRate: formatConversionRate(opened, sent),
    clickRate: formatConversionRate(clicked, opened),
    replyRate: formatConversionRate(replied, sent),
    bounceRate: formatConversionRate(bounced, sent)
  };
};

// Address formatting
export const formatAddress = (address, format = 'single') => {
  if (!address) return '';
  
  const {
    street,
    city,
    state,
    zipCode,
    country
  } = address;
  
  const parts = [street, city, state, zipCode, country].filter(Boolean);
  
  if (format === 'single') {
    return parts.join(', ');
  }
  
  if (format === 'multi') {
    return parts.join('\n');
  }
  
  return parts;
};