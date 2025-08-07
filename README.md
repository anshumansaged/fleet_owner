# Fleet Management System

A comprehensive fleet management system built with Next.js, TypeScript, and MongoDB Atlas. This system manages driver earnings, expenses, cash flow, and salary calculations for a fleet of drivers with percentage-based compensation.

## Features

- **Driver Management**: Track multiple drivers with individual commission percentages
- **Trip Tracking**: Record trips across multiple platforms (Uber, InDrive, Yatri, Rapido, offline)
- **Real-time Calculations**: Automatic salary calculations based on gross earnings
- **Expense Management**: Track fuel costs, commissions, and other expenses
- **Cash Flow Monitoring**: Monitor cash collected, online payments, and cash in hand
- **Salary Payments**: Record and track salary payments with running balances
- **Owner Dashboard**: Comprehensive business analytics with profitability analysis, pending salaries, and risk assessment
- **WhatsApp Integration**: Generate WhatsApp-ready summaries for easy sharing
- **Cashier Management**: Handle cash transactions with owner authentication
- **Manual Refresh**: Data refreshes on user action, navigation, or manual refresh
- **Direct Database Storage**: All data is stored directly in MongoDB Atlas with instant persistence

## Driver Configuration

The system comes pre-configured with 4 drivers:

- **Vivek Bali**: 30% commission of total earnings
- **Preetam**: 35% commission of total earnings
- **Vikash Yadav**: 35% commission of total earnings
- **Chhotelal**: 35% commission of total earnings

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with custom UI components
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Icons**: Lucide React
- **Deployment**: Vercel (optimized for easy deployment)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd mvlt
npm install
```

### 2. Environment Configuration

Create `.env.local` in the root directory:

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fleet-management?retryWrites=true&w=majority

# Next.js Environment
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Owner authentication secret for cashier operations
OWNER_AUTH_SECRET=fleet-owner-secret-key
```

### 3. MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Replace the `MONGODB_URI` in your `.env.local` file

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Initialize System

On first visit, click "Initialize System" to create the default drivers and setup the database.

## Deployment on Vercel

### Method 1: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts and add environment variables
```

### Method 2: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `NEXTAUTH_SECRET`
   - `OWNER_AUTH_SECRET`
5. Deploy

### Environment Variables in Vercel

In your Vercel dashboard, add these environment variables:

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `NEXTAUTH_SECRET`: A random secret key
- `OWNER_AUTH_SECRET`: Secret for cashier operations

## API Endpoints

- `GET /api/dashboard` - Dashboard data with driver summaries
- `GET /api/drivers` - List all drivers
- `POST /api/init` - Initialize system with default drivers
- `GET /api/trips` - List trips with filtering
- `POST /api/trips` - Add new trip (stores directly to MongoDB)
- `GET /api/salary-payments` - List salary payments
- `POST /api/salary-payments` - Record salary payment (stores directly to MongoDB)
- `GET /api/cashier` - Cashier transactions
- `POST /api/cashier` - Add cashier transaction (stores directly to MongoDB)
- `GET /api/owner-dashboard` - Comprehensive owner analytics and business metrics

## Data Storage & Flow

### Direct MongoDB Integration

**Yes, all data is stored directly in MongoDB Atlas!** Here's how it works:

1. **Form Submission**: When you submit the add-trip form, data goes directly to MongoDB
2. **Instant Storage**: No intermediate files - everything is saved to the cloud database immediately
3. **Real-time Access**: Data is available instantly across all devices and sessions
4. **Automatic Backup**: MongoDB Atlas provides automatic backups and redundancy

### Database Collections

The system uses these MongoDB collections:

- **drivers**: Stores driver information (name, commission %, earnings, salary data)
- **trips**: Stores all trip data (earnings, expenses, platform details, calculations)
- **salarypayments**: Records when drivers receive salary payments
- **cashbalances**: Tracks cashier balance and transactions
- **cashiertransactions**: Logs all cash movements

### Data Persistence Flow

```
Add Trip Form → Next.js API Route → MongoDB Atlas → Instant Storage
     ↓                ↓                    ↓              ↓
