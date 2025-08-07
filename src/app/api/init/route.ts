import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Driver, CashBalance } from '@/models';
import { FleetCalculations } from '@/lib/calculations';

export async function POST() {
  try {
    await connectDB();
    
    // Check if drivers already exist
    const existingDrivers = await Driver.countDocuments();
    if (existingDrivers > 0) {
      return NextResponse.json(
        { message: 'Drivers already initialized', count: existingDrivers },
        { status: 200 }
      );
    }

    // Create default drivers
    const defaultDrivers = FleetCalculations.getDefaultDrivers();
    const createdDrivers = await Driver.insertMany(defaultDrivers);

    // Initialize cash balance if it doesn't exist
    const existingBalance = await CashBalance.findOne();
    if (!existingBalance) {
      await CashBalance.create({
        currentBalance: 0,
        lastUpdated: new Date()
      });
    }

    return NextResponse.json(
      { 
        message: 'Fleet management system initialized successfully',
        drivers: createdDrivers,
        driversCount: createdDrivers.length
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error initializing system:', error);
    return NextResponse.json(
      { error: 'Failed to initialize system' },
      { status: 500 }
    );
  }
}
