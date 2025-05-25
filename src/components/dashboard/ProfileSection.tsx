import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/StarRating';
import { User } from '@/types';
import React from 'react';
import { Link } from 'react-router-dom';

interface ProfileSectionProps {
  user: User;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ user }) => {
  // Apply our established semantic bridge pattern for role checking
  const isClient = user.role === 'USER';
  const isTasker = user.role === 'TASKER';
  
  // Helper function to safely get user initials from the computed name property
  const getInitials = (name: string) => {
    return name.split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  // Helper function to handle nullable avatar URLs
  // This demonstrates defensive programming - always handle the case where data might be missing
  const getAvatarSrc = (avatar: string | null | undefined): string | undefined => {
    // Convert null to undefined to match what AvatarImage expects
    // This is a common pattern when working with APIs that return null vs components that expect undefined
    return avatar ?? undefined;
  };

  // Helper to determine verification status using the correct property names
  const getVerificationStatus = () => {
    // Use emailVerified since that's what exists in our User type
    // In a real app, you might want to check both email and phone verification
    const isVerified = user.emailVerified && user.phoneVerified;
    return {
      isVerified,
      text: isVerified ? 'Verified ✓' : 'Pending',
      className: isVerified ? 'text-green-600' : 'text-orange-600'
    };
  };

  // Helper to get user-friendly role display name
  // This replaces the nested ternary with clear, readable logic
  const getRoleDisplayName = (): string => {
    if (isClient) {
      return 'Client';
    }
    
    if (isTasker) {
      return 'Service Provider';
    }
    
    // Fallback to the raw role value for any future role types
    // This ensures the component won't break if new roles are added
    return user.role;
  };

  // Mock skills data - in a real app, this would either come from the User type
  // or be fetched separately based on user role and stored in component state
  const getUserSkills = (): string[] => {
    if (!isTasker) return [];
    
    // This is mock data - in a real application, you'd either:
    // 1. Add a skills property to your User type, or
    // 2. Fetch skills from a separate API endpoint, or  
    // 3. Store skills in a different data structure
    const mockSkills = [
      'Plumbing', 'Electrical Work', 'Carpentry', 'Painting'
    ];
    return mockSkills;
  };

  // Mock location data - similar to skills, this represents data that might
  // come from a different source or be structured differently than your current User type
  const getUserLocation = (): string => {
    // Use the existing city/state/country fields from User type if available
    const locationParts = [user.city, user.state, user.country].filter(Boolean);
    
    if (locationParts.length > 0) {
      return locationParts.join(', ');
    }
    
    return 'No location provided yet.';
  };

  const verificationStatus = getVerificationStatus();
  const userSkills = getUserSkills();
  const userLocation = getUserLocation();
  const roleDisplayName = getRoleDisplayName();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-4">
              {/* Use our helper function to safely handle nullable avatar */}
              <AvatarImage src={getAvatarSrc(user.avatar)} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-xl">{user.name}</h3>
            <Badge className="mt-2 capitalize">
              {roleDisplayName}
            </Badge>
            
            {/* Use averageRating instead of rating, with proper null checking */}
            {user.averageRating && user.averageRating > 0 ? (
              <>
                <StarRating rating={user.averageRating} size={4} className="mt-2" />
                <span className="ml-2 text-sm font-medium">
                  {user.averageRating.toFixed(1)} ({user.totalReviews ?? 0} reviews)
                </span>
              </>
            ) : (
              <div className="mt-2 text-sm text-gray-500">
                No ratings yet
              </div>
            )}
            
            <div className="w-full mt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone:</span>
                <span className="font-medium">{user.phone ?? 'Not provided'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Member since:</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Verification:</span>
                <span className={`font-medium ${verificationStatus.className}`}>
                  {verificationStatus.text}
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
            {/* Use our semantic bridge variables for cleaner conditional logic */}
            {isClient ? 'About Me' : 'Skills & Experience'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h4 className="font-medium mb-2">Bio</h4>
            <p className="text-gray-600">
              {user.bio ?? 'No bio provided yet.'}
            </p>
          </div>
          
          {/* Only show skills section for service providers (taskers) */}
          {isTasker && userSkills.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {userSkills.map((skill: string) => (
                  <Badge key={`skill-${skill}`} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">Location</h4>
            <p className="text-gray-600">
              {userLocation}
            </p>
          </div>
          
          <div className="border-t border-gray-200 mt-6 pt-6">
            <h4 className="font-medium mb-4">Recent Reviews</h4>
            {/* Safe checking for totalReviews using optional chaining and logical operators */}
            {(user.totalReviews ?? 0) > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <StarRating rating={5} size={4} />
                    <span className="ml-2 text-sm font-medium">
                      1 week ago
                    </span>
                  </div>
                  <p className="text-gray-600">
                    "{isClient 
                      ? 'Great client to work with! Clear instructions and prompt payment.'
                      : 'Excellent work! Very professional and completed the task perfectly.'
                    }"
                  </p>
                  <p className="text-sm font-medium mt-2">
                    - {isClient ? 'Aashi from Sonipat' : 'Shreesta from Delhi'}
                  </p>
                </div>
                
                <div className="text-center">
                  <Button variant="link" className="text-sm">
                    View all {user.totalReviews} reviews
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                No reviews yet. {isClient ? 'Hire service providers' : 'Complete tasks'} to receive reviews!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};