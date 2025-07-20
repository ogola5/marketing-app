// pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { LoginForm } from '../components/forms';
import { Loading } from '../components/common';
import { authService } from '../services';
import { APP_METADATA } from '../constants';
import { getUrlParams } from '../utils';

const LoginPage = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    try {
      // Check for OAuth callback parameters
      const urlParams = getUrlParams();
      
      if (Object.keys(urlParams).length > 0) {
        await handleOAuthCallback(urlParams);
      }
      
      // Clean up URL parameters
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Page initialization failed:', error);
      setError('Failed to initialize login page');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleOAuthCallback = async (urlParams) => {
    try {
      setLoading(true);
      
      const result = authService.handleOAuthCallback(urlParams);
      
      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess(result);
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('OAuth callback failed:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      
      const result = await authService.initiateGoogleLogin();
      
      if (!result.success) {
        setError(result.error || 'Failed to initiate Google login');
        setGoogleLoading(false);
      }
      // If successful, user will be redirected to Google
    } catch (error) {
      console.error('Google login failed:', error);
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      if (formData.isLogin) {
        result = await authService.loginWithEmail(formData.email);
      } else {
        result = await authService.registerWithEmail(formData.email, formData.name);
      }
      
      if (result.success) {
        if (onAuthSuccess) {
          onAuthSuccess(result);
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Email authentication failed:', error);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Loading size="LG" color="white" text="Initializing..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">AI</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {APP_METADATA.NAME}
          </h1>
          <p className="text-gray-600">
            {APP_METADATA.DESCRIPTION}
          </p>
        </div>

        {/* Login Form */}
        <LoginForm
          onSubmit={handleEmailAuth}
          onGoogleLogin={handleGoogleLogin}
          loading={loading}
          googleLoading={googleLoading}
          error={error}
        />

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <a 
              href="/privacy" 
              className="hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="/terms" 
              className="hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </a>
            <span>•</span>
            <a 
              href="/help" 
              className="hover:text-gray-700 transition-colors"
            >
              Help
            </a>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            © 2024 {APP_METADATA.NAME}. All rights reserved.
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default LoginPage;