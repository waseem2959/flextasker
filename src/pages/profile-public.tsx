import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Award as AwardIcon,
    Calendar,
    CheckCircle,
    Clock as ClockIcon,
    MapPin,
    MessageCircle,
    Star
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/main-layout';

import { Progress } from '@/components/ui/progress';
import { UserRole } from '../../shared/types/enums';

// Mock data - would be fetched from API in a real app
interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
  avatar?: string | null;
  bio: string;
  location: string;
  memberSince: string;
  verified: boolean;
  averageRating: number;
  totalReviews: number;
  totalTasksCompleted: number;
  responseRate: number;
  responseTime: string;
  skills: string[];
  languages: string[];
  education: string;
  workHistory: Array<{ company: string; role: string; period: string }>;
  certifications: string[];
  availability: {
    weekdays: boolean;
    weekends: boolean;
    evenings: boolean;
  };
}

const mockUser: User = {
  id: '123',
  firstName: 'Shreshta',
  lastName: 'Kumar',
  username: 'shreshta_k',
  role: UserRole.TASKER,
  avatar: null,
  bio: 'Professional painter with 5+ years of experience. Specializing in interior and exterior painting for residential properties. Committed to quality work and customer satisfaction.',
  location: 'New York, NY',
  memberSince: '2023-02-15',
  verified: true,
  averageRating: 4.9,
  totalReviews: 127,
  totalTasksCompleted: 143,
  responseRate: 98,
  responseTime: '2 hours',
  skills: [
    'Interior Painting',
    'Exterior Painting',
    'Wallpaper Installation',
    'Color Consulting',
    'Texture Application',
    'Trim Work'
  ],
  languages: ['English', 'Hindi'],
  education: 'Bachelor of Fine Arts, New York University',
  workHistory: [
    { 
      company: 'City Painters Inc.', 
      role: 'Senior Painter', 
      period: '2018-2022' 
    }
  ],
  certifications: [
    'Certified Professional Painter (CPP)',
    'OSHA Safety Certification'
  ],
  availability: {
    weekdays: true,
    weekends: true,
    evenings: false
  }
};

interface ReviewUser {
  name: string;
  avatar: string | null;
}

interface Review {
  id: string;
  user: ReviewUser;
  rating: number;
  date: string;
  text: string;
  taskTitle: string;
}

const mockReviews: Review[] = [
  {
    id: '1',
    user: {
      name: 'Michael B.',
      avatar: null
    },
    rating: 5,
    date: '2025-05-10',
    text: 'Excellent work! Shreshta was very professional and completed the job ahead of schedule. Highly recommend for any painting needs.',
    taskTitle: 'Living Room Painting'
  },
  {
    id: '2',
    user: {
      name: 'Robert T.',
      avatar: null
    },
    rating: 5,
    date: '2025-04-22',
    text: 'Very satisfied with the exterior painting job. Shreshta was thorough and paid attention to details. He also cleaned up everything perfectly after finishing the job.',
    taskTitle: 'Exterior House Painting'
  },
  {
    id: '3',
    user: {
      name: 'Sarah K.',
      avatar: null
    },
    rating: 4,
    date: '2025-04-05',
    text: 'Good work on the bedroom painting. Finished a bit later than expected but the quality was good so I\'m satisfied overall.',
    taskTitle: 'Bedroom Painting and Repair'
  }
];

const mockPortfolio = [
  {
    id: '1',
    title: 'Victorian House Exterior',
    description: 'Complete exterior painting of a Victorian-style home in Brooklyn',
    imageUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Modern Living Room',
    description: 'Contemporary living room with accent wall and custom trim work',
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'Kitchen Renovation',
    description: 'Complete kitchen cabinet refinishing and wall painting',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&auto=format&fit=crop'
  }
];

