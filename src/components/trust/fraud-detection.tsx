/**
 * Fraud Detection Component
 * 
 * Advanced fraud detection and risk assessment system for marketplace security.
 * Implements project-map specifications for trust and safety monitoring.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, DollarSign, Eye, Shield, TrendingUp, Users } from 'lucide-react';
import React, { useMemo, useState } from 'react';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type FraudType = 
  | 'fake-profile'
  | 'payment-fraud'
  | 'review-manipulation'
  | 'task-scam'
  | 'identity-theft'
  | 'money-laundering'
  | 'spam'
  | 'harassment';

export interface FraudIndicator {
  id: string;
  type: FraudType;
  severity: RiskLevel;
  confidence: number; // 0-100
  description: string;
  detectedAt: Date;
  evidence: string[];
  autoResolved: boolean;
}

export interface RiskAssessment {
  userId: string;
  overallRisk: RiskLevel;
  riskScore: number; // 0-100
  indicators: FraudIndicator[];
  lastAssessment: Date;
  accountAge: number; // days
  verificationLevel: number; // 0-100
  activityPatterns: {
    loginFrequency: number;
    taskCompletionRate: number;
    communicationScore: number;
    paymentReliability: number;
  };
}

interface FraudDetectionProps {
  riskAssessment: RiskAssessment;
  onInvestigate: (indicatorId: string) => void;
  onResolve: (indicatorId: string, resolution: string) => void;
  onEscalate: (indicatorId: string) => void;
  className?: string;
  showDetails?: boolean;
}

// Fraud type configuration
const FRAUD_TYPES: Record<FraudType, {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  priority: number;
}> = {
  'fake-profile': {
    name: 'Fake Profile',
    description: 'Suspicious profile information or photos',
    icon: Users,
    color: 'text-orange-600',
    priority: 3,
  },
  'payment-fraud': {
    name: 'Payment Fraud',
    description: 'Suspicious payment patterns or chargebacks',
    icon: DollarSign,
    color: 'text-red-600',
    priority: 5,
  },
  'review-manipulation': {
    name: 'Review Manipulation',
    description: 'Fake reviews or rating manipulation',
    icon: TrendingUp,
    color: 'text-yellow-600',
    priority: 2,
  },
  'task-scam': {
    name: 'Task Scam',
    description: 'Fraudulent task postings or completion',
    icon: Shield,
    color: 'text-red-600',
    priority: 4,
  },
  'identity-theft': {
    name: 'Identity Theft',
    description: 'Using stolen or fake identity documents',
    icon: Eye,
    color: 'text-red-700',
    priority: 5,
  },
  'money-laundering': {
    name: 'Money Laundering',
    description: 'Suspicious financial transaction patterns',
    icon: DollarSign,
    color: 'text-red-700',
    priority: 5,
  },
  spam: {
    name: 'Spam',
    description: 'Excessive or inappropriate messaging',
    icon: Users,
    color: 'text-orange-500',
    priority: 1,
  },
  harassment: {
    name: 'Harassment',
    description: 'Inappropriate behavior or communication',
    icon: Users,
    color: 'text-red-600',
    priority: 3,
  },
};

// Risk level configuration
const RISK_LEVELS: Record<RiskLevel, {
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  threshold: number;
}> = {
  low: {
    name: 'Low Risk',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    threshold: 25,
  },
  medium: {
    name: 'Medium Risk',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    threshold: 50,
  },
  high: {
    name: 'High Risk',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    threshold: 75,
  },
  critical: {
    name: 'Critical Risk',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    threshold: 100,
  },
};

/**
 * Risk Score Gauge Component
 */
