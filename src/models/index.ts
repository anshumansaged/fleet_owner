import mongoose, { Schema, Document } from 'mongoose';

// Driver interface and schema
export interface IDriver extends Document {
  name: string;
  commissionPercentage: number;
  totalEarnings: number;
  totalSalaryPaid: number;
  pendingSalary: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>({
  name: { type: String, required: true, unique: true },
  commissionPercentage: { type: Number, required: true },
  totalEarnings: { type: Number, default: 0 },
  totalSalaryPaid: { type: Number, default: 0 },
  pendingSalary: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Trip interface and schema
export interface ITrip extends Document {
  driverId: mongoose.Types.ObjectId;
  driverName: string;
  platform: 'uber' | 'indrive' | 'yatri' | 'rapido' | 'offline' | 'multiple';
  tripAmount: number;
  commissionAmount: number;
  fuelCost: number;
  otherExpenses: number;
  cashCollected: number;
  onlinePayment: number;
  netAmount: number;
  cashInHand: number;
  cashInDriverHand: number;
  driverSalary: number;
  startKm?: number;
  endKm?: number;
  totalKm?: number;
  driverTookSalary?: boolean;
  cashGivenToCashier?: boolean;
  cashToCashier?: number;
  notes?: string;
  tripDate: Date;
  platformDetails?: {
    uber?: { earnings: number; cash: number; commission?: number };
    indrive?: { earnings: number; cash: number; commission?: number };
    yatri?: { earnings: number; cash: number; trips?: number; commission?: number };
    rapido?: { earnings: number; cash: number; commission?: number };
    offline?: { earnings: number; cash: number; commission?: number };
  };
  commissionDetails?: {
    uber?: number;
    yatri?: number;
    total?: number;
  };
  fuelEntries?: Array<{
    id?: string;
    amount: number;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>({
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  driverName: { type: String, required: true },
  platform: { 
    type: String, 
    enum: ['uber', 'indrive', 'yatri', 'rapido', 'offline', 'multiple'], 
    required: true 
  },
  tripAmount: { type: Number, required: true },
  commissionAmount: { type: Number, default: 0 },
  fuelCost: { type: Number, default: 0 },
  otherExpenses: { type: Number, default: 0 },
  cashCollected: { type: Number, default: 0 },
  onlinePayment: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  cashInHand: { type: Number, required: true },
  cashInDriverHand: { type: Number, default: 0 },
  driverSalary: { type: Number, required: true },
  startKm: { type: Number },
  endKm: { type: Number },
  totalKm: { type: Number },
  driverTookSalary: { type: Boolean, default: false },
  cashGivenToCashier: { type: Boolean, default: false },
  cashToCashier: { type: Number, default: 0 },
  notes: { type: String },
  tripDate: { type: Date, required: true },
  platformDetails: {
    type: {
      uber: {
        earnings: { type: Number },
        cash: { type: Number },
        commission: { type: Number }
      },
      indrive: {
        earnings: { type: Number },
        cash: { type: Number },
        commission: { type: Number }
      },
      yatri: {
        earnings: { type: Number },
        cash: { type: Number },
        trips: { type: Number },
        commission: { type: Number }
      },
      rapido: {
        earnings: { type: Number },
        cash: { type: Number },
        commission: { type: Number }
      },
      offline: {
        earnings: { type: Number },
        cash: { type: Number },
        commission: { type: Number }
      }
    },
    required: false
  },
  commissionDetails: {
    type: {
      uber: { type: Number },
      yatri: { type: Number },
      total: { type: Number }
    },
    required: false
  },
  fuelEntries: {
    type: [{
      id: { type: String },
      amount: { type: Number, required: true },
      description: { type: String, required: true }
    }],
    default: []
  },
}, {
  timestamps: true
});

// Monthly Salary Summary interface and schema
export interface IMonthlySalarySummary extends Document {
  driverId: mongoose.Types.ObjectId;
  driverName: string;
  month: number; // 1-12
  year: number;
  totalEarningsThisMonth: number;
  totalSalaryThisMonth: number; // calculated based on commission percentage
  totalPaidThisMonth: number;
  remainingSalaryThisMonth: number;
  paymentsThisMonth: number; // count of payments
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlySalarySummarySchema = new Schema<IMonthlySalarySummary>({
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  driverName: { type: String, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  totalEarningsThisMonth: { type: Number, default: 0 },
  totalSalaryThisMonth: { type: Number, default: 0 },
  totalPaidThisMonth: { type: Number, default: 0 },
  remainingSalaryThisMonth: { type: Number, default: 0 },
  paymentsThisMonth: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Create unique index for driver per month/year
MonthlySalarySummarySchema.index({ driverId: 1, month: 1, year: 1 }, { unique: true });

// Salary Payment interface and schema
export interface ISalaryPayment extends Document {
  driverId: mongoose.Types.ObjectId;
  driverName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi';
  notes?: string;
  month: number; // 1-12 (for easy monthly filtering)
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const SalaryPaymentSchema = new Schema<ISalaryPayment>({
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
  driverName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'bank_transfer', 'upi'], 
    required: true 
  },
  notes: { type: String },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
}, {
  timestamps: true
});

// Cashier Transaction interface and schema
export interface ICashierTransaction extends Document {
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  cashierName: string;
  ownerAuthenticated: boolean;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CashierTransactionSchema = new Schema<ICashierTransaction>({
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  cashierName: { type: String, required: true },
  ownerAuthenticated: { type: Boolean, required: true },
  transactionDate: { type: Date, required: true },
}, {
  timestamps: true
});

// Cash Balance interface and schema
export interface ICashBalance extends Document {
  currentBalance: number;
  lastUpdated: Date;
}

const CashBalanceSchema = new Schema<ICashBalance>({
  currentBalance: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

// Helper function to get models (only create them when needed)
export function getModels() {
  return {
    Driver: mongoose.models.Driver || mongoose.model<IDriver>('Driver', DriverSchema),
    Trip: mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema),
    SalaryPayment: mongoose.models.SalaryPayment || mongoose.model<ISalaryPayment>('SalaryPayment', SalaryPaymentSchema),
    MonthlySalarySummary: mongoose.models.MonthlySalarySummary || mongoose.model<IMonthlySalarySummary>('MonthlySalarySummary', MonthlySalarySummarySchema),
    CashierTransaction: mongoose.models.CashierTransaction || mongoose.model<ICashierTransaction>('CashierTransaction', CashierTransactionSchema),
    CashBalance: mongoose.models.CashBalance || mongoose.model<ICashBalance>('CashBalance', CashBalanceSchema)
  };
}

// Export individual models with lazy loading
export const Driver = mongoose.models.Driver || mongoose.model<IDriver>('Driver', DriverSchema);
export const Trip = mongoose.models.Trip || mongoose.model<ITrip>('Trip', TripSchema);
export const SalaryPayment = mongoose.models.SalaryPayment || mongoose.model<ISalaryPayment>('SalaryPayment', SalaryPaymentSchema);
export const MonthlySalarySummary = mongoose.models.MonthlySalarySummary || mongoose.model<IMonthlySalarySummary>('MonthlySalarySummary', MonthlySalarySummarySchema);
export const CashierTransaction = mongoose.models.CashierTransaction || mongoose.model<ICashierTransaction>('CashierTransaction', CashierTransactionSchema);
export const CashBalance = mongoose.models.CashBalance || mongoose.model<ICashBalance>('CashBalance', CashBalanceSchema);
