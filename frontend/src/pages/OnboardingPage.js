import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingForm, Loading, ErrorMessage } from '../components';
import { authService } from '../services';
import { ROUTES } from '../constants';
import { useAuth } from '../hooks/useAuth';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      navigate(ROUTES.LOGIN);
    }
    // Redirect if already onboarded
    if (!authLoading && user?.isOnboarded) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, authLoading, navigate]);

  const handleOnboardingComplete = async (businessData) => {
    setLoading(true);
    setError('');

    try {
      await authService.completeOnboarding(businessData);
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding');
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Optional: Allow users to skip onboarding
    navigate(ROUTES.DASHBOARD);
  };

  if (authLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to AI Marketing Agent! 🎉
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let's set up your business profile to personalize your AI-powered marketing campaigns
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Account Created ✓</span>
              <span className="font-semibold text-indigo-600">Business Setup</span>
              <span>Ready to Launch</span>
            </div>
            <div className="mt-2 relative">
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-2 bg-indigo-600 rounded-full w-1/2 transition-all duration-300"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {error && (
              <ErrorMessage 
                message={error} 
                onDismiss={() => setError('')}
                className="mb-6"
              />
            )}

            <OnboardingForm
              onSubmit={handleOnboardingComplete}
              loading={loading}
              initialData={user?.businessData}
            />

            {/* Skip Option */}
            <div className="mt-6 text-center border-t pt-6">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 text-sm"
                disabled={loading}
              >
                Skip for now, I'll set up later →
              </button>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Personalized Campaigns</h3>
            <p className="text-gray-600 text-sm">AI tailors content to your brand voice and industry</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Instant Generation</h3>
            <p className="text-gray-600 text-sm">Create professional campaigns in seconds, not hours</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Track Performance</h3>
            <p className="text-gray-600 text-sm">Monitor leads and optimize your marketing strategy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;