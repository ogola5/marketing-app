import React, { useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const LoginComponent = () => {
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailFormData, setEmailFormData] = useState({ email: '', name: '', isLogin: false });

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/api/auth/google/login`);
      if (response.data.auth_url) {
        window.location.href = response.data.auth_url;
      }
    } catch (error) {
      console.error('Google login failed:', error);
      alert(`Google login failed: ${error.response?.data?.detail || error.message}`);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = emailFormData.isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = emailFormData.isLogin 
        ? { email: emailFormData.email }
        : { email: emailFormData.email, name: emailFormData.name };
      
      const response = await axios.post(`${API}${endpoint}`, payload);
      
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        window.location.reload();
      }
    } catch (error) {
      console.error('Email auth failed:', error);
      alert(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">AI Marketing Agent</h1>
          <p className="text-gray-600">Generate powerful marketing campaigns with AI</p>
        </div>
        
        {!showEmailForm ? (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
            
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg"
            >
              Continue with Email
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="flex space-x-2 mb-4">
              <button
                type="button"
                onClick={() => setEmailFormData({...emailFormData, isLogin: false})}
                className={`flex-1 py-2 px-4 rounded-lg ${!emailFormData.isLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setEmailFormData({...emailFormData, isLogin: true})}
                className={`flex-1 py-2 px-4 rounded-lg ${emailFormData.isLogin ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
              >
                Login
              </button>
            </div>

            <input
              type="email"
              placeholder="Email address"
              value={emailFormData.email}
              onChange={(e) => setEmailFormData({...emailFormData, email: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            
            {!emailFormData.isLogin && (
              <input
                type="text"
                placeholder="Full name"
                value={emailFormData.name}
                onChange={(e) => setEmailFormData({...emailFormData, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg"
            >
              {loading ? 'Processing...' : (emailFormData.isLogin ? 'Login' : 'Register')}
            </button>

            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="w-full text-gray-500 text-sm"
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};