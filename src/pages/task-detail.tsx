import { Layout } from '@/components/layout/Layout';
import { BidList } from '@/components/task/bid-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StarRating } from '@/components/ui/star-rating';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, useCreateBid, useTask } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { TaskStatus } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';


// Add missing type for Bid
interface Bid {
  id: string;
  amount: number;
  message: string;
  estimatedCompletionDays: number;
  status: string;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
}

// Helper functions outside the main component
// Validate bid amount format
const validateBidAmount = (amount: string): { valid: boolean; error?: string } => {
  if (!amount) {
    return { valid: false, error: 'Bid amount required' };
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return { valid: false, error: 'Please enter a valid bid amount' };
  }

  return { valid: true };
};

// Get status message based on task status
const getStatusMessage = (status: TaskStatus): string => {
  switch(status) {
    case TaskStatus.ACCEPTED:
      return 'This task has been accepted and is awaiting start.';
    case TaskStatus.IN_PROGRESS:
      return 'This task is currently in progress.';
    case TaskStatus.COMPLETED:
      return 'This task has been completed.';
    case TaskStatus.CANCELLED:
      return 'This task has been cancelled.';
    default:
      return 'This task is not currently accepting bids.';
  }
};

// Task loading error component
const TaskNotFound = ({ onBack }: { onBack: () => void }) => (
  <Layout>
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Task Not Found</h2>
      <p className="text-muted-foreground mb-4">The requested task could not be found.</p>
      <Button onClick={onBack} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tasks
      </Button>
    </div>
  </Layout>
);

// Loading component
const TaskLoading = () => (
  <Layout>
    <div className="py-10 px-4 text-center font-primary">
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(196,80%,43%)]" />
      </div>
    </div>
  </Layout>
);

// Error component
const TaskError = ({ onBack }: { onBack: () => void }) => (
  <Layout>
    <div className="py-10 px-4 text-center font-primary">
      <h2 className="text-2xl font-semibold text-[hsl(206,33%,16%)]">Task not found</h2>
      <Button onClick={onBack} className="mt-4">
        Back to Tasks
      </Button>
    </div>
  </Layout>
);