const ProfilePublic = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User>(mockUser);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [portfolio, setPortfolio] = useState<typeof mockPortfolio>(mockPortfolio);
  const [isLoading, setIsLoading] = useState(false);

  // This would fetch the actual user data in a real app
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser(mockUser);
      setReviews(mockReviews);
      setPortfolio(mockPortfolio);
      setIsLoading(false);
    }, 1000);
  }, [username]);

  // Calculate rating distribution
  const ratingDistribution = [
    { stars: 5, count: 98 },
    { stars: 4, count: 23 },
    { stars: 3, count: 5 },
    { stars: 2, count: 1 },
    { stars: 1, count: 0 }
  ];

  const totalRatings = ratingDistribution.reduce((acc, item) => acc + item.count, 0);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col space-y-4">
            <div className="h-60 bg-[hsl(215,16%,90%)] animate-pulse rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-96 bg-[hsl(215,16%,90%)] animate-pulse rounded-lg"></div>
              <div className="md:col-span-2 h-96 bg-[hsl(215,16%,90%)] animate-pulse rounded-lg"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Header Card */}
            <Card className="w-full mb-8 border-[hsl(215,16%,80%)] overflow-hidden">
              <div className="relative">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-r from-[hsl(196,80%,85%)] to-[hsl(196,80%,70%)]"></div>
                
                {/* Profile Content */}
                <div className="p-6 flex flex-col md:flex-row gap-6 relative">
                  {/* Profile Image */}
                  <div className="absolute top-0 transform -translate-y-1/2 left-6 md:left-8">
                    <Avatar className="h-24 w-24 border-4 border-white">
                      <AvatarImage src={user.avatar ?? undefined} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-[hsl(196,80%,43%)] text-white text-xl">
                        {`${user.firstName[0]}${user.lastName[0]}`}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Profile Details */}
                  <div className="mt-12 md:mt-0 md:ml-28 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-[hsl(206,33%,16%)] flex items-center">
                          {`${user.firstName} ${user.lastName}`}
                          {user.verified && (
                            <CheckCircle size={18} className="ml-2 text-[hsl(196,80%,43%)]" />
                          )}
                        </h1>
                        <div className="flex items-center flex-wrap gap-3 mt-1">
                          <div className="flex items-center text-[hsl(220,14%,46%)]">
                            <MapPin size={16} className="mr-1" />
                            <span>{user.location}</span>
                          </div>
                          <div className="flex items-center text-[hsl(220,14%,46%)]">
                            <Calendar size={16} className="mr-1" />
                            <span>Member since {new Date(user.memberSince).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0 flex gap-3">
                        <Button className="bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)] text-white">
                          <MessageCircle size={16} className="mr-2" />
                          Contact
                        </Button>
                        <Button variant="outline" className="border-[hsl(196,80%,43%)] text-[hsl(196,80%,43%)]">
                          View Tasks
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Badge variant="outline" className="flex items-center bg-[hsl(196,80%,95%)] text-[hsl(196,80%,43%)] border-[hsl(196,80%,43%)]/30">
                        <Star size={14} className="mr-1" />
                        {user.averageRating} ({user.totalReviews} reviews)
                      </Badge>
                      <Badge variant="outline" className="flex items-center border-[hsl(215,16%,80%)]">
                        <CheckCircle size={14} className="mr-1" />
                        {user.totalTasksCompleted} tasks completed
                      </Badge>
                      <Badge variant="outline" className="flex items-center border-[hsl(215,16%,80%)]">
                        <ClockIcon size={14} className="mr-1" />
                        {user.responseTime} avg. response
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Sidebar */}
              <div className="space-y-6">
                {/* About */}
                <Card className="border-[hsl(215,16%,80%)] overflow-hidden">
                  <div className="p-5 bg-[hsl(196,80%,95%)] border-b border-[hsl(215,16%,80%)]">
                    <h2 className="font-semibold text-[hsl(206,33%,16%)]">About</h2>
                  </div>
                  <div className="p-5">
                    <p className="text-[hsl(220,14%,46%)]">{user.bio}</p>
                  </div>
                </Card>
                
                {/* Skills */}
                <Card className="border-[hsl(215,16%,80%)] overflow-hidden">
                  <div className="p-5 bg-[hsl(196,80%,95%)] border-b border-[hsl(215,16%,80%)]">
                    <h2 className="font-semibold text-[hsl(206,33%,16%)]">Skills</h2>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge 
                          key={`skill-${skill}-${index}`} 
                          variant="outline" 
                          className="bg-white border-[hsl(215,16%,80%)] text-[hsl(220,14%,46%)]"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
                
                {/* Certifications */}
                <Card className="border-[hsl(215,16%,80%)] overflow-hidden">
                  <div className="p-5 bg-[hsl(196,80%,95%)] border-b border-[hsl(215,16%,80%)]">
                    <h2 className="font-semibold text-[hsl(206,33%,16%)]">Certifications</h2>
                  </div>
                  <div className="p-5">
                    <ul className="space-y-2">
                      {user.certifications.map((cert, index) => (
                        <li key={`cert-${cert}-${index}`} className="flex items-center text-[hsl(220,14%,46%)]">
                          <AwardIcon size={16} className="mr-2 text-[hsl(196,80%,43%)]" />
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
                
                {/* Languages */}
                <Card className="border-[hsl(215,16%,80%)] overflow-hidden">
                  <div className="p-5 bg-[hsl(196,80%,95%)] border-b border-[hsl(215,16%,80%)]">
                    <h2 className="font-semibold text-[hsl(206,33%,16%)]">Languages</h2>
                  </div>
                  <div className="p-5">
                    <ul className="space-y-1">
                      {user.languages.map((language, index) => (
                        <li key={`lang-${language}-${index}`} className="text-[hsl(220,14%,46%)]">{language}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
                
                {/* Education & Work */}
                <Card className="border-[hsl(215,16%,80%)] overflow-hidden">
                  <div className="p-5 bg-[hsl(196,80%,95%)] border-b border-[hsl(215,16%,80%)]">
                    <h2 className="font-semibold text-[hsl(206,33%,16%)]">Education & Work</h2>
                  </div>
                  <div className="p-5">
                    <h3 className="font-medium text-[hsl(206,33%,16%)] mb-1">Education</h3>
                    <p className="text-[hsl(220,14%,46%)] mb-4">{user.education}</p>
                    
                    <h3 className="font-medium text-[hsl(206,33%,16%)] mb-1">Work History</h3>
                    <ul className="space-y-3">
                      {user.workHistory.map((work) => (
                        <li key={`${work.company}-${work.role}-${work.period}`}>
                          <p className="font-medium text-[hsl(220,14%,46%)]">{work.role}</p>
                          <p className="text-sm text-[hsl(220,14%,46%)]">{work.company} • {work.period}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </div>
              
              {/* Main Content */}
              <div className="md:col-span-2">
                <Tabs defaultValue="reviews" className="w-full">
                  <TabsList className="w-full border-b border-[hsl(215,16%,90%)] bg-transparent p-0 mb-6">
                    <TabsTrigger 
                      value="reviews" 
                      className="py-3 px-5 border-b-2 border-transparent data-[state=active]:border-[hsl(196,80%,43%)] rounded-none bg-transparent data-[state=active]:text-[hsl(206,33%,16%)] text-[hsl(220,14%,46%)]"
                    >
                      Reviews
                    </TabsTrigger>
                    <TabsTrigger 
                      value="portfolio" 
                      className="py-3 px-5 border-b-2 border-transparent data-[state=active]:border-[hsl(196,80%,43%)] rounded-none bg-transparent data-[state=active]:text-[hsl(206,33%,16%)] text-[hsl(220,14%,46%)]"
                    >
                      Portfolio
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="reviews" className="mt-0">
                    <div className="bg-white border border-[hsl(215,16%,80%)] rounded-lg p-6 mb-6">
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Overall Rating */}
                        <div className="flex flex-col items-center md:w-1/3">
                          <h3 className="text-lg font-medium text-[hsl(206,33%,16%)] mb-2">Overall Rating</h3>
                          <div className="text-5xl font-bold text-[hsl(206,33%,16%)] mb-2">{user.averageRating}</div>
                          <div className="flex items-center mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={`rating-star-${star}`} 
                                size={18} 
                                className={star <= Math.floor(user.averageRating) ? "text-[hsl(38,92%,50%)] fill-[hsl(38,92%,50%)]" : "text-[hsl(215,16%,90%)]"} 
                              />
                            ))}
                          </div>
                          <p className="text-sm text-[hsl(220,14%,46%)]">Based on {user.totalReviews} reviews</p>
                        </div>
                        
                        {/* Rating Distribution */}
                        <div className="md:w-2/3">
                          <h3 className="text-lg font-medium text-[hsl(206,33%,16%)] mb-4">Rating Distribution</h3>
                          <div className="space-y-3">
                            {ratingDistribution.map((rating) => (
                              <div key={rating.stars} className="flex items-center">
                                <div className="w-16 flex items-center">
                                  <span className="text-[hsl(220,14%,46%)]">{rating.stars} stars</span>
                                </div>
                                <div className="flex-1 mx-3">
                                  <Progress 
                                    value={(rating.count / totalRatings) * 100} 
                                    className="h-2 bg-[hsl(215,16%,90%)] [&>div]:bg-[hsl(196,80%,43%)]"
                                  />
                                </div>
                                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[hsl(220,14%,46%)]">{rating.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Reviews List */}
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <Card key={review.id} className="p-5 border-[hsl(215,16%,80%)]">
                          <div className="flex justify-between mb-3">
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={review.user.avatar ?? ''} alt={review.user.name} />
                                <AvatarFallback className="bg-[hsl(196,80%,90%)] text-[hsl(196,80%,43%)]">
                                  {review.user.name?.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-[hsl(206,33%,16%)]">{review.user.name}</p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={`review-${review.id}-star-${i}`} 
                                      size={14} 
                                      className={i < review.rating ? "text-[hsl(38,92%,50%)] fill-[hsl(38,92%,50%)]" : "text-[hsl(215,16%,90%)]"} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-sm text-[hsl(220,14%,46%)]">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[hsl(220,14%,46%)] mb-3">{review.text}</p>
                          <Badge variant="outline" className="bg-[hsl(215,16%,97%)] border-[hsl(215,16%,80%)] text-[hsl(220,14%,46%)]">
                            {review.taskTitle}
                          </Badge>
                        </Card>
                      ))}
                      
                      {reviews.length > 3 && (
                        <div className="text-center mt-8">
                          <Button variant="outline" className="border-[hsl(215,16%,80%)] text-[hsl(220,14%,46%)]">
                            Load More Reviews
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="portfolio" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {portfolio.map((item) => (
                        <Card key={item.id} className="border-[hsl(215,16%,80%)] overflow-hidden">
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-[hsl(206,33%,16%)] mb-1">{item.title}</h3>
                            <p className="text-sm text-[hsl(220,14%,46%)]">{item.description}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default ProfilePublic;
