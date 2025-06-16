import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarIcon, CheckCircle } from 'lucide-react';
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
  requirements: string[];
}

interface StepProps {
  data: TaskData;
  onUpdate: (data: Partial<TaskData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TaskDetailsStep: React.FC<StepProps> = ({ data, onUpdate, onNext }) => {
  const categories = [
    'Cleaning & Maintenance',
    'Handyman Services', 
    'Moving & Delivery',
    'Personal Assistant',
    'Tech Support',
    'Design & Creative',
    'Writing & Translation',
    'Other'
  ];

  const handleNext = () => {
    if (data.title && data.description && data.category) {
      onNext();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-display">Task Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Task Title <span className="text-error">*</span>
          </Label>
          <Input
            id="title"
            value={data.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="What do you need help with?"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-error">*</span>
          </Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Provide more details about your task..."
            rows={4}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Category <span className="text-error">*</span>
          </Label>
          <Select value={data.category} onValueChange={(value) => onUpdate({ category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!data.title || !data.description || !data.category}
            size="lg"
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            Next: Location & Schedule
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const LocationStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const [date, setDate] = useState<Date | undefined>(data.dueDate);

  const handleNext = () => {
    onUpdate({ dueDate: date });
    onNext();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-display">Location & Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="remote"
              checked={data.location?.isRemote || false}
              onChange={(e) => onUpdate({
                location: { ...data.location, isRemote: e.target.checked }
              })}
              className="rounded border-border"
              aria-label="This is a remote task"
            />
            <Label htmlFor="remote">This is a remote task</Label>
          </div>

          {!data.location?.isRemote && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={data.location?.address || ''}
                  onChange={(e) => onUpdate({ 
                    location: { ...data.location, address: e.target.value }
                  })}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={data.location?.city || ''}
                  onChange={(e) => onUpdate({ 
                    location: { ...data.location, city: e.target.value }
                  })}
                  placeholder="City"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Due Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-text-secondary"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext} size="lg" className="bg-primary-600 hover:bg-primary-700 text-white">
            Next: Budget & Requirements
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const BudgetStep: React.FC<StepProps> = ({ data, onUpdate, onNext, onBack }) => {
  const handleNext = () => {
    if (data.budget?.amount && data.budget?.type) {
      onNext();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-display">Budget & Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium">
            Budget Type <span className="text-error">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={data.budget?.type === 'fixed' ? 'primary' : 'outline'}
              onClick={() => onUpdate({ budget: { ...data.budget, type: 'fixed' } })}
              className="h-16 flex-col"
            >
              <span className="font-semibold">Fixed Price</span>
              <span className="text-sm">One-time payment</span>
            </Button>
            <Button
              variant={data.budget?.type === 'hourly' ? 'primary' : 'outline'}
              onClick={() => onUpdate({ budget: { ...data.budget, type: 'hourly' } })}
              className="h-16 flex-col"
            >
              <span className="font-semibold">Hourly Rate</span>
              <span className="text-sm">Pay per hour</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Amount ({data.budget?.type === 'hourly' ? 'per hour' : 'total'}) <span className="text-error">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">$</span>
            <Input
              id="amount"
              type="number"
              value={data.budget?.amount || ''}
              onChange={(e) => onUpdate({ 
                budget: { ...data.budget, amount: parseFloat(e.target.value) || 0 }
              })}
              placeholder="0.00"
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!data.budget?.amount || !data.budget?.type}
            size="lg"
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            Next: Review & Post
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ReviewStep: React.FC<StepProps & { onComplete?: (data: TaskData) => void }> = ({ data, onBack, onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Call the completion handler with the data
      if (onComplete) {
        await onComplete(data);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-display">Review & Post</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-text-primary">Task Title</h3>
            <p className="text-text-secondary">{data.title}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-text-primary">Description</h3>
            <p className="text-text-secondary">{data.description}</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-text-primary">Budget</h3>
            <p className="text-text-secondary">
              ${data.budget?.amount} {data.budget?.type === 'hourly' ? 'per hour' : 'fixed price'}
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="min-w-32 bg-green-600 hover:bg-green-700 text-white"
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
  );
};

interface TaskCreationWizardProps {
  onComplete?: (taskData: TaskData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<TaskData>;
  className?: string;
}

export const TaskCreationWizard: React.FC<TaskCreationWizardProps> = ({
  onComplete = async () => {},
  onCancel = () => {},
  initialData = {},
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0); // 0-based indexing for ProgressIndicator
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
    requirements: [],
    ...initialData
  });

  // Updated 4-step process
  const steps = [
    { id: 'details', title: 'Task Details', description: 'Describe what you need done', component: TaskDetailsStep },
    { id: 'location', title: 'Location & Schedule', description: 'Set location and timing', component: LocationStep },
    { id: 'budget', title: 'Budget & Requirements', description: 'Set your budget', component: BudgetStep },
    { id: 'review', title: 'Review & Post', description: 'Review and publish your task', component: ReviewStep }
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

  // Validation functions for each step
  const validateStep = useCallback((stepIndex: number, data: TaskData): boolean => {
    switch (stepIndex) {
      case 0: // Task Details
        return !!(data.title && data.description && data.category);
      case 1: // Location & Schedule
        return data.location?.isRemote || !!(data.location?.address && data.location?.city);
      case 2: // Budget & Requirements
        return !!(data.budget?.amount && data.budget?.type);
      case 3: // Review & Post
        return true; // Always valid if we reached here
      default:
        return false;
    }
  }, []);

  // Check if a step is accessible (completed or current)
  const isStepAccessible = useCallback((stepIndex: number): boolean => {
    if (stepIndex === 0) return true; // First step is always accessible

    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!validateStep(i, taskData)) {
        return false;
      }
    }
    return true;
  }, [taskData, validateStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (isStepAccessible(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  }, [isStepAccessible]);

  // Progress steps for indicator (removed unused variable)

  return (
    <div className={cn("task-creation-wizard min-h-screen bg-neutral-50", className)}>
      <div className="flex">
        {/* Sidebar with Steps */}
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
                const isCompleted = validateStep(index, taskData) && index < currentStep;
                const isActive = index === currentStep;
                const isAccessible = isStepAccessible(index);

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
                    onClick={() => isAccessible && handleStepClick(index)}
                  >
                    {/* Step Number/Icon */}
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

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "text-sm font-semibold font-heading",
                        isActive && "text-primary-900",
                        isCompleted && "text-green-900",
                        !isActive && !isCompleted && "text-neutral-600"
                      )}>
                        {step.title}
                      </h3>
                      <p className={cn(
                        "text-xs font-body mt-1",
                        isActive && "text-primary-700",
                        isCompleted && "text-green-700",
                        !isActive && !isCompleted && "text-neutral-500"
                      )}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="step-content"
              >
                {React.createElement(steps[currentStep].component, {
                  data: taskData,
                  onUpdate: updateTaskData,
                  onNext: nextStep,
                  onBack: prevStep,
                  ...(currentStep === 3 && { onComplete })
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
