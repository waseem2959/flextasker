
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { id, title, description, location, images, createdAt, category, budget, bids } = task;

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formattedTime = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <Card className="task-card h-full">
      <div className="task-card-image">
        <img 
          src={images[0] || 'https://images.unsplash.com/photo-1531685250784-7569952593d2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d29ya3xlbnwwfHwwfHx8MA%3D%3D'} 
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="bg-gray-100">
            {category}
          </Badge>
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formattedTime}
          </div>
        </div>
        
        <Link to={`/tasks/${id}`}>
          <h3 className="font-semibold text-lg hover:text-flextasker-600 transition-colors mb-2">
            {title}
          </h3>
        </Link>
        
        <p className="text-gray-600 text-sm mb-3">
          {truncateText(description, 100)}
        </p>
        
        <div className="flex items-center text-gray-500 text-sm">
          <MapPin className="h-4 w-4 mr-1" />
          {location.address}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Budget:</p>
          <p className="font-semibold text-gray-900">
            ₹{budget?.min} - ₹{budget?.max}
          </p>
        </div>
        
        <div className="flex items-center">
          <div className="mr-4 text-right">
            <p className="text-sm text-gray-500">Bids:</p>
            <p className="font-semibold text-gray-900">
              {bids.length}
            </p>
          </div>
          
          <Button asChild className="bid-button">
            <Link to={`/tasks/${id}`} className="flex items-center">
              View <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
