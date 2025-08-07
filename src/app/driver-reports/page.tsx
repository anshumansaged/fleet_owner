'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';

interface Driver {
  _id: string;
  name: string;
  commissionPercentage: number;
}

interface Trip {
  _id: string;
  driverId: string;
  driverName: string;
  platform: string;
  tripAmount: number;
  commissionAmount: number;
  fuelCost: number;
  otherExpenses: number;
  cashCollected: number;
  onlinePayment: number;
  driverSalary: number;
  cashInDriverHand: number;
  tripDate: string;
  platformDetails?: {
    uber?: { earnings: number; cash: number };
    indrive?: { earnings: number; cash: number };
    yatri?: { earnings: number; cash: number; trips?: number };
    rapido?: { earnings: number; cash: number };
    offline?: { earnings: number; cash: number };
  };
  fuelEntries?: Array<{ amount: number; description: string }>;
}

interface DaySummary {
  date: string;
  totalEarnings: number;
  totalCommissions: number;
  netEarnings: number;
  totalCash: number;
  totalOnline: number;
  totalFuel: number;
  totalOtherExpenses: number;
  driverSalaryPaid: number;
  cashInDriverHand: number;
  driverShare: number;
  trips: Trip[];
  platformBreakdown: {
    uber: number;
    indrive: number;
    yatri: number;
    rapido: number;
    offline: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getPlatformColor = (platform: string) => {
  const colors = {
    uber: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    indrive: 'bg-blue-100 text-blue-800 border-blue-200',
    yatri: 'bg-green-100 text-green-800 border-green-200',
    rapido: 'bg-orange-100 text-orange-800 border-orange-200',
    offline: 'bg-gray-100 text-gray-800 border-gray-200',
    multiple: 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return colors[platform as keyof typeof colors] || colors.multiple;
};

export default function DriverReports() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [daySummary, setDaySummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch drivers on component mount
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await fetch('/api/drivers');
        if (response.ok) {
          const data = await response.json();
          setDrivers(data.drivers || []);
          if (data.drivers?.length > 0) {
            setSelectedDriver(data.drivers[0]._id);
          }
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };

    fetchDrivers();
  }, []);

  const calculateDaySummary = useCallback((trips: Trip[]) => {
    if (trips.length === 0) {
      setDaySummary(null);
      return;
    }

    const driver = drivers.find(d => d._id === selectedDriver);
    if (!driver) return;

    const summary: DaySummary = {
      date: selectedDate,
      totalEarnings: 0,
      totalCommissions: 0,
      netEarnings: 0,
      totalCash: 0,
      totalOnline: 0,
      totalFuel: 0,
      totalOtherExpenses: 0,
      driverSalaryPaid: 0,
      cashInDriverHand: 0,
      driverShare: 0,
      trips,
      platformBreakdown: {
        uber: 0,
        indrive: 0,
        yatri: 0,
        rapido: 0,
        offline: 0
      }
    };

    trips.forEach(trip => {
      summary.totalEarnings += trip.tripAmount;
      summary.totalCommissions += trip.commissionAmount;
      summary.totalCash += trip.cashCollected;
      summary.totalOnline += trip.onlinePayment;
      summary.totalFuel += trip.fuelCost;
      summary.totalOtherExpenses += trip.otherExpenses;
      summary.driverSalaryPaid += trip.driverSalary;
      summary.cashInDriverHand += trip.cashInDriverHand;

      // Platform breakdown
      if (trip.platformDetails) {
        const details = trip.platformDetails;
        if (details.uber?.earnings) summary.platformBreakdown.uber += details.uber.earnings;
        if (details.indrive?.earnings) summary.platformBreakdown.indrive += details.indrive.earnings;
        if (details.yatri?.earnings) summary.platformBreakdown.yatri += details.yatri.earnings;
        if (details.rapido?.earnings) summary.platformBreakdown.rapido += details.rapido.earnings;
        if (details.offline?.earnings) summary.platformBreakdown.offline += details.offline.earnings;
      }
    });

    summary.netEarnings = summary.totalEarnings - summary.totalCommissions;
    summary.driverShare = (summary.netEarnings * driver.commissionPercentage) / 100;

    setDaySummary(summary);
  }, [drivers, selectedDriver, selectedDate]);

  // Fetch day summary when driver or date changes
  useEffect(() => {
    const fetchDaySummary = async () => {
      if (!selectedDriver || !selectedDate) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/trips?driverId=${selectedDriver}&date=${selectedDate}`);
        if (response.ok) {
          const data = await response.json();
          calculateDaySummary(data.trips || []);
        }
      } catch (error) {
        console.error('Error fetching day summary:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDriver && selectedDate) {
      fetchDaySummary();
    }
  }, [selectedDriver, selectedDate, calculateDaySummary]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
            Driver Reports
          </h1>
          <p className="text-slate-600 text-lg">
            View detailed daily summaries for each driver including earnings, expenses, and cash flow
          </p>
        </div>

        {/* Filters */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Select Driver</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-semibold text-slate-700 transition-all duration-200"
              >
                <option value="">Choose a driver...</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} ({driver.commissionPercentage}% commission)
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-semibold text-slate-700 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-semibold">Loading day summary...</p>
          </div>
        )}

        {/* Day Summary */}
        {!loading && daySummary && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-emerald-700 mb-1">GROSS EARNINGS</p>
                  <p className="text-xl font-black text-emerald-900">{formatCurrency(daySummary.totalEarnings)}</p>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-blue-700 mb-1">DRIVER SHARE</p>
                  <p className="text-xl font-black text-blue-900">{formatCurrency(daySummary.driverShare)}</p>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M10.5 3L12 2l1.5 1H21l-9 9-9-9h7.5z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-purple-700 mb-1">TOTAL FUEL</p>
                  <p className="text-xl font-black text-purple-900">{formatCurrency(daySummary.totalFuel)}</p>
                </div>
              </div>

              <div className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-amber-700 mb-1">TOTAL TRIPS</p>
                  <p className="text-xl font-black text-amber-900">{daySummary.trips.length}</p>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Cash Flow Summary */}
              <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8">
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  Cash Flow Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                    <span className="font-semibold text-emerald-700">Cash Collected</span>
                    <span className="font-mono font-bold text-emerald-900">{formatCurrency(daySummary.totalCash)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                    <span className="font-semibold text-blue-700">Online Payments</span>
                    <span className="font-mono font-bold text-blue-900">{formatCurrency(daySummary.totalOnline)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                    <span className="font-semibold text-red-700">Fuel Expenses</span>
                    <span className="font-mono font-bold text-red-900">-{formatCurrency(daySummary.totalFuel)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                    <span className="font-semibold text-orange-700">Other Expenses</span>
                    <span className="font-mono font-bold text-orange-900">-{formatCurrency(daySummary.totalOtherExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                    <span className="font-semibold text-purple-700">Driver Salary Paid</span>
                    <span className="font-mono font-bold text-purple-900">-{formatCurrency(daySummary.driverSalaryPaid)}</span>
                  </div>
                  <div className="border-t-2 border-slate-200 pt-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl text-white">
                      <span className="font-bold">Cash in Driver Hand</span>
                      <span className="font-mono font-black text-lg">{formatCurrency(daySummary.cashInDriverHand)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Breakdown */}
              <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8">
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Platform Earnings
                </h3>
                <div className="space-y-4">
                  {Object.entries(daySummary.platformBreakdown)
                    .filter(([, amount]) => amount > 0)
                    .map(([platform, amount]) => (
                      <div key={platform} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border-2 border-slate-200/50">
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getPlatformColor(platform)} px-3 py-1 text-sm font-bold rounded-lg`}>
                            {platform.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="font-mono font-bold text-lg text-slate-900">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  {Object.entries(daySummary.platformBreakdown).filter(([, amount]) => amount > 0).length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p className="font-semibold">No platform earnings for this date</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Trip Details ({daySummary.trips.length} trips)
              </h3>
              <div className="space-y-4">
                {daySummary.trips.map((trip, index) => (
                  <div key={trip._id} className="p-6 bg-gradient-to-r from-slate-50 to-white rounded-2xl border-2 border-slate-200/50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getPlatformColor(trip.platform)} px-3 py-1 text-sm font-bold rounded-lg`}>
                          {trip.platform}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-600">Trip #{index + 1}</span>
                      </div>
                      <span className="font-mono font-black text-xl text-emerald-600">{formatCurrency(trip.tripAmount)}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Cash Collected:</span>
                        <div className="font-bold text-emerald-600">{formatCurrency(trip.cashCollected)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Online Payment:</span>
                        <div className="font-bold text-blue-600">{formatCurrency(trip.onlinePayment)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Fuel Cost:</span>
                        <div className="font-bold text-red-600">{formatCurrency(trip.fuelCost)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Driver Salary:</span>
                        <div className="font-bold text-purple-600">{formatCurrency(trip.driverSalary)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!loading && !daySummary && selectedDriver && selectedDate && (
          <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No trips found</h3>
            <p className="text-slate-500">
              No trips were recorded for {drivers.find(d => d._id === selectedDriver)?.name} on {formatDate(selectedDate)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
