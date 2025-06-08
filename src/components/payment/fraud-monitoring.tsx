/**
 * Fraud Monitoring Component
 * 
 * Real-time fraud detection and monitoring dashboard with risk assessment,
 * suspicious activity alerts, and automated prevention measures.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface FraudAlert {
  id: string;
  type: 'velocity' | 'device' | 'location' | 'behavior' | 'blacklist' | 'chargeback';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userEmail: string;
  description: string;
  riskScore: number;
  detectedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  metadata: {
    ipAddress?: string;
    deviceFingerprint?: string;
    location?: string;
    transactionAmount?: number;
    paymentMethod?: string;
  };
}

export interface FraudMetrics {
  totalTransactions: number;
  flaggedTransactions: number;
  fraudRate: number;
  falsePositiveRate: number;
  blockedAmount: number;
  savedAmount: number;
  averageRiskScore: number;
  topRiskFactors: Array<{
    factor: string;
    count: number;
    percentage: number;
  }>;
}

export interface FraudMonitoringProps {
  className?: string;
  onAlertAction?: (alertId: string, action: 'investigate' | 'resolve' | 'false_positive') => void;
}

/**
 * Risk Score Indicator
 */
const RiskScoreIndicator: React.FC<{
  score: number;
  size?: 'sm' | 'md' | 'lg';
}> = ({ score, size = 'md' }) => {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'critical', color: 'text-red-600 bg-red-100' };
    if (score >= 60) return { level: 'high', color: 'text-orange-600 bg-orange-100' };
    if (score >= 40) return { level: 'medium', color: 'text-yellow-600 bg-yellow-100' };
    return { level: 'low', color: 'text-green-600 bg-green-100' };
  };

  const risk = getRiskLevel(score);
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-bold border-2",
      risk.color,
      sizeClasses[size]
    )}>
      {score}
    </div>
  );
};

/**
 * Fraud Alert Card
 */
const FraudAlertCard: React.FC<{
  alert: FraudAlert;
  onAction: (action: 'investigate' | 'resolve' | 'false_positive') => void;
}> = ({ alert, onAction }) => {
  const getSeverityColor = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
    }
  };

  const getTypeIcon = (type: FraudAlert['type']) => {
    switch (type) {
      case 'velocity': return <TrendingUp className="w-4 h-4" />;
      case 'device': return <Shield className="w-4 h-4" />;
      case 'location': return <Eye className="w-4 h-4" />;
      case 'behavior': return <Users className="w-4 h-4" />;
      case 'blacklist': return <AlertTriangle className="w-4 h-4" />;
      case 'chargeback': return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: FraudAlert['status']) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'false_positive': return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("border-2", getSeverityColor(alert.severity))}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getTypeIcon(alert.type)}
                <span className="font-medium text-neutral-900 capitalize">
                  {alert.type.replace('_', ' ')} Alert
                </span>
              </div>
              <Badge className={cn("text-xs", getStatusColor(alert.status))}>
                {alert.status.replace('_', ' ')}
              </Badge>
            </div>
            <RiskScoreIndicator score={alert.riskScore} size="sm" />
          </div>

          <p className="text-sm text-neutral-700 mb-3">{alert.description}</p>

          <div className="grid grid-cols-2 gap-4 text-xs text-neutral-600 mb-4">
            <div>
              <span className="font-medium">User:</span> {alert.userEmail}
            </div>
            <div>
              <span className="font-medium">Detected:</span> {alert.detectedAt.toLocaleString()}
            </div>
            {alert.metadata.transactionAmount && (
              <div>
                <span className="font-medium">Amount:</span> ${alert.metadata.transactionAmount.toFixed(2)}
              </div>
            )}
            {alert.metadata.location && (
              <div>
                <span className="font-medium">Location:</span> {alert.metadata.location}
              </div>
            )}
          </div>

          {alert.status === 'open' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('investigate')}
                className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                Investigate
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('resolve')}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction('false_positive')}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                False Positive
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Fraud Metrics Overview
 */
const FraudMetricsOverview: React.FC<{
  metrics: FraudMetrics;
}> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Fraud Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {metrics.fraudRate.toFixed(2)}%
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Blocked Amount</p>
              <p className="text-2xl font-bold text-neutral-900">
                ${metrics.blockedAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">False Positive Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {metrics.falsePositiveRate.toFixed(2)}%
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Avg Risk Score</p>
              <p className="text-2xl font-bold text-neutral-900">
                {metrics.averageRiskScore.toFixed(0)}
              </p>
            </div>
            <RiskScoreIndicator score={metrics.averageRiskScore} size="sm" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Top Risk Factors
 */
const TopRiskFactors: React.FC<{
  factors: FraudMetrics['topRiskFactors'];
}> = ({ factors }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Top Risk Factors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {factors.map((factor) => (
            <div key={factor.factor} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900 capitalize">
                  {factor.factor.replace('_', ' ')}
                </span>
                <span className="text-sm text-neutral-600">
                  {factor.count} ({factor.percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={factor.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Fraud Monitoring Component
 */
export const FraudMonitoring: React.FC<FraudMonitoringProps> = ({
  className,
  onAlertAction
}) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'critical'>('all');

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockAlerts: FraudAlert[] = [
      {
        id: '1',
        type: 'velocity',
        severity: 'high',
        userId: 'user1',
        userEmail: 'user@example.com',
        description: 'Multiple high-value transactions in short time period',
        riskScore: 85,
        detectedAt: new Date(),
        status: 'open',
        metadata: {
          transactionAmount: 5000,
          location: 'New York, NY'
        }
      }
    ];

    const mockMetrics: FraudMetrics = {
      totalTransactions: 10000,
      flaggedTransactions: 150,
      fraudRate: 1.5,
      falsePositiveRate: 0.3,
      blockedAmount: 75000,
      savedAmount: 250000,
      averageRiskScore: 25,
      topRiskFactors: [
        { factor: 'velocity_check', count: 45, percentage: 30 },
        { factor: 'device_fingerprint', count: 38, percentage: 25.3 },
        { factor: 'geolocation', count: 32, percentage: 21.3 },
        { factor: 'behavior_analysis', count: 25, percentage: 16.7 },
        { factor: 'blacklist_check', count: 10, percentage: 6.7 }
      ]
    };

    setAlerts(mockAlerts);
    setMetrics(mockMetrics);
    setIsLoading(false);
  }, []);

  const handleAlertAction = (alertId: string, action: 'investigate' | 'resolve' | 'false_positive') => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: action === 'investigate' ? 'investigating' : action === 'resolve' ? 'resolved' : 'false_positive' }
        : alert
    ));
    
    onAlertAction?.(alertId, action);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'open') return alert.status === 'open';
    if (filter === 'critical') return alert.severity === 'critical';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn("fraud-monitoring space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 font-heading">
            Fraud Monitoring
          </h2>
          <p className="text-neutral-600 font-body">
            Real-time fraud detection and prevention dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            aria-label="Filter fraud alerts by status"
          >
            <option value="all">All Alerts</option>
            <option value="open">Open Alerts</option>
            <option value="critical">Critical Alerts</option>
          </select>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && <FraudMetricsOverview metrics={metrics} />}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            Recent Alerts ({filteredAlerts.length})
          </h3>
          
          {filteredAlerts.length > 0 ? (
            <div className="space-y-4">
              {filteredAlerts.map(alert => (
                <FraudAlertCard
                  key={alert.id}
                  alert={alert}
                  onAction={(action) => handleAlertAction(alert.id, action)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-medium text-neutral-900 mb-2">No Alerts</h3>
                <p className="text-neutral-600">All systems are running smoothly</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Risk Factors */}
        <div>
          {metrics && <TopRiskFactors factors={metrics.topRiskFactors} />}
        </div>
      </div>
    </div>
  );
};

export default FraudMonitoring;
