import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthComponent';
import { LoginComponent } from './components/LoginComponent';
import { OnboardingComponent } from './components/OnboardingComponent';
import { DashboardComponent } from './components/DashboardComponent';
import './App.css';

const AppContent = () => {
  const { user, loading, login } = useAuth();
  
  // Handle Google OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userEmail = urlParams.get('user');
    const userName = urlParams.get('name');
    const userPicture = urlParams.get('picture');
    
    if (token && userEmail && userName) {
      const userData = {
        email: userEmail,
        name: userName,
        picture: userPicture || null,
        onboarding_completed: false
      };
      
      login(userData, token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return <LoginComponent />;
  if (!user.onboarding_completed) return <OnboardingComponent />;
  return <DashboardComponent />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}