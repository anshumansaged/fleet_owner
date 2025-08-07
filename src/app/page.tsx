'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Copy, MessageCircle } from 'lucide-react';
import { formatCurrency, formatDate, getPlatformColor, copyToClipboard, generateWhatsAppUrl } from '@/lib/utils';

interface Driver {
  driverId: string;
  name: string;
  totalEarnings: number;
  totalSalary: number;
  pendingSalary: number;
  commissionPercentage: number;
  platformBreakdown: {
    uber: number;
    indrive: number;
    yatri: number;
    rapido: number;
    offline: number;
  };
  totalTrips: number;
  recentTrips: Trip[];
  recentPayments: SalaryPayment[];
  whatsappSummary: string;
}

interface Trip {
  _id: string;
  driverId: string;
  driverName: string;
  platform: 'uber' | 'indrive' | 'yatri' | 'rapido' | 'offline' | 'multiple';
  tripAmount: number;
  commissionAmount: number;
  fuelCost: number;
  otherExpenses: number;
  cashCollected: number;
  onlinePayment: number;
  netAmount: number;
  cashInHand: number;
  driverSalary: number;
  notes?: string;
  tripDate: string;
  createdAt: string;
}

interface SalaryPayment {
  _id: string;
  driverId: string;
  driverName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi';
  notes?: string;
  createdAt: string;
}

interface DashboardData {
  drivers: Driver[];
  overallStats: {
    totalDrivers: number;
    totalEarnings: number;
    totalPendingSalary: number;
    totalTripsToday: number;
    totalTripsThisMonth: number;
    cashBalance: number;
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const url = selectedDriver === 'all' 
        ? '/api/dashboard' 
        : `/api/dashboard?driverId=${selectedDriver}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDriver]);

  const initializeSystem = async () => {
    try {
      const response = await fetch('/api/init', { method: 'POST' });
      if (response.ok) {
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error initializing system:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleCopyWhatsApp = async (summary: string) => {
    const success = await copyToClipboard(summary);
    if (success) {
      alert('WhatsApp summary copied to clipboard!');
    } else {
      alert('Failed to copy to clipboard');
    }
  };

  const handleShareWhatsApp = (summary: string) => {
    const url = generateWhatsAppUrl(summary);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <h2 className="text-2xl font-bold">Fleet Management System</h2>
        <p className="text-gray-600">Initialize the system to get started</p>
        <Button onClick={initializeSystem}>Initialize System</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Enhanced Header with Glassmorphism */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8 hover:bg-white/80 transition-all duration-500">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Fleet Management
                  </h1>
                  <p className="text-slate-600 text-xl font-medium">Real-time operations dashboard</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-500">Live updates enabled</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={fetchDashboardData}
                disabled={refreshing}
                className="border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-300 px-6 py-3 rounded-2xl font-semibold"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid with Improved Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[
            {
              title: "Total Drivers",
              value: dashboardData.overallStats.totalDrivers,
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
              color: "from-blue-500 to-cyan-500",
              bgColor: "bg-blue-50",
              textColor: "text-blue-700"
            },
            {
              title: "Total Earnings",
              value: formatCurrency(dashboardData.overallStats.totalEarnings),
              icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
              color: "from-emerald-500 to-green-500",
              bgColor: "bg-emerald-50",
              textColor: "text-emerald-700"
            },
            {
              title: "Today's Trips",
              value: dashboardData.overallStats.totalTripsToday,
              icon: "M13 10V3L4 14h7v7l9-11h-7z",
              color: "from-purple-500 to-violet-500",
              bgColor: "bg-purple-50",
              textColor: "text-purple-700"
            },
            {
              title: "This Month",
              value: dashboardData.overallStats.totalTripsThisMonth,
              icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              color: "from-pink-500 to-rose-500",
              bgColor: "bg-pink-50",
              textColor: "text-pink-700"
            }
          ].map((stat, index) => (
            <div key={stat.title} className="group">
              <div className={`backdrop-blur-md bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6 hover:bg-white/80 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1`} style={{animationDelay: `${index * 100}ms`}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">{stat.title}</p>
                    <p className={`text-3xl font-black ${stat.textColor} group-hover:scale-110 transition-transform duration-300`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`w-14 h-14 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                </div>
                <div className={`mt-4 h-1 bg-gradient-to-r ${stat.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Driver Filter with Modern Design */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8 hover:bg-white/80 transition-all duration-500">
          <div className="mb-8">
            <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-3">
              Driver Overview
            </h2>
            <p className="text-slate-600 text-lg">Select a driver to view detailed performance metrics and insights</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              variant={selectedDriver === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedDriver('all')}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                selectedDriver === 'all' 
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl' 
                  : 'border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50/80 backdrop-blur-sm'
              }`}
            >
              🏢 All Drivers 
              <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {dashboardData.drivers.length}
              </span>
            </Button>
            {dashboardData.drivers.map((driver, index) => (
              <Button
                key={driver.driverId}
                variant={selectedDriver === driver.driverId ? 'default' : 'outline'}
                onClick={() => setSelectedDriver(driver.driverId)}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 ${
                  selectedDriver === driver.driverId 
                    ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-xl hover:shadow-2xl' 
                    : 'border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/80 backdrop-blur-sm'
                }`}
                style={{animationDelay: `${index * 100}ms`}}
              >
                👨‍💼 {driver.name}
                <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {driver.commissionPercentage}%
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Driver Cards with Glassmorphism */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {dashboardData.drivers.map((driver, index) => (
            <div 
              key={driver.driverId} 
              className="group backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:bg-white/80 hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-2"
              style={{animationDelay: `${index * 150}ms`}}
            >
              {/* Enhanced Driver Header with Gradient */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-white/20 to-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-3xl font-black">{driver.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-3xl font-black mb-2">{driver.name}</h3>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 font-semibold">
                          {driver.commissionPercentage}% commission
                        </span>
                        <span className="text-white/70">•</span>
                        <span className="bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-full text-emerald-200 font-semibold">
                          {driver.totalTrips} trips
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-white/80 text-sm">Active driver</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-3 rounded-2xl shadow-lg font-bold text-lg">
                      {formatCurrency(driver.totalSalary)}
                      <div className="text-sm font-medium opacity-80">total earned</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Enhanced Financial Overview - Driver Focused */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-5 border-2 border-emerald-200/50 group-hover:border-emerald-300 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-700 mb-1">NET EARNINGS</p>
                        <p className="text-lg font-black text-emerald-900">
                          {formatCurrency(driver.totalEarnings)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200/50 group-hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-700 mb-1">YOUR SHARE</p>
                        <p className="text-lg font-black text-blue-900">
                          {formatCurrency(driver.totalSalary)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-5 border-2 border-purple-200/50 group-hover:border-purple-300 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-purple-700 mb-1">TOTAL TRIPS</p>
                        <p className="text-lg font-black text-purple-900">
                          {driver.totalTrips}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Platform Earnings - Driver Focused */}
                <div>
                  <h4 className="font-black text-xl text-slate-900 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    Earnings Summary
                  </h4>
                  
                  {/* Driver Financial Overview */}
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200/50">
                      <div className="text-xs font-bold text-emerald-600 mb-1">TOTAL EARNED</div>
                      <div className="font-mono text-lg font-black text-emerald-700">
                        {formatCurrency(driver.totalSalary)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Platforms Only */}
                  <div className="space-y-4">
                    {Object.entries(driver.platformBreakdown)
                      .filter(([, amount]) => amount > 0)
                      .map(([platform, amount], index) => {
                        const driverShare = (amount * driver.commissionPercentage) / 100;
                        return (
                          <div 
                            key={platform} 
                            className="p-5 bg-gradient-to-r from-slate-50 to-white rounded-2xl border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                            style={{animationDelay: `${index * 100}ms`}}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-3">
                                <Badge className={`${getPlatformColor(platform)} px-4 py-2 text-sm font-bold rounded-xl shadow-md`}>
                                  {platform.toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-xl font-black bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                                  {formatCurrency(amount)}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">Net Earnings</div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center">
                              <div className="text-sm text-slate-600">
                                Your Share ({driver.commissionPercentage}%):
                              </div>
                              <div className="font-mono font-bold text-emerald-600">
                                {formatCurrency(driverShare)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {/* Show message if no active platforms */}
                    {Object.entries(driver.platformBreakdown).filter(([, amount]) => amount > 0).length === 0 && (
                      <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200/50 text-center">
                        <div className="text-slate-500 text-lg font-semibold">No earnings yet</div>
                        <div className="text-slate-400 text-sm mt-1">Start adding trips to see platform breakdown</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Recent Trips with Modern Design */}
                {driver.recentTrips.length > 0 && (
                  <div>
                    <h4 className="font-black text-xl text-slate-900 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      Recent Trips
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                      {driver.recentTrips.slice(0, 5).map((trip, index) => (
                        <div 
                          key={trip._id} 
                          className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border-2 border-slate-200/50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                          style={{animationDelay: `${index * 100}ms`}}
                        >
                          <div className="flex items-center space-x-4">
                            <Badge className={`${getPlatformColor(trip.platform)} text-xs font-bold px-3 py-1 rounded-lg`}>
                              {trip.platform}
                            </Badge>
                            <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                              {formatDate(trip.tripDate)}
                            </span>
                          </div>
                          <span className="font-mono font-black text-lg bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            {formatCurrency(trip.tripAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced WhatsApp Actions with Modern Styling */}
                <div className="flex space-x-4 pt-6 border-t-2 border-slate-200">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleCopyWhatsApp(driver.whatsappSummary)}
                    className="flex-1 border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-300 px-6 py-4 rounded-2xl font-bold transform hover:scale-105"
                  >
                    <Copy className="h-5 w-5 mr-3" />
                    Copy Summary
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleShareWhatsApp(driver.whatsappSummary)}
                    className="flex-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 px-6 py-4 rounded-2xl font-bold transform hover:scale-105"
                  >
                    <MessageCircle className="h-5 w-5 mr-3" />
                    Share on WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Custom CSS with Modern Animations */}
        <style jsx global>{`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          
          .animate-blob {
            animation: blob 7s infinite;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: linear-gradient(to bottom, #f1f5f9, #e2e8f0);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #94a3b8, #64748b);
          }
          
          .hover\\:shadow-3xl:hover {
            box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .backdrop-blur-md {
            backdrop-filter: blur(16px);
          }
        `}</style>
      </div>
    </div>
  );
}