const RiskScoreGauge: React.FC<{
  score: number;
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}> = ({ score, level, size = 'md' }) => {
  const config = RISK_LEVELS[level];
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn("relative", sizeClasses[size])}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-neutral-200"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${score * 2.83} 283`}
          className={cn(
            "transition-all duration-1000",
            score <= 25 && "text-green-500",
            score > 25 && score <= 50 && "text-yellow-500",
            score > 50 && score <= 75 && "text-orange-500",
            score > 75 && "text-red-500"
          )}
        />
      </svg>
      
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={cn("font-bold font-heading", textSizes[size], config.color)}>
            {score}
          </div>
          {size !== 'sm' && (
            <div className="text-xs text-neutral-600 font-body">
              Risk Score
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Fraud Indicator Card Component
 */
const FraudIndicatorCard: React.FC<{
  indicator: FraudIndicator;
  onInvestigate: () => void;
  onResolve: () => void;
  onEscalate: () => void;
}> = ({ indicator, onInvestigate, onResolve, onEscalate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const fraudType = FRAUD_TYPES[indicator.type];
  const riskLevel = RISK_LEVELS[indicator.severity];
  const IconComponent = fraudType.icon;

  return (
    <Card className={cn("border-2", riskLevel.borderColor, riskLevel.bgColor)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-lg", riskLevel.bgColor)}>
              <IconComponent className={cn("w-5 h-5", fraudType.color)} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-neutral-900 font-heading">
                  {fraudType.name}
                </h4>
                <Badge variant="outline" className={cn("text-xs", riskLevel.color, riskLevel.borderColor)}>
                  {riskLevel.name}
                </Badge>
              </div>
              
              <p className="text-sm text-neutral-600 font-body mb-2">
                {indicator.description}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-neutral-500">
                <span>Confidence: {indicator.confidence}%</span>
                <span>Detected: {indicator.detectedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 w-8 p-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Evidence Details */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-neutral-200"
            >
              <h5 className="font-medium text-neutral-900 font-heading mb-2">
                Evidence
              </h5>
              <ul className="space-y-1">
                {indicator.evidence.map((evidence, index) => (
                  <li key={index} className="text-sm text-neutral-600 font-body">
                    • {evidence}
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  onClick={onInvestigate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Investigate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onResolve}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Resolve
                </Button>
                {indicator.severity === 'critical' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEscalate}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Escalate
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

/**
 * Main Fraud Detection Component
 */
export const FraudDetection: React.FC<FraudDetectionProps> = ({
  riskAssessment,
  onInvestigate,
  onResolve,
  onEscalate,
  className,
  showDetails = true,
}) => {
  const riskConfig = RISK_LEVELS[riskAssessment.overallRisk];
  
  // Sort indicators by priority and severity
  const sortedIndicators = useMemo(() => {
    return [...riskAssessment.indicators].sort((a, b) => {
      const priorityA = FRAUD_TYPES[a.type].priority;
      const priorityB = FRAUD_TYPES[b.type].priority;
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      
      return priorityB - priorityA;
    });
  }, [riskAssessment.indicators]);



  return (
    <div className={cn("fraud-detection space-y-6", className)}>
      {/* Risk Overview */}
      <Card className={cn("border-2", riskConfig.borderColor, riskConfig.bgColor)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={cn("w-8 h-8", riskConfig.color)} />
              <div>
                <CardTitle className={cn("text-xl font-heading", riskConfig.color)}>
                  Fraud Risk Assessment
                </CardTitle>
                <p className="text-sm text-neutral-600 font-body">
                  User ID: {riskAssessment.userId}
                </p>
              </div>
            </div>
            
            <RiskScoreGauge
              score={riskAssessment.riskScore}
              level={riskAssessment.overallRisk}
              size="lg"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900 font-heading">
                {riskAssessment.accountAge}
              </div>
              <div className="text-sm text-neutral-600 font-body">Days Active</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900 font-heading">
                {riskAssessment.verificationLevel}%
              </div>
              <div className="text-sm text-neutral-600 font-body">Verified</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900 font-heading">
                {riskAssessment.indicators.length}
              </div>
              <div className="text-sm text-neutral-600 font-body">Active Alerts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900 font-heading">
                {Math.round(riskAssessment.activityPatterns.taskCompletionRate * 100)}%
              </div>
              <div className="text-sm text-neutral-600 font-body">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetails && (
        <Tabs defaultValue="indicators" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="indicators">
              Active Indicators ({riskAssessment.indicators.length})
            </TabsTrigger>
            <TabsTrigger value="patterns">Activity Patterns</TabsTrigger>
            <TabsTrigger value="history">Assessment History</TabsTrigger>
          </TabsList>

          {/* Active Indicators */}
          <TabsContent value="indicators" className="space-y-4">
            {sortedIndicators.length > 0 ? (
              <div className="space-y-3">
                {sortedIndicators.map((indicator) => (
                  <FraudIndicatorCard
                    key={indicator.id}
                    indicator={indicator}
                    onInvestigate={() => onInvestigate(indicator.id)}
                    onResolve={() => onResolve(indicator.id, 'manual-review')}
                    onEscalate={() => onEscalate(indicator.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-medium text-neutral-900 font-heading mb-2">
                    No Active Fraud Indicators
                  </h3>
                  <p className="text-neutral-600 font-body">
                    This user shows no signs of fraudulent activity.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Patterns */}
          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Behavioral Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries({
                  'Login Frequency': riskAssessment.activityPatterns.loginFrequency,
                  'Task Completion Rate': riskAssessment.activityPatterns.taskCompletionRate,
                  'Communication Score': riskAssessment.activityPatterns.communicationScore,
                  'Payment Reliability': riskAssessment.activityPatterns.paymentReliability,
                }).map(([label, value]) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-neutral-900 font-heading">{label}</span>
                      <span className="text-neutral-600 font-body">{Math.round(value * 100)}%</span>
                    </div>
                    <Progress value={value * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment History */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Risk Assessment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="font-medium text-neutral-900 font-heading mb-2">
                    Assessment History
                  </h3>
                  <p className="text-neutral-600 font-body">
                    Last assessment: {riskAssessment.lastAssessment.toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default FraudDetection;
