import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, PlusCircle } from 'lucide-react';
import { User, Task } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface TasksAndBidsListProps {
  user: User;
  myTasks: Task[];
}

export const TasksAndBidsList: React.FC<TasksAndBidsListProps> = ({ user, myTasks }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{user?.role === 'client' ? 'My Tasks' : 'My Bids'}</CardTitle>
          {user?.role === 'client' && (
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
        {myTasks.length > 0 ? (
          <div className="space-y-4">
            {myTasks.map((task) => {
              const userBid = user?.role === 'worker' 
                ? task.bids.find(bid => bid.workerId === user.id)
                : null;

              return (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:border-flextasker-200 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/tasks/${task.id}`} className="hover:text-flextasker-600 transition-colors">
                      <h3 className="font-medium text-lg">{task.title}</h3>
                    </Link>
                    <div className="flex items-center gap-2">
                      {userBid && (
                        <Badge 
                          variant={(() => {
                            if (userBid.status === 'accepted') return 'secondary';
                            if (userBid.status === 'rejected') return 'destructive';
                            return 'default';
                          })()}
                          className={
                            userBid.status === 'accepted' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''
                          }
                        >
                          {(() => {
                            if (userBid.status === 'accepted') return 'Won';
                            if (userBid.status === 'rejected') return 'Not Selected';
                            return 'Pending';
                          })()}
                        </Badge>
                      )}
                      <Badge variant={task.status === 'open' ? 'default' : 'secondary'} className="capitalize">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {task.location.address}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Posted {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Budget:</p>
                      <p className="font-semibold">
                        ₹{task.budget?.min} - ₹{task.budget?.max}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bids:</p>
                      <p className="font-semibold">{task.bids.length}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/tasks/${task.id}`}>
                        {user.role === 'client' ? 'View Bids' : 'View Details'}
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
              {user.role === 'client' 
                ? "You haven't posted any tasks yet" 
                : "You haven't placed any bids yet"
              }
            </p>
            <Button asChild className="mt-4">
              <Link to={user.role === 'client' ? '/post-task' : '/tasks'}>
                {user.role === 'client' ? 'Post Your First Task' : 'Browse Available Tasks'}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
