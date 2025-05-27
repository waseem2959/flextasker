
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '../hooks/use-toast';
import { CATEGORIES } from '../data/mockData';
import { UserRole } from '@/types/enums';

const PostTask = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (isAuthenticated && user?.role !== UserRole.USER) {
      toast({
        title: "Access denied",
        description: "Only users can post tasks",
        variant: "destructive",
      });
      navigate('/dashboard');
    } else if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to post a task",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!title || !description || !category || !budgetMin || !budgetMax || !location) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Validate budget
    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);
    
    if (isNaN(min) || isNaN(max) || min <= 0 || max <= 0 || min > max) {
      toast({
        title: "Invalid budget",
        description: "Please enter a valid budget range",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate API call to post task
    setTimeout(() => {
      toast({
        title: "Task posted successfully",
        description: "Workers can now see your task and start bidding",
      });
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <Layout>
      <div className="py-10 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Post a New Task</h1>
            <p className="mt-2 text-gray-600">
              Describe your task in detail to get the best bids from skilled workers
            </p>
          </div>
          
          <Card className="shadow-md border-0">
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
              <CardDescription>Provide the details of the task you need help with</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title*</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Fix bathroom sink leak"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category*</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Task Description*</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you need done in detail. Include any requirements, materials needed, or specific timeframes."
                    rows={5}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Budget Minimum (₹)*</Label>
                    <Input
                      id="budgetMin"
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="e.g., 1000"
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Budget Maximum (₹)*</Label>
                    <Input
                      id="budgetMax"
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="e.g., 5000"
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location*</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Connaught Place, New Delhi"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Enter the address or area where the task needs to be done
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images (optional)</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-500">
                    Add photos to help workers understand your task better (max 5 images)
                  </p>
                </div>
                
                <CardFooter className="px-0 pb-0">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Posting Task...' : 'Post Task'}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PostTask;
