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
import { CalendarIcon, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';

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
          >
            Next: Location & Schedule
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
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleNext} size="lg">
            Next: Budget & Requirements
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
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={handleNext}
            disabled={!data.budget?.amount || !data.budget?.type}
            size="lg"
          >
            Next: Review & Post
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ReviewStep: React.FC<StepProps> = ({ data, onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    // Handle success/redirect
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
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button 
            onClick={handleSubmit}
            loading={isSubmitting}
            size="lg"
            className="min-w-32"
          >
            {isSubmitting ? 'Posting...' : 'Post Task'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const TaskCreationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
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
    requirements: []
  });

  const steps = [
    { id: 1, title: 'Task Details', component: TaskDetailsStep },
    { id: 2, title: 'Location & Schedule', component: LocationStep },
    { id: 3, title: 'Budget & Requirements', component: BudgetStep },
    { id: 4, title: 'Review & Post', component: ReviewStep }
  ];

  const updateTaskData = (updates: Partial<TaskData>) => {
    setTaskData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="task-creation-wizard max-w-4xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="progress-steps flex justify-between mb-8">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className={cn(
              "flex items-center space-x-2",
              currentStep >= step.id && "text-primary-600",
              currentStep < step.id && "text-text-secondary"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
              currentStep > step.id && "bg-primary-600 border-primary-600 text-white",
              currentStep === step.id && "border-primary-600 text-primary-600",
              currentStep < step.id && "border-border text-text-secondary"
            )}>
              {currentStep > step.id ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{step.id}</span>
              )}
            </div>
            <span className="text-sm font-medium hidden sm:block">{step.title}</span>
            {index < steps.length - 1 && (
              <div className={cn(
                "hidden sm:block w-16 h-0.5 ml-2",
                currentStep > step.id ? "bg-primary-600" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>
      
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
          {React.createElement(steps[currentStep - 1].component, {
            data: taskData,
            onUpdate: updateTaskData,
            onNext: nextStep,
            onBack: prevStep
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
