import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Components
const LoginPage = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/auth/google/login`);
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Google login failed:', error);
      setLoading(false);
    }
  };

  const handleEmergentLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/auth/emergent`);
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Emergent login failed:', error);
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
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>
          
          <button
            onClick={handleEmergentLogin}
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{loading ? 'Connecting...' : 'Continue with Email'}</span>
          </button>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
};

const OnboardingPage = () => {
  const { user, fetchProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    business_type: '',
    industry: '',
    product_service: '',
    target_audience: '',
    campaign_goal: ''
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: 'Business Type',
      question: 'What type of business do you run?',
      field: 'business_type',
      options: ['Startup', 'Small Business', 'Agency', 'Freelancer', 'Enterprise', 'Non-profit']
    },
    {
      title: 'Industry',
      question: 'What industry are you in?',
      field: 'industry',
      options: ['Technology', 'Healthcare', 'E-commerce', 'Consulting', 'Education', 'Finance', 'Real Estate', 'Other']
    },
    {
      title: 'Product/Service',
      question: 'What do you offer?',
      field: 'product_service',
      type: 'textarea'
    },
    {
      title: 'Target Audience',
      question: 'Who is your target audience?',
      field: 'target_audience',
      type: 'textarea'
    },
    {
      title: 'Campaign Goal',
      question: 'What is your primary marketing goal?',
      field: 'campaign_goal',
      options: ['Generate Leads', 'Increase Sales', 'Brand Awareness', 'Customer Retention', 'Product Launch', 'Website Traffic']
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/onboarding`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfile();
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
            <span className="text-sm text-gray-500">{currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{currentStepData.question}</h2>
          
          {currentStepData.options ? (
            <div className="space-y-3">
              {currentStepData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setFormData({ ...formData, [currentStepData.field]: option })}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                    formData[currentStepData.field] === option
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={formData[currentStepData.field]}
              onChange={(e) => setFormData({ ...formData, [currentStepData.field]: e.target.value })}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none resize-none h-32"
              placeholder="Enter your answer..."
            />
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!formData[currentStepData.field] || loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors"
          >
            {loading ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchCampaigns();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">AI Marketing Agent</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                src={user?.picture || 'https://via.placeholder.com/32'}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-gray-700">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.campaigns_count || 0}</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.leads_count || 0}</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hot Leads</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.leads_by_status?.hot || 0}</p>
              </div>
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warm Leads</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData?.leads_by_status?.warm || 0}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCampaignForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Generate New Campaign</span>
          </button>
        </div>

        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
          </div>
          <div className="p-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
                </svg>
                <p className="text-gray-600 mb-4">No campaigns yet</p>
                <button
                  onClick={() => setShowCampaignForm(true)}
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Create your first campaign
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                      <p className="text-sm text-gray-600 capitalize">{campaign.campaign_type.replace('_', ' ')} • {campaign.style}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {campaign.status}
                      </span>
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <CampaignFormModal
          onClose={() => setShowCampaignForm(false)}
          onSuccess={() => {
            setShowCampaignForm(false);
            fetchCampaigns();
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
};

const CampaignFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    campaign_type: '',
    style: 'persuasive',
    custom_prompt: ''
  });
  const [loading, setLoading] = useState(false);
  const [generatedCampaign, setGeneratedCampaign] = useState(null);

  const campaignTypes = [
    { value: 'email', label: 'Email Sequence', description: 'Multi-email campaign for nurturing leads' },
    { value: 'social_media', label: 'Social Media Posts', description: 'Engaging posts for LinkedIn, Instagram, Twitter' },
    { value: 'direct_message', label: 'Direct Messages', description: 'Personalized outreach templates' }
  ];

  const styles = [
    { value: 'persuasive', label: 'Persuasive', description: 'Professional and convincing' },
    { value: 'aggressive', label: 'Aggressive', description: 'Direct and urgent' },
    { value: 'funny', label: 'Funny', description: 'Light-hearted and engaging' },
    { value: 'educational', label: 'Educational', description: 'Informative and valuable' }
  ];

  const handleGenerate = async () => {
    if (!formData.campaign_type) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/campaigns/generate`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedCampaign(response.data.campaign);
    } catch (error) {
      console.error('Campaign generation failed:', error);
      alert('Failed to generate campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Generate AI Campaign</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!generatedCampaign ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Campaign Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaignTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, campaign_type: type.value })}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.campaign_type === type.value
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Style</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setFormData({ ...formData, style: style.value })}
                      className={`p-3 border-2 rounded-lg text-left transition-colors ${
                        formData.style === style.value
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900 text-sm">{style.label}</h3>
                      <p className="text-xs text-gray-600 mt-1">{style.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Requirements (Optional)
                </label>
                <textarea
                  value={formData.custom_prompt}
                  onChange={(e) => setFormData({ ...formData, custom_prompt: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none resize-none h-24"
                  placeholder="Any specific requirements or instructions for the AI..."
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!formData.campaign_type || loading}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{loading ? 'Generating...' : 'Generate Campaign'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="font-medium text-green-800">Campaign Generated Successfully!</h3>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your AI-powered {generatedCampaign.campaign_type.replace('_', ' ')} campaign is ready.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{generatedCampaign.title}</h3>
                <div className="bg-gray-50 border rounded-lg p-6 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {generatedCampaign.content}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setGeneratedCampaign(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Generate New
                </button>
                <button
                  onClick={onSuccess}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Save Campaign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Auth Callback Handler
const AuthCallback = () => {
  const { login } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const fragment = window.location.hash;
      
      try {
        if (code) {
          // Google OAuth callback
          const response = await axios.post(`${API}/auth/google/callback`, { code });
          login(response.data.user, response.data.token);
        } else if (fragment.includes('session_id=')) {
          // Emergent auth callback
          const sessionId = fragment.split('session_id=')[1];
          const response = await axios.post(`${API}/auth/emergent/profile`, {}, {
            headers: { 'X-Session-ID': sessionId }
          });
          login(response.data.user, response.data.token);
        } else {
          throw new Error('No authentication data found');
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        alert('Authentication failed. Please try again.');
        window.location.href = '/';
      } finally {
        setProcessing(false);
      }
    };

    handleAuth();
  }, [login]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  
  // Handle auth callback
  if (window.location.pathname === '/auth/callback' || window.location.hash.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!user.onboarding_completed) {
    return <OnboardingPage />;
  }

  return <Dashboard />;
};

export default App;