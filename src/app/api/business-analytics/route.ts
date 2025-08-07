import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Driver, Trip, SalaryPayment, CashBalance } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
        break;
    }

    // Fetch all data
    const drivers = await Driver.find({ isActive: true });
    const trips = await Trip.find({
      tripDate: { $gte: startDate }
    }).sort({ tripDate: -1 });
    const salaryPayments = await SalaryPayment.find({
      paymentDate: { $gte: startDate }
    });
    const cashBalance = await CashBalance.findOne();

    // Calculate business metrics
    const metrics = calculateBusinessMetrics(drivers, trips, salaryPayments, cashBalance?.currentBalance || 0);

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
    console.error('Error in business analytics API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business analytics' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateBusinessMetrics(drivers: Array<any>, trips: Array<any>, salaryPayments: Array<any>, cashBalance: number) {
  // Initialize metrics
  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalFuelCosts = 0;
  let totalOnlinePayments = 0;
  let totalCashCollected = 0;
  
  const platformDistribution = {
    uber: 0,
    indrive: 0,
    yatri: 0,
    rapido: 0,
    offline: 0
  };

  // Calculate driver analytics
  const driverAnalytics = drivers.map(driver => {
    const driverTrips = trips.filter(trip => trip.driverId.toString() === driver._id.toString());
    const driverSalaryPayments = salaryPayments.filter(payment => 
      payment.driverId.toString() === driver._id.toString()
    );

    let driverEarnings = 0;
    let driverExpenses = 0;
    let driverFuelCost = 0;
    let driverOnlinePayments = 0;
    let driverCashCollected = 0;
    let driverSalaryEarned = 0;
    let driverSalaryPaid = 0;

    const driverPlatformBreakdown = {
      uber: 0,
      indrive: 0,
      yatri: 0,
      rapido: 0,
      offline: 0
    };

    // Process driver trips
    driverTrips.forEach(trip => {
      const netEarnings = trip.tripAmount - (trip.commissionAmount || 0);
      driverEarnings += netEarnings;
      driverExpenses += (trip.fuelCost || 0) + (trip.otherExpenses || 0);
      driverFuelCost += trip.fuelCost || 0;
      
      // Calculate salary earned for this trip
      const salaryEarned = (netEarnings * driver.commissionPercentage) / 100;
      driverSalaryEarned += salaryEarned;
      
      // Add salary actually paid during this trip
      driverSalaryPaid += trip.driverSalary || 0;

      // Track payment methods - both global and per driver
      const tripOnlinePayment = trip.onlinePayment || 0;
      const tripCashCollected = trip.cashCollected || 0;
      
      totalOnlinePayments += tripOnlinePayment;
      totalCashCollected += tripCashCollected;
      driverOnlinePayments += tripOnlinePayment;
      driverCashCollected += tripCashCollected;

      // Handle platform breakdown
      if (trip.platform === 'multiple' && trip.platformDetails) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(trip.platformDetails).forEach(([platform, details]: [string, any]) => {
          if (details?.earnings) {
            const platformNet = details.earnings - (details.commission || 0);
            if (driverPlatformBreakdown.hasOwnProperty(platform)) {
              driverPlatformBreakdown[platform as keyof typeof driverPlatformBreakdown] += platformNet;
              platformDistribution[platform as keyof typeof platformDistribution] += platformNet;
            }
          }
        });
      } else if (driverPlatformBreakdown.hasOwnProperty(trip.platform)) {
        driverPlatformBreakdown[trip.platform as keyof typeof driverPlatformBreakdown] += netEarnings;
        platformDistribution[trip.platform as keyof typeof platformDistribution] += netEarnings;
      }
    });

    // Add salary payments
    driverSalaryPayments.forEach(payment => {
      driverSalaryPaid += payment.amount;
    });

    // Calculate additional metrics
    const pendingSalary = Math.max(0, driverSalaryEarned - driverSalaryPaid);
    const averageEarningsPerTrip = driverTrips.length > 0 ? driverEarnings / driverTrips.length : 0;
    const efficiencyScore = driverTrips.length > 0 ? 
      Math.min(100, (averageEarningsPerTrip / 1000) * 100) : 0;
    const profitability = driverEarnings > 0 ? 
      ((driverEarnings - driverExpenses - driverSalaryEarned) / driverEarnings) * 100 : 0;

    // Add to global totals
    totalRevenue += driverEarnings;
    totalExpenses += driverExpenses + driverSalaryPaid;
    totalFuelCosts += driverFuelCost;

    return {
      _id: driver._id,
      name: driver.name,
      commissionPercentage: driver.commissionPercentage,
      totalTrips: driverTrips.length,
      totalEarnings: driverEarnings,
      totalExpenses: driverExpenses,
      totalFuelCost: driverFuelCost,
      totalOnlinePayments: driverOnlinePayments,
      totalCashCollected: driverCashCollected,
      totalSalaryEarned: driverSalaryEarned,
      totalSalaryPaid: driverSalaryPaid,
      pendingSalary,
      averageEarningsPerTrip,
      platformBreakdown: driverPlatformBreakdown,
      efficiencyScore,
      profitability
    };
  });

  // Calculate aggregated metrics
  const totalPendingSalaries = driverAnalytics.reduce((sum, driver) => sum + driver.pendingSalary, 0);
  const totalActiveDrivers = drivers.length;
  const totalTrips = trips.length;
  const averageRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
  const cashFlowStatus = totalRevenue - totalExpenses - totalPendingSalaries;

  // Find top performers (by earnings)
  const topPerformers = [...driverAnalytics]
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 3);

  // Identify risk factors
  const riskFactors: Array<{
    type: string;
    driver?: string;
    amount?: number;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }> = [];

  // Check for high pending salaries
  driverAnalytics.forEach(driver => {
    if (driver.pendingSalary > 5000) {
      riskFactors.push({
        type: 'high_pending_salary',
        driver: driver.name,
        amount: driver.pendingSalary,
        severity: driver.pendingSalary > 10000 ? 'high' : 'medium',
        message: `High pending salary for ${driver.name}: ₹${driver.pendingSalary.toLocaleString()}`
      });
    }
  });

  // Check for low profitability drivers
  driverAnalytics.forEach(driver => {
    if (driver.profitability < 10 && driver.totalTrips > 5) {
      riskFactors.push({
        type: 'low_profitability',
        driver: driver.name,
        severity: driver.profitability < 5 ? 'high' : 'medium',
        message: `Low profitability for ${driver.name}: ${driver.profitability.toFixed(1)}%`
      });
    }
  });

  // Check for drivers with high online payments needing transfer
  driverAnalytics.forEach(driver => {
    if (driver.totalOnlinePayments > 5000) {
      riskFactors.push({
        type: 'high_online_payment',
        driver: driver.name,
        amount: driver.totalOnlinePayments,
        severity: driver.totalOnlinePayments > 15000 ? 'high' : 'medium',
        message: `${driver.name} has ₹${driver.totalOnlinePayments.toLocaleString()} in online payments - transfer to cashier needed`
      });
    }
  });

  // Check for high fuel costs
  const avgFuelRatio = totalRevenue > 0 ? (totalFuelCosts / totalRevenue) * 100 : 0;
  if (avgFuelRatio > 25) {
    riskFactors.push({
      type: 'high_fuel_cost',
      amount: totalFuelCosts,
      severity: avgFuelRatio > 35 ? 'high' : 'medium',
      message: `High fuel cost ratio: ${avgFuelRatio.toFixed(1)}% of total revenue`
    });
  }

  // Check for inactive drivers
  driverAnalytics.forEach(driver => {
    if (driver.totalTrips === 0) {
      riskFactors.push({
        type: 'inactive_driver',
        driver: driver.name,
        severity: 'low',
        message: `${driver.name} has no trips in the selected period`
      });
    }
  });

  // Generate monthly trend (simplified for demo)
  const monthlyTrend = [
    { month: 'Current', revenue: totalRevenue, expenses: totalExpenses, profit: totalRevenue - totalExpenses }
  ];

  return {
    totalRevenue,
    totalExpenses,
    totalFuelCosts,
    totalPendingSalaries,
    totalOnlinePayments,
    totalCashCollected,
    totalActiveDrivers,
    totalTrips,
    averageRevenuePerTrip,
    profitMargin,
    cashFlowStatus,
    cashBalance,
    platformDistribution,
    monthlyTrend,
    driverAnalytics,
    topPerformers,
    riskFactors
  };
}
