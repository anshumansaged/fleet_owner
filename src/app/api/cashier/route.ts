import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { CashierTransaction, CashBalance } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type');
    
    const query: Record<string, unknown> = {};
    
    if (type && (type === 'deposit' || type === 'withdrawal')) {
      query.type = type;
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await CashierTransaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalTransactions = await CashierTransaction.countDocuments(query);
    
    // Get current cash balance
    const cashBalance = await CashBalance.findOne();
    
    return NextResponse.json({
      transactions,
      totalTransactions,
      currentPage: page,
      totalPages: Math.ceil(totalTransactions / limit),
      currentBalance: cashBalance?.currentBalance || 0
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching cashier transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cashier transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    
    const {
      type,
      amount,
      description,
      cashierName,
      ownerAuthenticated,
      transactionDate
    } = body;
    
    // Validate required fields
    if (!type || !amount || !description || !cashierName || ownerAuthenticated === undefined || !transactionDate) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate transaction type
    if (type !== 'deposit' && type !== 'withdrawal') {
      return NextResponse.json(
        { error: 'Transaction type must be either "deposit" or "withdrawal"' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Check current balance for withdrawals
    const currentBalance = await CashBalance.findOne();
    const balance = currentBalance?.currentBalance || 0;
    
    if (type === 'withdrawal' && amount > balance) {
      return NextResponse.json(
        { error: `Insufficient balance. Current balance: ₹${balance}` },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = new CashierTransaction({
      type,
      amount,
      description,
      cashierName,
      ownerAuthenticated,
      transactionDate: new Date(transactionDate)
    });

    await transaction.save();

    // Update cash balance
    const balanceChange = type === 'deposit' ? amount : -amount;
    
    if (currentBalance) {
      await CashBalance.findByIdAndUpdate(currentBalance._id, {
        $inc: { currentBalance: balanceChange },
        $set: { lastUpdated: new Date() }
      });
    } else {
      await CashBalance.create({
        currentBalance: Math.max(0, balanceChange),
        lastUpdated: new Date()
      });
    }

    // Get updated balance
    const updatedBalance = await CashBalance.findOne();

    return NextResponse.json({
      transaction,
      newBalance: updatedBalance?.currentBalance || 0
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating cashier transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create cashier transaction' },
      { status: 500 }
    );
  }
}
