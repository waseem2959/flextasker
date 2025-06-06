/**
 * Phase 1 Integration Example
 * 
 * Comprehensive example showing how to use all Phase 1 components together.
 * Demonstrates the enhanced design system harmonization and component patterns.
 */

import {
  // Enhanced UI Components
  CategoryGrid,
  ProgressIndicator,

  // Enhanced Task Components
  TaskCard,
} from '@/components';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Grid, Palette, Type } from 'lucide-react';

// Example data
const categories = [
  { id: 'cleaning', name: 'Cleaning', icon: undefined },
  { id: 'handyman', name: 'Handyman', icon: undefined },
  { id: 'gardening', name: 'Gardening', icon: undefined },
  { id: 'moving', name: 'Moving', icon: undefined },
  { id: 'delivery', name: 'Delivery', icon: undefined },
  { id: 'assembly', name: 'Assembly', icon: undefined },
  { id: 'tutoring', name: 'Tutoring', icon: undefined },
  { id: 'photography', name: 'Photography', icon: undefined },
];

const progressSteps = [
  {
    id: 'design-system',
    title: 'Design System',
    description: 'Enhanced color system and typography',
    isCompleted: true,
  },
  {
    id: 'components',
    title: 'UI Components',
    description: 'New marketplace components',
    isCompleted: true,
  },
  {
    id: 'integration',
    title: 'Integration',
    description: 'Component integration and testing',
    isCompleted: true,
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Usage examples and guides',
    isCompleted: false,
  },
];

const exampleTasks = [
  {
    id: '1',
    title: 'House Cleaning Service',
    description: 'Need a thorough cleaning of my 3-bedroom house including bathrooms, kitchen, and living areas.',
    category: { id: 'cleaning', name: 'Cleaning' },
    location: { address: '123 Main St', city: 'Sydney', state: 'NSW' },
    budget: { amount: 150, type: 'fixed' as const },
    bidCount: 8,
    status: 'open' as const,
    createdAt: new Date().toISOString(),
    isUrgent: false,
  },
  {
    id: '2',
    title: 'Garden Maintenance',
    description: 'Weekly garden maintenance including lawn mowing, hedge trimming, and general upkeep.',
    category: { id: 'gardening', name: 'Gardening' },
    location: { address: '456 Oak Ave', city: 'Melbourne', state: 'VIC' },
    budget: { amount: 80, type: 'fixed' as const },
    bidCount: 5,
    status: 'open' as const,
    createdAt: new Date().toISOString(),
    isUrgent: false,
  },
];

/**
 * Phase 1 Integration Example Component
 */
