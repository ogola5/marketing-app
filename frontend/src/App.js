// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// CORRECTED IMPORT: Add PublicRoute to the destructuring
import { AuthProvider, useAuth, ProtectedRoute, PublicRoute } from './components/AuthComponent'; 

import { LoginComponent } from './components/LoginComponent';
import { OnboardingComponent } from './components/OnboardingComponent';
import { DashboardComponent } from './components/DashboardComponent';
import { ProfileComponent } from './components/ProfileComponent';
import  CampaignComponent  from './components/CampaignComponent';
import { LandingComponent } from './components/LandingComponent';
// Remove this line if ProtectedRoute is now coming from AuthComponent.js
// import ProtectedRoute from './components/ProtectedRoute'; // <-- REMOVE THIS LINE IF PROTECTEDROUTE IS EXPORTED FROM AUTHCOMPONENT

import './App.css';

// ... (rest of your App.js code remains the same as the last correct version)

const AppContent = () => {
  const { user, loading, isAuthenticated, needsOnboarding } = useAuth(); 

  // Initial redirect logic for / if user is authenticated
  if (!loading && isAuthenticated && needsOnboarding && window.location.pathname === '/') {
    return <Navigate to="/onboarding" replace />;
  }
  if (!loading && isAuthenticated && !needsOnboarding && window.location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingComponent />} />
      <Route path="/login" element={<LoginComponent />} />

      <Route
        path="/auth/google/callback"
        element={
          <PublicRoute> {/* This is where PublicRoute was undefined */}
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="ml-4 text-indigo-700">Processing Google Login...</p>
            </div>
          </PublicRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={true}>
            <OnboardingComponent />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardComponent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaign"
        element={
          <ProtectedRoute>
            <CampaignComponent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileComponent />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}