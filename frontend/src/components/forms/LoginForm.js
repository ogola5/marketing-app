// components/forms/LoginForm.js
import React, { useState } from 'react';
import { Button, ErrorMessage } from '../common';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../../constants';

const LoginForm = ({ 
  onSubmit, 
  loading = false, 
  error = null,
  onGoogleLogin,
  googleLoading = false 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    isLogin: false
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateEmail = (email) => {
    if (!email) return ERROR_MESSAGES.REQUIRED;
    if (!VALIDATION_RULES.EMAIL.PATTERN.test(email)) {
      return ERROR_MESSAGES.INVALID_EMAIL;
    }
    if (email.length > VALIDATION_RULES.EMAIL.MAX_LENGTH) {
      return `Email must be no more than ${VALIDATION_RULES.EMAIL.MAX_LENGTH} characters`;
    }
    return null;
  };

  const validateName = (name) => {
    if (!name) return ERROR_MESSAGES.REQUIRED;
    if (name.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
      return ERROR_MESSAGES.NAME_TOO_SHORT;
    }
    if (name.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
      return `Name must be no more than ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`;
    }
    if (!VALIDATION_RULES.NAME.PATTERN.test(name)) {
      return ERROR_MESSAGES.NAME_INVALID;
    }
    return null;
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate email
    const emailError = validateEmail(formData.email);
    if (emailError) errors.email = emailError;
    
    // Validate name for registration
    if (!formData.isLogin) {
      const nameError = validateName(formData.name);
      if (nameError) errors.name = nameError;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const submitData = {
      email: formData.email.trim(),
      ...(formData.isLogin ? {} : { name: formData.name.trim() }),
      isLogin: formData.isLogin
    };
    
    onSubmit(submitData);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: null });
    }
  };

  const toggleMode = (isLogin) => {
    setFormData({ ...formData, isLogin });
    setValidationErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Google Login Button */}
      <Button
        onClick={onGoogleLogin}
        loading={googleLoading}
        disabled={loading || googleLoading}
        variant="DANGER"
        size="LG"
        className="w-full"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        }
      >
        {googleLoading ? 'Connecting...' : 'Continue with Google'}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex space-x-2">
        <Button
          onClick={() => toggleMode(false)}
          variant={!formData.isLogin ? 'PRIMARY' : 'OUTLINE'}
          size="MD"
          className="flex-1"
          disabled={loading}
        >
          Register
        </Button>
        <Button
          onClick={() => toggleMode(true)}
          variant={formData.isLogin ? 'PRIMARY' : 'OUTLINE'}
          size="MD"
          className="flex-1"
          disabled={loading}
        >
          Login
        </Button>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <input
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:outline-none transition-colors ${
              validationErrors.email 
                ? 'border-red-300 focus:border-red-600 bg-red-50' 
                : 'border-gray-300 focus:border-indigo-600'
            }`}
            disabled={loading}
            required
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        {/* Name Field (Registration only) */}
        {!formData.isLogin && (
          <div>
            <input
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none transition-colors ${
                validationErrors.name 
                  ? 'border-red-300 focus:border-red-600 bg-red-50' 
                  : 'border-gray-300 focus:border-indigo-600'
              }`}
              disabled={loading}
              required
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            variant="danger"
            className="mb-4"
          />
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          loading={loading}
          disabled={loading || googleLoading}
          variant="PRIMARY"
          size="LG"
          className="w-full"
        >
          {formData.isLogin ? 'Login' : 'Register'}
        </Button>
      </form>

      {/* Terms Text */}
      <div className="text-center text-sm text-gray-500">
        <p>By continuing, you agree to our Terms of Service</p>
      </div>
    </div>
  );
};

export default LoginForm;