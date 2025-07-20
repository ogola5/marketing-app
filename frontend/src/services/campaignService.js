// services/campaignService.js
import { campaignAPI, leadAPI, dashboardAPI } from './api';
import { STORAGE_KEYS, CAMPAIGN_TYPES, CAMPAIGN_STYLES } from '../constants';
import { safeLocalStorage, validateEmailList, generateCampaignTitle } from '../utils';

class CampaignService {
  constructor() {
    this.campaigns = [];
    this.leads = [];
    this.dashboardData = null;
    this.listeners = new Set();
    this.isLoading = false;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  // Campaign state listeners
  addCampaignListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          campaigns: this.campaigns,
          leads: this.leads,
          dashboardData: this.dashboardData,
          isLoading: this.isLoading
        });
      } catch (error) {
        console.error('Campaign listener error:', error);
      }
    });
  }
  
  // Check if cache is valid
  isCacheValid() {
    return this.lastFetch && (Date.now() - this.lastFetch) < this.cacheTimeout;
  }
  
  // Generate new campaign
  async generateCampaign(campaignData) {
    try {
      this.isLoading = true;
      this.notifyListeners();
      
      // Validate campaign data
      const validation = this.validateCampaignData(campaignData);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') };
      }
      
      // Save draft to local storage for recovery
      this.saveDraftCampaign(campaignData);
      
      const { data, error } = await campaignAPI.generateCampaign(campaignData);
      
      if (error) {
        return { success: false, error };
      }
      
      if (data?.campaign) {
        // Add to local campaigns array
        this.campaigns.unshift(data.campaign);
        
        // Clear draft since generation was successful
        this.clearDraftCampaign();
        
        // Update cache timestamp
        this.lastFetch = Date.now();
        
        this.notifyListeners();
        return { success: true, campaign: data.campaign };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Campaign generation failed:', error);
      return { success: false, error: 'Failed to generate campaign' };
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }
  }
  
  // Get all campaigns
  async getCampaigns(forceRefresh = false) {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid() && this.campaigns.length > 0) {
        return { success: true, campaigns: this.campaigns };
      }
      
      this.isLoading = true;
      this.notifyListeners();
      
      const { data, error } = await campaignAPI.getCampaigns();
      
      if (error) {
        return { success: false, error };
      }
      
      if (Array.isArray(data)) {
        this.campaigns = data;
        this.lastFetch = Date.now();
        this.notifyListeners();
        return { success: true, campaigns: data };
      } else {
        return { success: false, error: 'Invalid campaigns data received' };
      }
    } catch (error) {
      console.error('Get campaigns failed:', error);
      return { success: false, error: 'Failed to fetch campaigns' };
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }
  }
  
  // Get single campaign
  async getCampaign(campaignId) {
    try {
      // Check if campaign exists in cache first
      const cachedCampaign = this.campaigns.find(c => c.id === campaignId);
      if (cachedCampaign && this.isCacheValid()) {
        return { success: true, campaign: cachedCampaign };
      }
      
      const { data, error } = await campaignAPI.getCampaign(campaignId);
      
      if (error) {
        return { success: false, error };
      }
      
      if (data) {
        // Update campaign in cache
        const index = this.campaigns.findIndex(c => c.id === campaignId);
        if (index !== -1) {
          this.campaigns[index] = data;
        } else {
          this.campaigns.push(data);
        }
        
        this.notifyListeners();
        return { success: true, campaign: data };
      } else {
        return { success: false, error: 'Campaign not found' };
      }
    } catch (error) {
      console.error('Get campaign failed:', error);
      return { success: false, error: 'Failed to fetch campaign' };
    }
  }
  
  // Update campaign
  async updateCampaign(campaignId, updateData) {
    try {
      const { data, error } = await campaignAPI.updateCampaign(campaignId, updateData);
      
      if (error) {
        return { success: false, error };
      }
      
      // Update campaign in cache
      const index = this.campaigns.findIndex(c => c.id === campaignId);
      if (index !== -1) {
        this.campaigns[index] = { ...this.campaigns[index], ...updateData };
        this.notifyListeners();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update campaign failed:', error);
      return { success: false, error: 'Failed to update campaign' };
    }
  }
  
  // Delete campaign
  async deleteCampaign(campaignId) {
    try {
      const { data, error } = await campaignAPI.deleteCampaign(campaignId);
      
      if (error) {
        return { success: false, error };
      }
      
      // Remove campaign from cache
      this.campaigns = this.campaigns.filter(c => c.id !== campaignId);
      this.notifyListeners();
      
      return { success: true };
    } catch (error) {
      console.error('Delete campaign failed:', error);
      return { success: false, error: 'Failed to delete campaign' };
    }
  }
  
  // Send email campaign
  async sendEmailCampaign(campaignId, recipients) {
    try {
      // Validate email list
      const emailValidation = validateEmailList(recipients);
      if (!emailValidation.isValid) {
        return { 
          success: false, 
          error: emailValidation.errors.join(', '),
          validEmails: emailValidation.validEmails,
          invalidEmails: emailValidation.invalidEmails
        };
      }
      
      const { data, error } = await campaignAPI.sendEmailCampaign(campaignId, emailValidation.validEmails);
      
      if (error) {
        return { success: false, error };
      }
      
      if (data) {
        // Update campaign status in cache
        const index = this.campaigns.findIndex(c => c.id === campaignId);
        if (index !== -1) {
          this.campaigns[index].status = 'sent';
          this.campaigns[index].performance = {
            sent_count: data.sent_count,
            failed_count: data.failed_count,
            sent_at: new Date().toISOString()
          };
        }
        
        // Refresh leads since new ones were created
        this.getLeads(true);
        
        this.notifyListeners();
        return { 
          success: true, 
          sentCount: data.sent_count,
          failedCount: data.failed_count,
          failedRecipients: data.failed_recipients
        };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('Send email campaign failed:', error);
      return { success: false, error: 'Failed to send email campaign' };
    }
  }
  
  // Duplicate campaign
  async duplicateCampaign(campaignId) {
    try {
      const originalCampaign = this.campaigns.find(c => c.id === campaignId);
      if (!originalCampaign) {
        return { success: false, error: 'Original campaign not found' };
      }
      
      // Create new campaign data based on original
      const duplicateData = {
        campaign_type: originalCampaign.campaign_type,
        style: originalCampaign.style,
        custom_prompt: `Duplicate of: ${originalCampaign.title}`
      };
      
      // Generate new campaign
      return await this.generateCampaign(duplicateData);
    } catch (error) {
      console.error('Duplicate campaign failed:', error);
      return { success: false, error: 'Failed to duplicate campaign' };
    }
  }
  
  // Get leads
  async getLeads(forceRefresh = false) {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid() && this.leads.length > 0) {
        return { success: true, leads: this.leads };
      }
      
      const { data, error } = await leadAPI.getLeads();
      
      if (error) {
        return { success: false, error };
      }
      
      if (Array.isArray(data)) {
        this.leads = data;
        this.notifyListeners();
        return { success: true, leads: data };
      } else {
        return { success: false, error: 'Invalid leads data received' };
      }
    } catch (error) {
      console.error('Get leads failed:', error);
      return { success: false, error: 'Failed to fetch leads' };
    }
  }
  
  // Update lead status
  async updateLeadStatus(leadId, status) {
    try {
      const { data, error } = await leadAPI.updateLeadStatus(leadId, status);
      
      if (error) {
        return { success: false, error };
      }
      
      // Update lead in cache
      const index = this.leads.findIndex(l => l.id === leadId);
      if (index !== -1) {
        this.leads[index].status = status;
        this.notifyListeners();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update lead status failed:', error);
      return { success: false, error: 'Failed to update lead status' };
    }
  }
  
  // Get dashboard data
  async getDashboardData(forceRefresh = false) {
    try {
      // Return cached data if valid and not forcing refresh
      if (!forceRefresh && this.isCacheValid() && this.dashboardData) {
        return { success: true, data: this.dashboardData };
      }
      
      const { data, error } = await dashboardAPI.getDashboardData();
      
      if (error) {
        return { success: false, error };
      }
      
      if (data) {
        this.dashboardData = data;
        this.notifyListeners();
        return { success: true, data };
      } else {
        return { success: false, error: 'Invalid dashboard data received' };
      }
    } catch (error) {
      console.error('Get dashboard data failed:', error);
      return { success: false, error: 'Failed to fetch dashboard data' };
    }
  }
  
  // Draft campaign management
  saveDraftCampaign(campaignData) {
    try {
      const drafts = safeLocalStorage.get(STORAGE_KEYS.DRAFT_CAMPAIGNS, []);
      const newDraft = {
        ...campaignData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      // Keep only last 5 drafts
      const updatedDrafts = [newDraft, ...drafts].slice(0, 5);
      safeLocalStorage.set(STORAGE_KEYS.DRAFT_CAMPAIGNS, updatedDrafts);
    } catch (error) {
      console.error('Failed to save draft campaign:', error);
    }
  }
  
  getDraftCampaigns() {
    return safeLocalStorage.get(STORAGE_KEYS.DRAFT_CAMPAIGNS, []);
  }
  
  clearDraftCampaign() {
    try {
      const drafts = safeLocalStorage.get(STORAGE_KEYS.DRAFT_CAMPAIGNS, []);
      if (drafts.length > 0) {
        // Remove the most recent draft
        const updatedDrafts = drafts.slice(1);
        safeLocalStorage.set(STORAGE_KEYS.DRAFT_CAMPAIGNS, updatedDrafts);
      }
    } catch (error) {
      console.error('Failed to clear draft campaign:', error);
    }
  }
  
  // Validation helpers
  validateCampaignData(data) {
    const errors = [];
    
    if (!data.campaign_type) {
      errors.push('Campaign type is required');
    } else if (!CAMPAIGN_TYPES.find(t => t.value === data.campaign_type)) {
      errors.push('Invalid campaign type');
    }
    
    if (!data.style) {
      errors.push('Campaign style is required');
    } else if (!CAMPAIGN_STYLES.find(s => s.value === data.style)) {
      errors.push('Invalid campaign style');
    }
    
    if (data.custom_prompt && data.custom_prompt.length > 1000) {
      errors.push('Custom prompt must be no more than 1000 characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Analytics and insights
  getCampaignAnalytics() {
    if (!this.campaigns.length) return null;
    
    const analytics = {
      totalCampaigns: this.campaigns.length,
      campaignsByType: {},
      campaignsByStatus: {},
      totalEmailsSent: 0,
      averagePerformance: {}
    };
    
    // Group by type and status
    this.campaigns.forEach(campaign => {
      // By type
      analytics.campaignsByType[campaign.campaign_type] = 
        (analytics.campaignsByType[campaign.campaign_type] || 0) + 1;
      
      // By status
      analytics.campaignsByStatus[campaign.status] = 
        (analytics.campaignsByStatus[campaign.status] || 0) + 1;
      
      // Email performance
      if (campaign.performance?.sent_count) {
        analytics.totalEmailsSent += campaign.performance.sent_count;
      }
    });
    
    return analytics;
  }
  
  getLeadAnalytics() {
    if (!this.leads.length) return null;
    
    const analytics = {
      totalLeads: this.leads.length,
      leadsByStatus: {},
      leadsByCampaign: {},
      conversionFunnel: {}
    };
    
    // Group by status
    this.leads.forEach(lead => {
      analytics.leadsByStatus[lead.status] = 
        (analytics.leadsByStatus[lead.status] || 0) + 1;
      
      analytics.leadsByCampaign[lead.campaign_id] = 
        (analytics.leadsByCampaign[lead.campaign_id] || 0) + 1;
    });
    
    return analytics;
  }
  
  // Cache management
  clearCache() {
    this.campaigns = [];
    this.leads = [];
    this.dashboardData = null;
    this.lastFetch = null;
    this.notifyListeners();
  }
  
  // Refresh all data
  async refreshAll() {
    try {
      this.isLoading = true;
      this.notifyListeners();
      
      const [campaignsResult, leadsResult, dashboardResult] = await Promise.allSettled([
        this.getCampaigns(true),
        this.getLeads(true),
        this.getDashboardData(true)
      ]);
      
      const errors = [];
      if (campaignsResult.status === 'rejected') errors.push('Failed to refresh campaigns');
      if (leadsResult.status === 'rejected') errors.push('Failed to refresh leads');
      if (dashboardResult.status === 'rejected') errors.push('Failed to refresh dashboard');
      
      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : null
      };
    } catch (error) {
      console.error('Refresh all data failed:', error);
      return { success: false, error: 'Failed to refresh data' };
    } finally {
      this.isLoading = false;
      this.notifyListeners();
    }
  }
}

// Create and export singleton instance
const campaignService = new CampaignService();

export { campaignService };
export default campaignService;