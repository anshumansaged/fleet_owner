'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  Activity,
  RefreshCw,
  Calculator,
  Target,
  PieChart,
  BarChart3,
  Wallet,
  Eye,
  EyeOff
} from 'lucide-react';

interface OwnerMetrics {
  // Financial Overview
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  
  // Cash Flow
  totalCashInHand: number;
  cashierBalance: number;
  totalCashFlow: number;
  pendingCollections: number;
  
  // Driver Management
  totalPendingSalaries: number;
  totalDrivers: number;
  activeDrivers: number;
  totalTripsToday: number;
  
  // Operational Metrics
  totalFuelCosts: number;
  totalCommissions: number;
  averageRevenuePerTrip: number;
  fuelCostRatio: number;
  
  // Performance Indicators
  topPerformingDriver: string;
  mostProfitablePlatform: string;
  dailyTarget: number;
  targetAchievement: number;
  
  // Platform Breakdown
  platformRevenue: {
    uber: number;
    indrive: number;
    yatri: number;
    rapido: number;
    offline: number;
  };
  
  // Driver Details
  driverSummaries: Array<{
    _id: string;
    name: string;
    totalEarnings: number;
    pendingSalary: number;
    totalTrips: number;
    efficiency: number;
    lastTripDate: string;
    status: 'active' | 'inactive' | 'alert';
  }>;
  
  // Risk Assessment
  riskFactors: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    amount?: number;
    action: string;
  }>;
  
  // Recent Activity
  recentTransactions: Array<{
    type: 'trip' | 'salary' | 'expense' | 'collection';
    amount: number;
    description: string;
    timestamp: string;
    driver?: string;
  }>;
}

export default function OwnerDashboard() {
  const [metrics, setMetrics] = useState<OwnerMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  const fetchOwnerMetrics = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/owner-dashboard?period=${selectedPeriod}`);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching owner metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchOwnerMetrics();
  }, [fetchOwnerMetrics]);

  const formatCurrency = (amount: number) => 
    showSensitiveData 
      ? `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` 
      : '₹****';

  const formatNumber = (value: number) => value.toLocaleString('en-IN');
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-4">Unable to load owner dashboard data.</p>
            <Button onClick={fetchOwnerMetrics} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                Owner Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Complete business overview and control center</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex bg-white rounded-xl border shadow-sm">
              {(['today', 'week', 'month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    selectedPeriod === period
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {period === 'today' ? 'Today' : period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'All Time'}
                </button>
              ))}
            </div>
            
            {/* Data Visibility Toggle */}
            <Button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              variant="outline"
              className="border-gray-300"
            >
              {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSensitiveData ? 'Hide' : 'Show'} Values
            </Button>
            
            <Button
              onClick={fetchOwnerMetrics}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {refreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="text-xs text-green-600 mt-1">
                Avg per trip: {formatCurrency(metrics.averageRevenuePerTrip)}
              </div>
            </CardContent>
          </Card>

          {/* Net Profit */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Net Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.netProfit)}</div>
              <div className="text-xs text-blue-600 mt-1">
                Margin: {formatPercentage(metrics.profitMargin)}
              </div>
            </CardContent>
          </Card>

          {/* Pending Salaries */}
          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Salaries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{formatCurrency(metrics.totalPendingSalaries)}</div>
              <div className="text-xs text-orange-600 mt-1">
                Requires immediate attention
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow */}
          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Total Cash Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{formatCurrency(metrics.totalCashFlow)}</div>
              <div className="text-xs text-purple-600 mt-1">
                In hand + Cashier balance
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Alerts */}
        {metrics.riskFactors.length > 0 && (
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Action Items ({metrics.riskFactors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border shadow-sm">
                    <div className={`w-3 h-3 rounded-full mt-1 ${
                      risk.severity === 'high' ? 'bg-red-500' : 
                      risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{risk.message}</div>
                      <div className="text-xs text-gray-600 mt-1">{risk.action}</div>
                      {risk.amount && (
                        <div className="text-xs font-medium text-red-600 mt-1">
                          Amount: {formatCurrency(risk.amount)}
                        </div>
                      )}
                    </div>
                    <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                      {risk.severity.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Driver Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.driverSummaries.slice(0, 4).map((driver) => (
                  <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        driver.status === 'active' ? 'bg-green-500' :
                        driver.status === 'alert' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium text-sm">{driver.name}</div>
                        <div className="text-xs text-gray-600">
                          {driver.totalTrips} trips • {formatPercentage(driver.efficiency)} efficiency
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-green-600">{formatCurrency(driver.totalEarnings)}</div>
                      {driver.pendingSalary > 0 && (
                        <div className="text-xs text-orange-600">
                          Pending: {formatCurrency(driver.pendingSalary)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Revenue Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Platform Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.platformRevenue)
                  .sort(([,a], [,b]) => b - a)
                  .map(([platform, amount]) => {
                    const percentage = metrics.totalRevenue > 0 ? (amount / metrics.totalRevenue) * 100 : 0;
                    return (
                      <div key={platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            platform === 'uber' ? 'bg-yellow-500' :
                            platform === 'indrive' ? 'bg-blue-500' :
                            platform === 'yatri' ? 'bg-green-500' :
                            platform === 'rapido' ? 'bg-orange-500' : 'bg-gray-500'
                          }`} />
                          <span className="font-medium capitalize text-sm">{platform}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm">{formatCurrency(amount)}</div>
                          <div className="text-xs text-gray-600">{formatPercentage(percentage)}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Daily Target Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Target Achievement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPercentage(metrics.targetAchievement)}
                  </div>
                  <div className="text-sm text-gray-600">of daily target achieved</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target:</span>
                    <span className="font-medium">{formatCurrency(metrics.dailyTarget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Achieved:</span>
                    <span className="font-medium">{formatCurrency(metrics.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining:</span>
                    <span className="font-medium">{formatCurrency(Math.max(0, metrics.dailyTarget - metrics.totalRevenue))}</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, metrics.targetAchievement)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operational Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-600" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-700">{formatCurrency(metrics.totalRevenue)}</div>
                    <div className="text-xs text-green-600">Total Revenue</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-700">{formatCurrency(metrics.totalExpenses)}</div>
                    <div className="text-xs text-red-600">Total Expenses</div>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Fuel Costs:</span>
                    <span className="font-medium">{formatCurrency(metrics.totalFuelCosts)} ({formatPercentage(metrics.fuelCostRatio)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Commissions:</span>
                    <span className="font-medium">{formatCurrency(metrics.totalCommissions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Salaries:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(metrics.totalPendingSalaries)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-bold">Net Profit:</span>
                    <span className={`font-bold ${metrics.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(metrics.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {metrics.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.type === 'trip' ? 'bg-green-500' :
                      transaction.type === 'salary' ? 'bg-blue-500' :
                      transaction.type === 'expense' ? 'bg-red-500' : 'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{transaction.description}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(transaction.timestamp).toLocaleString('en-IN')}
                        {transaction.driver && ` • ${transaction.driver}`}
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${
                      transaction.type === 'trip' || transaction.type === 'collection' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'trip' || transaction.type === 'collection' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Insights */}
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Business Health Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Performance Indicators</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Active Drivers:</span>
                    <span className="font-medium">{metrics.activeDrivers}/{metrics.totalDrivers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Today&apos;s Trips:</span>
                    <span className="font-medium">{formatNumber(metrics.totalTripsToday)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Top Performer:</span>
                    <span className="font-medium">{metrics.topPerformingDriver}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Best Platform:</span>
                    <span className="font-medium capitalize">{metrics.mostProfitablePlatform}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Cash Management</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cash in Hand:</span>
                    <span className="font-medium">{formatCurrency(metrics.totalCashInHand)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier Balance:</span>
                    <span className="font-medium">{formatCurrency(metrics.cashierBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Collections:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(metrics.pendingCollections)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Liquidity:</span>
                    <span className="font-medium text-green-600">{formatCurrency(metrics.totalCashFlow)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Efficiency Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className={`font-medium ${metrics.profitMargin > 20 ? 'text-green-600' : metrics.profitMargin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatPercentage(metrics.profitMargin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Cost Ratio:</span>
                    <span className={`font-medium ${metrics.fuelCostRatio < 20 ? 'text-green-600' : metrics.fuelCostRatio < 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatPercentage(metrics.fuelCostRatio)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue/Trip:</span>
                    <span className="font-medium">{formatCurrency(metrics.averageRevenuePerTrip)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Business Health:</span>
                    <span className={`font-medium ${
                      metrics.profitMargin > 15 && metrics.fuelCostRatio < 25 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {metrics.profitMargin > 15 && metrics.fuelCostRatio < 25 ? 'Excellent' : 'Good'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
