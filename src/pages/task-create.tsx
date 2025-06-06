import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskPriority } from '../../shared/types/enums';
import MainLayout from '../layouts/main-layout';

interface TaskFormState {
  title: string;
  description: string;
  budget: string;
  category: string;
  priority: TaskPriority | '';
  dueDate: Date | undefined;
  location: string;
  attachments: File[];
}

const TaskCreate = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<TaskFormState>({
    title: '',
    description: '',
    budget: '',
    category: '',
    priority: '',
    dueDate: undefined,
    location: '',
    attachments: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle rich text editor changes
  const handleDescriptionChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      description: value
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date changes
  const handleDateChange = (date: Date | undefined) => {
    setFormState(prev => ({
      ...prev,
      dueDate: date
    }));
  };
  
  // Handle file changes
  const handleFileChange = (files: File[]) => {
    setFormState(prev => ({
      ...prev,
      attachments: files
    }));
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formState.title || !formState.description || !formState.budget || !formState.category) {
      toast({

        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate a successful API response
          const success = true; // In a real app, this would be the API response
          if (success) {
            resolve(true);
          } else {
            reject(new Error('Failed to create task'));
          }
        }, 1500);
      });
      
      toast({
        title: "Task Created",
        description: "Your task has been created successfully.",
        variant: "default",
      });
      
      // Redirect to tasks page
      navigate('/tasks');
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error instanceof Error ? error.message : 'There was a problem creating your task. Please try again.';
      
      toast({

        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Available categories
  const categories = [
    'Web Development',
    'Mobile App Development',
    'Design',
    'Content Writing',
    'Marketing',
    'Virtual Assistance',
    'Data Entry',
    'Other'
  ];
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Create a New Task</h1>
        <p className="text-text-secondary mb-8">
          Describe your task in detail to attract the right taskers.
        </p>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title <span className="text-error">*</span></Label>
              <Input
                id="title"
                name="title"
                value={formState.title}
                onChange={handleChange}
                placeholder="E.g. 'Design a logo for my business'"
                className="border-border"
                required
              />
            </div>
            
            {/* Task Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Task Description <span className="text-error">*</span></Label>
              <RichTextEditor
                value={formState.description}
                onChange={handleDescriptionChange}
                placeholder="Describe your task in detail. Include any specific requirements, skills needed, and expected outcomes."
                minHeight="200px"
              />
            </div>
            
            <Separator className="my-6" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹) <span className="text-error">*</span></Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formState.budget}
                  onChange={handleChange}
                  placeholder="Enter your budget"
                  className="border-border"
                  required
                  min="0"
                />
              </div>
              
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-error">*</span></Label>
                <Select
                  value={formState.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger className="border-border">
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
              
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formState.priority} 
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Due Date */}
              <div className="space-y-2">
                <DateTimePicker
                  date={formState.dueDate}
                  setDate={handleDateChange}
                  label="Due Date"
                  showTime={true}
                />
              </div>
              
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formState.location}
                  onChange={handleChange}
                  placeholder="Enter location (if applicable)"
                  className="border-border"
                />
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Attachments */}
            <div className="space-y-2">
              <Label>Attachments</Label>
              <FileUpload
                onChange={handleFileChange}
                value={formState.attachments}
                maxFiles={5}
                maxSize={10}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                description="Upload any relevant files (images, documents, etc.)"
              />
            </div>
            
            <div className="pt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/tasks')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default TaskCreate;
