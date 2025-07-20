import React, { createContext, useState, useCallback } from 'react';

export const CampaignContext = createContext(null);

export const CampaignProvider = ({ children }) => {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [draftCampaign, setDraftCampaign] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    sortBy: 'createdAt'
  });

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const saveDraft = useCallback((campaignData) => {
    setDraftCampaign(campaignData);
    // Also save to localStorage for persistence
    localStorage.setItem('campaignDraft', JSON.stringify(campaignData));
  }, []);

  const clearDraft = useCallback(() => {
    setDraftCampaign(null);
    localStorage.removeItem('campaignDraft');
  }, []);

  const value = {
    selectedCampaign,
    setSelectedCampaign,
    draftCampaign,
    saveDraft,
    clearDraft,
    filters,
    updateFilters
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};