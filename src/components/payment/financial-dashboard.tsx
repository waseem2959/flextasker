/**
 * Financial Dashboard Component
 * 
 * Comprehensive financial analytics dashboard with revenue tracking, payment analytics,
 * tax management, and performance metrics for marketplace participants.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  RevenueAnalytics,
  financialManagementService
} from '@/services/payment/financial-management-service';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  PieChart,
  TrendingUp,
  Wallet
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface FinancialDashboardProps {
  userId: string;
  userRole: 'client' | 'tasker' | 'admin';
  period?: 'week' | 'month' | 'quarter' | 'year';
  className?: string;
}

interface DashboardData {
  totalEarnings: number;
  pendingEarnings: number;
  completedTasks: number;
  averageTaskValue: number;
  topCategories: Array<{ category: string; earnings: number }>;
  recentTransactions: Array<{
    id: string;
    taskTitle: string;
    amount: number;
    date: Date;
    status: string;
  }>;
  upcomingPayouts: Array<{
    amount: number;
    date: Date;
    method: string;
  }>;
}

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  format?: 'currency' | 'number' | 'percentage';
}> = ({ title, value, change, changeLabel, icon: Icon, color = 'primary', format = 'number' }) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-neutral-600';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-neutral-900 font-heading">
              {formatValue(value)}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {change > 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-600" />
                ) : change < 0 ? (
                  <ArrowDown className="w-4 h-4 text-red-600" />
                ) : null}
                <span className={cn("text-sm font-medium", getChangeColor(change))}>
                  {Math.abs(change).toFixed(1)}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-neutral-500">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            color === 'primary' && "bg-primary-100 text-primary-600",
            color === 'green' && "bg-green-100 text-green-600",
            color === 'blue' && "bg-blue-100 text-blue-600",
            color === 'orange' && "bg-orange-100 text-orange-600"
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Revenue Chart Component (Placeholder for actual chart library)
 */
const RevenueChart: React.FC<{
  data: Array<{ date: Date; revenue: number; transactions: number }>;
  period: string;
}> = ({ data, period }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Revenue Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
          <div className="text-center">
            <PieChart className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
            <p className="text-neutral-600">Chart visualization would be implemented here</p>
            <p className="text-sm text-neutral-500">
              Showing {data.length} data points for {period}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Recent Transactions Component
 */
const RecentTransactions: React.FC<{
  transactions: DashboardData['recentTransactions'];
}> = ({ transactions }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-neutral-900 truncate">
                  {transaction.taskTitle}
                </p>
                <p className="text-sm text-neutral-600">
                  {transaction.date.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-neutral-900">
                  ${transaction.amount.toFixed(2)}
                </p>
                <Badge className={cn("text-xs", getStatusColor(transaction.status))}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
              <p>No recent transactions</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Top Categories Component
 */
const TopCategories: React.FC<{
  categories: DashboardData['topCategories'];
  totalEarnings: number;
}> = ({ categories, totalEarnings }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Top Categories
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categories.map((category) => {
            const percentage = totalEarnings > 0 ? (category.earnings / totalEarnings) * 100 : 0;
            
            return (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">{category.category}</span>
                  <span className="text-sm text-neutral-600">
                    ${category.earnings.toFixed(2)} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-neutral-500">
              <PieChart className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
              <p>No category data available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Financial Dashboard Component
 */
export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  userId,
  period = 'month',
  className
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [revenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await financialManagementService.getFinancialDashboard(userId, selectedPeriod);
        if (response.success && response.data) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [userId, selectedPeriod]);

  // Handle export
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const response = await financialManagementService.exportFinancialData(
        userId,
        startDate,
        endDate,
        format
      );
      
      if (response.success && response.data) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className={cn("financial-dashboard space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 font-heading">
            Financial Dashboard
          </h2>
          <p className="text-neutral-600 font-body">
            Track your earnings, payments, and financial performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            aria-label="Select time period for financial data"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Earnings"
          value={dashboardData.totalEarnings}
          format="currency"
          icon={DollarSign}
          color="primary"
        />
        <MetricCard
          title="Pending Earnings"
          value={dashboardData.pendingEarnings}
          format="currency"
          icon={Wallet}
          color="orange"
        />
        <MetricCard
          title="Completed Tasks"
          value={dashboardData.completedTasks}
          icon={FileText}
          color="green"
        />
        <MetricCard
          title="Average Task Value"
          value={dashboardData.averageTaskValue}
          format="currency"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart
          data={revenueAnalytics?.dailyRevenue || []}
          period={selectedPeriod}
        />
        <TopCategories
          categories={dashboardData.topCategories}
          totalEarnings={dashboardData.totalEarnings}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions transactions={dashboardData.recentTransactions} />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.upcomingPayouts.map((payout, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">
                      ${payout.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-neutral-600">{payout.method}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-600">
                      {payout.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {dashboardData.upcomingPayouts.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                  <p>No upcoming payouts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDashboard;
