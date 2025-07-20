// utils/validators.js
import { VALIDATION_RULES, ERROR_MESSAGES } from '../constants';

// Basic validation functions
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
};

export const minLength = (value, min) => {
  if (!value) return false;
  return String(value).length >= min;
};

export const maxLength = (value, max) => {
  if (!value) return true; // Allow empty values, use isRequired for required validation
  return String(value).length <= max;
};

export const isEmail = (email) => {
  if (!email) return false;
  return VALIDATION_RULES.EMAIL.PATTERN.test(email) && 
         email.length <= VALIDATION_RULES.EMAIL.MAX_LENGTH;
};

export const isValidName = (name) => {
  if (!name) return false;
  return VALIDATION_RULES.NAME.PATTERN.test(name) &&
         name.length >= VALIDATION_RULES.NAME.MIN_LENGTH &&
         name.length <= VALIDATION_RULES.NAME.MAX_LENGTH;
};

export const isStrongPassword = (password) => {
  if (!password) return false;
  return password.length >= VALIDATION_RULES.PASSWORD.MIN_LENGTH &&
         VALIDATION_RULES.PASSWORD.PATTERN.test(password);
};

export const isUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isPhoneNumber = (phone) => {
  if (!phone) return false;
  // Simple phone validation - adjust based on your needs
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Email validation functions
export const validateEmail = (email) => {
  const errors = [];
  
  if (!isRequired(email)) {
    errors.push(ERROR_MESSAGES.REQUIRED);
  } else if (!isEmail(email)) {
    errors.push(ERROR_MESSAGES.INVALID_EMAIL);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmailList = (emails) => {
  if (!Array.isArray(emails)) {
    return {
      isValid: false,
      errors: ['Email list must be an array'],
      validEmails: [],
      invalidEmails: []
    };
  }
  
  if (emails.length === 0) {
    return {
      isValid: false,
      errors: ['At least one email is required'],
      validEmails: [],
      invalidEmails: []
    };
  }
  
  const validEmails = [];
  const invalidEmails = [];
  
  emails.forEach(email => {
    const trimmedEmail = String(email).trim();
    if (isEmail(trimmedEmail)) {
      validEmails.push(trimmedEmail);
    } else {
      invalidEmails.push(trimmedEmail);
    }
  });
  
  const errors = [];
  if (invalidEmails.length > 0) {
    errors.push(`Invalid email addresses: ${invalidEmails.join(', ')}`);
  }
  if (validEmails.length === 0) {
    errors.push('No valid email addresses found');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validEmails,
    invalidEmails
  };
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];
  
  if (!isRequired(password)) {
    errors.push(ERROR_MESSAGES.REQUIRED);
  } else {
    if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      errors.push(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
    }
    
    if (!VALIDATION_RULES.PASSWORD.PATTERN.test(password)) {
      errors.push(ERROR_MESSAGES.PASSWORD_WEAK);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: getPasswordStrength(password)
  };
};

export const getPasswordStrength = (password) => {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  
  // Character types
  if (/[a-z]/.test(password)) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  // Complexity
  if (password.length >= 16) strength += 1;
  
  return Math.min(strength, 5); // Max strength of 5
};

// Name validation
export const validateName = (name) => {
  const errors = [];
  
  if (!isRequired(name)) {
    errors.push(ERROR_MESSAGES.REQUIRED);
  } else if (!isValidName(name)) {
    if (name.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
      errors.push(ERROR_MESSAGES.NAME_TOO_SHORT);
    } else if (name.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
      errors.push(`Name must be no more than ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`);
    } else {
      errors.push(ERROR_MESSAGES.NAME_INVALID);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Campaign validation
export const validateCampaignTitle = (title) => {
  const errors = [];
  
  if (!isRequired(title)) {
    errors.push(ERROR_MESSAGES.REQUIRED);
  } else {
    if (title.length < VALIDATION_RULES.CAMPAIGN_TITLE.MIN_LENGTH) {
      errors.push(ERROR_MESSAGES.CAMPAIGN_TITLE_TOO_SHORT);
    }
    if (title.length > VALIDATION_RULES.CAMPAIGN_TITLE.MAX_LENGTH) {
      errors.push(`Title must be no more than ${VALIDATION_RULES.CAMPAIGN_TITLE.MAX_LENGTH} characters`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCampaignContent = (content) => {
  const errors = [];
  
  if (!isRequired(content)) {
    errors.push(ERROR_MESSAGES.REQUIRED);
  } else {
    if (content.length < VALIDATION_RULES.CAMPAIGN_CONTENT.MIN_LENGTH) {
      errors.push(ERROR_MESSAGES.CAMPAIGN_CONTENT_TOO_SHORT);
    }
    if (content.length > VALIDATION_RULES.CAMPAIGN_CONTENT.MAX_LENGTH) {
      errors.push(`Content must be no more than ${VALIDATION_RULES.CAMPAIGN_CONTENT.MAX_LENGTH} characters`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCampaignType = (type, allowedTypes) => {
  const errors = [];
  
  if (!isRequired(type)) {
    errors.push('Campaign type is required');
  } else if (allowedTypes && !allowedTypes.includes(type)) {
    errors.push('Invalid campaign type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Onboarding validation
export const validateOnboardingStep = (field, value, stepConfig) => {
  const errors = [];
  
  if (!isRequired(value)) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }
  
  if (stepConfig.type === 'textarea') {
    if (value.length < 10) {
      errors.push('Please provide at least 10 characters');
    }
    if (stepConfig.maxLength && value.length > stepConfig.maxLength) {
      errors.push(`Must be no more than ${stepConfig.maxLength} characters`);
    }
  }
  
  if (stepConfig.options && !stepConfig.options.includes(value)) {
    errors.push('Please select a valid option');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateOnboardingForm = (formData, steps) => {
  const errors = {};
  const fieldErrors = [];
  
  steps.forEach(step => {
    const value = formData[step.field];
    const validation = validateOnboardingStep(step.field, value, step);
    
    if (!validation.isValid) {
      errors[step.field] = validation.errors;
      fieldErrors.push(`${step.title}: ${validation.errors.join(', ')}`);
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    fieldErrors,
    summary: fieldErrors.length > 0 ? `Please fix the following: ${fieldErrors.join('; ')}` : null
  };
};

// Generic form validation
export const validateForm = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    const fieldErrors = [];
    
    // Required check
    if (rules.required && !isRequired(value)) {
      fieldErrors.push(ERROR_MESSAGES.REQUIRED);
    }
    
    // Skip other validations if field is empty and not required
    if (!isRequired(value) && !rules.required) {
      return;
    }
    
    // Type-specific validations
    if (rules.type === 'email' && !isEmail(value)) {
      fieldErrors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }
    
    if (rules.type === 'password') {
      const passwordValidation = validatePassword(value);
      fieldErrors.push(...passwordValidation.errors);
    }
    
    if (rules.type === 'name' && !isValidName(value)) {
      fieldErrors.push(ERROR_MESSAGES.NAME_INVALID);
    }
    
    // Length validations
    if (rules.minLength && !minLength(value, rules.minLength)) {
      fieldErrors.push(`Must be at least ${rules.minLength} characters`);
    }
    
    if (rules.maxLength && !maxLength(value, rules.maxLength)) {
      fieldErrors.push(`Must be no more than ${rules.maxLength} characters`);
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      fieldErrors.push(rules.patternMessage || 'Invalid format');
    }
    
    // Custom validation function
    if (rules.validator && typeof rules.validator === 'function') {
      const customValidation = rules.validator(value, formData);
      if (!customValidation.isValid) {
        fieldErrors.push(...customValidation.errors);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    hasErrors: (field) => field ? !!errors[field] : Object.keys(errors).length > 0,
    getFieldErrors: (field) => errors[field] || [],
    getAllErrors: () => Object.values(errors).flat()
  };
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'],
    required = false
  } = options;
  
  const errors = [];
  
  if (!file) {
    if (required) {
      errors.push('File is required');
    }
    return { isValid: !required, errors };
  }
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Business validation helpers
export const validateBusinessData = (data) => {
  const validationRules = {
    business_type: {
      required: true,
      type: 'select'
    },
    industry: {
      required: true,
      type: 'select'
    },
    product_service: {
      required: true,
      minLength: 10,
      maxLength: 500
    },
    target_audience: {
      required: true,
      minLength: 10,
      maxLength: 500
    },
    campaign_goal: {
      required: true,
      type: 'select'
    }
  };
  
  return validateForm(data, validationRules);
};

// Sanitization helpers
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return input;
  
  const {
    removeHtml = true,
    removeTags = true,
    maxLength = null,
    allowedChars = null
  } = options;
  
  let sanitized = input;
  
  // Remove HTML tags
  if (removeHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Remove script tags specifically
  if (removeTags) {
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  // Filter allowed characters
  if (allowedChars) {
    const regex = new RegExp(`[^${allowedChars}]`, 'g');
    sanitized = sanitized.replace(regex, '');
  }
  
  // Truncate if needed
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
};