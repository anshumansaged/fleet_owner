import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Trip, Driver, CashierTransaction, CashBalance } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const platform = searchParams.get('platform');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    const query: Record<string, unknown> = {};
    
    if (driverId) {
      query.driverId = driverId;
    }
    
    if (platform) {
      query.platform = platform;
    }
    
    if (date) {
      // Filter by specific date
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query.tripDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    const skip = (page - 1) * limit;
    
    const trips = await Trip.find(query)
      .sort({ tripDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('driverId', 'name commissionPercentage');
    
    const totalTrips = await Trip.countDocuments(query);
    
    return NextResponse.json({
      trips,
      totalTrips,
      currentPage: page,
      totalPages: Math.ceil(totalTrips / limit)
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
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
      tripDate,
      startKm,
      endKm,
      totalKm,
      uberEarnings = 0,
      indriveEarnings = 0,
      yatriEarnings = 0,
      rapidoEarnings = 0,
      offlineEarnings = 0,
      uberCash = 0,
      indriveCash = 0,
      yatriCash = 0,
      rapidoCash = 0,
      offlineCash = 0,
      fuelExpenses = [],
      otherExpenses = 0,
      hasUberCommission = false,
      yatriTrips = 0,
      onlinePayment = 0,
      cashToCashier = 0,
      driverTookSalary = false,
      cashGivenToCashier = false,
      platform = 'multiple',
      negativeHandlingOption = null,
      amountFromCashier = 0
    } = body;
    
    // Validate required fields
    if (!driverId || !tripDate) {
      return NextResponse.json(
        { error: 'Driver ID and trip date are required' },
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

    // Calculate totals
    const totalEarnings = uberEarnings + indriveEarnings + yatriEarnings + rapidoEarnings + offlineEarnings;
    const totalCashCollected = uberCash + indriveCash + yatriCash + rapidoCash + offlineCash;
    
    // Calculate commissions
    const uberCommission = hasUberCommission ? 117 : 0;
    const yatriCommission = yatriTrips * 10;
    const totalCommission = uberCommission + yatriCommission;
    
    // Calculate fuel cost
    const totalFuelCost = fuelExpenses.reduce((sum: number, entry: { amount?: number }) => sum + (entry.amount || 0), 0);
    
    // Calculate net earnings
    const netEarnings = totalEarnings - totalCommission;
    
    // Calculate driver salary if taken
    const driverSalary = driverTookSalary ? (netEarnings * driver.commissionPercentage / 100) : 0;
    
    // Calculate cash in driver hand (subtract cashToCashier)
    const cashInDriverHand = totalCashCollected - totalFuelCost - onlinePayment - otherExpenses - driverSalary - cashToCashier;

    // Create trip with detailed structure
    const trip = new Trip({
      driverId,
      driverName: driver.name,
      tripDate: new Date(tripDate),
      startKm,
      endKm,
      totalKm,
      platform,
      tripAmount: totalEarnings,
      commissionAmount: totalCommission,
      cashCollected: totalCashCollected,
      onlinePayment,
      fuelCost: totalFuelCost,
      otherExpenses,
      driverSalary,
      cashInHand: cashInDriverHand,
      cashInDriverHand,
      netAmount: netEarnings,
      platformDetails: {
        uber: { earnings: uberEarnings, cash: uberCash },
        indrive: { earnings: indriveEarnings, cash: indriveCash },
        yatri: { earnings: yatriEarnings, cash: yatriCash, trips: yatriTrips },
        rapido: { earnings: rapidoEarnings, cash: rapidoCash },
        offline: { earnings: offlineEarnings, cash: offlineCash }
      },
      commissionDetails: {
        uber: uberCommission,
        yatri: yatriCommission,
        total: totalCommission
      },
      fuelEntries: fuelExpenses,
      driverTookSalary,
      cashGivenToCashier,
      cashToCashier
    });

    await trip.save();

    // Handle negative cash scenarios
    if (negativeHandlingOption === 'cashier' && amountFromCashier > 0) {
      try {
        // Create a cashier transaction record
        const cashierTransaction = new CashierTransaction({
          type: 'withdrawal',
          amount: amountFromCashier,
          description: `Cash deficit covered for trip - Driver: ${driver.name}`,
          cashierName: 'System',
          ownerAuthenticated: true,
          transactionDate: new Date(tripDate)
        });
        
        await cashierTransaction.save();
        
        // Update cash balance
        const currentBalance = await CashBalance.findOne();
        
        if (currentBalance) {
          await CashBalance.findByIdAndUpdate(currentBalance._id, {
            $inc: { currentBalance: -amountFromCashier },
            $set: { lastUpdated: new Date() }
          });
        } else {
          await CashBalance.create({
            currentBalance: Math.max(0, -amountFromCashier),
            lastUpdated: new Date()
          });
        }
      } catch (error) {
        console.error('Error updating cashier balance:', error);
      }
    }

    // Update driver totals
    let adjustedDriverSalary = driverSalary;
    
    // If negative cash is added to driver salary, adjust the salary calculation
    if (negativeHandlingOption === 'salary' && cashInDriverHand < 0) {
      adjustedDriverSalary = driverSalary + Math.abs(cashInDriverHand);
    }
    
    const salaryToAdd = driverTookSalary ? adjustedDriverSalary : netEarnings * driver.commissionPercentage / 100;
    
    await Driver.findByIdAndUpdate(driverId, {
      $inc: {
        totalEarnings: totalEarnings,
        pendingSalary: driverTookSalary ? 0 : salaryToAdd,
        totalSalaryPaid: driverTookSalary ? adjustedDriverSalary : 0
      }
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
