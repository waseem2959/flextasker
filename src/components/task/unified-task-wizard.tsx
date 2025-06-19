/**
 * Unified Task Creation Wizard
 * 
 * Combines both task-creation-wizard and airtasker-style-wizard into a single
 * configurable component that can switch between different styles and flows.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { BudgetType, TaskPriority } from '@/types';
import { createTaskSchema } from '@/utils/form-validation';
import { z } from 'zod';

type TaskCreateData = z.infer<typeof createTaskSchema>;

/**
 * Wizard style configuration
 */
export type WizardStyle = 'default' | 'airtasker' | 'minimal';

/**
 * Wizard configuration
 */
interface WizardConfig {
  style: WizardStyle;
  showSidebar: boolean;
  showProgress: boolean;
  allowSkipOptional: boolean;
  steps: string[];
}

/**
 * Step component props
 */
interface StepProps {
  style: WizardStyle;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Wizard props
 */
interface UnifiedTaskWizardProps {
  style?: WizardStyle;
  initialData?: Partial<TaskCreateData>;
  categories: Array<{ id: string; name: string }>;
  onComplete?: (taskData: TaskCreateData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  config?: Partial<WizardConfig>;
}

/**
 * Basic Info Step Component
 */
const BasicInfoStep: React.FC<StepProps & { 
  state: any; 
  actions: any; 
  categories: Array<{ id: string; name: string }>;
}> = ({ style, onNext, canProceed, state, actions, categories }) => {
  const isAirtaskerStyle = style === 'airtasker';
  
  return (
    <Card className={cn(
      isAirtaskerStyle ? "border-2 border-neutral-200 shadow-lg" : "w-full"
    )}>
      {!isAirtaskerStyle && (
        <CardHeader>
          <CardTitle className="text-xl font-display">Task Details</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-6", isAirtaskerStyle ? "p-8" : "")}>
        {isAirtaskerStyle && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
              Let's start with the basics
            </h2>
            <p className="text-neutral-600 font-body">Step 1/4</p>
          </div>
        )}
        
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className={cn(
            isAirtaskerStyle ? "text-lg font-medium text-neutral-900 font-heading" : "text-sm font-medium"
          )}>
            {isAirtaskerStyle ? "In a few words, what do you need done?" : "Task Title"}
            <span className="text-error">*</span>
          </Label>
          <Input
            id="title"
            value={state.data.title || ''}
            onChange={(e) => actions.setField('title', e.target.value)}
            onBlur={() => actions.setTouched('title')}
            placeholder={isAirtaskerStyle ? "e.g. Help me move a couch" : "What do you need help with?"}
            className={cn(
              isAirtaskerStyle ? "text-lg p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" : "w-full",
              state.errors.title && state.touched.title ? 'border-red-500' : ''
            )}
          />
          {state.errors.title && state.touched.title && (
            <p className="text-sm text-red-500">{state.errors.title[0]}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className={cn(
            isAirtaskerStyle ? "text-lg font-medium text-neutral-900 font-heading" : "text-sm font-medium"
          )}>
            Description <span className="text-error">*</span>
          </Label>
          <Textarea
            id="description"
            value={state.data.description || ''}
            onChange={(e) => actions.setField('description', e.target.value)}
            onBlur={() => actions.setTouched('description')}
            placeholder="Provide more details about your task..."
            rows={isAirtaskerStyle ? 6 : 4}
            className={cn(
              isAirtaskerStyle ? "text-base p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body resize-none" : "w-full",
              state.errors.description && state.touched.description ? 'border-red-500' : ''
            )}
          />
          {state.errors.description && state.touched.description && (
            <p className="text-sm text-red-500">{state.errors.description[0]}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className={cn(
            isAirtaskerStyle ? "text-lg font-medium text-neutral-900 font-heading" : "text-sm font-medium"
          )}>
            Category <span className="text-error">*</span>
          </Label>
          <Select 
            value={state.data.category || ''} 
            onValueChange={(value) => actions.setField('category', value)}
          >
            <SelectTrigger className={cn(
              isAirtaskerStyle ? "text-base p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" : ""
            )}>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors.category && state.touched.category && (
            <p className="text-sm text-red-500">{state.errors.category[0]}</p>
          )}
        </div>

        {/* Next Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={onNext}
            disabled={!canProceed}
            size="lg"
            className={cn(
              isAirtaskerStyle ? "bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg" : "bg-primary-600 hover:bg-primary-700 text-white"
            )}
          >
            Next: Location & Schedule
            {!isAirtaskerStyle && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Location Step Component
 */
const LocationStep: React.FC<StepProps & { state: any; actions: any }> = ({ 
  style, onNext, onBack, canProceed, state, actions 
}) => {
  const isAirtaskerStyle = style === 'airtasker';
  
  return (
    <Card className={cn(
      isAirtaskerStyle ? "border-2 border-neutral-200 shadow-lg" : "w-full"
    )}>
      {!isAirtaskerStyle && (
        <CardHeader>
          <CardTitle className="text-xl font-display">Location & Schedule</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-6", isAirtaskerStyle ? "p-8" : "")}>
        {isAirtaskerStyle && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
              Where do you need this done?
            </h2>
            <p className="text-neutral-600 font-body">Step 2/4</p>
          </div>
        )}
        
        {/* Remote Toggle */}
        <div className="flex items-center space-x-3">
          <Switch
            id="isRemote"
            checked={state.data.location?.isRemote || false}
            onCheckedChange={(checked) => actions.setField('location', { 
              ...state.data.location, 
              isRemote: checked 
            })}
          />
          <Label htmlFor="isRemote" className="font-body">
            This {isAirtaskerStyle ? 'can be done remotely' : 'is a remote task'}
          </Label>
        </div>

        {/* Physical Location Fields */}
        {!state.data.location?.isRemote && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className={cn(
                isAirtaskerStyle ? "text-lg font-medium text-neutral-900 font-heading" : "font-medium text-neutral-900"
              )}>
                Address
              </Label>
              <Input
                id="address"
                value={state.data.location?.address || ''}
                onChange={(e) => actions.setField('location', { 
                  ...state.data.location, 
                  address: e.target.value 
                })}
                placeholder="Enter your address"
                className={cn(
                  isAirtaskerStyle ? "text-lg p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" : ""
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="font-medium text-neutral-900">City</Label>
                <Input
                  id="city"
                  value={state.data.location?.city || ''}
                  onChange={(e) => actions.setField('location', { 
                    ...state.data.location, 
                    city: e.target.value 
                  })}
                  placeholder="City"
                  className={cn(
                    isAirtaskerStyle ? "border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" : ""
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state" className="font-medium text-neutral-900">State</Label>
                <Input
                  id="state"
                  value={state.data.location?.state || ''}
                  onChange={(e) => actions.setField('location', { 
                    ...state.data.location, 
                    state: e.target.value 
                  })}
                  placeholder="State"
                  className={cn(
                    isAirtaskerStyle ? "border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" : ""
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className={cn(
              isAirtaskerStyle ? "border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-8 py-3 rounded-lg" : ""
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed}
            size="lg"
            className={cn(
              isAirtaskerStyle ? "bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg" : "bg-primary-600 hover:bg-primary-700 text-white"
            )}
          >
            Next: Budget & Requirements
            {!isAirtaskerStyle && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Budget Step Component
 */
const BudgetStep: React.FC<StepProps & { state: any; actions: any }> = ({ 
  style, onNext, onBack, canProceed, state, actions 
}) => {
  const isAirtaskerStyle = style === 'airtasker';
  
  return (
    <Card className={cn(
      isAirtaskerStyle ? "border-2 border-neutral-200 shadow-lg" : "w-full"
    )}>
      {!isAirtaskerStyle && (
        <CardHeader>
          <CardTitle className="text-xl font-display">Budget & Requirements</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-6", isAirtaskerStyle ? "p-8" : "")}>
        {isAirtaskerStyle && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
              What's your budget?
            </h2>
            <p className="text-neutral-600 font-body">Step 3/4</p>
          </div>
        )}
        
        {/* Budget Type */}
        <div className="space-y-4">
          <Label className={cn(
            isAirtaskerStyle ? "text-lg font-medium text-neutral-900 font-heading" : "text-sm font-medium"
          )}>
            {isAirtaskerStyle ? "How would you like to pay?" : "Budget Type"} 
            <span className="text-error">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={state.data.budget?.type === BudgetType.FIXED ? 'default' : 'outline'}
              onClick={() => actions.setField('budget', { 
                ...state.data.budget, 
                type: BudgetType.FIXED 
              })}
              className={cn(
                "h-20 flex-col space-y-1",
                isAirtaskerStyle ? "border-2" : "",
                state.data.budget?.type === BudgetType.FIXED
                  ? isAirtaskerStyle ? "bg-primary-600 text-white border-primary-600" : ""
                  : isAirtaskerStyle ? "border-neutral-300 hover:border-primary-300" : ""
              )}
            >
              <span className="font-semibold">Fixed Price</span>
              <span className="text-sm opacity-80">One-time payment</span>
            </Button>
            <Button
              variant={state.data.budget?.type === BudgetType.HOURLY ? 'default' : 'outline'}
              onClick={() => actions.setField('budget', { 
                ...state.data.budget, 
                type: BudgetType.HOURLY 
              })}
              className={cn(
                "h-20 flex-col space-y-1",
                isAirtaskerStyle ? "border-2" : "",
                state.data.budget?.type === BudgetType.HOURLY
                  ? isAirtaskerStyle ? "bg-primary-600 text-white border-primary-600" : ""
                  : isAirtaskerStyle ? "border-neutral-300 hover:border-primary-300" : ""
              )}
            >
              <span className="font-semibold">Hourly Rate</span>
              <span className="text-sm opacity-80">Pay per hour</span>
            </Button>
          </div>
        </div>

        {/* Budget Amount */}
        <div className="space-y-3">
          <Label htmlFor="amount" className={cn(
            isAirtaskerStyle ? "text-lg font-medium text-neutral-900 font-heading" : "text-sm font-medium"
          )}>
            {state.data.budget?.type === BudgetType.HOURLY ? 'Hourly rate' : 'Total budget'}
            <span className="text-error">*</span>
          </Label>
          <div className="relative">
            <span className={cn(
              "absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500",
              isAirtaskerStyle ? "text-lg" : ""
            )}>$</span>
            <Input
              id="amount"
              type="number"
              value={state.data.budget?.amount || ''}
              onChange={(e) => actions.setField('budget', {
                ...state.data.budget,
                amount: parseFloat(e.target.value) || 0
              })}
              placeholder="0"
              className={cn(
                isAirtaskerStyle ? "text-lg p-4 pl-8 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body" : "pl-8"
              )}
            />
          </div>
          {isAirtaskerStyle && (
            <p className="text-sm text-neutral-500 font-body">
              {state.data.budget?.type === BudgetType.HOURLY
                ? 'This is what you\'ll pay per hour of work'
                : 'This is the total amount you\'re willing to pay for this task'
              }
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className={cn(
              isAirtaskerStyle ? "border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-8 py-3 rounded-lg" : ""
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={!canProceed}
            size="lg"
            className={cn(
              isAirtaskerStyle ? "bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg" : "bg-primary-600 hover:bg-primary-700 text-white"
            )}
          >
            Next: Review & Submit
            {!isAirtaskerStyle && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Review Step Component
 */
const ReviewStep: React.FC<StepProps & { 
  state: any; 
  actions: any; 
  onComplete?: (data: TaskCreateData) => Promise<void>;
}> = ({ style, onBack, state, actions, onComplete }) => {
  const isAirtaskerStyle = style === 'airtasker';
  
  const handleSubmit = async () => {
    if (onComplete) {
      actions.setSubmitting(true);
      try {
        await onComplete(state.data as TaskCreateData);
      } catch (error) {
        console.error('Error submitting task:', error);
      } finally {
        actions.setSubmitting(false);
      }
    }
  };

  return (
    <Card className={cn(
      isAirtaskerStyle ? "border-2 border-neutral-200 shadow-lg" : "w-full"
    )}>
      {!isAirtaskerStyle && (
        <CardHeader>
          <CardTitle className="text-xl font-display">Review & Post</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className={cn("space-y-6", isAirtaskerStyle ? "p-8" : "")}>
        {isAirtaskerStyle && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
              Review & Post
            </h2>
            <p className="text-neutral-600 font-body">Step 4/4</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-text-primary">Task Title</h3>
            <p className="text-text-secondary">{state.data.title}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-text-primary">Description</h3>
            <p className="text-text-secondary">{state.data.description}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-text-primary">Budget</h3>
            <p className="text-text-secondary">
              ${state.data.budget?.amount} {state.data.budget?.type === BudgetType.HOURLY ? 'per hour' : 'fixed price'}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-text-primary">Location</h3>
            <p className="text-text-secondary">
              {state.data.location?.isRemote ? 'Remote' : `${state.data.location?.address}, ${state.data.location?.city}`}
            </p>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            size="lg"
            className={cn(
              isAirtaskerStyle ? "border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-8 py-3 rounded-lg" : ""
            )}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={state.isSubmitting}
            size="lg"
            className={cn(
              isAirtaskerStyle ? "bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg min-w-32" : "min-w-32 bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            {state.isSubmitting ? (
              'Posting...'
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Post Task
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Unified Task Wizard Component
 */
export const UnifiedTaskWizard: React.FC<UnifiedTaskWizardProps> = ({
  style = 'default',
  initialData,
  categories,
  onComplete: _onComplete,
  onCancel,
  className,
  config,
}) => {
  const defaultConfig: WizardConfig = {
    style,
    showSidebar: style === 'default',
    showProgress: true,
    allowSkipOptional: true,
    steps: ['basic-info', 'location', 'budget', 'review'],
  };

  const wizardConfig = { ...defaultConfig, ...config };
  const isAirtaskerStyle = style === 'airtasker';

  // Simple local state for now - TODO: Use shared form state hook
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<TaskCreateData>>({
    priority: TaskPriority.MEDIUM,
    budget: {
      type: BudgetType.FIXED,
      amount: 0,
      currency: 'USD' as const,
      negotiable: false,
    },
    location: {
      isRemote: false,
    },
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic info
        return !!(formData.title && formData.description && formData.category);
      case 1: // Location
        return formData.location?.isRemote || !!(formData.location?.address && formData.location?.city);
      case 2: // Budget
        return !!(formData.budget?.amount && formData.budget?.type);
      case 3: // Review
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  };

  // Mock state and actions to match the expected interface
  const state = {
    data: formData,
    currentStep,
    errors: {},
    touched: {},
    canProceed: canProceed(),
    isSubmitting,
    completedSteps: new Set(Array.from({length: currentStep}, (_, i) => i)),
    canGoToStep: (step: number) => step <= currentStep + 1,
  };

  const actions = {
    setField,
    nextStep,
    prevStep,
    goToStep,
    setSubmitting: setIsSubmitting,
    setTouched: () => {},
  };

  const steps = [
    { id: 'basic-info', title: 'Basic Info', component: BasicInfoStep },
    { id: 'location', title: 'Location', component: LocationStep },
    { id: 'budget', title: 'Budget', component: BudgetStep },
    { id: 'review', title: 'Review', component: ReviewStep },
  ];

  const currentStepComponent = steps[currentStep]?.component;

  const stepProps: StepProps = {
    style,
    onNext: nextStep,
    onBack: prevStep,
    canProceed: canProceed(),
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
  };

  if (isAirtaskerStyle) {
    return (
      <div className={cn("airtasker-wizard min-h-screen bg-neutral-50 py-8", className)}>
        <div className="container mx-auto px-4">
          {/* Progress Bar */}
          {wizardConfig.showProgress && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((_, index) => (
                  <div key={`step-${index}`} className="flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                      index <= currentStep
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-200 text-neutral-500"
                    )}>
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        "w-16 h-1 mx-2",
                        index < currentStep ? "bg-primary-600" : "bg-neutral-200"
                      )} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-neutral-600 font-body">
                  Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
                </p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepComponent && React.createElement(currentStepComponent, {
                ...stepProps,
                state,
                actions,
                categories,
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Default style with sidebar
  return (
    <div className={cn("task-creation-wizard min-h-screen bg-neutral-50", className)}>
      <div className="flex">
        {/* Sidebar */}
        {wizardConfig.showSidebar && (
          <div className="w-80 bg-white shadow-lg border-r border-neutral-200 min-h-screen">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-heading font-bold text-neutral-900">
                  Create a New Task
                </h1>
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
              <p className="text-sm text-neutral-600 font-body">
                Follow these steps to post your task
              </p>
            </div>

            {/* Steps Sidebar */}
            <div className="p-6">
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const isCompleted = state.completedSteps.has(index);
                  const isActive = index === currentStep;
                  const isAccessible = state.canGoToStep(index);

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer",
                        isActive && "bg-primary-50 border border-primary-200",
                        isCompleted && !isActive && "bg-green-50 border border-green-200 hover:bg-green-100",
                        !isActive && !isCompleted && !isAccessible && "opacity-50 cursor-not-allowed",
                        !isActive && !isCompleted && isAccessible && "hover:bg-neutral-50"
                      )}
                      onClick={() => isAccessible && goToStep(index)}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                        isCompleted && "bg-green-500 text-white",
                        isActive && "bg-primary-600 text-white",
                        !isActive && !isCompleted && "bg-neutral-200 text-neutral-600"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "text-sm font-semibold font-heading",
                          isActive && "text-primary-900",
                          isCompleted && "text-green-900",
                          !isActive && !isCompleted && "text-neutral-600"
                        )}>
                          {step.title}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {currentStepComponent && React.createElement(currentStepComponent, {
                  ...stepProps,
                  state,
                  actions,
                  categories,
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTaskWizard;