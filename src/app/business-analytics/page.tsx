'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  RefreshCw,
  Lock
} from 'lucide-react';

interface DriverAnalytics {
  _id: string;
  name: string;
  commissionPercentage: number;
  totalTrips: number;
  totalEarnings: number;
  totalExpenses: number;
  totalFuelCost: number;
  totalOnlinePayments: number;
  totalCashCollected: number;
  totalSalaryEarned: number;
  totalSalaryPaid: number;
  pendingSalary: number;
  averageEarningsPerTrip: number;
  platformBreakdown: {
    uber: number;
    indrive: number;
    yatri: number;
    rapido: number;
    offline: number;
  };
  efficiencyScore: number;
  profitability: number;
}

interface BusinessMetrics {
  totalRevenue: number;
  totalExpenses: number;
  totalFuelCosts: number;
  totalPendingSalaries: number;
  totalOnlinePayments: number;
  totalCashCollected: number;
  totalActiveDrivers: number;
  totalTrips: number;
  averageRevenuePerTrip: number;
  profitMargin: number;
  cashFlowStatus: number;
  cashBalance: number;
  platformDistribution: {
    uber: number;
    indrive: number;
    yatri: number;
    rapido: number;
    offline: number;
  };
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  driverAnalytics: DriverAnalytics[];
  topPerformers: DriverAnalytics[];
  riskFactors: Array<{
    type: 'high_pending_salary' | 'low_profitability' | 'high_fuel_cost' | 'inactive_driver' | 'high_online_payment';
    driver?: string;
    amount?: number;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
}

export default function BusinessAnalyticsPage() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'uber1234') {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPassword('');
    }
  };

  const fetchAnalytics = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setRefreshing(true);
      const response = await fetch(`/api/business-analytics?period=${selectedPeriod}`);
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod, isAuthenticated]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Card className="backdrop-blur-sm bg-white/10 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-white mb-2">Owner Dashboard</CardTitle>
              <p className="text-slate-300">Enter password to access business analytics</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border ${authError ? 'border-red-400' : 'border-white/20'} text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200`}
                    autoFocus
                  />
                  {authError && (
                    <p className="text-red-400 text-sm mt-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Incorrect password. Please try again.
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Access Dashboard
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <p className="text-gray-600 mb-4">Unable to load business analytics data.</p>
            <Button onClick={fetchAnalytics} className="bg-blue-600 hover:bg-blue-700">
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
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
              Business Analytics
            </h1>
            <p className="text-gray-600 mt-2">Owner Dashboard - Fleet Performance & Profitability Analysis</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex bg-white rounded-xl border shadow-sm">
              {(['7d', '30d', '90d', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    selectedPeriod === period
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : 'All Time'}
                </button>
              ))}
            </div>
            
            <Button
              onClick={fetchAnalytics}
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

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
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

          {/* Online Payments */}
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-cyan-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Online Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-900">{formatCurrency(metrics.totalOnlinePayments)}</div>
              <div className="text-xs text-cyan-600 mt-1">
                {formatPercentage((metrics.totalOnlinePayments / metrics.totalRevenue) * 100)} of revenue
              </div>
            </CardContent>
          </Card>

          {/* Cash Collected */}
          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-teal-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cash Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-900">{formatCurrency(metrics.totalCashCollected)}</div>
              <div className="text-xs text-teal-600 mt-1">
                {formatPercentage((metrics.totalCashCollected / metrics.totalRevenue) * 100)} of revenue
              </div>
            </CardContent>
          </Card>

          {/* Profit Margin */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Profit Margin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatPercentage(metrics.profitMargin)}</div>
              <div className="text-xs text-blue-600 mt-1">
                Net Profit: {formatCurrency(metrics.totalRevenue - metrics.totalExpenses)}
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

          {/* Cash Balance */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Cash Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">{formatCurrency(metrics.cashBalance)}</div>
              <div className="text-xs text-indigo-600 mt-1">
                Available liquidity
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Factors Alert */}
        {metrics.riskFactors.length > 0 && (
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Factors & Action Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      risk.severity === 'high' ? 'bg-red-500' : 
                      risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{risk.message}</div>
                      {risk.driver && (
                        <div className="text-xs text-gray-600 mt-1">Driver: {risk.driver}</div>
                      )}
                      {risk.amount && (
                        <div className="text-xs text-gray-600 mt-1">Amount: {formatCurrency(risk.amount)}</div>
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

        {/* Driver Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Top Performing Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topPerformers.slice(0, 3).map((driver, index) => (
                  <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-sm text-gray-600">
                          {driver.totalTrips} trips • {formatPercentage(driver.efficiencyScore)} efficiency
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatCurrency(driver.totalEarnings)}</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(driver.averageEarningsPerTrip)}/trip
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Platform Revenue Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.platformDistribution)
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
                          <span className="font-medium capitalize">{platform}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(amount)}</div>
                          <div className="text-sm text-gray-600">{formatPercentage(percentage)}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash vs Online Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                Payment Method Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">Online Payments</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{formatCurrency(metrics.totalOnlinePayments)}</div>
                    <div className="text-sm text-gray-600">
                      {formatPercentage((metrics.totalOnlinePayments / (metrics.totalOnlinePayments + metrics.totalCashCollected)) * 100)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium">Cash Collected</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">{formatCurrency(metrics.totalCashCollected)}</div>
                    <div className="text-sm text-gray-600">
                      {formatPercentage((metrics.totalCashCollected / (metrics.totalOnlinePayments + metrics.totalCashCollected)) * 100)}
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Payments</span>
                    <span className="font-bold">{formatCurrency(metrics.totalOnlinePayments + metrics.totalCashCollected)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Drivers with High Online Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                High Online Payment Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.driverAnalytics
                  .filter(driver => driver.totalOnlinePayments > 0)
                  .sort((a, b) => b.totalOnlinePayments - a.totalOnlinePayments)
                  .slice(0, 4)
                  .map((driver) => (
                    <div key={driver._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-sm text-gray-600">
                          {formatPercentage((driver.totalOnlinePayments / driver.totalEarnings) * 100)} of earnings online
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{formatCurrency(driver.totalOnlinePayments)}</div>
                        <div className="text-xs text-gray-500">
                          {driver.totalOnlinePayments > 5000 && (
                            <span className="text-orange-600 font-medium">⚠ Transfer needed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {metrics.driverAnalytics.filter(driver => driver.totalOnlinePayments > 0).length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>No online payments recorded</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Driver Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Detailed Driver Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2">Driver</th>
                    <th className="text-right py-3 px-2">Trips</th>
                    <th className="text-right py-3 px-2">Total Earnings</th>
                    <th className="text-right py-3 px-2">Online Payments</th>
                    <th className="text-right py-3 px-2">Cash Collected</th>
                    <th className="text-right py-3 px-2">Fuel Costs</th>
                    <th className="text-right py-3 px-2">Pending Salary</th>
                    <th className="text-center py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.driverAnalytics.map((driver) => (
                    <tr key={driver._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-xs text-gray-600">{driver.commissionPercentage}% commission</div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-medium">{driver.totalTrips}</td>
                      <td className="text-right py-3 px-2 font-bold text-green-600">
                        {formatCurrency(driver.totalEarnings)}
                      </td>
                      <td className="text-right py-3 px-2 font-bold text-blue-600">
                        {formatCurrency(driver.totalOnlinePayments)}
                      </td>
                      <td className="text-right py-3 px-2 font-bold text-emerald-600">
                        {formatCurrency(driver.totalCashCollected)}
                      </td>
                      <td className="text-right py-3 px-2 text-red-600">
                        {formatCurrency(driver.totalFuelCost)}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={`font-medium ${driver.pendingSalary > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(driver.pendingSalary)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        {driver.pendingSalary > 5000 ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500 mx-auto" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Insights */}
        <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Business Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Financial Health</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Cash Flow Status:</span>
                    <span className={`font-medium ${metrics.cashFlowStatus > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics.cashFlowStatus > 0 ? 'Positive' : 'Negative'} ({formatCurrency(Math.abs(metrics.cashFlowStatus))})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Cost Ratio:</span>
                    <span className="font-medium">
                      {formatPercentage((metrics.totalFuelCosts / metrics.totalRevenue) * 100)} of revenue
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salary Payout Ratio:</span>
                    <span className="font-medium">
                      {formatPercentage((metrics.totalPendingSalaries / metrics.totalRevenue) * 100)} pending
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Operational Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Fleet Utilization:</span>
                    <span className="font-medium">
                      {(metrics.totalTrips / (metrics.totalActiveDrivers * 30)).toFixed(1)} trips/driver/month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Most Profitable Platform:</span>
                    <span className="font-medium capitalize">
                      {Object.entries(metrics.platformDistribution)
                        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Trip Value:</span>
                    <span className="font-medium">{formatCurrency(metrics.averageRevenuePerTrip)}</span>
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
