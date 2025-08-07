import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { MonthlySalarySummary, Driver, Trip, SalaryPayment } from '@/models';

// Helper function to calculate monthly earnings and salary for a driver
async function calculateMonthlySalary(driverId: string, month: number, year: number, commissionPercentage: number) {
  // Get trips for this month/year
  const startDate = new Date(year, month - 1, 1); // month - 1 because JS months are 0-indexed
  const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month

  const tripsAggregation = await Trip.aggregate([
    {
      $match: {
        driverId: driverId,
        tripDate: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$driverEarnings' }
      }
    }
  ]);

  const totalEarningsThisMonth = tripsAggregation[0]?.totalEarnings || 0;
  const totalSalaryThisMonth = totalEarningsThisMonth * (commissionPercentage / 100);

  return {
    totalEarningsThisMonth,
    totalSalaryThisMonth
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '');
    
    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Get driver information
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Calculate monthly earnings and salary
    const { totalEarningsThisMonth, totalSalaryThisMonth } = await calculateMonthlySalary(
      driverId, 
      month, 
      year, 
      driver.commissionPercentage
    );

    // Get payments for this month
    const paymentsAggregation = await SalaryPayment.aggregate([
      {
        $match: {
          driverId: driverId,
          month: month,
          year: year
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);

    const totalPaidThisMonth = paymentsAggregation[0]?.totalPaid || 0;
    const paymentsThisMonth = paymentsAggregation[0]?.paymentCount || 0;
    const remainingSalaryThisMonth = totalSalaryThisMonth - totalPaidThisMonth;

    // Update or create monthly summary
    const monthlySummary = await MonthlySalarySummary.findOneAndUpdate(
      {
        driverId,
        month,
        year
      },
      {
        driverName: driver.name,
        totalEarningsThisMonth,
        totalSalaryThisMonth,
        totalPaidThisMonth,
        remainingSalaryThisMonth,
        paymentsThisMonth,
        lastUpdated: new Date()
      },
      {
        upsert: true,
        new: true
      }
    );

    // Get payment history for this month
    const paymentHistory = await SalaryPayment.find({
      driverId,
      month,
      year
    }).sort({ paymentDate: -1 });

    return NextResponse.json({
      monthlySummary,
      paymentHistory,
      calculatedData: {
        totalEarningsThisMonth,
        totalSalaryThisMonth,
        totalPaidThisMonth,
        remainingSalaryThisMonth,
        paymentsThisMonth,
        commissionPercentage: driver.commissionPercentage
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching monthly salary data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly salary data' },
      { status: 500 }
    );
  }
}

// Get monthly summaries for all drivers or a specific range
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { drivers, startMonth, startYear, endMonth, endYear } = body;

    // Default to current month if not specified
    const currentDate = new Date();
    const defaultMonth = currentDate.getMonth() + 1;
    const defaultYear = currentDate.getFullYear();

    const query: Record<string, unknown> = {};

    if (drivers && drivers.length > 0) {
      query.driverId = { $in: drivers };
    }

    // Handle date range
    if (startMonth && startYear && endMonth && endYear) {
      query.$or = [];
      
      // If same year, just check months
      if (startYear === endYear) {
        query.year = startYear;
        query.month = { $gte: startMonth, $lte: endMonth };
      } else {
        // Handle cross-year ranges
        query.$or = [
          { year: startYear, month: { $gte: startMonth } },
          { year: { $gt: startYear, $lt: endYear } },
          { year: endYear, month: { $lte: endMonth } }
        ];
      }
    } else {
      // Default to current month
      query.month = defaultMonth;
      query.year = defaultYear;
    }

    const summaries = await MonthlySalarySummary.find(query)
      .populate('driverId', 'name commissionPercentage')
      .sort({ year: -1, month: -1, driverName: 1 });

    return NextResponse.json({
      summaries,
      query // For debugging
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching monthly summaries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly summaries' },
      { status: 500 }
    );
  }
}
