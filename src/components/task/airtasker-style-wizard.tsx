/**
 * Airtasker-Style Task Creation Wizard
 * 
 * Implements Airtasker's exact 4-step process:
 * 1. Title & Date - Basic task info and timing
 * 2. Location - Where the task needs to be done
 * 3. Details - Description and category
 * 4. Budget - Pricing and final submission
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface TaskData {
  title: string;
  description: string;
  category: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    isRemote: boolean;
  };
  budget: {
    amount: number;
    type: 'fixed' | 'hourly';
  };
  dueDate?: Date;
  dateType?: 'on' | 'before' | 'flexible';
}

interface StepProps {
  data: TaskData;
  onUpdate: (updates: Partial<TaskData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Step 1: Title & Date (Airtasker Style)
const TitleDateStep: React.FC<StepProps> = ({ data, onUpdate, onNext }) => {
  const [dueDate, setDueDate] = useState<Date | undefined>(data.dueDate);
  const [dateType, setDateType] = useState<'on' | 'before' | 'flexible'>(data.dateType || 'flexible');

  const handleNext = () => {
    if (data.title && (dateType === 'flexible' || dueDate)) {
      onUpdate({ 
        dueDate: dateType === 'flexible' ? undefined : dueDate,
        dateType 
      });
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
          Let's start with the basics
        </h2>
        <p className="text-neutral-600 font-body">
          Step 1/4
        </p>
      </div>

      <Card className="border-2 border-neutral-200 shadow-lg">
        <CardContent className="p-8 space-y-8">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-lg font-medium text-neutral-900 font-heading">
              In a few words, what do you need done?
            </Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="e.g. Help me move a couch"
              className="text-lg p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium text-neutral-900 font-heading">
              When do you need this done?
            </Label>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="on-date"
                  name="dateType"
                  value="on"
                  checked={dateType === 'on'}
                  onChange={(e) => setDateType(e.target.value as 'on')}
                  className="w-4 h-4 text-primary-600"
                />
                <Label htmlFor="on-date" className="font-body">On date</Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="before-date"
                  name="dateType"
                  value="before"
                  checked={dateType === 'before'}
                  onChange={(e) => setDateType(e.target.value as 'before')}
                  className="w-4 h-4 text-primary-600"
                />
                <Label htmlFor="before-date" className="font-body">Before date</Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  id="flexible"
                  name="dateType"
                  value="flexible"
                  checked={dateType === 'flexible'}
                  onChange={(e) => setDateType(e.target.value as 'flexible')}
                  className="w-4 h-4 text-primary-600"
                />
                <Label htmlFor="flexible" className="font-body">I'm flexible</Label>
              </div>
            </div>

            {(dateType === 'on' || dateType === 'before') && (
              <div className="mt-4">
                <Input
                  type="date"
                  value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : undefined)}
                  className="border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleNext}
              disabled={!data.title || (dateType !== 'flexible' && !dueDate)}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 2: Location (Airtasker Style)
const LocationStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const handleNext = () => {
    if (data.location?.isRemote || (data.location?.address && data.location?.city)) {
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
          Where do you need this done?
        </h2>
        <p className="text-neutral-600 font-body">
          Step 2/4
        </p>
      </div>

      <Card className="border-2 border-neutral-200 shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="remote"
                checked={data.location?.isRemote || false}
                onChange={(e) => onUpdate({
                  location: { ...data.location, isRemote: e.target.checked }
                })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <Label htmlFor="remote" className="font-body">This can be done remotely</Label>
            </div>

            {!data.location?.isRemote && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-lg font-medium text-neutral-900 font-heading">
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={data.location?.address || ''}
                    onChange={(e) => onUpdate({ 
                      location: { ...data.location, address: e.target.value }
                    })}
                    placeholder="Enter your address"
                    className="text-lg p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-medium text-neutral-900 font-body">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={data.location?.city || ''}
                      onChange={(e) => onUpdate({ 
                        location: { ...data.location, city: e.target.value }
                      })}
                      placeholder="City"
                      className="border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state" className="font-medium text-neutral-900 font-body">
                      State
                    </Label>
                    <Input
                      id="state"
                      value={data.location?.state || ''}
                      onChange={(e) => onUpdate({ 
                        location: { ...data.location, state: e.target.value }
                      })}
                      placeholder="State"
                      className="border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              onClick={onBack}
              variant="outline"
              size="lg"
              className="border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-8 py-3 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!data.location?.isRemote && (!data.location?.address || !data.location?.city)}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 3: Details (Airtasker Style)
const DetailsStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const categories = [
    'Cleaning',
    'Handyman',
    'Moving & Delivery',
    'Gardening',
    'Tech Support',
    'Assembly',
    'Painting',
    'Plumbing',
    'Electrical',
    'Carpentry',
    'Other'
  ];

  const handleNext = () => {
    if (data.description && data.category) {
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
          Tell us more about your task
        </h2>
        <p className="text-neutral-600 font-body">
          Step 3/4
        </p>
      </div>

      <Card className="border-2 border-neutral-200 shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="description" className="text-lg font-medium text-neutral-900 font-heading">
              Describe what you need done
            </Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Be as specific as possible about what you need done. Include any requirements, materials needed, or special instructions."
              rows={6}
              className="text-base p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body resize-none"
            />
            <p className="text-sm text-neutral-500 font-body">
              {data.description.length}/500 characters
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-medium text-neutral-900 font-heading">
              What category best describes your task?
            </Label>
            <Select value={data.category} onValueChange={(value) => onUpdate({ category: value })}>
              <SelectTrigger className="text-base p-4 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="font-body">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-8 py-3 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!data.description || !data.category}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step 4: Budget (Airtasker Style)
const BudgetStep: React.FC<StepProps> = ({ data, onUpdate, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (data.budget?.amount && data.budget?.type) {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitting(false);
      // Handle success/redirect
      console.log('Task submitted:', data);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 font-heading mb-2">
          What's your budget?
        </h2>
        <p className="text-neutral-600 font-body">
          Step 4/4
        </p>
      </div>

      <Card className="border-2 border-neutral-200 shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <Label className="text-lg font-medium text-neutral-900 font-heading">
              How would you like to pay?
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={data.budget?.type === 'fixed' ? 'default' : 'outline'}
                onClick={() => onUpdate({ budget: { ...data.budget, type: 'fixed' } })}
                className={cn(
                  "h-20 flex-col space-y-1 border-2",
                  data.budget?.type === 'fixed'
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-neutral-300 hover:border-primary-300"
                )}
              >
                <span className="font-semibold">Fixed Price</span>
                <span className="text-sm opacity-80">One-time payment</span>
              </Button>
              <Button
                variant={data.budget?.type === 'hourly' ? 'default' : 'outline'}
                onClick={() => onUpdate({ budget: { ...data.budget, type: 'hourly' } })}
                className={cn(
                  "h-20 flex-col space-y-1 border-2",
                  data.budget?.type === 'hourly'
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-neutral-300 hover:border-primary-300"
                )}
              >
                <span className="font-semibold">Hourly Rate</span>
                <span className="text-sm opacity-80">Pay per hour</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="amount" className="text-lg font-medium text-neutral-900 font-heading">
              {data.budget?.type === 'hourly' ? 'Hourly rate' : 'Total budget'}
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500 text-lg">$</span>
              <Input
                id="amount"
                type="number"
                value={data.budget?.amount || ''}
                onChange={(e) => onUpdate({
                  budget: { ...data.budget, amount: parseFloat(e.target.value) || 0 }
                })}
                placeholder="0"
                className="text-lg p-4 pl-8 border-2 border-neutral-200 focus:border-primary-500 rounded-lg font-body"
              />
            </div>
            <p className="text-sm text-neutral-500 font-body">
              {data.budget?.type === 'hourly'
                ? 'This is what you\'ll pay per hour of work'
                : 'This is the total amount you\'re willing to pay for this task'
              }
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-8 py-3 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!data.budget?.amount || !data.budget?.type || isSubmitting}
              size="lg"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg min-w-32"
            >
              {isSubmitting ? (
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
    </div>
  );
};

// Main Airtasker-Style Wizard Component
interface AirtaskerStyleWizardProps {
  onComplete?: (taskData: TaskData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TaskData>;
  className?: string;
}

export const AirtaskerStyleWizard: React.FC<AirtaskerStyleWizardProps> = ({
  onComplete: _onComplete,
  onCancel: _onCancel,
  initialData = {},
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [taskData, setTaskData] = useState<TaskData>({
    title: '',
    description: '',
    category: '',
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      isRemote: false
    },
    budget: {
      amount: 0,
      type: 'fixed'
    },
    ...initialData
  });

  const steps = [
    { component: TitleDateStep, title: 'Title & Date' },
    { component: LocationStep, title: 'Location' },
    { component: DetailsStep, title: 'Details' },
    { component: BudgetStep, title: 'Budget' }
  ];

  const updateTaskData = useCallback((updates: Partial<TaskData>) => {
    setTaskData(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  return (
    <div className={cn("airtasker-wizard min-h-screen bg-neutral-50 py-8", className)}>
      <div className="container mx-auto px-4">
        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((_step, index) => (
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
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {React.createElement(steps[currentStep].component, {
              data: taskData,
              onUpdate: updateTaskData,
              onNext: nextStep,
              onBack: prevStep
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
