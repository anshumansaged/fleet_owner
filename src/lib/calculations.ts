import { ITrip, IDriver } from '@/models';

export interface TripCalculation {
  driverSalary: number;
  netAmount: number;
  cashInHand: number;
  totalExpenses: number;
}

export interface DriverSummary {
  name: string;
  totalEarnings: number;
  totalSalary: number;
  pendingSalary: number;
  commissionPercentage: number;
  platformBreakdown: {
    uber: number;
    indrive: number;
    yatri: number;
    rapido: number;
    offline: number;
  };
  totalTrips: number;
}

export interface BusinessMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  totalFuelCosts: number;
  totalPendingSalaries: number;
  totalCashFlow: number;
  profitMargin: number;
  fuelCostRatio: number;
  avgRevenuePerTrip: number;
  avgProfitPerTrip: number;
  topPerformingPlatform: string;
  riskScore: number;
}

export class FleetCalculations {
  /**
   * Calculate driver salary, net amount, and cash in hand for a trip
   */
  static calculateTripFinancials(
    tripAmount: number,
    commissionPercentage: number,
    fuelCost: number = 0,
    otherExpenses: number = 0,
    cashCollected: number = 0,
    onlinePayment: number = 0,
    commissionAmount: number = 0
  ): TripCalculation {
    // Driver salary is calculated on gross earnings before expenses
    const driverSalary = (tripAmount * commissionPercentage) / 100;
    
    // Total expenses including commission
    const totalExpenses = fuelCost + otherExpenses + commissionAmount;
    
    // Net amount is total earnings minus expenses
    const netAmount = tripAmount - totalExpenses;
    
    // Cash in hand calculation
    const totalCollected = cashCollected + onlinePayment;
    const cashInHand = totalCollected - fuelCost - (totalCollected > 0 ? driverSalary : 0);
    
    return {
      driverSalary,
      netAmount,
      cashInHand,
      totalExpenses
    };
  }

  /**
   * Generate WhatsApp-ready summary for a driver
   */
  static generateWhatsAppSummary(
    driverSummary: DriverSummary,
    trips: ITrip[],
    dateRange?: { from: Date; to: Date }
  ): string {
    const dateStr = dateRange 
      ? `(${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()})`
      : '';

    // Calculate additional summary data
    let grossEarnings = 0;
    let totalCommissions = 0;
    let totalExpenses = 0;
    let totalCashCollected = 0;
    let totalOnlinePayments = 0;
    
    trips.forEach(trip => {
      grossEarnings += trip.tripAmount;
      totalCommissions += trip.commissionAmount || 0;
      totalExpenses += (trip.fuelCost || 0) + (trip.otherExpenses || 0);
      totalCashCollected += trip.cashCollected || 0;
      totalOnlinePayments += trip.onlinePayment || 0;
    });

    const netEarnings = grossEarnings - totalCommissions;
    const salaryPercentage = driverSummary.commissionPercentage;
    const calculatedSalary = (netEarnings * salaryPercentage) / 100;

    let summary = `🚗 *Fleet Management Report* ${dateStr}\n\n`;
    summary += `👤 *Driver:* ${driverSummary.name}\n`;
    summary += `💼 *Commission Rate:* ${salaryPercentage}%\n\n`;
    
    summary += `📊 *Financial Summary:*\n`;
    summary += `💰 Gross Earnings: ₹${grossEarnings.toFixed(2)}\n`;
    summary += `📉 Platform Commissions: -₹${totalCommissions.toFixed(2)}\n`;
    summary += `✅ Net Earnings: ₹${netEarnings.toFixed(2)}\n`;
    summary += `💵 Driver Salary (${salaryPercentage}%): ₹${calculatedSalary.toFixed(2)}\n`;
    summary += `🔄 Salary Paid: ₹${driverSummary.totalSalary.toFixed(2)}\n`;
    summary += `⏳ Pending Salary: ₹${driverSummary.pendingSalary.toFixed(2)}\n`;
    summary += `🚕 Total Trips: ${driverSummary.totalTrips}\n\n`;
    
    summary += `🏢 *Platform Breakdown (Net Earnings):*\n`;
    summary += `🟡 Uber: ₹${driverSummary.platformBreakdown.uber.toFixed(2)}\n`;
    summary += `🔵 InDrive: ₹${driverSummary.platformBreakdown.indrive.toFixed(2)}\n`;
    summary += `🟢 Yatri: ₹${driverSummary.platformBreakdown.yatri.toFixed(2)}\n`;
    summary += `🟠 Rapido: ₹${driverSummary.platformBreakdown.rapido.toFixed(2)}\n`;
    summary += `⚫ Offline: ₹${driverSummary.platformBreakdown.offline.toFixed(2)}\n\n`;
    
    if (totalExpenses > 0 || totalCashCollected > 0) {
      summary += `💼 *Cash Flow:*\n`;
      summary += `💴 Cash Collected: ₹${totalCashCollected.toFixed(2)}\n`;
      summary += `💳 Online Payments: ₹${totalOnlinePayments.toFixed(2)}\n`;
      if (totalExpenses > 0) {
        summary += `⛽ Total Expenses: ₹${totalExpenses.toFixed(2)}\n`;
      }
      summary += `\n`;
    }
    
    if (trips.length > 0) {
      summary += `📋 *Recent Trips:*\n`;
      trips.slice(-5).reverse().forEach((trip, index) => {
        const tripDate = new Date(trip.tripDate).toLocaleDateString('en-IN');
        
        // Show meaningful platform info
        let platformInfo = '';
        if (trip.platform === 'multiple') {
          const activePlatforms = [];
          if (trip.platformDetails?.uber?.earnings) activePlatforms.push(`Uber: ₹${trip.platformDetails.uber.earnings}`);
          if (trip.platformDetails?.indrive?.earnings) activePlatforms.push(`InDrive: ₹${trip.platformDetails.indrive.earnings}`);
          if (trip.platformDetails?.yatri?.earnings) activePlatforms.push(`Yatri: ₹${trip.platformDetails.yatri.earnings}`);
          if (trip.platformDetails?.rapido?.earnings) activePlatforms.push(`Rapido: ₹${trip.platformDetails.rapido.earnings}`);
          if (trip.platformDetails?.offline?.earnings) activePlatforms.push(`Offline: ₹${trip.platformDetails.offline.earnings}`);
          
          platformInfo = activePlatforms.length > 0 ? activePlatforms.join(', ') : 'Multiple Platforms';
        } else {
          platformInfo = trip.platform.charAt(0).toUpperCase() + trip.platform.slice(1);
        }
        
        summary += `${index + 1}. ${platformInfo} - Total: ₹${trip.tripAmount} (${tripDate})\n`;
      });
    }
    
    summary += `\n📱 Generated by Fleet Management System`;
    
    return summary;
  }

