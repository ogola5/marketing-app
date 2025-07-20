// components/cards/CampaignCard.js
import React, { useState } from 'react';
import { Button } from '../common';
import { CARD_STYLES, STATUS_COLORS, CAMPAIGN_TYPE_ICONS } from '../../constants';

const CampaignCard = ({ 
  campaign,
  onView,
  onEdit,
  onDelete,
  onSendEmail,
  onDuplicate,
  className = '',
  showActions = true,
  compact = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.draft;
  };

  const getCampaignTypeIcon = (type) => {
    return CAMPAIGN_TYPE_ICONS[type] || '📄';
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getPerformanceMetrics = () => {
    if (!campaign.performance) return null;
    
    const { sent_count, failed_count, sent_at } = campaign.performance;
    
    if (!sent_count && !failed_count) return null;
    
    return (
      <div className="flex items-center space-x-4 text-xs text-gray-500">
        {sent_count > 0 && (
          <span className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>{sent_count} sent</span>
          </span>
        )}
        {failed_count > 0 && (
          <span className="flex items-center space-x-1">
            <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{failed_count} failed</span>
          </span>
        )}
        {sent_at && (
          <span>Sent {formatDate(sent_at)}</span>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <div className={`${CARD_STYLES.HOVER} p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{getCampaignTypeIcon(campaign.campaign_type)}</span>
              <h3 className="font-medium text-gray-900 truncate">{campaign.title}</h3>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="capitalize">{campaign.campaign_type.replace('_', ' ')}</span>
              <span>•</span>
              <span className="capitalize">{campaign.style}</span>
              <span>•</span>
              <span>{formatDate(campaign.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
            {showActions && (
              <Button
                onClick={() => onView?.(campaign)}
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
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="text-2xl">{getCampaignTypeIcon(campaign.campaign_type)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
              {campaign.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="capitalize font-medium">
                {campaign.campaign_type.replace('_', ' ')}
              </span>
              <span>•</span>
              <span className="capitalize">{campaign.style}</span>
            </div>
          </div>
        </div>
        
        {/* Actions Menu */}
        {showActions && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
              </svg>
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => { onView?.(campaign); setShowMenu(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Details
                </button>
                
                {onEdit && (
                  <button
                    onClick={() => { onEdit(campaign); setShowMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Campaign
                  </button>
                )}
                
                {onSendEmail && campaign.campaign_type === 'email' && campaign.status === 'draft' && (
                  <button
                    onClick={() => { onSendEmail(campaign); setShowMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Emails
                  </button>
                )}
                
                {onDuplicate && (
                  <button
                    onClick={() => { onDuplicate(campaign); setShowMenu(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate
                  </button>
                )}
                
                {onDelete && (
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => { onDelete(campaign); setShowMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Preview */}
      <div className="mb-4">
        <p className="text-gray-600 text-sm leading-relaxed">
          {truncateText(campaign.content)}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
            {campaign.status}
          </span>
          <span className="text-xs text-gray-500">
            Created {formatDate(campaign.created_at)}
          </span>
        </div>
        
        {/* Performance Metrics */}
        {getPerformanceMetrics()}
      </div>
    </div>
  );
};

export default CampaignCard;