// Bid form component
const BidForm = ({
  isOpenForBidding,
  status,
  isAuthenticated,
  userBid,
  isSubmitting,
  bidAmount,
  bidMessage,
  setBidAmount,
  setBidMessage,
  handleSubmitBid
}: {
  isOpenForBidding: boolean;
  status: TaskStatus;
  isAuthenticated: boolean;
  userBid: Bid | undefined;
  isSubmitting: boolean;
  bidAmount: string;
  bidMessage: string;
  setBidAmount: (value: string) => void;
  setBidMessage: (value: string) => void;
  handleSubmitBid: (e: React.FormEvent) => Promise<void>;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Place Your Bid</CardTitle>
      <CardDescription>
        {isOpenForBidding 
          ? "Submit your best offer for this task" 
          : "This task is not currently accepting bids"}
      </CardDescription>
    </CardHeader>
    <CardContent>
      {isOpenForBidding ? (
        <form onSubmit={handleSubmitBid} className="space-y-4">
          <div>
            <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Your Bid (₹)
            </label>
            <Input
              id="bidAmount"
              type="number"
              placeholder="Enter amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min="1"
              step="0.01"
              required
              disabled={isSubmitting || !!userBid}
            />
          </div>
          <div>
            <label htmlFor="bidMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <Textarea
              id="bidMessage"
              placeholder="Add a message to the client"
              value={bidMessage}
              onChange={(e) => setBidMessage(e.target.value)}
              rows={3}
              disabled={isSubmitting || !!userBid}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !!userBid}
          >
            {userBid ? 'Bid Submitted' : 'Place Bid'}
          </Button>
          {userBid && (
            <p className="text-sm text-green-600 text-center">
              You've already placed a bid of ₹{userBid.amount}
            </p>
          )}
        </form>
      ) : (
        <div className="text-center py-4">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">{getStatusMessage(status)}</p>
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="mt-4 text-center">
          <p className="text-lg text-[hsl(220,14%,46%)] font-medium mb-2">You need to sign in to place a bid</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

// Task management component for owners
const TaskManagement = ({ id, status, bidsCount, onNavigate }: { 
  id: string; 
  status: TaskStatus; 
  bidsCount: number;
  onNavigate: (path: string) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Task Management</CardTitle>
      <CardDescription>Manage your task</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <Button className="w-full" onClick={() => onNavigate(`/tasks/${id}/edit`)}>
          Edit Task
        </Button>
        <Button variant="outline" className="w-full">
          View Bids ({bidsCount})
        </Button>
        {status === TaskStatus.OPEN && (
          <Button variant="destructive" className="w-full">
            Cancel Task
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get task using hook
  const { 
    data: taskResponse, 
    isLoading: isTaskLoading,
    error: taskError
  } = useTask(id ?? '');
  const task = taskResponse?.data;
  
  // Create bid mutation hook
  const createBidMutation = useCreateBid();
  
  // Early returns for loading and error states
  if (!id) {
    return <TaskNotFound onBack={() => navigate('/tasks')} />;
  }
  
  if (isTaskLoading) {
    return <TaskLoading />;
  }
  
  if (taskError || !task) {
    return <TaskError onBack={() => navigate('/tasks')} />;
  }
  
  // Extract task properties safely
  const { 
    title, 
    description, 
    category, 
    status, 
    budget, 
    location, 
    createdAt, 
    deadline,
    owner
  } = task;
  
  // Initialize empty array for bids since they're not in the Task interface
  const taskBids: Bid[] = [];
  
  // Format task data for display
  const taskBudget = typeof budget === 'number' ? `$${budget}` : 'Negotiable';
  const taskLocation = location ?? 'Not specified';
  
  // Format deadline for display if it exists
  const formattedDeadline = deadline ? format(new Date(deadline), 'MMM d, yyyy') : 'No deadline';
  
  // Check task and user related statuses
  const isTaskOwner = (user as any)?.id === (owner as any).id;
  const userBid = taskBids.find((bid) => (bid.worker as any)?.id === (user as any)?.id);
  const isOpenForBidding = status === TaskStatus.OPEN && (user as any)?.id !== (owner as any).id;

  // Show error toast with consistent formatting
  const showErrorToast = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    });
  };

  // Validate bid submission conditions
  const canSubmitBid = () => {
    if (!isAuthenticated) {
      showErrorToast('Authentication required', 'Please login to place a bid');
      navigate('/login');
      return false;
    }

    if (!user || !id) {
      showErrorToast('Error', 'You must be logged in to submit a bid.');
      return false;
    }

    if (status !== TaskStatus.OPEN) {
      showErrorToast(
        'Task Not Accepting Bids',
        'This task is no longer accepting new bids.'
      );
      return false;
    }

    return true;
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate submission conditions
    if (!canSubmitBid()) {
      return;
    }

    // Validate bid amount with nullish coalescing for error message
    const amountValidation = validateBidAmount(bidAmount);
    if (!amountValidation.valid) {
      showErrorToast('Invalid Bid', amountValidation.error ?? 'Please check your bid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      await createBidMutation.mutateAsync({
        taskId: id,
        amount: parseFloat(bidAmount),
        message: bidMessage,
        // estimatedCompletionDays: 7 // Removed - not in CreateBidRequest type
      });

      // Reset form fields after successful submission
      setBidAmount('');
      setBidMessage('');
      
      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error submitting your bid.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="py-8 bg-white min-h-screen font-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/tasks')} className="flex items-center text-[hsl(220,14%,46%)]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Details - Left Column */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <span className="text-[hsl(220,14%,46%)]">No image available</span>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {category?.name || 'Uncategorized'}
                      </Badge>
                      <h1 className="text-2xl font-bold mb-2">{title}</h1>
                    </div>
                    <Badge 
                      variant={status === TaskStatus.OPEN ? 'default' : 'secondary'} 
                      className="capitalize"
                    >
                      {status.toLowerCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-3 mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {taskLocation}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Posted {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </div>
                    {deadline && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Due by {formattedDeadline}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Budget</h3>
                    <p className="text-2xl font-semibold text-flextasker-700">
                      {taskBudget}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-[hsl(220,14%,46%)] whitespace-pre-line">{description}</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Task Requirements */}
              <Card className="mb-6">
                <CardHeader>
                  <h3 className="text-lg font-medium">Requirements</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-flextasker-600">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">
                          Please bring your own tools and materials.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-6 w-6 text-flextasker-600">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <p className="text-gray-700">
                          Must have experience with similar projects.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">About the Client</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={owner.avatar ?? undefined} 
                        alt={`${(owner as any).firstName} ${(owner as any).lastName}`}
                      />
                      <AvatarFallback>
                        {(owner as any).firstName?.[0]}{(owner as any).lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{(owner as any).firstName} {(owner as any).lastName}</h4>
                      <div className="flex items-center mt-1">
                        <StarRating rating={4.8} />
                        <span className="ml-2 text-sm text-gray-500">4.8 (24 reviews)</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Member since {owner.createdAt ? new Date(owner.createdAt).getFullYear() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bids Section - Only show if there are bids or if user is task owner */}
              {(taskBids.length > 0 || isTaskOwner) && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">
                      {isTaskOwner ? 'Received Bids' : 'Current Bids'}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <BidList
                      bids={taskBids.map(bid => ({
                        id: bid.id,
                        provider: {
                          id: bid.worker.id,
                          name: `${bid.worker.firstName} ${bid.worker.lastName}`,
                          avatar: bid.worker.avatar,
                          rating: 4.5, // Mock data - would come from API
                          reviewCount: 12,
                          completionRate: 95,
                          responseTime: '2h',
                          isVerified: true,
                          completedTasks: 24,
                          joinedDate: '2023'
                        },
                        amount: bid.amount,
                        type: 'fixed' as const,
                        message: bid.message,
                        distance: '2.5 km', // Mock data
                        estimatedDuration: `${bid.estimatedCompletionDays} days`,
                        createdAt: bid.createdAt
                      }))}
                      onAcceptBid={(bidId: string) => {
                        console.log('Accept bid:', bidId);
                        // Handle bid acceptance
                      }}
                      onMessageProvider={(providerId: string) => {
                        console.log('Message provider:', providerId);
                        // Handle messaging
                      }}
                      onViewProfile={(providerId: string) => {
                        console.log('View profile:', providerId);
                        // Handle profile viewing
                      }}
                      isLoading={false}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Bid Form */}
            <div className="space-y-6">
              {isTaskOwner ? (
                <TaskManagement 
                  id={id} 
                  status={status} 
                  bidsCount={taskBids.length} 
                  onNavigate={navigate} 
                />
              ) : (
                <BidForm
                  isOpenForBidding={isOpenForBidding}
                  status={status}
                  isAuthenticated={isAuthenticated}
                  userBid={userBid}
                  isSubmitting={isSubmitting}
                  bidAmount={bidAmount}
                  bidMessage={bidMessage}
                  setBidAmount={setBidAmount}
                  setBidMessage={setBidMessage}
                  handleSubmitBid={handleSubmitBid}
                />
              )}
              
              {/* Similar Tasks (placeholder for now) */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Similar Tasks</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="group">
                      <Link to="/tasks/task-3" className="block hover:bg-gray-50 p-2 rounded-md">
                        <p className="font-medium group-hover:text-flextasker-600">Living Room Painting</p>
                        <p className="text-sm text-gray-500">₹5,000 - ₹8,000</p>
                      </Link>
                    </div>
                    <div className="group">
                      <Link to="/tasks/task-4" className="block hover:bg-gray-50 p-2 rounded-md">
                        <p className="font-medium group-hover:text-flextasker-600">Furniture Delivery and Assembly</p>
                        <p className="text-sm text-gray-500">₹1,500 - ₹2,500</p>
                      </Link>
                    </div>
                    <div className="group">
                      <Link to="/tasks/task-5" className="block hover:bg-gray-50 p-2 rounded-md">
                        <p className="font-medium group-hover:text-flextasker-600">Digital Marketing Strategy</p>
                        <p className="text-sm text-gray-500">₹20,000 - ₹35,000</p>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskDetail;