  /**
   * Calculate driver summary from trips
   */
  static calculateDriverSummary(driver: IDriver, trips: ITrip[]): DriverSummary {
    const platformBreakdown = {
      uber: 0,
      indrive: 0,
      yatri: 0,
      rapido: 0,
      offline: 0
    };

    let totalEarnings = 0;
    let totalSalaryPaid = 0;
    let totalEarnedSalary = 0;

    trips.forEach(trip => {
      // Use net earnings (total - commission) instead of gross earnings
      const netEarnings = trip.tripAmount - trip.commissionAmount;
      totalEarnings += netEarnings;
      
      // Calculate what the driver should earn from this trip (commission percentage of net earnings)
      const earnedSalary = (netEarnings * driver.commissionPercentage) / 100;
      totalEarnedSalary += earnedSalary;
      
      // Add only the salary that was actually paid during this trip
      totalSalaryPaid += trip.driverSalary || 0;
      
      // Handle platform breakdown for multiple platforms
      if (trip.platform === 'multiple') {
        // Check if the trip has platformDetails and use that for breakdown
        if (trip.platformDetails) {
          const details = trip.platformDetails;
          if (details.uber?.earnings) platformBreakdown.uber += details.uber.earnings - (details.uber.commission || 0);
          if (details.indrive?.earnings) platformBreakdown.indrive += details.indrive.earnings - (details.indrive.commission || 0);
          if (details.yatri?.earnings) platformBreakdown.yatri += details.yatri.earnings - (details.yatri.commission || 0);
          if (details.rapido?.earnings) platformBreakdown.rapido += details.rapido.earnings - (details.rapido.commission || 0);
          if (details.offline?.earnings) platformBreakdown.offline += details.offline.earnings - (details.offline.commission || 0);
        } else {
          // Fallback: add to a general category or split evenly
          // For now, we'll add to offline as it's the most generic
          platformBreakdown.offline += netEarnings;
        }
      } else {
        // Single platform trip
        if (platformBreakdown.hasOwnProperty(trip.platform)) {
          platformBreakdown[trip.platform as keyof typeof platformBreakdown] += netEarnings;
        }
      }
    });

    // Calculate total salary from both trip payments and separate salary payments
    const totalSalaryFromPayments = driver.totalSalaryPaid || 0;
    const totalSalaryReceived = totalSalaryPaid + totalSalaryFromPayments;
    
    // Pending salary is what they should have earned minus what they've received
    const pendingSalary = Math.max(0, totalEarnedSalary - totalSalaryReceived);

    return {
      name: driver.name,
      totalEarnings,
      totalSalary: totalEarnedSalary, // Total salary they should have earned
      pendingSalary,
      commissionPercentage: driver.commissionPercentage,
      platformBreakdown,
      totalTrips: trips.length
    };
  }

  /**
   * Calculate comprehensive business metrics for owner analytics
   */
  static calculateBusinessMetrics(drivers: IDriver[], trips: ITrip[]): BusinessMetrics {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalFuelCosts = 0;
    let totalSalariesPaid = 0;
    let totalSalariesEarned = 0;
    
    const platformRevenue = {
      uber: 0,
      indrive: 0,
      yatri: 0,
      rapido: 0,
      offline: 0
    };

    // Process all trips
    trips.forEach(trip => {
      const netEarnings = trip.tripAmount - (trip.commissionAmount || 0);
      totalRevenue += netEarnings;
      totalExpenses += (trip.fuelCost || 0) + (trip.otherExpenses || 0);
      totalFuelCosts += trip.fuelCost || 0;
      totalSalariesPaid += trip.driverSalary || 0;

      // Find driver for this trip
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const driver = drivers.find((d: any) => d._id.toString() === trip.driverId.toString());
      if (driver) {
        totalSalariesEarned += (netEarnings * driver.commissionPercentage) / 100;
      }

      // Platform revenue tracking
      if (trip.platform === 'multiple' && trip.platformDetails) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(trip.platformDetails).forEach(([platform, details]: [string, any]) => {
          if (details?.earnings && platformRevenue.hasOwnProperty(platform)) {
            const platformNet = details.earnings - (details.commission || 0);
            platformRevenue[platform as keyof typeof platformRevenue] += platformNet;
          }
        });
      } else if (platformRevenue.hasOwnProperty(trip.platform)) {
        platformRevenue[trip.platform as keyof typeof platformRevenue] += netEarnings;
      }
    });

    // Add salary payments from driver records
    drivers.forEach(driver => {
      totalSalariesPaid += driver.totalSalaryPaid || 0;
    });

    const totalPendingSalaries = Math.max(0, totalSalariesEarned - totalSalariesPaid);
    const totalProfit = totalRevenue - totalExpenses - totalSalariesEarned;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const fuelCostRatio = totalRevenue > 0 ? (totalFuelCosts / totalRevenue) * 100 : 0;
    const avgRevenuePerTrip = trips.length > 0 ? totalRevenue / trips.length : 0;
    const avgProfitPerTrip = trips.length > 0 ? totalProfit / trips.length : 0;
    const totalCashFlow = totalRevenue - totalExpenses - totalPendingSalaries;

    // Find top performing platform
    const topPerformingPlatform = Object.entries(platformRevenue)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    // Calculate risk score (0-100, lower is better)
    let riskScore = 0;
    if (fuelCostRatio > 25) riskScore += 20;
    if (profitMargin < 10) riskScore += 30;
    if (totalPendingSalaries > totalRevenue * 0.2) riskScore += 25;
    if (totalCashFlow < 0) riskScore += 25;

    return {
      totalRevenue,
      totalProfit,
      totalExpenses,
      totalFuelCosts,
      totalPendingSalaries,
      totalCashFlow,
      profitMargin,
      fuelCostRatio,
      avgRevenuePerTrip,
      avgProfitPerTrip,
      topPerformingPlatform,
      riskScore
    };
  }

  /**
   * Get default driver configurations
   */
  static getDefaultDrivers() {
    return [
      {
        name: 'Vivek Bali',
        commissionPercentage: 30,
        totalEarnings: 0,
        totalSalaryPaid: 0,
        pendingSalary: 0,
        isActive: true
      },
      {
        name: 'Preetam',
        commissionPercentage: 35,
        totalEarnings: 0,
        totalSalaryPaid: 0,
        pendingSalary: 0,
        isActive: true
      },
      {
        name: 'Chhotelal',
        commissionPercentage: 35,
        totalEarnings: 0,
        totalSalaryPaid: 0,
        pendingSalary: 0,
        isActive: true
      },
      {
        name: 'Vikash Yadav',
        commissionPercentage: 35,
        totalEarnings: 0,
        totalSalaryPaid: 0,
        pendingSalary: 0,
        isActive: true
      }
    ];
  }
}
