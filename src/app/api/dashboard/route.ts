import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Driver, Trip, SalaryPayment, CashBalance } from '@/models';
import { FleetCalculations } from '@/lib/calculations';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
    // Build date filter
    const dateFilter: Record<string, Record<string, Date>> = {};
    if (dateFrom || dateTo) {
      dateFilter.tripDate = {};
      if (dateFrom) {
        dateFilter.tripDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.tripDate.$lte = new Date(dateTo);
      }
    }    // Get drivers
    const drivers = await Driver.find({ isActive: true }).sort({ name: 1 });
    
    // Get dashboard summary
    const dashboardData: Record<string, unknown> = {
      drivers: [],
      overallStats: {
        totalDrivers: drivers.length,
        totalEarnings: 0,
        totalPendingSalary: 0,
        totalTripsToday: 0,
        totalTripsThisMonth: 0
      },
      cashBalance: 0
    };

    // Get cash balance
    const cashBalanceDoc = await CashBalance.findOne();
    dashboardData.overallStats = {
      ...dashboardData.overallStats as Record<string, unknown>,
      cashBalance: cashBalanceDoc?.currentBalance || 0
    };

    // Calculate stats for each driver or specific driver
    const driverFilter = driverId ? { _id: driverId } : { isActive: true };
    const targetDrivers = await Driver.find(driverFilter);

    for (const driver of targetDrivers) {
      // Get trips for this driver
      const tripFilter = { driverId: driver._id, ...dateFilter };
      const trips = await Trip.find(tripFilter).sort({ tripDate: -1 });
      
      // Calculate driver summary
      const driverSummary = FleetCalculations.calculateDriverSummary(driver, trips);
      
      // Get recent salary payments
      const recentPayments = await SalaryPayment.find({ driverId: driver._id })
        .sort({ paymentDate: -1 })
        .limit(5);

      // Add WhatsApp summary
      const whatsappSummary = FleetCalculations.generateWhatsAppSummary(
        driverSummary,
        trips,
        dateFrom && dateTo ? { from: new Date(dateFrom), to: new Date(dateTo) } : undefined
      );

      const driverData = {
        ...driverSummary,
        driverId: driver._id,
        recentTrips: trips.slice(0, 10), // Last 10 trips
        recentPayments,
        whatsappSummary
      };

      (dashboardData.drivers as unknown[]).push(driverData);

      // Add to overall stats
      const stats = dashboardData.overallStats as Record<string, number>;
      stats.totalEarnings += driverSummary.totalEarnings;
      stats.totalPendingSalary += driverSummary.pendingSalary;
    }

    // Get today's trips count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTripsCount = await Trip.countDocuments({
      tripDate: { $gte: today, $lt: tomorrow }
    });

    // Get this month's trips count
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const monthTripsCount = await Trip.countDocuments({
      tripDate: { $gte: monthStart, $lte: monthEnd }
    });

    const stats = dashboardData.overallStats as Record<string, number>;
    stats.totalTripsToday = todayTripsCount;
    stats.totalTripsThisMonth = monthTripsCount;

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
