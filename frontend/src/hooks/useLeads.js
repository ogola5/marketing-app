import { useState, useEffect, useCallback } from 'react';
import { campaignService } from '../services';
import { useAuth } from './useAuth';

export const useLeads = (campaignId = null) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = campaignId 
        ? await campaignService.getCampaignLeads(campaignId)
        : await campaignService.getAllLeads();
      setLeads(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [user, campaignId]);

  const refreshLeads = useCallback(async () => {
    await fetchLeads();
  }, [fetchLeads]);

  const updateLeadStatus = useCallback(async (leadId, status) => {
    try {
      await campaignService.updateLeadStatus(leadId, status);
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? { ...lead, status } : lead
      ));
    } catch (err) {
      throw err;
    }
  }, []);

  const addLeadNote = useCallback(async (leadId, note) => {
    try {
      const updatedLead = await campaignService.addLeadNote(leadId, note);
      setLeads(prev => prev.map(lead => 
        lead.id === leadId ? updatedLead : lead
      ));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    refreshLeads,
    updateLeadStatus,
    addLeadNote
  };
};