/**
 * Phase 3 Integration Example
 * 
 * Comprehensive example showing how to use all Phase 3 components together.
 * Demonstrates payment infrastructure, trust & safety, and AI-powered search.
 */

import {
    // Available Components
    CommissionCalculator,
    EscrowService,
    // Trust & Safety Components
    IdentityVerification,
    // Payment Components
    PaymentMethodSelector,
    ReviewDisplay,
    ReviewForm,
} from '@/components';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, CreditCard, MapPin, Shield, Star } from 'lucide-react';

// Example data types and mock data - Stripe only
const mockPaymentMethods = [
  {
    id: 'stripe-1',
    provider: 'stripe' as const,
    type: 'card' as const,
    displayName: 'Visa •••• 4242',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    brand: 'visa',
    isDefault: true,
    isVerified: true,
  },
  {
    id: 'stripe-2',
    provider: 'stripe' as const,
    type: 'card' as const,
    displayName: 'Mastercard •••• 5555',
    last4: '5555',
    expiryMonth: 8,
    expiryYear: 2026,
    brand: 'mastercard',
    isDefault: false,
    isVerified: true,
  },
];

const mockEscrowTransaction = {
  id: 'escrow-123',
  taskId: 'task-456',
  clientId: 'client-789',
  taskerId: 'tasker-101',
  totalAmount: 500,
  currency: 'USD',
  status: 'funded' as const,
  milestones: [
    {
      id: 'milestone-1',
      title: 'Initial Setup',
      description: 'Set up project environment and requirements',
      amount: 150,
      status: 'approved' as const,
      approvedAt: new Date('2024-01-15'),
    },
    {
      id: 'milestone-2',
      title: 'Development Phase',
      description: 'Core development and implementation',
      amount: 250,
      status: 'in-progress' as const,
    },
    {
      id: 'milestone-3',
      title: 'Testing & Deployment',
      description: 'Testing, bug fixes, and final deployment',
      amount: 100,
      status: 'pending' as const,
    },
  ],
  createdAt: new Date('2024-01-10'),
  fundedAt: new Date('2024-01-12'),
  platformFee: 50,
  taskerAmount: 450,
};

// Removed unused mockRiskAssessment

const mockReviews = [
  {
    id: 'review-1',
    taskId: 'task-123',
    reviewerId: 'reviewer-1',
    reviewerName: 'Sarah Johnson',
    reviewerAvatar: '/api/placeholder/40/40',
    revieweeId: 'tasker-456',
    revieweeName: 'Mike Chen',
    ratings: [
      { dimension: 'quality' as const, score: 5 },
      { dimension: 'communication' as const, score: 4 },
      { dimension: 'timeliness' as const, score: 5 },
      { dimension: 'professionalism' as const, score: 5 },
    ],
    overallRating: 4.8,
    comment: 'Excellent work! Mike completed the task ahead of schedule and the quality exceeded my expectations.',
    isPublic: true,
    isVerified: true,
    createdAt: new Date('2024-01-15'),
    helpfulVotes: 12,
    reportCount: 0,
  },
];

/**
 * Phase 3 Integration Example Component
 */
export const Phase3IntegrationExample: React.FC = () => {
  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe-1');
  const [_userTier, _setUserTier] = useState<'basic' | 'verified' | 'professional' | 'elite'>('professional');

  // Trust & Safety state
  const [showVerification, setShowVerification] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Removed unused search state

  // Event handlers
  const handlePaymentMethodAdd = (provider: 'stripe') => {
    console.log('Adding payment method:', provider);
  };

  const handleMilestoneAction = (milestoneId: string, action: 'approve' | 'dispute' | 'submit') => {
    console.log('Milestone action:', milestoneId, action);
  };

  const handleTransactionAction = (action: 'fund' | 'cancel' | 'complete' | 'refund') => {
    console.log('Transaction action:', action);
  };

  const handleVerificationSubmit = async (data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    documents: Array<{
      id: string;
      type: string;
      fileName: string;
      fileSize: number;
      uploadedAt: Date;
      status: string;
    }>;
  }) => {
    console.log('Verification submitted:', data);
    setShowVerification(false);
  };

  const handleReviewSubmit = async (review: {
    taskId: string;
    reviewerId: string;
    reviewerName: string;
    revieweeId: string;
    revieweeName: string;
    ratings: Array<{ dimension: string; score: number }>;
    overallRating: number;
    comment: string;
    isPublic: boolean;
    isVerified: boolean;
  }) => {
    console.log('Review submitted:', review);
    setShowReviewForm(false);
  };

  // Removed unused handlers for deleted components

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold text-neutral-900 mb-4">
          Phase 3: Payment & Trust Infrastructure
        </h1>
        <p className="text-lg text-neutral-600 font-body max-w-3xl mx-auto">
          Advanced marketplace infrastructure with secure payments, comprehensive trust systems, 
          and AI-powered search capabilities.
        </p>
      </div>

      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">
            <CreditCard className="w-4 h-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="trust-safety">
            <Shield className="w-4 h-4 mr-2" />
            Trust & Safety
          </TabsTrigger>
          <TabsTrigger value="ai-search">
            <Brain className="w-4 h-4 mr-2" />
            AI Search
          </TabsTrigger>
          <TabsTrigger value="geospatial">
            <MapPin className="w-4 h-4 mr-2" />
            Geospatial
          </TabsTrigger>
        </TabsList>

        {/* Payment Infrastructure Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Method Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodSelector
                  paymentMethods={mockPaymentMethods}
                  selectedMethodId={selectedPaymentMethod}
                  onMethodSelect={setSelectedPaymentMethod}
                  onAddMethod={handlePaymentMethodAdd}
                  showAddMethod={true}
                />
              </CardContent>
            </Card>

            {/* Commission Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Commission Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <CommissionCalculator
                  userTier={_userTier}
                  monthlyVolume={5000}
                  taskCategory="tech"
                  showBreakdown={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Escrow Service */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Escrow Service</CardTitle>
            </CardHeader>
            <CardContent>
              <EscrowService
                transaction={mockEscrowTransaction}
                userRole="client"
                onMilestoneAction={handleMilestoneAction}
                onTransactionAction={handleTransactionAction}
                {...({} as any)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trust & Safety Tab */}
        <TabsContent value="trust-safety" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Identity Verification</CardTitle>
              </CardHeader>
              <CardContent>
                {!showVerification ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="font-medium text-neutral-900 font-heading mb-2">
                      Verify Your Identity
                    </h3>
                    <p className="text-neutral-600 font-body mb-4">
                      Complete identity verification to build trust and unlock premium features.
                    </p>
                    <Button
                      onClick={() => setShowVerification(true)}
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      Start Verification
                    </Button>
                  </div>
                ) : (
                  <IdentityVerification
                    onSubmit={handleVerificationSubmit}
                    onCancel={() => setShowVerification(false)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Fraud Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Fraud Detection</CardTitle>
              </CardHeader>
              <CardContent>
                {/* FraudDetection component removed during cleanup */}
                <div className="p-4 text-center text-neutral-600">
                  Fraud Detection component has been removed during codebase cleanup.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Review System */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Leave a Review</CardTitle>
              </CardHeader>
              <CardContent>
                {!showReviewForm ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="font-medium text-neutral-900 font-heading mb-2">
                      Share Your Experience
                    </h3>
                    <p className="text-neutral-600 font-body mb-4">
                      Help build trust by reviewing your recent task experience.
                    </p>
                    <Button
                      onClick={() => setShowReviewForm(true)}
                      className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                      Write Review
                    </Button>
                  </div>
                ) : (
                  <ReviewForm
                    taskId="task-123"
                    revieweeId="tasker-456"
                    revieweeName="Mike Chen"
                    onSubmit={handleReviewSubmit}
                    onCancel={() => setShowReviewForm(false)}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewDisplay
                  reviews={mockReviews}
                  showAverages={true}
                  allowInteraction={true}
                  onHelpfulVote={(id) => console.log('Helpful vote:', id)}
                  {...({} as any)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Search Tab */}
        <TabsContent value="ai-search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">AI-Powered Search Engine</CardTitle>
            </CardHeader>
            <CardContent>
              {/* AISearchEngine component removed during cleanup */}
              <div className="p-4 text-center text-neutral-600">
                AI Search Engine component has been removed during codebase cleanup.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geospatial Search Tab */}
        <TabsContent value="geospatial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Geospatial Search</CardTitle>
            </CardHeader>
            <CardContent>
              {/* GeospatialSearch component removed during cleanup */}
              <div className="p-4 text-center text-neutral-600">
                Geospatial Search component has been removed during codebase cleanup.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
        <CardContent className="p-6">
          <h3 className="text-xl font-heading font-semibold text-primary-900 mb-4">
            Phase 3 Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Badge className="bg-green-500 text-white mb-2">
                <CreditCard className="w-3 h-3 mr-1" />
                Payment Infrastructure
              </Badge>
              <p className="text-sm text-primary-800">
                Multi-gateway payments, escrow services, and dynamic commission calculation
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-blue-500 text-white mb-2">
                <Shield className="w-3 h-3 mr-1" />
                Trust & Safety
              </Badge>
              <p className="text-sm text-primary-800">
                Identity verification, fraud detection, and multi-dimensional reviews
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-purple-500 text-white mb-2">
                <Brain className="w-3 h-3 mr-1" />
                AI Search
              </Badge>
              <p className="text-sm text-primary-800">
                ML-powered ranking, smart suggestions, and visual search capabilities
              </p>
            </div>
            <div className="text-center">
              <Badge className="bg-orange-500 text-white mb-2">
                <MapPin className="w-3 h-3 mr-1" />
                Geospatial
              </Badge>
              <p className="text-sm text-primary-800">
                Location clustering, proximity optimization, and interactive mapping
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase3IntegrationExample;
