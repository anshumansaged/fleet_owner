'use client';

import { useState, useEffect } from 'react';

export default function Cashier() {
  const [cashBalance, setCashBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch cash balance data
    const fetchCashBalance = async () => {
      try {
        const response = await fetch('/api/cashier');
        if (response.ok) {
          const data = await response.json();
          setCashBalance(data.currentBalance || 0);
        }
      } catch (error) {
        console.error('Error fetching cash balance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCashBalance();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
            Cashier Management
          </h1>
          <p className="text-slate-600 text-lg">
            Manage cash transactions and balance for the fleet
          </p>
        </div>

        {/* Cash Balance Card */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              Current Cash Balance
            </h2>
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            ) : (
              <div className="text-6xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {formatCurrency(cashBalance)}
              </div>
            )}
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4">Enhanced Features Coming Soon</h3>
          <p className="text-slate-600 text-lg mb-6">
            Complete cashier management including transaction history, deposits, withdrawals, and reporting will be available soon.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-2">Transaction Management</h4>
              <p className="text-sm text-blue-700">Record deposits and withdrawals with owner authentication</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <h4 className="font-bold text-emerald-900 mb-2">Balance Tracking</h4>
              <p className="text-sm text-emerald-700">Real-time cash balance with detailed transaction history</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">Reporting</h4>
              <p className="text-sm text-purple-700">Generate detailed cash flow reports and summaries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
