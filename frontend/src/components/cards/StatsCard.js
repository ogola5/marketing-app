// components/cards/StatsCard.js
import React from 'react';
import { CARD_STYLES, STATS_ICONS } from '../../constants';

const StatsCard = ({ 
  title, 
  value, 
  icon,
  iconType,
  iconColor = 'blue',
  trend,
  trendDirection,
  subtitle,
  onClick,
  loading = false,
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-500'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const getIcon = () => {
    if (icon) return icon;
    if (iconType && STATS_ICONS[iconType]) return STATS_ICONS[iconType];
    
    // Default icon
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (trendDirection === 'down') {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return null;
  };

  const formatValue = (val) => {
    if (loading) return '...';
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val || '0';
  };

  const cardClasses = onClick 
    ? `${CARD_STYLES.HOVER} cursor-pointer` 
    : CARD_STYLES.DEFAULT;

  return (
    <div 
      className={`${cardClasses} p-6 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Title */}
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          
          {/* Value */}
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-bold text-gray-900 ${loading ? 'animate-pulse' : ''}`}>
              {formatValue(value)}
            </p>
            
            {/* Trend */}
            {trend && trendDirection && (
              <div className={`flex items-center space-x-1 ${trendColors[trendDirection]}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">{trend}</span>
              </div>
            )}
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Icon */}
        <div className={`w-12 h-12 ${colorClasses[iconColor]} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <div className="text-white">
            {getIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;