User Input → /api/trips → Database Write → Real-time Dashboard Update
```

### What Gets Stored

When you submit a trip, here's exactly what gets saved to MongoDB:

```json
{
  "driverId": "driver_mongodb_id",
  "tripDate": "2025-08-07",
  "startKm": 1000,
  "endKm": 1400,
  "totalKm": 400,
  "platform": "multiple",
  "tripAmount": 5100,
  "commissionAmount": 147,
  "cashCollected": 4800,
  "onlinePayment": 1000,
  "fuelCost": 500,
  "otherExpenses": 100,
  "driverSalary": 0,
  "cashInDriverHand": 3200,
  "platformDetails": {
    "uber": { "earnings": 2000, "cash": 1500 },
    "indrive": { "earnings": 1000, "cash": 1200 },
    "yatri": { "earnings": 1000, "cash": 1000, "trips": 3 },
    "rapido": { "earnings": 100, "cash": 100 },
    "offline": { "earnings": 1000, "cash": 1000 }
  },
  "commissionDetails": {
    "uber": 117,
    "yatri": 30,
    "total": 147
  },
  "fuelEntries": [
    { "amount": 100, "description": "CNG" },
    { "amount": 400, "description": "Petrol" }
  ],
  "createdAt": "2025-08-07T10:30:00Z",
  "updatedAt": "2025-08-07T10:30:00Z"
}
```

### No Local Storage - 100% Cloud-Based

- **No local files**: Everything is stored in MongoDB Atlas cloud
- **No data loss**: Even if your computer crashes, all data is safe in the cloud  
- **Multi-device access**: Access your data from anywhere with internet
- **Automatic sync**: All changes are immediately available on all devices
- **Professional grade**: MongoDB Atlas provides enterprise-level security and reliability

## Key Features Explained

### Automated Trip Entry Flow

The system follows this automated calculation flow:

#### 1. Basic Trip Information
- **Date Selection**: Choose trip date
- **Driver Selection**: Select from 4 configured drivers
- **KM Tracking**: Enter Start KM and End KM
- **Auto Calculation**: Total KM = End KM - Start KM (displayed automatically)

#### 2. Platform Earnings Entry
Enter earnings from multiple platforms:
- **Uber**: ₹2000 (example)
- **InDrive**: ₹1000 
- **Yatri Sathi**: ₹1000 (when entered, trips input field appears automatically)
- **Rapido**: ₹100
- **Offline**: ₹1000

**Yatri Sathi Integration**: When Yatri earnings are entered, system automatically shows trips input field for commission calculation.

#### 3. Commission Calculations (Automated)
- **Uber Commission**: Fixed ₹117 (checkbox to enable/disable)
- **Yatri Sathi Commission**: Number of trips × ₹10 (e.g., 3 trips × ₹10 = ₹30)
- **Total Commission**: Auto-calculated and displayed
- **Net Earnings**: Total Earnings - Total Commission

#### 4. Cash Collection
Enter cash collected by platform (auto-fills to match earnings for some platforms):
- **Uber Cash**: ₹1500 (manual entry)
- **InDrive Cash**: ₹1200 (manual entry)
- **Yatri Cash**: ₹1000 (auto-matches earnings)
- **Rapido Cash**: ₹100 (auto-matches earnings)
- **Offline Cash**: ₹1000 (auto-matches earnings)
- **Total Cash Collected**: Auto-calculated (₹4800 in example)

#### 5. Expenses Management
- **Fuel Expenses**: Multiple entries with descriptions (CNG/Petrol options)
  - Entry 1: ₹100 (CNG)
  - Entry 2: ₹400 (Petrol)
  - Total Fuel: ₹500
- **Other Expenses**: ₹100 (single field)

#### 6. Payment Processing
- **Online Payments**: ₹1000 (received online)
- **Driver Salary (Automated)**: If "Driver took salary today" is checked, automatically calculates:
  - Formula: Net Earnings × Driver Commission %
  - Example: ₹4953 × 30% = ₹1485.90 (for Vivek Bali)
  - Displays calculation breakdown in real-time
- **Cash in Driver Hand**: Auto-calculated = Total Cash - Fuel - Online - Other Expenses - Driver Salary (if taken)
  - Without salary: ₹4800 - ₹500 - ₹1000 - ₹100 = ₹3200
  - With salary: ₹4800 - ₹500 - ₹1000 - ₹100 - ₹1485.90 = ₹1714.10

#### 7. Cashier Management
- **Cashier Collection Message**: "Cashier has to collect ₹3200"
- **Cash to Cashier**: Input field for amount given to cashier
- **Net Cash Transfer**: Auto-calculated = Cash to Cashier Input - Cash in Driver Hand
- **Remaining Amount**: Displayed as balance

### Complete Example Flow

Here's a complete example following the automated calculation system:

**Step 1: Basic Information**
- Date: Today's date
- Driver: Vivek Bali (30% commission)
- Start KM: 1000, End KM: 1400
- **Auto-calculated**: Total KM = 400 km

**Step 2: Platform Earnings**
- Uber: ₹2000
- InDrive: ₹1000  
- Yatri Sathi: ₹1000 (triggers trips input → 3 trips)
- Rapido: ₹100
- Offline: ₹1000
- **Total Earnings**: ₹5100

**Step 3: Commission Calculations (Automated)**
- Uber Commission: ₹117 (fixed)
- Yatri Commission: 3 trips × ₹10 = ₹30
- **Total Commission**: ₹147
- **Net Earnings**: ₹5100 - ₹147 = ₹4953

**Step 4: Cash Collection (Auto-filled for some platforms)**
- Uber Cash: ₹1500 (manual)
- InDrive Cash: ₹1200 (manual)
- Yatri Cash: ₹1000 (auto-matches earnings)
- Rapido Cash: ₹100 (auto-matches earnings)
- Offline Cash: ₹1000 (auto-matches earnings)
- **Total Cash**: ₹4800

**Step 5: Expenses**
- Fuel Entry 1: ₹100 (CNG)
- Fuel Entry 2: ₹400 (Petrol)
- **Total Fuel**: ₹500
- Other Expenses: ₹100

**Step 6: Payments**
- Online Payments: ₹1000
- Driver Salary: ₹0 (not taking salary today)
- **If Driver Takes Salary**: Auto-calculated as 30% of Net Earnings (₹4953 × 30% = ₹1485.90)

**Step 7: Final Calculations (Automated)**
- **Without Driver Salary**: Cash in Driver Hand = ₹4800 - ₹500 - ₹1000 - ₹100 = ₹3200
- **With Driver Salary**: Cash in Driver Hand = ₹4800 - ₹500 - ₹1000 - ₹100 - ₹1485.90 = ₹1714.10
- **Message**: "Cashier has to collect ₹3200" (or ₹1714.10 if salary taken)
- **Cash to Cashier**: Enter amount (e.g., ₹3000)
- **Remaining with Driver**: ₹3200 - ₹3000 = ₹200

### Financial Calculation Logic

1. **Driver Salary**: Calculated as percentage of gross trip amount (before expenses)
2. **Net Amount**: Trip amount minus all expenses (fuel, commission, other)
3. **Cash in Hand**: Cash collected + online payments - fuel costs - driver salary (if paid immediately)
4. **Pending Salary**: Running total of earned vs paid salary amounts

### Real-time Updates

- Dashboard refreshes on user actions (manual refresh, navigation, form submissions)
- Immediate updates after data changes through user interactions
- Live calculation of all financial metrics during form entry

### WhatsApp Integration

- One-click copy of formatted trip summaries
- Direct WhatsApp sharing with pre-filled messages
- Platform-wise earnings breakdown
- Recent trips and payment history

### Owner Dashboard

The comprehensive Owner Dashboard provides business analytics and complete financial oversight:

#### Financial Overview
- **Total Revenue**: Real-time revenue tracking across all platforms
- **Net Profit**: Calculated profit after all expenses and pending salaries
- **Profit Margin**: Percentage-based profitability analysis
- **Cash Flow**: Total liquidity including driver cash and cashier balance

#### Business Intelligence
- **Pending Salaries**: Critical overview of all outstanding driver payments
- **Risk Assessment**: Automated alerts for high pending amounts, low profitability, and operational issues
- **Performance Metrics**: Driver efficiency scoring and platform performance analysis
- **Target Achievement**: Daily/weekly/monthly goal tracking with visual progress indicators

#### Operational Analytics
- **Platform Revenue Distribution**: Detailed breakdown of earnings by platform (Uber, InDrive, Yatri, etc.)
- **Driver Performance Matrix**: Individual driver analytics with efficiency scores and earnings
- **Expense Analysis**: Fuel cost ratios, commission tracking, and operational cost optimization
- **Recent Activity Feed**: Real-time transaction monitoring and business activity tracking

#### Data Privacy & Security
- **Sensitive Data Toggle**: Hide/show financial amounts for privacy
- **Period Filtering**: View data by Today, Week, Month, or All Time
- **Real-time Refresh**: Instant data updates with manual refresh capability

The Owner Dashboard transforms raw operational data into actionable business insights, helping optimize fleet performance and maximize profitability.

## Production Considerations

### Security

- Environment variables for sensitive data
- Input validation on all API endpoints
- Mongoose schema validation
- Error handling and logging

### Performance

- MongoDB connection pooling
- Efficient aggregation pipelines
- Optimized API responses
- Client-side caching with auto-refresh

### Monitoring

- Error logging in production
- Database connection monitoring
- API response time tracking

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── add-trip/          # Add trip page
│   ├── globals.css        # Global styles
│   └── page.tsx           # Main dashboard
├── components/ui/         # Reusable UI components
├── lib/                   # Utility functions
│   ├── calculations.ts    # Financial calculations
│   ├── mongodb.ts         # Database connection
│   └── utils.ts           # General utilities
└── models/                # MongoDB schemas
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the GitHub issues
2. Review the API documentation
3. Check MongoDB Atlas connection
4. Verify environment variables

## License

This project is licensed under the MIT License.