export const Phase1IntegrationExample: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('cleaning');
  const [currentStep, setCurrentStep] = useState(2);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-4">
          Phase 1: Design System Harmonization
        </h1>
        <p className="text-lg text-neutral-600 font-body max-w-3xl mx-auto">
          Comprehensive example showcasing the enhanced design system, new UI components, 
          and improved component patterns aligned with project-map specifications.
        </p>
      </div>

      <Tabs defaultValue="design-system" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="design-system">
            <Palette className="w-4 h-4 mr-2" />
            Design System
          </TabsTrigger>
          <TabsTrigger value="components">
            <Grid className="w-4 h-4 mr-2" />
            UI Components
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="w-4 h-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="integration">
            <CheckCircle className="w-4 h-4 mr-2" />
            Integration
          </TabsTrigger>
        </TabsList>

        {/* Design System Tab */}
        <TabsContent value="design-system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Enhanced Color System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Primary Colors */}
                <div>
                  <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-3">
                    Primary Teal-Mint Gradient
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[50, 100, 500, 800, 900].map((shade) => (
                      <div key={shade} className="text-center">
                        <div 
                          className={`w-full h-16 rounded-lg mb-2 bg-primary-${shade}`}
                        />
                        <div className="text-xs font-mono text-neutral-600">
                          primary-{shade}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Neutral Colors */}
                <div>
                  <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-3">
                    Enhanced Neutral Palette
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {[50, 200, 500, 800, 900].map((shade) => (
                      <div key={shade} className="text-center">
                        <div 
                          className={`w-full h-16 rounded-lg mb-2 bg-neutral-${shade}`}
                        />
                        <div className="text-xs font-mono text-neutral-600">
                          neutral-{shade}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Colors */}
                <div>
                  <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-3">
                    Status Colors
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-full h-16 rounded-lg mb-2 bg-green-500" />
                      <div className="text-xs font-mono text-neutral-600">Success</div>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-16 rounded-lg mb-2 bg-yellow-500" />
                      <div className="text-xs font-mono text-neutral-600">Warning</div>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-16 rounded-lg mb-2 bg-red-500" />
                      <div className="text-xs font-mono text-neutral-600">Error</div>
                    </div>
                    <div className="text-center">
                      <div className="w-full h-16 rounded-lg mb-2 bg-blue-500" />
                      <div className="text-xs font-mono text-neutral-600">Info</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Indicator */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Progress Indicator</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressIndicator
                  steps={progressSteps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                  variant="default"
                  showLabels={true}
                />
                
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep(Math.min(progressSteps.length - 1, currentStep + 1))}
                    disabled={currentStep === progressSteps.length - 1}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Grid */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Category Grid</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryGrid
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategorySelect={setSelectedCategory}
                  variant="default"
                />
                
                <div className="mt-4">
                  <Badge variant="outline" className="bg-primary-50 text-primary-800 border-primary-200">
                    Selected: {categories.find(c => c.id === selectedCategory)?.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Task Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Enhanced Task Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exampleTasks.map((task) => (
                  <TaskCard key={task.id} task={task as any} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Dual-Typeface Typography System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Heading Font */}
              <div>
                <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-3">
                  Heading Font: Formula Condensed
                </h3>
                <div className="space-y-2">
                  <h1 className="text-4xl font-heading font-bold text-neutral-900">
                    Heading 1 - Bold
                  </h1>
                  <h2 className="text-3xl font-heading font-semibold text-neutral-800">
                    Heading 2 - Semibold
                  </h2>
                  <h3 className="text-2xl font-heading font-medium text-neutral-700">
                    Heading 3 - Medium
                  </h3>
                </div>
              </div>

              {/* Body Font */}
              <div>
                <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-3">
                  Body Font: Manrope
                </h3>
                <div className="space-y-2">
                  <p className="text-lg font-body text-neutral-900">
                    Large body text - Regular weight for readability
                  </p>
                  <p className="text-base font-body text-neutral-800">
                    Base body text - Standard paragraph text with optimal line height
                  </p>
                  <p className="text-sm font-body text-neutral-600">
                    Small body text - For captions and secondary information
                  </p>
                </div>
              </div>

              {/* Typography Hierarchy */}
              <div>
                <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-3">
                  Typography Hierarchy
                </h3>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <h4 className="text-xl font-heading font-bold text-primary-900 mb-2">
                    Marketplace Task Title
                  </h4>
                  <p className="text-base font-body text-neutral-700 mb-3">
                    This is a sample task description using our body font. It demonstrates 
                    how the dual-typeface system creates clear hierarchy and improved readability.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary-100 text-primary-800 font-heading">
                      Category
                    </Badge>
                    <span className="text-sm font-body text-neutral-600">
                      Posted 2 hours ago
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Component Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Integration Example */}
                <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg border-2 border-primary-200">
                  <h3 className="text-xl font-heading font-bold text-primary-900 mb-4">
                    Complete Integration Example
                  </h3>
                  
                  <div className="space-y-4">
                    <ProgressIndicator
                      steps={progressSteps.slice(0, 3)}
                      currentStep={2}
                      variant="compact"
                      showLabels={false}
                    />
                    
                    <CategoryGrid
                      categories={categories.slice(0, 4)}
                      selectedCategory={selectedCategory}
                      onCategorySelect={setSelectedCategory}
                      variant="compact"
                    />
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-heading font-semibold text-green-900">
                      Enhanced Design
                    </h4>
                    <p className="text-sm font-body text-green-700">
                      Project-map aligned color system and typography
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Grid className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-heading font-semibold text-blue-900">
                      New Components
                    </h4>
                    <p className="text-sm font-body text-blue-700">
                      Marketplace-specific UI components
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <Type className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-heading font-semibold text-purple-900">
                      Better UX
                    </h4>
                    <p className="text-sm font-body text-purple-700">
                      Improved readability and visual hierarchy
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="bg-primary-50 border-2 border-primary-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-heading font-semibold text-primary-900 mb-3">
            Phase 1 Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Badge className="bg-primary-500 text-white mb-2">Design System</Badge>
              <p className="text-sm text-primary-800">
                Enhanced teal-mint color system with 50-950 scale
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-primary-500 text-white mb-2">Typography</Badge>
              <p className="text-sm text-primary-800">
                Dual-typeface system with Formula Condensed and Manrope
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-primary-500 text-white mb-2">Components</Badge>
              <p className="text-sm text-primary-800">
                New marketplace UI components with enhanced patterns
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase1IntegrationExample;
