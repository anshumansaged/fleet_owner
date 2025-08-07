'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Driver {
  _id: string;
  name: string;
  commissionPercentage: number;
  pendingSalary: number;
}

interface SalaryPayment {
  _id: string;
  driverId: string;
  driverName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi';
  notes?: string;
  month: number;
  year: number;
  createdAt: string;
}

interface MonthlySalarySummary {
  _id: string;
  driverId: string;
  driverName: string;
  month: number;
  year: number;
  totalEarningsThisMonth: number;
  totalSalaryThisMonth: number;
  totalPaidThisMonth: number;
  remainingSalaryThisMonth: number;
  paymentsThisMonth: number;
  lastUpdated: string;
}

interface MonthlyData {
  monthlySummary: MonthlySalarySummary;
  paymentHistory: SalaryPayment[];
  calculatedData: {
    totalEarningsThisMonth: number;
    totalSalaryThisMonth: number;
    totalPaidThisMonth: number;
    remainingSalaryThisMonth: number;
    paymentsThisMonth: number;
    commissionPercentage: number;
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

export default function SalaryPayments() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const driverParam = selectedDriver ? `?driverId=${selectedDriver}` : '';
      const response = await fetch(`/api/salary-payments${driverParam}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    if (!selectedDriver) {
      setMonthlyData(null);
      return;
    }

    setMonthlyLoading(true);
    try {
      const response = await fetch(`/api/monthly-salary?driverId=${selectedDriver}&month=${selectedMonth}&year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setMonthlyData(data);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setMonthlyLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPayments();
    fetchMonthlyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriver, selectedMonth, selectedYear]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/70 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-2 sm:mb-4">
            Salary Payments
          </h1>
          <p className="text-slate-600 text-sm sm:text-base lg:text-lg">
            Track and manage salary payments for all drivers
          </p>
        </div>

        {/* Driver Filter and Month/Year Selection */}
        <div className="backdrop-blur-md bg-white/70 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 mb-4 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3">Filter by Driver</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-semibold text-slate-700 transition-all duration-200 text-sm sm:text-base"
              >
                <option value="">All Drivers</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} ({formatCurrency(driver.pendingSalary)} pending)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-semibold text-slate-700 transition-all duration-200 text-sm sm:text-base"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleString('en-IN', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 font-semibold text-slate-700 transition-all duration-200 text-sm sm:text-base"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => {
                  fetchPayments();
                  fetchMonthlyData();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Monthly Summary Card */}
        {selectedDriver && monthlyData && (
          <div className="backdrop-blur-md bg-white/70 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-8 mb-4 sm:mb-8">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">
              Monthly Salary Summary - {monthlyData.monthlySummary.driverName}
            </h2>
            <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
              {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
            
            {monthlyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <div className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl border-2 border-green-200">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-green-800">Total Earnings</h3>
                      <p className="text-lg sm:text-2xl font-black text-green-900">
                        {formatCurrency(monthlyData.calculatedData.totalEarningsThisMonth)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl border-2 border-blue-200">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-blue-800">Total Salary ({monthlyData.calculatedData.commissionPercentage}%)</h3>
                      <p className="text-lg sm:text-2xl font-black text-blue-900">
                        {formatCurrency(monthlyData.calculatedData.totalSalaryThisMonth)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl border-2 border-purple-200">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-purple-800">Already Paid</h3>
                      <p className="text-lg sm:text-2xl font-black text-purple-900">
                        {formatCurrency(monthlyData.calculatedData.totalPaidThisMonth)}
                      </p>
                      <p className="text-xs text-purple-600">
                        {monthlyData.calculatedData.paymentsThisMonth} payment{monthlyData.calculatedData.paymentsThisMonth !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl sm:rounded-2xl border-2 border-orange-200">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-orange-800">Remaining Salary</h3>
                      <p className="text-lg sm:text-2xl font-black text-orange-900">
                        {formatCurrency(monthlyData.calculatedData.remainingSalaryThisMonth)}
                      </p>
                      <p className="text-xs text-orange-600">
                        {monthlyData.calculatedData.remainingSalaryThisMonth > 0 ? 'Pending' : 'Fully Paid'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pending Salaries Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {drivers.map((driver) => (
            <div key={driver._id} className="backdrop-blur-md bg-white/70 rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">{driver.name.charAt(0)}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{driver.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{driver.commissionPercentage}% commission</p>
                <p className="text-lg font-black text-emerald-600">{formatCurrency(driver.pendingSalary)}</p>
                <p className="text-xs text-slate-500">pending</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment History */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            Payment History
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600 font-semibold">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No payments found</h3>
              <p className="text-slate-500">
                {selectedDriver ? 'No payments recorded for this driver' : 'No salary payments have been recorded yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment._id} className="p-6 bg-gradient-to-r from-slate-50 to-white rounded-2xl border-2 border-slate-200/50 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">{payment.driverName.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{payment.driverName}</h3>
                        <p className="text-sm text-slate-600">{formatDate(payment.paymentDate)}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {payment.notes && (
                            <span className="text-xs text-slate-500">• {payment.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-slate-500">Paid on {formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
