// components/common/Loading.js
import React from 'react';
import { ICON_SIZES, ANIMATIONS } from '../../constants';

const Loading = ({ 
  size = 'MD', 
  color = 'indigo-600',
  text,
  className = '',
  fullScreen = false 
}) => {
  const sizeClasses = ICON_SIZES[size] || ICON_SIZES.MD;
  const spinnerClasses = `${sizeClasses} ${ANIMATIONS.SPIN} border-2 border-gray-200 border-t-${color} rounded-full ${className}`;
  
  const LoadingSpinner = () => (
    <div className={spinnerClasses}></div>
  );
  
  const LoadingContent = () => (
    <div className="flex flex-col items-center justify-center space-y-3">
      <LoadingSpinner />
      {text && (
        <p className="text-gray-600 text-sm">{text}</p>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <LoadingContent />
      </div>
    );
  }
  
  if (text) {
    return <LoadingContent />;
  }
  
  return <LoadingSpinner />;
};

export default Loading;