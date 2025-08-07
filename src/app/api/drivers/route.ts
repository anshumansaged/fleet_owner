import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Driver } from '@/models';

export async function GET() {
  try {
    await connectDB();
    const drivers = await Driver.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ drivers }, { status: 200 });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { name, commissionPercentage } = body;
    
    if (!name || !commissionPercentage) {
      return NextResponse.json(
        { error: 'Name and commission percentage are required' },
        { status: 400 }
      );
    }

    const existingDriver = await Driver.findOne({ name });
    if (existingDriver) {
      return NextResponse.json(
        { error: 'Driver with this name already exists' },
        { status: 409 }
      );
    }

    const driver = new Driver({
      name,
      commissionPercentage,
      totalEarnings: 0,
      totalSalaryPaid: 0,
      pendingSalary: 0,
      isActive: true
    });

    await driver.save();
    
    return NextResponse.json({ driver }, { status: 201 });
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json(
      { error: 'Failed to create driver' },
      { status: 500 }
    );
  }
}
