import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, StatsCard, CampaignCard, LeadCard, Loading, ErrorMessage, Button } from '../components';
import { campaignService } from '../services';
import { ROUTES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useCampaigns } from '../hooks/useCampaigns';
import { useLeads } from '../hooks/useLeads';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { campaigns, loading: campaignsLoading, error: campaignsError, refreshCampaigns } = useCampaigns();
  const { leads, loading: leadsLoading, error: leadsError, refreshLeads } = useLeads();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(ROUTES.LOGIN);
    } else if (!authLoading && user && !user.isOnboarded) {
      navigate(ROUTES.ONBOARDING);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await campaignService.getDashboardData();
      setDashboardData(data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDashboardData(),
      refreshCampaigns(),
      refreshLeads()
    ]);
    setRefreshing(false);
  };

  if (authLoading || loading) {
    return <Loading fullScreen />;
  }

  const recentCampaigns = campaigns?.slice(0, 3) || [];
  const recentLeads = leads?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.displayName || 'there'}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's your marketing performance overview
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="SECONDARY"
              onClick={handleRefresh}
              loading={refreshing}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              }
            >
              Refresh
            </Button>
            <Button
              variant="PRIMARY"
              onClick={() => navigate(ROUTES.CAMPAIGNS)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              New Campaign
            </Button>
          </div>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Campaigns"
            value={dashboardData?.totalCampaigns || 0}
            icon="campaigns"
            trend={dashboardData?.campaignsTrend}
            trendDirection={dashboardData?.campaignsTrendDirection}
            color="blue"
          />
          <StatsCard
            title="Active Leads"
            value={dashboardData?.activeLeads || 0}
            icon="leads"
            trend={dashboardData?.leadsTrend}
            trendDirection={dashboardData?.leadsTrendDirection}
            color="green"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${dashboardData?.conversionRate || 0}%`}
            icon="conversion"
            trend={dashboardData?.conversionTrend}
            trendDirection={dashboardData?.conversionTrendDirection}
            color="purple"
          />
          <StatsCard
            title="Emails Sent"
            value={dashboardData?.emailsSent || 0}
            icon="emails"
            trend={dashboardData?.emailsTrend}
            trendDirection={dashboardData?.emailsTrendDirection}
            color="orange"
          />
        </div>

        {/* Recent Campaigns */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Campaigns</h2>
            <Button
              variant="LINK"
              onClick={() => navigate(ROUTES.CAMPAIGNS)}
            >
              View all →
            </Button>
          </div>
          
          {campaignsLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : campaignsError ? (
            <ErrorMessage message={campaignsError} />
          ) : recentCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {recentCampaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={(c) => navigate(`${ROUTES.CAMPAIGNS}/${c.id}/edit`)}
                  onDuplicate={async (c) => {
                    await campaignService.duplicateCampaign(c.id);
                    refreshCampaigns();
                  }}
                  onViewLeads={(c) => navigate(`${ROUTES.CAMPAIGNS}/${c.id}/leads`)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">Create your first AI-powered marketing campaign</p>
              <Button variant="PRIMARY" onClick={() => navigate(ROUTES.CAMPAIGNS)}>
                Create Campaign
              </Button>
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
            <Button
              variant="LINK"
              onClick={() => navigate(ROUTES.LEADS)}
            >
              View all →
            </Button>
          </div>
          
          {leadsLoading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : leadsError ? (
            <ErrorMessage message={leadsError} />
          ) : recentLeads.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="divide-y divide-gray-200">
                {recentLeads.map((lead, index) => (
                  <div key={lead.id} className={index === 0 ? '' : 'pt-4'}>
                    <LeadCard
                      lead={lead}
                      onStatusChange={async (leadId, status) => {
                        await campaignService.updateLeadStatus(leadId, status);
                        refreshLeads();
                      }}
                      onAddNote={async (leadId, note) => {
                        await campaignService.addLeadNote(leadId, note);
                        refreshLeads();
                      }}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
              <p className="text-gray-600">Leads will appear here when your campaigns generate responses</p>
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Pro Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Use persuasive style for product launches and informative for newsletters</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>A/B test different campaign styles to see what resonates with your audience</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Follow up with warm leads within 24 hours for best conversion rates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;