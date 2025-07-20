// constants/forms.js

// Campaign Types - matches backend CAMPAIGN_TYPES
export const CAMPAIGN_TYPES = [
  { 
    value: 'email', 
    label: 'Email Sequence', 
    description: 'Multi-email campaign for nurturing leads',
    icon: '📧'
  },
  { 
    value: 'social_media', 
    label: 'Social Media Posts', 
    description: 'Engaging posts for LinkedIn, Instagram, Twitter',
    icon: '📱'
  },
  { 
    value: 'direct_message', 
    label: 'Direct Messages', 
    description: 'Personalized outreach templates',
    icon: '💬'
  }
];

// Campaign Styles - matches backend CAMPAIGN_STYLES  
export const CAMPAIGN_STYLES = [
  { 
    value: 'persuasive', 
    label: 'Persuasive', 
    description: 'Professional and convincing' 
  },
  { 
    value: 'informative', 
    label: 'Informative', 
    description: 'Educational and valuable' 
  },
  { 
    value: 'casual', 
    label: 'Casual', 
    description: 'Friendly and approachable' 
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    description: 'Formal and business-like' 
  },
  { 
    value: 'urgent', 
    label: 'Urgent', 
    description: 'Direct and time-sensitive' 
  },
  { 
    value: 'friendly', 
    label: 'Friendly', 
    description: 'Warm and personal' 
  },
];

// Onboarding Steps - matches backend validation
export const ONBOARDING_STEPS = [
  {
    title: 'Business Type',
    question: 'What type of business do you run?',
    field: 'business_type',
    type: 'select',
    options: [
      'E-commerce',
      'SaaS', 
      'Consulting',
      'Agency',
      'Retail',
      'Restaurant',
      'Healthcare',
      'Education',
      'Real Estate',
      'Finance',
      'Technology',
      'Manufacturing',
      'Non-profit',
      'Other'
    ]
  },
  {
    title: 'Industry',
    question: 'What industry are you in?',
    field: 'industry',
    type: 'select',
    options: [
      'Technology',
      'Healthcare', 
      'Finance',
      'Education',
      'Retail',
      'Manufacturing',
      'Real Estate',
      'Marketing',
      'Consulting',
      'E-commerce',
      'Food & Beverage',
      'Travel & Tourism',
      'Entertainment',
      'Automotive',
      'Construction',
      'Energy',
      'Agriculture',
      'Fashion',
      'Sports',
      'Media',
      'Other'
    ]
  },
  {
    title: 'Product/Service',
    question: 'What do you offer?',
    field: 'product_service',
    type: 'textarea',
    placeholder: 'Describe your product or service...',
    maxLength: 500
  },
  {
    title: 'Target Audience',
    question: 'Who is your target audience?',
    field: 'target_audience',
    type: 'textarea',
    placeholder: 'Describe your ideal customers...',
    maxLength: 500
  },
  {
    title: 'Campaign Goal',
    question: 'What is your primary marketing goal?',
    field: 'campaign_goal',
    type: 'select',
    options: [
      'Lead Generation',
      'Sales Conversion',
      'Brand Awareness',
      'Customer Retention',
      'Product Launch',
      'Event Promotion',
      'Newsletter Signup',
      'App Downloads',
      'Website Traffic',
      'Social Media Engagement',
      'Customer Feedback',
      'Upsell/Cross-sell',
      'Other'
    ]
  }
];

// Lead Statuses - matches backend LEAD_STATUSES
export const LEAD_STATUSES = [
  { value: 'cold', label: 'Cold', color: 'blue' },
  { value: 'warm', label: 'Warm', color: 'yellow' },
  { value: 'hot', label: 'Hot', color: 'red' },
  { value: 'converted', label: 'Converted', color: 'green' },
];

// Campaign Statuses - matches backend CAMPAIGN_STATUSES
export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'scheduled', label: 'Scheduled', color: 'blue' },
  { value: 'sending', label: 'Sending', color: 'yellow' },
  { value: 'sent', label: 'Sent', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'purple' },
  { value: 'paused', label: 'Paused', color: 'orange' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
];

// Form Validation Rules - matches backend VALIDATION_RULES
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    MAX_LENGTH: 254,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s\-'\.]+$/,
  },
  CAMPAIGN_TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  CAMPAIGN_CONTENT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 10000,
  },
  BUSINESS_NAME: {
    MAX_LENGTH: 100,
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`,
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, number and special character',
  NAME_TOO_SHORT: `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`,
  NAME_INVALID: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods',
  CAMPAIGN_TITLE_TOO_SHORT: `Campaign title must be at least ${VALIDATION_RULES.CAMPAIGN_TITLE.MIN_LENGTH} characters`,
  CAMPAIGN_CONTENT_TOO_SHORT: `Campaign content must be at least ${VALIDATION_RULES.CAMPAIGN_CONTENT.MIN_LENGTH} characters`,
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'Session expired. Please log in again.',
  SERVER_ERROR: 'Server error. Please try again later.',
};