/**
 * Task Form Component
 * 
 * A reusable form for creating and editing tasks with strong TypeScript
 * typing throughout the validation and submission process.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFormValidation } from '@/hooks/use-form-validation';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { CreateTaskRequest, UpdateTaskRequest } from '@/types/api';
import { BudgetType, TaskPriority } from '@/types/enums';
import { Task } from '@/types/task';
import { createTaskSchema } from '@/utils/validation';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
// Use regular select instead of the Radix UI component due to form binding
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Define the type based on the Zod schema
type TaskFormValues = z.infer<typeof createTaskSchema>;

interface TaskFormProps {
  /**
   * Existing task for editing, or undefined for creating a new task
   */
  task?: Task;
  
  /**
   * Available categories for the dropdown
   */
  categories: Array<{ id: string; name: string }>;
  
  /**
   * Called when form is cancelled
   */
  onCancel?: () => void;
}

export function TaskForm({ task, categories, onCancel }: TaskFormProps) {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Initialize form with existing task data or defaults
  const initialValues: Partial<TaskFormValues> = task
    ? {
        title: task.title,
        description: task.description,
        categoryId: task.category.id,
        priority: task.priority,
        budget: {
          amount: task.budget.amount,
          type: task.budget.type,
          currency: task.budget.currency,
          negotiable: task.budget.negotiable
        },
        location: {
          address: task.location.address || '',
          city: task.location.city || '',
          state: task.location.state || '',
          country: task.location.country || '',
          zipCode: task.location.zipCode || '',
          isRemote: task.location.isRemote
        },
        tags: task.tags,
        requirements: task.requirements,
        deadline: task.deadline ? task.deadline.toISOString() : undefined,
        startDate: task.startDate ? task.startDate.toISOString() : undefined
      }
    : {
        priority: TaskPriority.MEDIUM,
        budget: {
          type: BudgetType.FIXED,
          amount: 0,
          currency: 'USD',
          negotiable: false
        },
        location: {
          isRemote: true
        },
        tags: [],
        requirements: []
      };
      
  // Get form validation methods and state
  const form = useFormValidation(createTaskSchema, initialValues);
  
  // Setup React Query mutations
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  
  // Form submission handler
  const handleSubmit = async (values: TaskFormValues) => {
    try {
      setSubmitError(null);
      
      if (task) {
        // Update existing task
        // Transform form data to match API requirements
        const updateRequest: UpdateTaskRequest = {
          title: values.title,
          description: values.description,
          categoryId: values.categoryId,
          priority: values.priority,
          budget: values.budget.amount,
          budgetType: values.budget.type,
          isRemote: values.location.isRemote,
          // Convert location object to string (address or empty if remote)
          location: values.location.isRemote ? undefined : (
            [values.location.address, values.location.city, values.location.state, values.location.country]
              .filter(Boolean).join(', ') || undefined
          ),
          tags: values.tags,
          requirements: values.requirements,
          deadline: values.deadline,
          startDate: values.startDate
        };
        
        await updateTask.mutateAsync({
          id: task.id,
          updates: updateRequest
        });
        navigate(`/tasks/${task.id}`);
      } else {
        // Create new task
        // Transform form data to match API requirements
        const createTaskRequest: CreateTaskRequest = {
          title: values.title,
          description: values.description,
          categoryId: values.categoryId,
          priority: values.priority,
          budget: values.budget.amount,
          budgetType: values.budget.type,
          isRemote: values.location.isRemote,
          // Convert location object to string (address or empty if remote)
          location: values.location.isRemote ? undefined : (
            [values.location.address, values.location.city, values.location.state, values.location.country]
              .filter(Boolean).join(', ') || undefined
          ),
          tags: values.tags,
          requirements: values.requirements,
          deadline: values.deadline,
          startDate: values.startDate
        };
        
        const result = await createTask.mutateAsync(createTaskRequest);
        navigate(`/tasks/${result.data?.id}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('An unexpected error occurred');
      }
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          value={form.values.title || ''}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
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
          value={form.values.description || ''}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
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
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          name="categoryId"
          value={form.values.categoryId || ''}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          aria-label="Task category"
          title="Select a category for this task"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            form.errors.categoryId && form.touched.categoryId ? 'border-red-500' : ''
          )}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {form.errors.categoryId && form.touched.categoryId && (
          <p className="text-sm text-red-500">{form.errors.categoryId[0]}</p>
        )}
      </div>
      
      {/* Priority selection */}
      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          name="priority"
          value={form.values.priority || ''}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
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
            value={form.values.budget?.type || BudgetType.FIXED}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
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
              value={form.values.budget?.amount || 0}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
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
            checked={form.values.budget?.negotiable || false}
            onCheckedChange={(checked) => {
              const newBudget = { ...form.values.budget, negotiable: checked };
              form.setFieldValue('budget', newBudget);
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
            checked={form.values.location?.isRemote || false}
            onCheckedChange={(checked) => {
              const newLocation = { ...form.values.location, isRemote: checked };
              form.setFieldValue('location', newLocation);
            }}
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
                value={form.values.location?.address || ''}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Street address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location.city">City</Label>
              <Input
                id="location.city"
                name="location.city"
                value={form.values.location?.city || ''}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="City"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location.state">State/Province</Label>
              <Input
                id="location.state"
                name="location.state"
                value={form.values.location?.state || ''}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="State/Province"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location.country">Country</Label>
              <Input
                id="location.country"
                name="location.country"
                value={form.values.location?.country || ''}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Country"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location.zipCode">Zip/Postal Code</Label>
              <Input
                id="location.zipCode"
                name="location.zipCode"
                value={form.values.location?.zipCode || ''}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Zip/Postal Code"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Deadline & Start Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            value={form.values.deadline || ''}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
          />
          {form.errors.deadline && form.touched.deadline && (
            <p className="text-sm text-red-500">{form.errors.deadline[0]}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="datetime-local"
            value={form.values.startDate || ''}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
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
          disabled={form.isSubmitting}
        >
          {form.isSubmitting 
            ? 'Saving...' 
            : task ? 'Update Task' : 'Create Task'
          }
        </Button>
      </div>
    </form>
  );
}
