import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, LeadCard, Loading, ErrorMessage, Button, Modal } from '../components';
import { campaignService } from '../services';
import { ROUTES, LEAD_STATUS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useLeads } from '../hooks/useLeads';
import { formatDate } from '../utils';

const LeadsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { leads, loading: leadsLoading, error: leadsError, refreshLeads } = useLeads();
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(ROUTES.LOGIN);
    }
  }, [user, authLoading, navigate]);

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await campaignService.updateLeadStatus(leadId, newStatus);
      await refreshLeads();
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const handleAddNote = async (leadId, note) => {
    try {
      await campaignService.addLeadNote(leadId, note);
      await refreshLeads();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleExportLeads = async () => {
    setExportLoading(true);
    try {
      const csvContent = generateCSV(filteredLeads);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export leads:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const generateCSV = (leadsData) => {
    const headers = ['Name', 'Email', 'Company', 'Campaign', 'Status', 'Score', 'Created Date', 'Last Contact', 'Notes'];
    const rows = leadsData.map(lead => [
      lead.name,
      lead.email,
      lead.company || '',
      lead.campaignTitle || '',
      lead.status,
      lead.score || '',
      formatDate(lead.createdAt),
      lead.lastContactDate ? formatDate(lead.lastContactDate) : '',
      lead.notes?.map(n => n.content).join('; ') || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  };

  // Filter and sort leads
  const filteredLeads = leads?.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  }) || [];

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case 'createdAt':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'score':
        return (b.score || 0) - (a.score || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'lastContact':
        return new Date(b.lastContactDate || 0) - new Date(a.lastContactDate || 0);
      default:
        return 0;
    }
  });

  // Get stats
  const leadStats = {
    total: leads?.length || 0,
    new: leads?.filter(l => l.status === 'new').length || 0,
    contacted: leads?.filter(l => l.status === 'contacted').length || 0,
    qualified: leads?.filter(l => l.status === 'qualified').length || 0,
    converted: leads?.filter(l => l.status === 'converted').length || 0,
  };

  if (authLoading || leadsLoading) {
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
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="text-gray-600 mt-2">
                Manage and nurture your marketing leads
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="SECONDARY"
                onClick={handleExportLeads}
                loading={exportLoading}
                disabled={filteredLeads.length === 0}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
              >
                Export CSV
              </Button>
              <Button
                variant="PRIMARY"
                onClick={() => navigate(ROUTES.CAMPAIGNS)}
              >
                Generate More Leads
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(leadStats).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg shadow-sm p-4">
                <div className="text-sm text-gray-600 capitalize">{key}</div>
                <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
              </div>
            ))}
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or company..."
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
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="createdAt">Newest First</option>
                <option value="lastContact">Last Contacted</option>
                <option value="score">Highest Score</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {leadsError && <ErrorMessage message={leadsError} />}

        {/* Leads List */}
        {sortedLeads.length > 0 ? (
          <div className="space-y-4">
            {sortedLeads.map(lead => (
              <div key={lead.id} className="bg-white rounded-lg shadow-sm">
                <LeadCard
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  onAddNote={handleAddNote}
                  onViewDetails={(l) => {
                    setSelectedLead(l);
                    setShowDetailsModal(true);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || filter !== 'all' ? 'No leads found' : 'No leads yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create and send campaigns to start generating leads'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button
                variant="PRIMARY"
                onClick={() => navigate(ROUTES.CAMPAIGNS)}
              >
                Create Campaign
              </Button>
            )}
          </div>
        )}

        {/* Lead Management Tips */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📈 Lead Management Best Practices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Response Time Matters</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Respond to new leads within 5 minutes for 9x better conversion</li>
                <li>• Use automated follow-ups for consistent engagement</li>
                <li>• Track response times in your lead notes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Lead Scoring Tips</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• Score based on engagement level and fit</li>
                <li>• Focus on leads with scores above 70</li>
                <li>• Update scores after each interaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedLead(null);
        }}
        title="Lead Details"
        size="medium"
      >
        {selectedLead && (
          <div className="space-y-6">
            {/* Lead Info */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{selectedLead.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{selectedLead.email}</span>
                </div>
                {selectedLead.company && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">{selectedLead.company}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaign:</span>
                  <span className="font-medium">{selectedLead.campaignTitle}</span>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Activity Timeline</h3>
              <div className="space-y-3">
                {selectedLead.notes?.map((note, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(note.createdAt, 'relative')}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 mr-3"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Lead created</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(selectedLead.createdAt, 'relative')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="SECONDARY"
                onClick={() => {
                  setShowDetailsModal(false);
                  navigate(`${ROUTES.CAMPAIGNS}/${selectedLead.campaignId}`);
                }}
              >
                View Campaign
              </Button>
              <Button
                variant="PRIMARY"
                onClick={() => {
                  window.location.href = `mailto:${selectedLead.email}`;
                }}
              >
                Send Email
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadsPage;