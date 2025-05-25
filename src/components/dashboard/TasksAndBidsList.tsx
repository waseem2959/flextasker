import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task, User } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, PlusCircle } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

interface TasksAndBidsListProps {
  user: User;
  myTasks: Task[];
}

// Enhanced interfaces to bridge the gap between current types and component needs
// This demonstrates how to handle evolving data requirements gracefully
interface EnhancedTask extends Task {
  // Mock bid data - in a real app, this might come from a separate API call
  // or be included in an expanded Task type definition
  bids: BidInfo[];
  
  // Enhanced location information - could come from geocoding services
  // or be stored as structured data in your backend
  locationDisplay: string;
  
  // Enhanced budget information - demonstrates handling complex financial data
  budgetRange: {
    min: number;
    max: number;
    display: string;
  };
}

// Precise type definition for Badge variants to ensure type safety
// This demonstrates how literal types provide more specific constraints than general strings
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// Interface for bid information that might come from a separate data source
// This shows how to model complex relationships between entities
interface BidInfo {
  id: string;
  workerId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  workerName: string;
  submittedAt: Date;
}

// Interface for bid status display configuration
// Note the precise return type specification using literal types
// This ensures TypeScript can verify that our configuration always returns valid Badge variants
interface BidStatusConfig {
  variant: BadgeVariant; // Using our precise type instead of a general string
  className: string;
  label: string;
}

// Interface for task status display configuration  
// This demonstrates the same precise typing pattern for consistency
interface TaskStatusConfig {
  variant: BadgeVariant; // Ensures type safety for Badge component variants
  className: string;
  label: string;
}

