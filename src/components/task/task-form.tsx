/**
 * Task Form Component
 * 
 * A reusable form for creating and editing tasks with strong TypeScript
 * typing throughout the validation and submission process.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useFormValidation } from '@/hooks/use-form';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';
import { CreateTaskRequest, UpdateTaskRequest } from '@/services/api/task-service';
import { BudgetType, Task, TaskPriority } from '@/types';
import { createTaskSchema } from '@/utils/validation';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

// Define the type based on the Zod schema
type TaskFormValues = z.infer<typeof createTaskSchema>;

interface TaskFormProps {
  /**
   * Existing task for editing, or undefined for creating a new task
   */
  readonly task?: Task;
  
  /**
   * Available categories for the dropdown
   */
  readonly categories: Array<{ id: string; name: string }>;
  
  /**
   * Called when form is cancelled
   */
  readonly onCancel?: () => void;
}

export function TaskForm({ task, categories, onCancel }: TaskFormProps) {
  // Helper function to get submit button text based on form state and task existence
  const getSubmitButtonText = (isSubmitting: boolean, isEditMode: boolean): string => {
    if (isSubmitting) {
      return 'Saving...';
    }
    return isEditMode ? 'Update Task' : 'Create Task';
  };
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Initialize form with existing task data or defaults
  const initialValues: Partial<TaskFormValues> = task
    ? {
        title: task.title,
        description: task.description,
        category: task.category.id,
        priority: task.priority,
        budget: {
          amount: task.budget,
          type: task.budgetType
        },
        location: {
          address: task.location ?? '',
          isRemote: task.isRemote
        },
        tags: task.tags,
        dueDate: task.deadline ?? undefined,
        startDate: task.startDate ?? undefined,
      }
    : {
        priority: TaskPriority.MEDIUM,
        budget: {
          type: BudgetType.FIXED,
          amount: 0
        },
        location: {
          isRemote: true
        },
        tags: [],
      };
      
  // Get form validation methods and state
  const form = useFormValidation(createTaskSchema, initialValues);
  
  // Only destructure what we actually use
  const { values } = form;
  
  // Create a setFieldValue function that wraps setValue
  const setFieldValue = (field: string, value: any) => {
    form.setValue(field as keyof typeof values, value);
  };
  
  // Setup React Query mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  
  // Form submission handler
  // Helper function to handle input changes with proper typing
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    form.handleChange(name as keyof TaskFormValues, value);
  };
  
  // Helper to handle budget amount changes
  const handleBudgetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    const newBudget = { ...form.values.budget, amount };
    setFieldValue('budget', newBudget);
  };

  // Helper to handle location remote toggle
  const toggleRemote = (checked: boolean) => {
    const newLocation = { ...form.values.location, isRemote: checked };
    setFieldValue('location', newLocation);
  };
  
  // Add isSubmitting state since it's not available in the form object
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Handle form submission with proper type casting
  const handleSubmitForm = async (formData: Record<string, any>) => {
    // Cast the form data to our expected type
    const values = formData as TaskFormValues;
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      
      if (task) {
        // Update existing task - use shared API type structure
        const updateRequest: UpdateTaskRequest = {
          title: values.title,
          description: values.description,
          category: values.category,
          budget: values.budget?.amount ?? 0,
          budgetType: values.budget?.type,
          location: values.location?.isRemote ? undefined : values.location?.address,
          dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
        };
        
        await updateTask.mutateAsync({
          id: task.id,
          updates: updateRequest
        });
        navigate(`/tasks/${task.id}`);
      } else {
        // Create new task - use shared API type structure
        const createTaskRequest: CreateTaskRequest = {
          title: values.title,
          description: values.description,
          category: values.category,
          budget: values.budget?.amount ?? 0,
          budgetType: values.budget?.type,
          // Convert location object to string (address or empty if remote)
          location: values.location?.isRemote ? undefined : (
            [values.location?.address,
             values.location?.city,
             values.location?.state,
             values.location?.country]
              .filter(Boolean).join(', ') || undefined
          ),
          dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined
        };
        
        const result = await createTask.mutateAsync(createTaskRequest);
        navigate(`/tasks/${result.data?.id}`);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };
  
  // We'll remove the unused handlers for tags and requirements

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      // Validate the form manually before submission
      const isValid = Object.keys(form.errors).length === 0;
      if (isValid) {
        handleSubmitForm(form.values);
      }
    }} className="space-y-6">
      {/* Form title */}
      <h2 className="text-2xl font-bold">
        {task ? 'Edit Task' : 'Create New Task'}
      </h2>
      
      {/* Show error message if submission failed */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
      
      {/* Title field */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={form.values.title ?? ''}
          onChange={handleFieldChange}
          onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
          placeholder="Enter task title"
          className={form.errors.title && form.touched.title ? 'border-red-500' : ''}
        />
        {form.errors.title && form.touched.title && (
          <p className="text-sm text-red-500">{form.errors.title[0]}</p>
        )}
      </div>
      
      {/* Description field */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={form.values.description ?? ''}
          onChange={handleFieldChange}
          onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
          placeholder="Describe the task in detail"
          rows={5}
          className={form.errors.description && form.touched.description ? 'border-red-500' : ''}
        />
        {form.errors.description && form.touched.description && (
          <p className="text-sm text-red-500">{form.errors.description[0]}</p>
        )}
      </div>
      
      {/* Category selection */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          value={form.values.category ?? ''}
          onChange={handleFieldChange}
          onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
          aria-label="Task category"
          title="Select a category for this task"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            form.errors.category && form.touched.category ? 'border-red-500' : ''
          )}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {form.errors.category && form.touched.category && (
          <p className="text-sm text-red-500">{form.errors.category[0]}</p>
        )}
      </div>
      
      {/* Priority selection */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          name="priority"
          value={form.values.priority ?? TaskPriority.MEDIUM}
          onChange={handleFieldChange}
          onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
          aria-label="Task priority"
          title="Select the priority level for this task"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value={TaskPriority.LOW}>Low</option>
          <option value={TaskPriority.MEDIUM}>Medium</option>
          <option value={TaskPriority.HIGH}>High</option>
          <option value={TaskPriority.URGENT}>Urgent</option>
        </select>
      </div>
      
      {/* Budget section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium">Budget</h3>
        
        {/* Budget type */}
        <div className="space-y-2">
          <Label htmlFor="budget.type">Budget Type</Label>
          <select
            id="budget.type"
            name="budget.type"
            value={form.values.budget?.type ?? BudgetType.FIXED}
            onChange={handleFieldChange}
            onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
            aria-label="Budget type"
            title="Select how you want to structure the payment"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={BudgetType.FIXED}>Fixed Price</option>
            <option value={BudgetType.HOURLY}>Hourly Rate</option>
          </select>
        </div>
        
        {/* Budget amount */}
        <div className="space-y-2">
          <Label htmlFor="budget.amount">Amount</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
              $
            </span>
            <Input
              id="budget.amount"
              name="budget.amount"
              type="number"
              value={form.values.budget?.amount ?? 0}
              onChange={handleBudgetAmountChange}
              onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
              min={0}
              step={0.01}
              className="rounded-l-none"
            />
          </div>
          {form.errors['budget.amount'] && form.touched['budget.amount'] && (
            <p className="text-sm text-red-500">{form.errors['budget.amount'][0]}</p>
          )}
        </div>
        
        {/* Negotiable checkbox */}
        <div className="flex items-center space-x-2">
          <Switch
            id="budget.negotiable"
            name="budget.negotiable"
            checked={form.values.budget?.negotiable ?? false}
            onCheckedChange={(checked) => {
              const newBudget = { ...form.values.budget, negotiable: checked };
              setFieldValue('budget', newBudget);
            }}
          />
          <Label htmlFor="budget.negotiable">Budget is negotiable</Label>
        </div>
      </div>
      
      {/* Location section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium">Location</h3>
        
        {/* Remote toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="location.isRemote"
            name="location.isRemote"
            checked={form.values.location?.isRemote ?? false}
            onCheckedChange={toggleRemote}
          />
          <Label htmlFor="location.isRemote">This is a remote task</Label>
        </div>
        
        {/* Physical location fields (only shown if not remote) */}
        {!form.values.location?.isRemote && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location.address">Address</Label>
              <Input
                id="location.address"
                name="location.address"
                value={form.values.location?.address ?? ''}
                onChange={handleFieldChange}
                onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
                placeholder="Street address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location.city">City</Label>
              <Input
                id="location.city"
                name="location.city"
                value={form.values.location?.city ?? ''}
                onChange={handleFieldChange}
                onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location.state">State/Province</Label>
              <Input
                id="location.state"
                name="location.state"
                value={form.values.location?.state ?? ''}
                onChange={handleFieldChange}
                onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
                placeholder="State/Province"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location.country">Country</Label>
              <Input
                id="location.country"
                name="location.country"
                value={form.values.location?.country ?? ''}
                onChange={handleFieldChange}
                onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
                placeholder="Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location.zipCode">Zip/Postal Code</Label>
              <Input
                id="location.zipCode"
                name="location.zipCode"
                value={form.values.location?.zipCode ?? ''}
                onChange={handleFieldChange}
                onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
                placeholder="Zip/Postal Code"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Deadline & Start Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Deadline</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="datetime-local"
            value={form.values.dueDate ?? ''}
            onChange={handleFieldChange}
            onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
          />
          {form.errors.dueDate && form.touched.dueDate && (
            <p className="text-sm text-red-500">{form.errors.dueDate[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="datetime-local"
            value={form.values.startDate ?? ''}
            onChange={handleFieldChange}
            onBlur={(e) => form.handleBlur(e.target.name as keyof TaskFormValues)}
          />
          {form.errors.startDate && form.touched.startDate && (
            <p className="text-sm text-red-500">{form.errors.startDate[0]}</p>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {getSubmitButtonText(isSubmitting, !!task)
          }
        </Button>
      </div>
    </form>
  );
}
