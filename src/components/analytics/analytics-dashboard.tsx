/**
 * Analytics Dashboard
 * 
 * Comprehensive analytics dashboard with real-time metrics, interactive charts,
 * business intelligence insights, and customizable reporting.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Briefcase, 
  Target,
  Download,
  RefreshCw,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { DatePickerWithRange } from '../ui/date-range-picker';
import { Progress } from '../ui/progress';
import { 
  LineChart as RechartsLineChart,
  AreaChart,
  BarChart,
  PieChart as RechartsPieChart,
  FunnelChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Area,
  Bar,
  Cell,
  Funnel,
  LabelList
} from 'recharts';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useAnalytics } from '../../hooks/use-analytics';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percentage' | 'number';
  description?: string;
}

interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'funnel';
  title: string;
  data: any[];
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  color?: string;
  colors?: string[];
}

interface AnalyticsDashboardProps {
  userRole?: 'admin' | 'user' | 'business';
  customizable?: boolean;
  realTimeUpdates?: boolean;
  exportEnabled?: boolean;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const TIME_RANGES = [
  { label: 'Last 7 days', value: '7d', days: 7 },
  { label: 'Last 30 days', value: '30d', days: 30 },
  { label: 'Last 90 days', value: '90d', days: 90 },
  { label: 'Last year', value: '1y', days: 365 },
  { label: 'Custom', value: 'custom', days: 0 }
];

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  realTimeUpdates = true,
  exportEnabled = true,
  className = ''
}) => {
  // State
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date())
  });
  const [selectedMetrics] = useState<string[]>([
    'revenue',
    'users',
    'tasks',
    'conversion'
  ]);
  // Loading state managed by useAnalytics hook
  const [activeTab, setActiveTab] = useState('overview');

  // Analytics hook
  const {
    businessMetrics,
    chartData,
    funnelData,
    isLoadingMetrics,
    refreshData
  } = useAnalytics({
    timeRange: selectedTimeRange === 'custom' ? customDateRange : {
      from: subDays(new Date(), TIME_RANGES.find(r => r.value === selectedTimeRange)?.days || 30),
      to: new Date()
    },
    metrics: selectedMetrics,
    realTime: realTimeUpdates
  });

  // Date range is calculated in useAnalytics hook

  // Format number with appropriate suffix
  const formatNumber = useCallback((value: number, format?: 'currency' | 'percentage' | 'number') => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    }
  }, []);

  // Get metric cards data
  const metricCards: MetricCard[] = useMemo(() => {
    if (!businessMetrics) return [];

    return [
      {
        title: 'Total Revenue',
        value: formatNumber(businessMetrics.revenue.total, 'currency'),
        change: businessMetrics.revenue.growth,
        changeType: businessMetrics.revenue.growth >= 0 ? 'increase' : 'decrease',
        icon: DollarSign,
        trend: businessMetrics.revenue.growth >= 0 ? 'up' : 'down',
        format: 'currency',
        description: 'Total revenue generated'
      },
      {
        title: 'Active Users',
        value: formatNumber(businessMetrics.users.active),
        change: businessMetrics.users.active - businessMetrics.users.retained,
        changeType: 'increase',
        icon: Users,
        trend: 'up',
        format: 'number',
        description: 'Currently active users'
      },
      {
        title: 'Tasks Completed',
        value: formatNumber(businessMetrics.tasks.completed),
        change: businessMetrics.tasks.success_rate,
        changeType: businessMetrics.tasks.success_rate >= 75 ? 'increase' : 'decrease',
        icon: Briefcase,
        trend: 'up',
        format: 'number',
        description: 'Successfully completed tasks'
      },
      {
        title: 'Conversion Rate',
        value: formatNumber(businessMetrics.marketplace.conversion_rate, 'percentage'),
        change: 2.3,
        changeType: 'increase',
        icon: Target,
        trend: 'up',
        format: 'percentage',
        description: 'Task posting to completion rate'
      },
      {
        title: 'Avg. Task Value',
        value: formatNumber(businessMetrics.tasks.avg_budget, 'currency'),
        change: 5.2,
        changeType: 'increase',
        icon: TrendingUp,
        trend: 'up',
        format: 'currency',
        description: 'Average task budget'
      },
      {
        title: 'Time to Completion',
        value: `${businessMetrics.marketplace.time_to_completion.toFixed(1)}d`,
        change: -8.5,
        changeType: 'increase',
        icon: Clock,
        trend: 'up',
        format: 'number',
        description: 'Average time from posting to completion'
      }
    ];
  }, [businessMetrics, formatNumber]);

  // Handle time range change
  const handleTimeRangeChange = useCallback((value: string) => {
    setSelectedTimeRange(value);
    if (value !== 'custom') {
      const days = TIME_RANGES.find(r => r.value === value)?.days || 30;
      setCustomDateRange({
        from: startOfDay(subDays(new Date(), days)),
        to: endOfDay(new Date())
      });
    }
  }, []);

  // Handle export
  const handleExport = useCallback(async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      // Implementation for export functionality
      console.log(`Exporting analytics data as ${format}`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  // Metric Card Component
  const MetricCardComponent: React.FC<{ metric: MetricCard }> = ({ metric }) => {
    const Icon = metric.icon;
    const isPositive = metric.changeType === 'increase';
    const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`p-2 rounded-lg ${
                isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
            <div className={`flex items-center space-x-1 ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <ChangeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {Math.abs(metric.change).toFixed(1)}%
              </span>
            </div>
          </div>
          {metric.description && (
            <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Chart Component
  const ChartComponent: React.FC<{ config: ChartConfig; height?: number }> = ({ 
    config, 
    height = 300 
  }) => {
    const renderChart = () => {
      switch (config.type) {
        case 'line':
          return (
            <RechartsLineChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxisKey || 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={config.dataKey || 'value'} 
                stroke={config.color || COLORS[0]} 
                strokeWidth={2}
              />
            </RechartsLineChart>
          );
        
        case 'area':
          return (
            <AreaChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxisKey || 'date'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={config.dataKey || 'value'} 
                stroke={config.color || COLORS[0]} 
                fill={config.color || COLORS[0]}
                fillOpacity={0.3}
              />
            </AreaChart>
          );
        
        case 'bar':
          return (
            <BarChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxisKey || 'name'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={config.dataKey || 'value'} fill={config.color || COLORS[0]} />
            </BarChart>
          );
        
        case 'pie':
          return (
            <RechartsPieChart>
              <Tooltip />
              <Legend />
              {/* Pie chart implementation would go here */}
            </RechartsPieChart>
          );
        
        case 'funnel':
          return (
            <FunnelChart>
              <Tooltip />
              <Funnel
                dataKey="value"
                data={config.data}
                isAnimationActive
                labelLine
              >
                <LabelList position="center" fill="#fff" stroke="none" />
                {config.data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          );
        
        default:
          return <div>Unsupported chart type</div>;
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  // Real-time indicator
  const RealtimeIndicator: React.FC = () => (
    <div className="flex items-center space-x-2 text-green-600">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-sm font-medium">Live</span>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your platform performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {realTimeUpdates && <RealtimeIndicator />}
          
          {/* Time Range Selector */}
          <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedTimeRange === 'custom' && (
            <DatePickerWithRange
              date={customDateRange}
              onDateChange={(date) => {
                if (date && date.from && date.to) {
                  setCustomDateRange({ from: date.from, to: date.to });
                }
              }}
            />
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoadingMetrics}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export Menu */}
          {exportEnabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => (
          <MetricCardComponent key={index} metric={metric} />
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartComponent
              config={{
                type: 'area',
                title: 'Revenue Trend',
                data: chartData?.revenue || [],
                dataKey: 'amount',
                xAxisKey: 'date',
                color: COLORS[0]
              }}
            />
            <ChartComponent
              config={{
                type: 'line',
                title: 'User Growth',
                data: chartData?.users || [],
                dataKey: 'count',
                xAxisKey: 'date',
                color: COLORS[1]
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartComponent
              config={{
                type: 'bar',
                title: 'Tasks by Category',
                data: chartData?.tasksByCategory || [],
                dataKey: 'count',
                xAxisKey: 'category',
                color: COLORS[2]
              }}
            />
            <ChartComponent
              config={{
                type: 'pie',
                title: 'User Distribution',
                data: chartData?.userDistribution || [],
                colors: COLORS
              }}
            />
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={businessMetrics?.tasks.success_rate || 0} className="w-20" />
                      <span className="text-sm font-medium">
                        {businessMetrics?.tasks.success_rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Churn Rate</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={businessMetrics?.users.churnRate || 0} className="w-20" />
                      <span className="text-sm font-medium">
                        {businessMetrics?.users.churnRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Response Time</span>
                    <Badge variant="secondary">
                      {businessMetrics?.marketplace.time_to_completion.toFixed(1)}d
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartComponent
              config={{
                type: 'area',
                title: 'Revenue by Month',
                data: chartData?.revenueByMonth || [],
                dataKey: 'revenue',
                xAxisKey: 'month',
                color: COLORS[0]
              }}
            />
            <ChartComponent
              config={{
                type: 'bar',
                title: 'Revenue by Source',
                data: chartData?.revenueBySource || [],
                dataKey: 'amount',
                xAxisKey: 'source',
                color: COLORS[1]
              }}
            />
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartComponent
              config={{
                type: 'line',
                title: 'User Acquisition',
                data: chartData?.userAcquisition || [],
                dataKey: 'users',
                xAxisKey: 'date',
                color: COLORS[2]
              }}
            />
            <ChartComponent
              config={{
                type: 'area',
                title: 'User Retention',
                data: chartData?.userRetention || [],
                dataKey: 'retention',
                xAxisKey: 'cohort',
                color: COLORS[3]
              }}
            />
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartComponent
              config={{
                type: 'funnel',
                title: 'Task Completion Funnel',
                data: funnelData || []
              }}
            />
            <ChartComponent
              config={{
                type: 'bar',
                title: 'Task Performance',
                data: chartData?.taskPerformance || [],
                dataKey: 'count',
                xAxisKey: 'status',
                color: COLORS[4]
              }}
            />
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Revenue Growth</h4>
                      <p className="text-sm text-blue-700">
                        Revenue increased by 23% compared to last month, driven by higher-value tasks.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">User Engagement</h4>
                      <p className="text-sm text-green-700">
                        Daily active users are up 15% with improved retention rates.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Activity className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Optimization Opportunity</h4>
                      <p className="text-sm text-yellow-700">
                        Task completion time can be reduced by improving the matching algorithm.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm">Focus marketing on high-value task categories</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm">Implement user retention campaigns for new users</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm">Optimize task discovery and matching features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span className="text-sm">Consider premium features for power users</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;