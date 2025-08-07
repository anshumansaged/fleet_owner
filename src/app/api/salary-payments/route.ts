import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { SalaryPayment, Driver, MonthlySalarySummary } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    const query: Record<string, unknown> = {};
    
    if (driverId) {
      query.driverId = driverId;
    }
    
    const skip = (page - 1) * limit;
    
    const payments = await SalaryPayment.find(query)
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('driverId', 'name commissionPercentage');
    
    const totalPayments = await SalaryPayment.countDocuments(query);
    
    return NextResponse.json({
      payments,
      totalPayments,
      currentPage: page,
      totalPages: Math.ceil(totalPayments / limit)
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching salary payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salary payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const {
      driverId,
      amount,
      paymentDate,
      paymentMethod,
      notes
    } = body;
    
    // Validate required fields
    if (!driverId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { error: 'Driver ID, amount, payment date, and payment method are required' },
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

    // Check if payment amount exceeds pending salary
    if (amount > driver.pendingSalary) {
      return NextResponse.json(
        { error: `Payment amount (₹${amount}) exceeds pending salary (₹${driver.pendingSalary})` },
        { status: 400 }
      );
    }

    // Create salary payment record
    const paymentDateObj = new Date(paymentDate);
    const payment = new SalaryPayment({
      driverId,
      driverName: driver.name,
      amount,
      paymentDate: paymentDateObj,
      paymentMethod,
      notes,
      month: paymentDateObj.getMonth() + 1, // JavaScript months are 0-indexed
      year: paymentDateObj.getFullYear()
    });

    await payment.save();

    // Update driver's salary tracking
    await Driver.findByIdAndUpdate(driverId, {
      $inc: {
        totalSalaryPaid: amount,
        pendingSalary: -amount
      }
    });

    // Update or create monthly salary summary
    const month = paymentDateObj.getMonth() + 1;
    const year = paymentDateObj.getFullYear();

    // Get or create monthly summary
    let monthlySummary = await MonthlySalarySummary.findOne({
      driverId,
      month,
      year
    });

    if (!monthlySummary) {
      monthlySummary = new MonthlySalarySummary({
        driverId,
        driverName: driver.name,
        month,
        year,
        totalEarningsThisMonth: 0,
        totalSalaryThisMonth: 0,
        totalPaidThisMonth: 0,
        remainingSalaryThisMonth: 0,
        paymentsThisMonth: 0
      });
    }

    // Update monthly summary
    monthlySummary.totalPaidThisMonth += amount;
    monthlySummary.paymentsThisMonth += 1;
    monthlySummary.lastUpdated = new Date();

    // Calculate remaining salary for this month (need to calculate from trips)
    // For now, we'll calculate this when needed in the API call
    await monthlySummary.save();

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating salary payment:', error);
    return NextResponse.json(
      { error: 'Failed to create salary payment' },
      { status: 500 }
    );
  }
}
