// components/forms/OnboardingForm.js
import React, { useState } from 'react';
import { Button, ErrorMessage } from '../common';
import { ONBOARDING_STEPS, VALIDATION_RULES } from '../../constants';

const OnboardingForm = ({ 
  onSubmit, 
  loading = false, 
  error = null,
  initialData = {},
  userName = 'User'
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    business_type: '',
    industry: '',
    product_service: '',
    target_audience: '',
    campaign_goal: '',
    ...initialData
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateCurrentStep = () => {
    const currentStepData = ONBOARDING_STEPS[currentStep];
    const fieldValue = formData[currentStepData.field];
    
    if (!fieldValue || fieldValue.trim() === '') {
      setValidationErrors({ [currentStepData.field]: 'This field is required' });
      return false;
    }
    
    // Additional validation for textarea fields
    if (currentStepData.type === 'textarea') {
      if (fieldValue.length > (currentStepData.maxLength || 500)) {
        setValidationErrors({ 
          [currentStepData.field]: `Must be no more than ${currentStepData.maxLength || 500} characters` 
        });
        return false;
      }
      if (fieldValue.length < 10) {
        setValidationErrors({ 
          [currentStepData.field]: 'Please provide at least 10 characters' 
        });
        return false;
      }
    }
    
    setValidationErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit form
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
    setValidationErrors({});
  };

  const handleSubmit = () => {
    if (!validateCurrentStep()) return;
    
    // Validate all required fields
    const missingFields = ONBOARDING_STEPS.filter(step => 
      !formData[step.field] || formData[step.field].trim() === ''
    );
    
    if (missingFields.length > 0) {
      setValidationErrors({ 
        form: `Please complete all steps: ${missingFields.map(f => f.title).join(', ')}` 
      });
      return;
    }
    
    onSubmit(formData);
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear validation error
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: null });
    }
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progressPercentage = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {userName}!
          </h1>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {currentStepData.question}
        </h2>

        {/* Selection Options */}
        {currentStepData.options ? (
          <div className="space-y-3">
            {currentStepData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleFieldChange(currentStepData.field, option)}
                className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                  formData[currentStepData.field] === option
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm'
                    : 'border-gray-200 hover:border-indigo-300 text-gray-700 hover:bg-gray-50'
                }`}
                disabled={loading}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
        ) : (
          /* Textarea Input */
          <div>
            <textarea
              value={formData[currentStepData.field]}
              onChange={(e) => handleFieldChange(currentStepData.field, e.target.value)}
              className={`w-full p-4 border-2 rounded-lg focus:outline-none resize-none h-32 transition-colors ${
                validationErrors[currentStepData.field]
                  ? 'border-red-300 focus:border-red-600 bg-red-50'
                  : 'border-gray-200 focus:border-indigo-600'
              }`}
              placeholder={currentStepData.placeholder || "Enter your answer..."}
              maxLength={currentStepData.maxLength || 500}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-2">
              <div>
                {validationErrors[currentStepData.field] && (
                  <p className="text-sm text-red-600">
                    {validationErrors[currentStepData.field]}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {formData[currentStepData.field]?.length || 0} / {currentStepData.maxLength || 500}
              </div>
            </div>
          </div>
        )}

        {/* General validation error */}
        {validationErrors[currentStepData.field] && currentStepData.options && (
          <ErrorMessage 
            message={validationErrors[currentStepData.field]}
            variant="danger"
            className="mt-4"
          />
        )}
      </div>

      {/* Form Error */}
      {error && (
        <ErrorMessage 
          message={error}
          variant="danger"
          className="mb-6"
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0 || loading}
          variant="OUTLINE"
          size="LG"
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!formData[currentStepData.field] || loading}
          loading={loading && currentStep === ONBOARDING_STEPS.length - 1}
          variant="PRIMARY"
          size="LG"
        >
          {loading && currentStep === ONBOARDING_STEPS.length - 1 
            ? 'Saving...' 
            : currentStep === ONBOARDING_STEPS.length - 1 
              ? 'Complete Setup' 
              : 'Next'
          }
        </Button>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center mt-8 space-x-2">
        {ONBOARDING_STEPS.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentStep
                ? 'bg-indigo-600'
                : index < currentStep
                  ? 'bg-indigo-300'
                  : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingForm;