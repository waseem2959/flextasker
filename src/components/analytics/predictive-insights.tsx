/**
 * Predictive Insights Component
 * 
 * AI-powered predictive analytics dashboard with machine learning insights,
 * forecasting, churn prediction, and business recommendations.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  ArrowRight,
  ChevronRight,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { 
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';
import { useAnalytics } from '../../hooks/use-analytics';

interface PredictiveModel {
  id: string;
  name: string;
  type: 'churn_prediction' | 'ltv_prediction' | 'task_success_rate' | 'demand_forecasting';
  accuracy: number;
  confidence: number;
  lastTrained: string;
  version: string;
  status: 'active' | 'training' | 'needs_update';
}

interface Prediction {
  id: string;
  modelType: string;
  prediction: {
    value: number;
    confidence: number;
    probability?: number;
    category?: string;
  };
  features: Record<string, any>;
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

interface Forecast {
  period: string;
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
}

interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'optimization' | 'trend';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    metric: string;
    value: number;
    timeframe: string;
  };
  confidence: number;
  recommendations: string[];
  relatedMetrics: string[];
}

interface PredictiveInsightsProps {
  timeHorizon?: 'week' | 'month' | 'quarter' | 'year';
  models?: string[];
  autoRefresh?: boolean;
  className?: string;
}

const MODEL_TYPES = [
  { 
    value: 'churn_prediction', 
    label: 'Churn Prediction',
    description: 'Predict user churn probability',
    icon: Users
  },
  { 
    value: 'ltv_prediction', 
    label: 'Lifetime Value',
    description: 'Predict customer lifetime value',
    icon: DollarSign
  },
  { 
    value: 'task_success_rate', 
    label: 'Task Success',
    description: 'Predict task completion probability',
    icon: Target
  },
  { 
    value: 'demand_forecasting', 
    label: 'Demand Forecasting',
    description: 'Forecast future demand patterns',
    icon: TrendingUp
  }
];

const INSIGHT_TYPES = {
  opportunity: { color: 'bg-green-100 text-green-800 border-green-200', icon: Lightbulb },
  risk: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  optimization: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Settings },
  trend: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: TrendingUp }
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

const PredictiveInsights: React.FC<PredictiveInsightsProps> = ({
  timeHorizon = 'month',
  models = ['churn_prediction', 'ltv_prediction', 'demand_forecasting'],
  autoRefresh = true,
  className = ''
}) => {
  // State
  const [selectedModel, setSelectedModel] = useState<string>(models[0]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [modelPerformance, setModelPerformance] = useState<PredictiveModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState(timeHorizon);

  // Analytics hook
  const { executeQuery, trackEvent } = useAnalytics({
    timeRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    },
    metrics: ['predictions', 'forecasts'],
    realTime: false
  });

  // Load predictive data
  const loadPredictiveData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Load predictions for selected model
      await executeQuery({
        metrics: ['predictions'],
        filters: [
          { field: 'model_type', operator: 'eq', value: selectedModel },
          { field: 'time_horizon', operator: 'eq', value: selectedTimeHorizon }
        ],
        timeRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          to: new Date()
        }
      });

      // Load forecasts
      await executeQuery({
        metrics: ['forecasts'],
        filters: [
          { field: 'model_type', operator: 'eq', value: selectedModel },
          { field: 'horizon', operator: 'eq', value: selectedTimeHorizon }
        ],
        timeRange: {
          from: new Date(),
          to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Next 90 days
        }
      });

      // Mock data for demonstration
      setPredictions([
        {
          id: '1',
          modelType: selectedModel,
          prediction: {
            value: 0.23,
            confidence: 0.87,
            probability: 23,
            category: 'high_risk'
          },
          features: {
            days_since_last_login: 14,
            total_tasks_completed: 3,
            avg_task_rating: 4.2,
            account_age_days: 120
          },
          insights: [
            'User shows declining engagement patterns',
            'Below average task completion rate',
            'Recent login frequency has decreased significantly'
          ],
          recommendations: [
            'Send personalized re-engagement email',
            'Offer special discount on next task',
            'Provide productivity tips and tutorials'
          ],
          createdAt: new Date().toISOString()
        }
      ]);

      setForecasts([
        {
          period: '2024-02',
          predicted_value: 15420,
          confidence_interval: { lower: 14200, upper: 16800 },
          factors: [
            { name: 'Seasonal trend', impact: 0.15, direction: 'positive' },
            { name: 'Marketing campaign', impact: 0.08, direction: 'positive' },
            { name: 'Economic factors', impact: -0.03, direction: 'negative' }
          ]
        },
        {
          period: '2024-03',
          predicted_value: 16850,
          confidence_interval: { lower: 15500, upper: 18300 },
          factors: [
            { name: 'Platform improvements', impact: 0.12, direction: 'positive' },
            { name: 'User growth', impact: 0.18, direction: 'positive' },
            { name: 'Competition', impact: -0.05, direction: 'negative' }
          ]
        }
      ]);

      setInsights([
        {
          id: '1',
          type: 'opportunity',
          priority: 'high',
          title: 'Revenue Growth Opportunity',
          description: 'Machine learning models predict a 25% increase in high-value tasks if we improve the task matching algorithm',
          impact: {
            metric: 'Monthly Revenue',
            value: 25000,
            timeframe: 'Next Quarter'
          },
          confidence: 0.82,
          recommendations: [
            'Implement AI-powered task matching',
            'Optimize skill-based recommendations',
            'A/B test new matching algorithm'
          ],
          relatedMetrics: ['conversion_rate', 'average_task_value', 'user_engagement']
        },
        {
          id: '2',
          type: 'risk',
          priority: 'critical',
          title: 'User Churn Risk',
          description: 'Predictive models identify 15% of premium users at high risk of churning within 30 days',
          impact: {
            metric: 'Monthly Recurring Revenue',
            value: -18000,
            timeframe: 'Next Month'
          },
          confidence: 0.91,
          recommendations: [
            'Launch targeted retention campaign',
            'Provide personalized onboarding support',
            'Offer loyalty rewards program'
          ],
          relatedMetrics: ['churn_rate', 'user_engagement', 'support_tickets']
        }
      ]);

      setModelPerformance([
        {
          id: 'churn_model_v2',
          name: 'Churn Prediction Model',
          type: 'churn_prediction',
          accuracy: 0.87,
          confidence: 0.82,
          lastTrained: '2024-01-15',
          version: 'v2.1',
          status: 'active'
        },
        {
          id: 'ltv_model_v1',
          name: 'Customer LTV Model',
          type: 'ltv_prediction',
          accuracy: 0.79,
          confidence: 0.74,
          lastTrained: '2024-01-10',
          version: 'v1.3',
          status: 'needs_update'
        }
      ]);

      // Track analytics event
      await trackEvent('predictive_analytics', 'data_loaded', {
        model: selectedModel,
        timeHorizon: selectedTimeHorizon
      });

    } catch (error) {
      console.error('Failed to load predictive data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel, selectedTimeHorizon, executeQuery, trackEvent]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadPredictiveData();
  }, [loadPredictiveData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadPredictiveData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, loadPredictiveData]);

  // Format confidence score
  const formatConfidence = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    let color = 'text-red-600';
    if (percentage >= 80) color = 'text-green-600';
    else if (percentage >= 60) color = 'text-yellow-600';
    
    return { percentage, color };
  };

  // Prediction Card Component
  const PredictionCard: React.FC<{ prediction: Prediction }> = ({ prediction }) => {
    const confidence = formatConfidence(prediction.prediction.confidence);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {MODEL_TYPES.find(m => m.value === prediction.modelType)?.label}
            </CardTitle>
            <Badge variant="outline" className={confidence.color}>
              {confidence.percentage}% confident
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Prediction Value */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">
                {prediction.modelType === 'churn_prediction' && 
                  `${Math.round(prediction.prediction.probability || 0)}%`
                }
                {prediction.modelType === 'ltv_prediction' && 
                  `$${prediction.prediction.value.toFixed(0)}`
                }
                {prediction.modelType === 'task_success_rate' && 
                  `${Math.round(prediction.prediction.value * 100)}%`
                }
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Predicted {prediction.modelType.replace('_', ' ')}
              </div>
            </div>

            {/* Key Factors */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Factors</h4>
              <div className="space-y-2">
                {Object.entries(prediction.features).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Insights</h4>
              <ul className="space-y-1">
                {prediction.insights.slice(0, 2).map((insight, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <div className="space-y-2">
                {prediction.recommendations.slice(0, 2).map((rec, index) => (
                  <Button key={index} variant="outline" size="sm" className="w-full justify-start">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {rec}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Forecast Chart Component
  const ForecastChart: React.FC = () => (
    <Card>
      <CardHeader>
        <CardTitle>Demand Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecasts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="predicted_value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="confidence_interval.upper"
              stroke="#82ca9d"
              fill="none"
              strokeDasharray="5 5"
            />
            <Area
              type="monotone"
              dataKey="confidence_interval.lower"
              stroke="#82ca9d"
              fill="none"
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  // Business Insight Component
  const BusinessInsightCard: React.FC<{ insight: BusinessInsight }> = ({ insight }) => {
    const typeConfig = INSIGHT_TYPES[insight.type];
    const Icon = typeConfig.icon;
    
    return (
      <Card className={`border-l-4 ${typeConfig.color}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="w-5 h-5" />
              <CardTitle className="text-lg">{insight.title}</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={PRIORITY_COLORS[insight.priority]}>
                {insight.priority}
              </Badge>
              <Badge variant="outline">
                {Math.round(insight.confidence * 100)}% confident
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700">{insight.description}</p>
            
            {/* Impact */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">
                  Expected Impact on {insight.impact.metric}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {insight.impact.value > 0 ? '+' : ''}
                  {insight.impact.value.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {insight.impact.timeframe}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Action Items</h4>
              <div className="space-y-2">
                {insight.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Model Performance Component
  const ModelPerformanceCard: React.FC<{ model: PredictiveModel }> = ({ model }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      training: 'bg-yellow-100 text-yellow-800',
      needs_update: 'bg-red-100 text-red-800'
    };

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">{model.name}</h3>
            <Badge className={statusColors[model.status]}>
              {model.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Accuracy</span>
                <span>{Math.round(model.accuracy * 100)}%</span>
              </div>
              <Progress value={model.accuracy * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Confidence</span>
                <span>{Math.round(model.confidence * 100)}%</span>
              </div>
              <Progress value={model.confidence * 100} className="h-2" />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Version {model.version}</span>
              <span>Updated {model.lastTrained}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Predictive Insights</h1>
            <p className="text-gray-600">AI-powered analytics and forecasting</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_TYPES.filter(m => models.includes(m.value)).map(model => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedTimeHorizon} onValueChange={(value) => setSelectedTimeHorizon(value as 'week' | 'month' | 'quarter' | 'year')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">1 Week</SelectItem>
              <SelectItem value="month">1 Month</SelectItem>
              <SelectItem value="quarter">1 Quarter</SelectItem>
              <SelectItem value="year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={loadPredictiveData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {predictions.map(prediction => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </TabsContent>

        {/* Forecasts Tab */}
        <TabsContent value="forecasts">
          <div className="space-y-6">
            <ForecastChart />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map((forecast, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{forecast.period}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {forecast.predicted_value.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Predicted Value</div>
                      </div>
                      
                      <div className="text-center text-sm text-gray-500">
                        Range: {forecast.confidence_interval.lower.toLocaleString()} - {forecast.confidence_interval.upper.toLocaleString()}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Key Factors</h4>
                        <div className="space-y-1">
                          {forecast.factors.slice(0, 3).map((factor, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{factor.name}</span>
                              <div className="flex items-center space-x-1">
                                {factor.direction === 'positive' ? (
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-500" />
                                )}
                                <span>{Math.abs(factor.impact * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Business Insights Tab */}
        <TabsContent value="insights">
          <div className="space-y-6">
            {insights.map(insight => (
              <BusinessInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </TabsContent>

        {/* Model Performance Tab */}
        <TabsContent value="models">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelPerformance.map(model => (
              <ModelPerformanceCard key={model.id} model={model} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveInsights;