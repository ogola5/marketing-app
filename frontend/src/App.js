import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, CampaignProvider, ThemeProvider } from './contexts';
import { useAuth } from './hooks';
import { 
  LoginPage, 
  OnboardingPage, 
  DashboardPage, 
  CampaignsPage, 
  LeadsPage 
} from './pages';
import { Loading } from './components';
import { ROUTES } from './constants';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading fullScreen />;
  }
  
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  if (!user.isOnboarded) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }
  
  return children;
};

// App Content with Router
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path={ROUTES.LOGIN} 
        element={user ? <Navigate to={ROUTES.DASHBOARD} replace /> : <LoginPage />} 
      />
      
      {/* Onboarding Route */}
      <Route 
        path={ROUTES.ONBOARDING} 
        element={
          !user ? <Navigate to={ROUTES.LOGIN} replace /> :
          user.isOnboarded ? <Navigate to={ROUTES.DASHBOARD} replace /> :
          <OnboardingPage />
        } 
      />
      
      {/* Protected Routes */}
      <Route path={ROUTES.DASHBOARD} element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      
      <Route path={ROUTES.CAMPAIGNS} element={
        <ProtectedRoute>
          <CampaignsPage />
        </ProtectedRoute>
      } />
      
      <Route path={ROUTES.LEADS} element={
        <ProtectedRoute>
          <LeadsPage />
        </ProtectedRoute>
      } />
      
      {/* Default Route */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      
      {/* 404 Route */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-8">Page not found</p>
            <a href={ROUTES.DASHBOARD} className="text-indigo-600 hover:text-indigo-700">
              Go to Dashboard
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CampaignProvider>
            <AppContent />
          </CampaignProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;