export const TasksAndBidsList: React.FC<TasksAndBidsListProps> = ({ user, myTasks }) => {
  // Apply our established semantic bridge pattern for consistent role checking
  const isClient = user.role === 'USER';
  const isTasker = user.role === 'TASKER';
  
  // Enhanced data transformation function that bridges current types with component needs
  // This pattern allows you to evolve your component independently of your core data types
  const enhanceTaskData = (task: Task): EnhancedTask => {
    // Mock bid data generation - in a real app, this would come from your backend
    // This demonstrates how to handle missing relationships gracefully
    const mockBids: BidInfo[] = generateMockBids(task, user);
    
    // FIXED: Use nullish coalescing (??) instead of logical OR (||) for safer null handling
    // This prevents issues when task.location is an empty string but we want to keep it
    const locationDisplay = task.location ?? 'Location not specified';
    
    // Enhanced budget handling - converts single number to range representation
    // This demonstrates adapting simple data to complex UI requirements
    const budgetRange = generateBudgetRange(task.budget);
    
    return {
      ...task,
      bids: mockBids,
      locationDisplay,
      budgetRange
    };
  };

  // Helper function to determine bid status based on index
  // FIXED: Extracted nested ternary into a clear, readable function
  // This makes the logic easier to understand and maintain
  const determineBidStatus = (index: number): BidInfo['status'] => {
    if (index === 0) return 'accepted';
    if (index === 1) return 'rejected';
    return 'pending';
  };

  // Helper function to generate mock bid data based on task context
  // This demonstrates how to create realistic test data for development
  const generateMockBids = (task: Task, currentUser: User): BidInfo[] => {
    // Use nullish coalescing (??) instead of logical OR (||) for safer null handling
    // This prevents issues when bidCount is 0 (a valid number but falsy value)
    const bidCount = task.bidCount ?? 0;
    const bids: BidInfo[] = [];
    
    // Generate mock bids based on the bidCount from the actual task data
    for (let i = 0; i < Math.min(bidCount, 3); i++) {
      const mockWorkerNames = ['Amit Patel', 'Priya Sharma', 'Raj Kumar', 'Sneha Gupta'];
      
      // FIXED: Use the extracted helper function instead of nested ternary
      // This demonstrates proper conditional logic that produces different outcomes
      const bidStatus = determineBidStatus(i);
      
      bids.push({
        id: `bid-${task.id}-${i}`,
        workerId: `worker-${i}`,
        amount: task.budget + (i * 500), // Vary bid amounts realistically
        status: bidStatus,
        workerName: mockWorkerNames[i % mockWorkerNames.length],
        submittedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000) // Stagger bid times
      });
    }
    
    // If current user is a tasker, add their bid to the list
    if (isTasker) {
      bids.push({
        id: `bid-${task.id}-user`,
        workerId: currentUser.id,
        amount: task.budget - 200, // User's competitive bid
        status: 'pending',
        workerName: currentUser.name,
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });
    }
    
    return bids;
  };

  // Helper function to generate budget range from single budget value
  // This demonstrates adapting simple data to complex display requirements
  const generateBudgetRange = (budget: number) => {
    // Create a realistic range around the base budget
    // Using nullish coalescing to safely handle potential undefined budget values
    const safeBudget = budget ?? 0;
    const min = Math.round(safeBudget * 0.8);
    const max = Math.round(safeBudget * 1.2);
    
    return {
      min,
      max,
      display: `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`
    };
  };

  // Configuration function for bid status display
  // This demonstrates the configuration pattern with precise literal type returns
  // The explicit return type annotation ensures TypeScript verifies our return values match exactly
  const getBidStatusConfig = (status: BidInfo['status']): BidStatusConfig => {
    switch (status) {
      case 'accepted':
        return {
          variant: 'secondary' as const, // 'as const' ensures TypeScript treats this as the literal type 'secondary'
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          label: 'Won'
        };
      case 'rejected':
        return {
          variant: 'destructive' as const, // Explicit literal type assertion for type safety
          className: '',
          label: 'Not Selected'
        };
      case 'pending':
      default:
        return {
          variant: 'default' as const, // Ensures return type matches Badge component expectations
          className: '',
          label: 'Pending'
        };
    }
  };

  // Configuration function for task status display
  // This uses the correct enum values and provides consistent styling with precise typing
  const getTaskStatusConfig = (status: Task['status']): TaskStatusConfig => {
    // Extract the variant determination logic into a clear, readable helper function
    // This replaces the nested ternary with explicit conditional logic for better maintainability
    const determineVariant = (): BadgeVariant => {
      return status === 'OPEN' ? 'default' : 'secondary';
    };

    return {
      variant: determineVariant(),
      className: 'capitalize',
      // Convert enum values to user-friendly display text
      label: status.toLowerCase().replace('_', ' ')
    };
  };

  // Helper function to render user bid badge conditionally
  // This extracts the complex conditional rendering logic from the JSX
  // and makes the component more readable and maintainable
  const renderUserBidBadge = (userBid: BidInfo | null): React.ReactNode => {
    // Early return pattern for cleaner conditional logic
    if (!userBid) {
      return null;
    }

    const bidConfig = getBidStatusConfig(userBid.status);
    return (
      <Badge 
        variant={bidConfig.variant}
        className={bidConfig.className}
      >
        {bidConfig.label}
      </Badge>
    );
  };

  // Transform the task data using our enhancement function
  const enhancedTasks = myTasks.map(enhanceTaskData);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{isClient ? 'My Tasks' : 'My Bids'}</CardTitle>
          {isClient && (
            <Button asChild>
              <Link to="/post-task" className="flex items-center">
                <PlusCircle className="h-4 w-4 mr-2" />
                Post a New Task
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {enhancedTasks.length > 0 ? (
          <div className="space-y-4">
            {enhancedTasks.map((task) => {
              // FIXED: Handle the potential undefined return from Array.find()
              // By using nullish coalescing, we explicitly convert undefined to null
              // This matches the expected type for renderUserBidBadge function
              const userBid = isTasker 
                ? (task.bids.find(bid => bid.workerId === user.id) ?? null)
                : null;

              const taskStatusConfig = getTaskStatusConfig(task.status);

              return (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-flextasker-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/tasks/${task.id}`} className="hover:text-flextasker-600 transition-colors">
                      <h3 className="font-medium text-lg">{task.title}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      {/* Show user's bid status if they're a tasker */}
                      {/* Extract the conditional badge rendering into a clear helper function */}
                      {/* This eliminates the complex inline conditional pattern that SonarLint flagged */}
                      {renderUserBidBadge(userBid)}
                      <Badge 
                        variant={taskStatusConfig.variant} 
                        className={taskStatusConfig.className}
                      >
                        {taskStatusConfig.label}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {task.locationDisplay}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Posted {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Budget:</p>
                      <p className="font-semibold">{task.budgetRange.display}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bids:</p>
                      <p className="font-semibold">{task.bids.length}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/tasks/${task.id}`}>
                        {isClient ? 'View Bids' : 'View Details'}
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">
              {isClient 
                ? "You haven't posted any tasks yet" 
                : "You haven't placed any bids yet"
              }
            </p>
            <Button asChild className="mt-4">
              <Link to={isClient ? '/post-task' : '/tasks'}>
                {isClient ? 'Post Your First Task' : 'Browse Available Tasks'}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};