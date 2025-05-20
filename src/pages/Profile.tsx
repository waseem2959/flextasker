
import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getInitials } from '../utils/avatar';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
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
                      key={i} 
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
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium">{user.location?.address || 'Not provided'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Member since:</span>
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {user.bio && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Bio</h4>
                      <p className="text-gray-600">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
