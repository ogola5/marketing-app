// components/forms/CampaignForm.js
import React, { useState } from 'react';
import { Button, ErrorMessage } from '../common';
import { CAMPAIGN_TYPES, CAMPAIGN_STYLES, VALIDATION_RULES } from '../../constants';

const CampaignForm = ({ 
  onGenerate, 
  onSave,
  loading = false, 
  error = null,
  generatedCampaign = null,
  onReset
}) => {
  const [formData, setFormData] = useState({
    campaign_type: '',
    style: 'persuasive',
    custom_prompt: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.campaign_type) {
      errors.campaign_type = 'Please select a campaign type';
    }
    
    if (!formData.style) {
      errors.style = 'Please select a campaign style';
    }
    
    if (formData.custom_prompt && formData.custom_prompt.length > 1000) {
      errors.custom_prompt = 'Custom prompt must be no more than 1000 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = () => {
    if (!validateForm()) return;
    
    onGenerate({
      campaign_type: formData.campaign_type,
      style: formData.style,
      custom_prompt: formData.custom_prompt.trim() || undefined
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: null });
    }
  };

  const handleReset = () => {
    setFormData({
      campaign_type: '',
      style: 'persuasive',
      custom_prompt: ''
    });
    setValidationErrors({});
    if (onReset) onReset();
  };

  // If campaign is generated, show results
  if (generatedCampaign) {
    return (
      <div className="space-y-6">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="font-medium text-green-800">Campaign Generated Successfully!</h3>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Your AI-powered {generatedCampaign.campaign_type.replace('_', ' ')} campaign is ready.
          </p>
        </div>

        {/* Campaign Details */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {generatedCampaign.title}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="capitalize">
                {generatedCampaign.campaign_type.replace('_', ' ')}
              </span>
              <span>•</span>
              <span className="capitalize">{generatedCampaign.style}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-6 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
              {generatedCampaign.content}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            onClick={handleReset}
            variant="OUTLINE"
            size="MD"
            disabled={loading}
          >
            Generate New
          </Button>
          <Button
            onClick={() => onSave(generatedCampaign)}
            variant="SUCCESS"
            size="MD"
            loading={loading}
          >
            Save Campaign
          </Button>
        </div>
      </div>
    );
  }

  // Form for campaign generation
  return (
    <div className="space-y-6">
      {/* Campaign Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Campaign Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CAMPAIGN_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleInputChange('campaign_type', type.value)}
              className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                formData.campaign_type === type.value
                  ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl">{type.icon}</span>
                <h3 className="font-medium text-gray-900">{type.label}</h3>
              </div>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>
        {validationErrors.campaign_type && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.campaign_type}</p>
        )}
      </div>

      {/* Campaign Style Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Campaign Style
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CAMPAIGN_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => handleInputChange('style', style.value)}
              className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${
                formData.style === style.value
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
              }`}
              disabled={loading}
            >
              <h3 className="font-medium text-gray-900 text-sm">{style.label}</h3>
              <p className="text-xs text-gray-600 mt-1">{style.description}</p>
            </button>
          ))}
        </div>
        {validationErrors.style && (
          <p className="mt-2 text-sm text-red-600">{validationErrors.style}</p>
        )}
      </div>

      {/* Custom Prompt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Requirements <span className="text-gray-500">(Optional)</span>
        </label>
        <textarea
          value={formData.custom_prompt}
          onChange={(e) => handleInputChange('custom_prompt', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:outline-none resize-none h-24 transition-colors ${
            validationErrors.custom_prompt
              ? 'border-red-300 focus:border-red-600 bg-red-50'
              : 'border-gray-300 focus:border-indigo-600'
          }`}
          placeholder="Any specific requirements or instructions for the AI..."
          maxLength={1000}
          disabled={loading}
        />
        <div className="flex justify-between items-center mt-2">
          {validationErrors.custom_prompt && (
            <p className="text-sm text-red-600">{validationErrors.custom_prompt}</p>
          )}
          <div className="text-sm text-gray-500 ml-auto">
            {formData.custom_prompt.length} / 1000
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage 
          message={error}
          variant="danger"
        />
      )}

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleGenerate}
          disabled={!formData.campaign_type || loading}
          loading={loading}
          variant="PRIMARY"
          size="LG"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        >
          Generate Campaign
        </Button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">AI Campaign Tips:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Be specific in your custom prompt for better results</li>
              <li>• Email campaigns work best for nurturing leads over time</li>
              <li>• Social media posts are great for brand awareness</li>
              <li>• Direct messages are perfect for personalized outreach</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignForm;