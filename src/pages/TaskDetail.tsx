
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { getTaskWithBids, getTaskWithClient, createBid } from '../data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../hooks/use-toast';
import { MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Bid } from '../types';

import { getInitials } from '../utils/avatar';

import { StarRating } from '@/components/ui/StarRating';
const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [bidAmount, setBidAmount] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [myBid, setMyBid] = useState<Bid | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Get task with populated data
  const task = id ? getTaskWithBids(id) : null;
  const taskWithClient = id ? getTaskWithClient(id) : null;
  
  if (!task || !taskWithClient) {
    return (
      <Layout>
        <div className="py-10 px-4 text-center">
          <h2 className="text-2xl font-semibold">Task not found</h2>
          <Button onClick={() => navigate('/tasks')} className="mt-4">
            Back to Tasks
          </Button>
        </div>
      </Layout>
    );
  }

  const { 
    title, 
    description, 
    category, 
    status, 
    budget, 
    location, 
    images, 
    createdAt, 
    deadline,
    bids
  } = task;
  
  const client = taskWithClient.client;

  const handleSubmitBid = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to place a bid",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    if (!bidAmount) {
      toast({
        title: "Bid amount required",
        description: "Please enter your bid amount",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid bid amount",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Create bid and update the UI
    setTimeout(() => {
      if (user) {
        const newBid = createBid(task.id, user.id, amount, bidMessage);
        setMyBid(newBid);
        
        toast({
          title: "Bid submitted successfully",
          description: "The client will be notified of your bid",
        });
      }
      
      setIsSubmitting(false);
      setBidAmount('');
      setBidMessage('');
    }, 1000);
  };


  return (
    <Layout>
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/tasks')} className="flex items-center text-gray-500">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Details - Left Column */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img 
                    src={images[0] || 'https://images.unsplash.com/photo-1531685250784-7569952593d2'} 
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {category}
                      </Badge>
                      <h1 className="text-2xl font-bold mb-2">{title}</h1>
                    </div>
                    <Badge variant={status === 'open' ? 'default' : 'secondary'} className="capitalize">
                      {status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-3 mb-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {location.address}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Posted {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                    </div>
                    {deadline && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Due by {format(new Date(deadline), 'PP')}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-medium mb-2">Budget</h3>
                    <p className="text-2xl font-semibold text-flextasker-700">
                      ₹{budget?.min} - ₹{budget?.max}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="text-gray-600 whitespace-pre-line">{description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Image Gallery */}
              {images.length > 1 && (
                <Card className="mb-6">
                  <CardHeader>
                    <h3 className="text-lg font-medium">Task Photos</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {images.map((image, index) => (
                        <div key={`task-image-${id}-${index}`} className="aspect-square overflow-hidden rounded-md">
                          <img src={image} alt={`${title} detail ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bids Section */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Bids ({bids.length})</h3>
                </CardHeader>
                <CardContent>
                  {bids.length > 0 ? (
                    <div className="space-y-4">
                      {bids.map((bid) => (
                        <div key={bid.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={bid.worker?.avatar} alt={bid.worker?.name} />
                            <AvatarFallback>{bid.worker?.name ? getInitials(bid.worker.name) : 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="ml-4 flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{bid.worker?.name}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              <p className="font-semibold text-flextasker-600">₹{bid.amount}</p>
                            </div>
                            {bid.message && (
                              <p className="mt-2 text-gray-600">{bid.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No bids yet. Be the first to bid!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Client Info */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Posted by</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client?.avatar} alt={client?.name} />
                      <AvatarFallback>{client?.name ? getInitials(client.name) : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <p className="font-semibold">{client?.name}</p>
                      <div className="flex items-center text-sm">
                        <span className="flex items-center">
                          <StarRating rating={client?.rating || 0} size={4} />
                          <span className="ml-1">{client?.rating}</span>
                        </span>
                        <span className="mx-2">•</span>
                        <span>{client?.totalReviews} reviews</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Place Bid */}
              {status === 'open' && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-medium">Place your bid</h3>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // For non-client users
                      if (user?.role !== 'client') {
                        // If the user has already placed a bid
                        if (myBid) {
                          return (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-green-700">
                              <h4 className="font-medium">Your bid has been placed</h4>
                              <p className="mt-1 text-sm">Amount: ₹{myBid.amount}</p>
                              {myBid.message && (
                                <p className="mt-1 text-sm">Message: {myBid.message}</p>
                              )}
                            </div>
                          );
                        }
                        // If the user hasn't placed a bid yet
                        return (
                          <form onSubmit={handleSubmitBid} className="space-y-4">
                            <div className="space-y-2">
                              <label htmlFor="bid-amount" className="block text-sm font-medium text-gray-700">
                                Bid Amount (₹)
                              </label>
                              <Input
                                id="bid-amount"
                                type="number"
                                placeholder="Enter your bid amount"
                                value={bidAmount}
                                onChange={(e) => setBidAmount(e.target.value)}
                                min={1}
                                required
                              />
                              {budget && (
                                <p className="text-xs text-gray-500">Client's budget: ₹{budget.min} - ₹{budget.max}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="bid-message" className="block text-sm font-medium text-gray-700">
                                Message (optional)
                              </label>
                              <Textarea
                                id="bid-message"
                                placeholder="Describe why you are the right person for this task"
                                value={bidMessage}
                                onChange={(e) => setBidMessage(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <Button
                              type="submit"
                              className="w-full"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit Bid'}
                            </Button>
                          </form>
                        );
                      } else {
                        // For client users
                        return (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-amber-700">
                            <h4 className="font-medium">You cannot bid on tasks as a client</h4>
                            <p className="mt-1 text-sm">Only workers can place bids on tasks.</p>
                          </div>
                        );
                      }
                    })()}
                    
                    {!isAuthenticated && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500 mb-2">You need to sign in to place a bid</p>
                        <Button asChild variant="outline" className="w-full">
                          <Link to="/login">Sign In</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
