// components/common/Button.js
import React from 'react';
import { BUTTON_VARIANTS, BUTTON_SIZES } from '../../constants';
import Loading from './Loading';

const Button = ({
  children,
  variant = 'PRIMARY',
  size = 'MD',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.PRIMARY;
  const sizeClasses = BUTTON_SIZES[size] || BUTTON_SIZES.MD;
  
  const buttonClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;
  
  const isDisabled = disabled || loading;
  
  const renderIcon = () => {
    if (loading) {
      return <Loading size="sm" className="mr-2" />;
    }
    
    if (icon) {
      const iconClasses = iconPosition === 'right' ? 'ml-2' : 'mr-2';
      return (
        <span className={iconClasses}>
          {icon}
        </span>
      );
    }
    
    return null;
  };
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={isDisabled}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      <span>{children}</span>
      {iconPosition === 'right' && renderIcon()}
    </button>
  );
};

export default Button;