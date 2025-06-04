import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from '@/components/ui/star-rating';
import { useAuth } from '@/hooks/use-auth';
import { getInitials } from '@/services/user';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="py-8 bg-white min-h-screen font-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-[hsl(206,33%,16%)] font-primary">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatar ?? undefined} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-[hsl(206,33%,16%)]">{`${user.firstName} ${user.lastName}`}</h2>
                <Badge className="mt-2 capitalize">{user.role}</Badge>

                <StarRating rating={user.averageRating ?? 0} size={4} className="mt-2" />
                <span className="ml-2 text-sm font-medium text-[hsl(220,14%,46%)]">
                  {user.averageRating ?? 0} ({user.totalReviews ?? 0} reviews)
                </span>

                <div className="w-full mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(220,14%,46%)]">Email:</span>
                    <span className="font-medium text-[hsl(206,33%,16%)]">{user.email}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(220,14%,46%)]">Location:</span>
                    <span className="font-medium text-[hsl(206,33%,16%)]">
                      {[user.city, user.state, user.country].filter(Boolean).join(', ') || 'Not provided'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(220,14%,46%)]">Member since:</span>
                    <span className="font-medium text-[hsl(206,33%,16%)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {user.bio && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 text-[hsl(206,33%,16%)]">Bio</h4>
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
