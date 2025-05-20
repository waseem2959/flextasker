import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';

interface ProfileSectionProps {
  user: User;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user }) => {
  const getInitials = (name: string) => {
    return name.split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-xl">{user.name}</h3>
            <Badge className="mt-2 capitalize">{user.role}</Badge>
            
            <div className="flex items-center mt-2">
              {Array(5).fill(0).map((_, i) => (
                <Star 
                  key={`rating-star-${user.id}-${i}`} 
                  className={`h-4 w-4 ${i < user.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="ml-2 text-sm font-medium">
                {user.rating} ({user.totalReviews} reviews)
              </span>
            </div>
            
            <div className="w-full mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium">{user.phone || 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Member since:</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Verification:</span>
                <span className={`font-medium ${user.verified ? 'text-green-600' : 'text-orange-600'}`}>
                  {user.verified ? 'Verified ✓' : 'Pending'}
                </span>
              </div>
            </div>
            
            <Button asChild variant="outline" className="mt-6">
              <Link to="/profile/edit">Edit Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {user.role === 'client' ? 'About Me' : 'Skills & Experience'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h4 className="font-medium mb-2">Bio</h4>
            <p className="text-gray-600">
              {user.bio || 'No bio provided yet.'}
            </p>
          </div>
          
          {user.role === 'worker' && user.skills && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <Badge key={`skill-${skill}`} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-medium mb-2">Location</h4>
            <p className="text-gray-600">
              {user.location?.address || 'No location provided yet.'}
            </p>
          </div>
          
          <div className="border-t border-gray-200 mt-6 pt-6">
            <h4 className="font-medium mb-4">Recent Reviews</h4>
            {user.totalReviews > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={`review-star-user-${user.id}-position-${i}`} 
                          className={`h-4 w-4 ${i < 5 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      1 week ago
                    </span>
                  </div>
                  <p className="text-gray-600">
                    "{user.role === 'client' 
                      ? 'Great client to work with! Clear instructions and prompt payment.'
                      : 'Excellent work! Very professional and completed the task perfectly.'
                    }"
                  </p>
                  <p className="text-sm font-medium mt-2">
                    - {user.role === 'client' ? 'Aashi from Sonipat' : 'Shreesta from Delhi'}
                  </p>
                </div>
                
                <div className="text-center">
                  <Button variant="link" className="text-sm">
                    View all reviews
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                No reviews yet. Complete tasks to receive reviews!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
