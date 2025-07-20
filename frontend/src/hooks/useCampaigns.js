import { useState, useEffect, useCallback } from 'react';
import { campaignService } from '../services';
import { useAuth } from './useAuth';

export const useCampaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await campaignService.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshCampaigns = useCallback(async () => {
    await fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (campaignData) => {
    try {
      const newCampaign = await campaignService.generateCampaign(campaignData);
      await refreshCampaigns();
      return newCampaign;
    } catch (err) {
      throw err;
    }
  }, [refreshCampaigns]);

  const updateCampaign = useCallback(async (campaignId, updates) => {
    try {
      const updated = await campaignService.updateCampaign(campaignId, updates);
      await refreshCampaigns();
      return updated;
    } catch (err) {
      throw err;
    }
  }, [refreshCampaigns]);

  const deleteCampaign = useCallback(async (campaignId) => {
    try {
      await campaignService.deleteCampaign(campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    refreshCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign
  };
};