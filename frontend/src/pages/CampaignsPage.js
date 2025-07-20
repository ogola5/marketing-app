import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, CampaignCard, CampaignForm, Loading, ErrorMessage, Button, Modal } from '../components';
import { campaignService } from '../services';
import { ROUTES, CAMPAIGN_TYPES, CAMPAIGN_STATUS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useCampaigns } from '../hooks/useCampaigns';

const CampaignsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { campaigns, loading: campaignsLoading, error: campaignsError, refreshCampaigns } = useCampaigns();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(ROUTES.LOGIN);
    }
  }, [user, authLoading, navigate]);

  const handleCreateCampaign = async (campaignData) => {
    setCreating(true);
    try {
      const newCampaign = await campaignService.generateCampaign(campaignData);
      await refreshCampaigns();
      setShowCreateModal(false);
      navigate(`${ROUTES.CAMPAIGNS}/${newCampaign.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicateCampaign = async (campaign) => {
    try {
      await campaignService.duplicateCampaign(campaign.id);
      await refreshCampaigns();
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await campaignService.deleteCampaign(campaignId);
        await refreshCampaigns();
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  // Filter and sort campaigns
  const filteredCampaigns = campaigns?.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'createdAt':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'performance':
        return (b.metrics?.conversionRate || 0) - (a.metrics?.conversionRate || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  if (authLoading || campaignsLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-gray-600 mt-2">
                Create and manage your AI-powered marketing campaigns
              </p>
            </div>
            <Button
              variant="PRIMARY"
              onClick={() => setShowCreateModal(true)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              New Campaign
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Status Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="createdAt">Newest First</option>
                <option value="performance">Best Performance</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {/* Stats */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total: <strong>{campaigns?.length || 0}</strong></span>
              <span>Active: <strong>{campaigns?.filter(c => c.status === 'active').length || 0}</strong></span>
              <span>Draft: <strong>{campaigns?.filter(c => c.status === 'draft').length || 0}</strong></span>
            </div>
          </div>
        </div>

        {campaignsError && <ErrorMessage message={campaignsError} />}

        {/* Campaigns Grid */}
        {sortedCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onEdit={(c) => navigate(`${ROUTES.CAMPAIGNS}/${c.id}/edit`)}
                onDuplicate={handleDuplicateCampaign}
                onDelete={handleDeleteCampaign}
                onViewLeads={(c) => navigate(`${ROUTES.CAMPAIGNS}/${c.id}/leads`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No campaigns found' : 'Create your first campaign'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start generating AI-powered marketing content that converts'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button
                variant="PRIMARY"
                onClick={() => setShowCreateModal(true)}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Create Campaign
              </Button>
            )}
          </div>
        )}

        {/* Campaign Type Guide */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Types Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(CAMPAIGN_TYPES).map(([key, type]) => (
              <div key={key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-lg">{type.icon}</span>
                  </div>
                  <h4 className="font-medium text-gray-900">{type.label}</h4>
                </div>
                <p className="text-sm text-gray-600">{type.description}</p>
                <div className="mt-3 text-xs text-gray-500">
                  Best for: {type.bestFor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !creating && setShowCreateModal(false)}
        title="Create New Campaign"
        size="large"
      >
        <CampaignForm
          onSubmit={handleCreateCampaign}
          onCancel={() => setShowCreateModal(false)}
          loading={creating}
        />
      </Modal>
    </div>
  );
};

export default CampaignsPage;