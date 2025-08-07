import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Driver, Trip, SalaryPayment, CashBalance, CashierTransaction } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
        break;
    }

    // Fetch all required data
    const [drivers, trips, salaryPayments, cashBalance, cashierTransactions] = await Promise.all([
      Driver.find({ isActive: true }),
      Trip.find({ tripDate: { $gte: startDate } }).sort({ tripDate: -1 }),
      SalaryPayment.find({ paymentDate: { $gte: startDate } }),
      CashBalance.findOne().sort({ lastUpdated: -1 }),
      CashierTransaction.find({ transactionDate: { $gte: startDate } }).sort({ transactionDate: -1 })
    ]);

    // Calculate comprehensive owner metrics
    const metrics = calculateOwnerMetrics(drivers, trips, salaryPayments, cashBalance, cashierTransactions);

    return NextResponse.json({
      success: true,
      metrics,
      period,
      dateRange: {
        from: startDate,
        to: now
      }
    });

  } catch (error) {
    console.error('Error in owner dashboard API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch owner dashboard data' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateOwnerMetrics(drivers: any[], trips: any[], salaryPayments: any[], cashBalance: any, cashierTransactions: any[]) {
  // Initialize totals
  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalFuelCosts = 0;
  let totalCommissions = 0;
  let totalCashInHand = 0;
  let totalPendingSalaries = 0;

  const platformRevenue = {
    uber: 0,
    indrive: 0,
    yatri: 0,
    rapido: 0,
    offline: 0
  };

  // Process all trips
  trips.forEach(trip => {
    const netEarnings = trip.tripAmount - (trip.commissionAmount || 0);
    totalRevenue += netEarnings;
    totalExpenses += (trip.fuelCost || 0) + (trip.otherExpenses || 0);
    totalFuelCosts += trip.fuelCost || 0;
    totalCommissions += trip.commissionAmount || 0;
    totalCashInHand += trip.cashInDriverHand || 0;

    // Handle platform breakdown
    if (trip.platform === 'multiple' && trip.platformDetails) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(trip.platformDetails).forEach(([platform, details]: [string, any]) => {
        if (details?.earnings && platformRevenue.hasOwnProperty(platform)) {
          const platformNet = details.earnings - (details.commission || 0);
          platformRevenue[platform as keyof typeof platformRevenue] += platformNet;
        }
      });
    } else if (platformRevenue.hasOwnProperty(trip.platform)) {
      platformRevenue[trip.platform as keyof typeof platformRevenue] += netEarnings;
    }
  });

  // Calculate driver summaries and pending salaries
  const driverSummaries = drivers.map(driver => {
    const driverTrips = trips.filter(trip => trip.driverId.toString() === driver._id.toString());
    const driverSalaryPayments = salaryPayments.filter(payment => 
      payment.driverId.toString() === driver._id.toString()
    );

    let driverEarnings = 0;
    let driverSalaryEarned = 0;
    let driverSalaryPaid = 0;

    // Calculate earnings and salary earned from trips
    driverTrips.forEach(trip => {
      const netEarnings = trip.tripAmount - (trip.commissionAmount || 0);
      driverEarnings += netEarnings;
      
      const salaryEarned = (netEarnings * driver.commissionPercentage) / 100;
      driverSalaryEarned += salaryEarned;
      
      driverSalaryPaid += trip.driverSalary || 0;
    });

    // Add salary payments
    driverSalaryPayments.forEach(payment => {
      driverSalaryPaid += payment.amount;
    });

    const pendingSalary = Math.max(0, driverSalaryEarned - driverSalaryPaid);
    totalPendingSalaries += pendingSalary;

    const efficiency = driverTrips.length > 0 ? 
      Math.min(100, (driverEarnings / driverTrips.length / 1000) * 100) : 0;

    const lastTripDate = driverTrips.length > 0 ? 
      new Date(Math.max(...driverTrips.map(trip => new Date(trip.tripDate).getTime()))) : null;

    const status = pendingSalary > 5000 ? 'alert' : 
                  driverTrips.length > 0 ? 'active' : 'inactive';

    return {
      _id: driver._id,
      name: driver.name,
      totalEarnings: driverEarnings,
      pendingSalary,
      totalTrips: driverTrips.length,
      efficiency,
      lastTripDate: lastTripDate ? lastTripDate.toISOString() : '',
      status
    };
  });

  // Calculate additional metrics
  const netProfit = totalRevenue - totalExpenses - totalPendingSalaries;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const fuelCostRatio = totalRevenue > 0 ? (totalFuelCosts / totalRevenue) * 100 : 0;
  const averageRevenuePerTrip = trips.length > 0 ? totalRevenue / trips.length : 0;

  // Cash flow calculations
  const cashierBalance = cashBalance?.currentBalance || 0;
  const totalCashFlow = totalCashInHand + cashierBalance;
  const pendingCollections = totalCashInHand; // Cash still with drivers

  // Performance indicators
  const topPerformingDriver = driverSummaries.length > 0 ? 
    driverSummaries.reduce((prev, current) => prev.totalEarnings > current.totalEarnings ? prev : current).name : '';

  const mostProfitablePlatform = Object.entries(platformRevenue)
    .reduce((prev, current) => prev[1] > current[1] ? prev : current)[0];

  // Daily target (can be configured)
  const dailyTarget = 10000; // ₹10,000 daily target
  const targetAchievement = (totalRevenue / dailyTarget) * 100;

  // Risk assessment
  const riskFactors = [];

  // High pending salaries
  driverSummaries.forEach(driver => {
    if (driver.pendingSalary > 5000) {
      riskFactors.push({
        type: 'high_pending_salary',
        severity: driver.pendingSalary > 10000 ? 'high' : 'medium',
        message: `${driver.name} has high pending salary`,
        amount: driver.pendingSalary,
        action: 'Process salary payment immediately'
      });
    }
  });

  // Low profit margin
  if (profitMargin < 10) {
    riskFactors.push({
      type: 'low_profit_margin',
      severity: profitMargin < 5 ? 'high' : 'medium',
      message: `Low profit margin: ${profitMargin.toFixed(1)}%`,
      action: 'Review expenses and optimize operations'
    });
  }

  // High fuel cost ratio
  if (fuelCostRatio > 30) {
    riskFactors.push({
      type: 'high_fuel_costs',
      severity: fuelCostRatio > 40 ? 'high' : 'medium',
      message: `High fuel cost ratio: ${fuelCostRatio.toFixed(1)}%`,
      amount: totalFuelCosts,
      action: 'Optimize routes and fuel efficiency'
    });
  }

  // Inactive drivers
  const inactiveDrivers = driverSummaries.filter(d => d.status === 'inactive');
  if (inactiveDrivers.length > 0) {
    riskFactors.push({
      type: 'inactive_drivers',
      severity: 'low',
      message: `${inactiveDrivers.length} driver(s) inactive`,
      action: 'Follow up with inactive drivers'
    });
  }

  // Recent transactions for activity feed
  const recentTransactions = [
    ...trips.slice(0, 10).map(trip => ({
      type: 'trip' as const,
      amount: trip.tripAmount,
      description: `Trip completed by ${trip.driverName}`,
      timestamp: trip.createdAt,
      driver: trip.driverName
    })),
    ...salaryPayments.slice(0, 5).map(payment => ({
      type: 'salary' as const,
      amount: payment.amount,
      description: `Salary payment`,
      timestamp: payment.createdAt,
      driver: payment.driverName
    })),
    ...cashierTransactions.slice(0, 5).map(transaction => ({
      type: transaction.type === 'deposit' ? 'collection' as const : 'expense' as const,
      amount: transaction.amount,
      description: transaction.description,
      timestamp: transaction.createdAt
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);

  return {
    // Financial Overview
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    
    // Cash Flow
    totalCashInHand,
    cashierBalance,
    totalCashFlow,
    pendingCollections,
    
    // Driver Management
    totalPendingSalaries,
    totalDrivers: drivers.length,
    activeDrivers: driverSummaries.filter(d => d.status === 'active').length,
    totalTripsToday: trips.length,
    
    // Operational Metrics
    totalFuelCosts,
    totalCommissions,
    averageRevenuePerTrip,
    fuelCostRatio,
    
    // Performance Indicators
    topPerformingDriver,
    mostProfitablePlatform,
    dailyTarget,
    targetAchievement,
    
    // Platform Breakdown
    platformRevenue,
    
    // Driver Details
    driverSummaries: driverSummaries.sort((a, b) => b.totalEarnings - a.totalEarnings),
    
    // Risk Assessment
    riskFactors,
    
    // Recent Activity
    recentTransactions
  };
}
