// components/cards/LeadCard.js
import React, { useState } from 'react';
import { Button } from '../common';
import { CARD_STYLES, LEAD_STATUS_COLORS, LEAD_STATUSES } from '../../constants';

const LeadCard = ({ 
  lead,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
  onAddNote,
  className = '',
  showActions = true,
  compact = false
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusInfo = (status) => {
    const statusData = LEAD_STATUSES.find(s => s.value === status);
    return statusData || { value: status, label: status, color: 'gray' };
  };

  const getStatusColor = (status) => {
    return LEAD_STATUS_COLORS[status] || LEAD_STATUS_COLORS.cold;
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'sent':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'opened':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'clicked':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        );
      case 'replied':
        return (
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange?.(lead, newStatus);
    setShowStatusMenu(false);
  };

  if (compact) {
    return (
      <div className={`${CARD_STYLES.HOVER} p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {(lead.name || lead.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {lead.name || 'Unknown Name'}
              </p>
              <p className="text-sm text-gray-500 truncate">{lead.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
              {getStatusInfo(lead.status).label}
            </span>
            {showActions && (
              <Button
                onClick={() => onView?.(lead)}
                variant="OUTLINE"
                size="SM"
              >
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${CARD_STYLES.HOVER} p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-lg">
              {(lead.name || lead.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Lead Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {lead.name || 'Unknown Name'}
            </h3>
            <p className="text-gray-600 mb-2">{lead.email}</p>
            
            {/* Interaction Type */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {getInteractionIcon(lead.interaction_type)}
              <span className="capitalize">
                {lead.interaction_type.replace('_', ' ')}
              </span>
              <span>•</span>
              <span>{formatDate(lead.created_at)}</span>
            </div>
          </div>
        </div>
        
        {/* Actions Menu */}
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => { onView?.(lead); setShowActionsMenu(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  View Details
                </button>
                
                {onEdit && (
                  <button
                    onClick={() => { onEdit(lead); setShowActionsMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Lead
                  </button>
                )}
                
                {onAddNote && (
                  <button
                    onClick={() => { onAddNote(lead); setShowActionsMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Add Note
                  </button>
                )}
                
                {onDelete && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { onDelete(lead); setShowActionsMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Lead
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{lead.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${getStatusColor(lead.status)} hover:shadow-sm`}
          >
            <span>{getStatusInfo(lead.status).label}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showStatusMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              {LEAD_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={`flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 ${
                    lead.status === status.value ? 'bg-gray-50 font-medium' : ''
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 bg-${status.color}-500`}></span>
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Campaign Info */}
        {lead.campaign_id && (
          <span className="text-xs text-gray-500">
            Campaign: {lead.campaign_id.substring(0, 8)}...
          </span>
        )}
      </div>
    </div>
  );
};

export default LeadCard;