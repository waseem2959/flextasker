/**
 * Phase 2 Integration Example
 * 
 * Comprehensive example showing how to use all Phase 2 components together.
 * Demonstrates the enhanced marketplace functionality and component integration.
 */

import {
  // UI Components
  CategoryGrid,
  PriceRangeSlider,
  ProgressIndicator,
  SkillsPortfolio,
  TaskCard,
  // Task Components
  TaskCreationWizard,
  // Search Components
  TaskSearchInterface,
  TrustScore,
  // User Profile Components
  VerificationBadges,
} from '@/components';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Example data types
interface ExampleTask {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string };
  location: { address: string; city: string; state: string };
  budget: { amount: number; type: 'fixed' | 'hourly' };
  bidCount: number;
  status: 'open' | 'assigned' | 'in-progress' | 'completed';
  createdAt: string;
  isUrgent?: boolean;
}

/**
 * Phase 2 Integration Example Component
 */
export const Phase2IntegrationExample: React.FC = () => {
  // Task Creation State
  const [showTaskWizard, setShowTaskWizard] = useState(false);
  const [_taskData, _setTaskData] = useState({});

  // Search State
  const [searchState, setSearchState] = useState({
    query: '',
    location: { address: '' },
    filters: {},
    sortBy: 'relevance',
    viewMode: 'grid' as const,
  });

  // User Profile State
  const [userVerifications] = useState([
    { type: 'identity' as const, isVerified: true, verifiedAt: new Date() },
    { type: 'phone' as const, isVerified: true, verifiedAt: new Date() },
    { type: 'email' as const, isVerified: true, verifiedAt: new Date() },
    { type: 'payment' as const, isVerified: true, verifiedAt: new Date() },
    { type: 'background-check' as const, isVerified: false },
    { type: 'professional' as const, isVerified: true, verifiedAt: new Date() },
  ]);

  const [userSkills] = useState([
    { id: '1', name: 'Plumbing', level: 'expert' as const, yearsExperience: 8, isVerified: true, endorsements: 15 },
    { id: '2', name: 'Electrical Work', level: 'advanced' as const, yearsExperience: 5, isVerified: true, endorsements: 8 },
    { id: '3', name: 'Carpentry', level: 'intermediate' as const, yearsExperience: 3, isVerified: false, endorsements: 3 },
    { id: '4', name: 'Painting', level: 'advanced' as const, yearsExperience: 6, isVerified: true, endorsements: 12 },
  ]);

  const [userPortfolio] = useState([
    {
      id: '1',
      title: 'Kitchen Renovation',
      description: 'Complete kitchen makeover including plumbing, electrical, and carpentry work.',
      images: ['/api/placeholder/400/300'],
      category: 'Home Renovation',
      completedAt: new Date('2024-01-15'),
      location: 'Sydney, NSW',
      rating: 5,
      clientFeedback: 'Exceptional work! Highly recommended.',
      tags: ['Kitchen', 'Plumbing', 'Electrical', 'Carpentry'],
      isPublic: true,
      views: 245,
      likes: 18,
    },
    {
      id: '2',
      title: 'Bathroom Upgrade',
      description: 'Modern bathroom renovation with new fixtures and tiling.',
      images: ['/api/placeholder/400/300'],
      category: 'Bathroom Renovation',
      completedAt: new Date('2024-02-20'),
      location: 'Melbourne, VIC',
      rating: 4.8,
      clientFeedback: 'Great attention to detail and professional service.',
      tags: ['Bathroom', 'Tiling', 'Plumbing'],
      isPublic: true,
      views: 189,
      likes: 14,
    },
  ]);

  // Example categories
  const categories = [
    { id: 'cleaning', name: 'Cleaning', icon: undefined },
    { id: 'handyman', name: 'Handyman', icon: undefined },
    { id: 'gardening', name: 'Gardening', icon: undefined },
    { id: 'moving', name: 'Moving', icon: undefined },
    { id: 'delivery', name: 'Delivery', icon: undefined },
    { id: 'assembly', name: 'Assembly', icon: undefined },
  ];

  // Example tasks
  const exampleTasks: ExampleTask[] = [
    {
      id: '1',
      title: 'House Cleaning Service',
      description: 'Need a thorough cleaning of my 3-bedroom house including bathrooms, kitchen, and living areas.',
      category: { id: 'cleaning', name: 'Cleaning' },
      location: { address: '123 Main St', city: 'Sydney', state: 'NSW' },
      budget: { amount: 150, type: 'fixed' },
      bidCount: 8,
      status: 'open',
      createdAt: new Date().toISOString(),
      isUrgent: false,
    },
    {
      id: '2',
      title: 'Urgent Furniture Assembly',
      description: 'Need help assembling IKEA furniture today. Multiple items including wardrobe and desk.',
      category: { id: 'assembly', name: 'Assembly' },
      location: { address: '456 Oak Ave', city: 'Melbourne', state: 'VIC' },
      budget: { amount: 80, type: 'fixed' },
      bidCount: 3,
      status: 'open',
      createdAt: new Date().toISOString(),
      isUrgent: true,
    },
  ];

  // Event handlers
  const handleTaskCreation = async (data: any) => {
    console.log('Creating task:', data);
    setShowTaskWizard(false);
    // In real app, this would call an API
  };

  const handleSearch = () => {
    console.log('Searching with state:', searchState);
    // In real app, this would call search API
  };

  const handlePriceRangeChange = (range: { min: number; max: number }) => {
    console.log('Price range changed:', range);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-4">
          Phase 2: Core Feature Enhancement
        </h1>
        <p className="text-lg text-neutral-600 font-body max-w-3xl mx-auto">
          Comprehensive example showcasing all Phase 2 components including advanced task management, 
          enhanced search functionality, and professional user profiles.
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search & Discovery</TabsTrigger>
          <TabsTrigger value="task-creation">Task Creation</TabsTrigger>
          <TabsTrigger value="user-profile">User Profile</TabsTrigger>
          <TabsTrigger value="components">UI Components</TabsTrigger>
        </TabsList>

        {/* Search & Discovery Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Enhanced Search Interface</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskSearchInterface
                searchState={searchState}
                onSearchStateChange={setSearchState as any}
                onSearch={handleSearch}
                categories={categories}
                showViewModes={true}
                showQuickFilters={true}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exampleTasks.map((task) => (
              <TaskCard key={task.id} task={task as any} />
            ))}
          </div>
        </TabsContent>

        {/* Task Creation Tab */}
        <TabsContent value="task-creation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Multi-Step Task Creation</CardTitle>
            </CardHeader>
            <CardContent>
              {!showTaskWizard ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-4">
                    Experience the enhanced task creation wizard with progress tracking and validation.
                  </p>
                  <Button
                    onClick={() => setShowTaskWizard(true)}
                    className="bg-primary-900 hover:bg-primary-800 text-white font-heading"
                  >
                    Start Task Creation
                  </Button>
                </div>
              ) : (
                <TaskCreationWizard
                  onComplete={handleTaskCreation}
                  onCancel={() => setShowTaskWizard(false)}
                  initialData={_taskData}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Profile Tab */}
        <TabsContent value="user-profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trust & Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Trust & Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TrustScore
                  score={85}
                  verifications={userVerifications}
                  showDetails={true}
                />
                <VerificationBadges
                  verifications={userVerifications}
                  layout="vertical"
                  maxVisible={6}
                />
              </CardContent>
            </Card>

            {/* Skills & Portfolio */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Skills & Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillsPortfolio
                    skills={userSkills}
                    portfolio={userPortfolio}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* UI Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price Range Slider */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Price Range Slider</CardTitle>
              </CardHeader>
              <CardContent>
                <PriceRangeSlider
                  min={5}
                  max={1000}
                  value={{ min: 50, max: 300 }}
                  onChange={handlePriceRangeChange}
                  currency="USD"
                  showTooltips={true}
                />
              </CardContent>
            </Card>

            {/* Category Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Category Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryGrid
                  categories={categories}
                  selectedCategory="cleaning"
                  onCategorySelect={(id) => console.log('Selected:', id)}
                  variant="default"
                />
              </CardContent>
            </Card>

            {/* Progress Indicator */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-heading">Progress Indicator</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressIndicator
                  steps={[
                    { id: 'step1', title: 'Category', description: 'Choose service type' },
                    { id: 'step2', title: 'Details', description: 'Describe your task' },
                    { id: 'step3', title: 'Location', description: 'Set location' },
                    { id: 'step4', title: 'Budget', description: 'Set your budget' },
                    { id: 'step5', title: 'Review', description: 'Review and post' },
                  ]}
                  currentStep={2}
                  onStepClick={(step) => console.log('Clicked step:', step)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="bg-primary-50 border-primary-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-heading font-semibold text-primary-900 mb-3">
            Phase 2 Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge className="bg-primary-500 text-white mb-2">Advanced Components</Badge>
              <p className="text-sm text-primary-800">
                Multi-step wizards, enhanced cards, and filtering interfaces
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-primary-500 text-white mb-2">Search & Discovery</Badge>
              <p className="text-sm text-primary-800">
                Location search, price filters, and comprehensive search interface
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-primary-500 text-white mb-2">User Profiles</Badge>
              <p className="text-sm text-primary-800">
                Verification badges, trust scores, and skills portfolios
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase2IntegrationExample;
