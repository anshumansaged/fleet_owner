'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Navigation, 
  Fuel,
  CheckCircle,
  Save,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Driver {
  _id: string;
  name: string;
  commissionPercentage: number;
}

interface FuelEntry {
  id: string;
  amount: number;
  description: string;
}

interface FormData {
  tripDate: string;
  driverId: string;
  startKm: string;
  endKm: string;
  uberEarnings: string;
  indriveEarnings: string;
  yatriEarnings: string;
  rapidoEarnings: string;
  offlineEarnings: string;
  uberCash: string;
  indriveCash: string;
  yatriCash: string;
  rapidoCash: string;
  offlineCash: string;
  onlinePayment: string;
  cashToCashier: string;
  otherExpenses: string;
  hasUberCommission: boolean;
  yatriTrips: string;
  driverTookSalary: boolean;
  cashGivenToCashier: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Trip Details',
    description: 'Basic trip information',
    icon: Navigation,
  },
  {
    id: 2,
    title: 'Platform Earnings & Cash',
    description: 'Earnings and cash from platforms',
    icon: DollarSign,
  },
  {
    id: 3,
    title: 'Expenses',
    description: 'Fuel and other expenses',
    icon: Save,
  },
];

export default function AddTrip() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [justMovedToStep3, setJustMovedToStep3] = useState(false);
  const [showCashierSection, setShowCashierSection] = useState(false);
  
  // Negative cash handling states
  const [showNegativeCashModal, setShowNegativeCashModal] = useState(false);
  const [negativeAmount, setNegativeAmount] = useState(0);
  const [negativeHandlingOption, setNegativeHandlingOption] = useState<'salary' | 'cashier' | null>(null);
  const [amountFromCashier, setAmountFromCashier] = useState('');
  
  // WhatsApp summary states
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [tripSummary, setTripSummary] = useState<Record<string, unknown> | null>(null);

  const [formData, setFormData] = useState<FormData>({
    tripDate: '',
    driverId: '',
    startKm: '',
    endKm: '',
    uberEarnings: '',
    indriveEarnings: '',
    yatriEarnings: '',
    rapidoEarnings: '',
    offlineEarnings: '',
    uberCash: '',
    indriveCash: '',
    yatriCash: '',
    rapidoCash: '',
    offlineCash: '',
    onlinePayment: '',
    cashToCashier: '',
    otherExpenses: '',
    hasUberCommission: false,
    yatriTrips: '',
    driverTookSalary: false,
    cashGivenToCashier: false,
  });

  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);

  useEffect(() => {
    fetchDrivers();
    // Set today's date after component mounts to avoid hydration mismatch
    setFormData(prev => ({
      ...prev,
      tripDate: new Date().toISOString().split('T')[0]
    }));
    
    // Mark initial load as complete after a brief delay
    setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    
    // Add event listener to track what's causing form submissions
    const handleFormEvents = (e: Event) => {
      console.log('Form event detected:', e.type, e.target);
    };
    
    document.addEventListener('submit', handleFormEvents);
    document.addEventListener('keydown', handleFormEvents);
    
    return () => {
      document.removeEventListener('submit', handleFormEvents);
      document.removeEventListener('keydown', handleFormEvents);
    };
  }, []);

  // Check for negative cash when moving to step 3 or when values change on step 3
  useEffect(() => {
    if (currentStep === 3) {
      const totalCash = calculateTotalCash();
      const onlinePayment = parseFloat(formData.onlinePayment || '0');
      const totalFuelCost = fuelEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const otherExpenses = parseFloat(formData.otherExpenses || '0');
      const driverSalary = formData.driverTookSalary ? calculateDriverSalary() : 0;
      const cashToCashier = parseFloat(formData.cashToCashier || '0');
      const cashInHand = totalCash - onlinePayment - totalFuelCost - otherExpenses - driverSalary - cashToCashier;
      
      if (cashInHand < 0 && !negativeHandlingOption && !showNegativeCashModal) {
        setNegativeAmount(Math.abs(cashInHand));
        setShowNegativeCashModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, formData.onlinePayment, formData.otherExpenses, formData.driverTookSalary, formData.cashToCashier, fuelEntries, negativeHandlingOption, showNegativeCashModal]);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Only trigger auto-save after initial load is complete
    if (!isInitialLoad) {
      triggerAutoSave();
    }
  };

  const triggerAutoSave = () => {
    setAutoSaveStatus('saving');
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 2000);
    }, 1000);
  };

  const addFuelEntry = () => {
    const newEntry: FuelEntry = {
      id: Date.now().toString(),
      amount: 0,
      description: ''
    };
    setFuelEntries([...fuelEntries, newEntry]);
  };

  const updateFuelEntry = (id: string, field: 'amount' | 'description', value: number | string) => {
    setFuelEntries(entries => 
      entries.map(entry => 
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const removeFuelEntry = (id: string) => {
    setFuelEntries(entries => entries.filter(entry => entry.id !== id));
  };

  const calculateTotalKm = () => {
    const startKm = parseFloat(formData.startKm || '0');
    const endKm = parseFloat(formData.endKm || '0');
    return endKm - startKm;
  };

  const calculateTotalCash = () => {
    return (
      parseFloat(formData.uberCash || '0') +
      parseFloat(formData.indriveCash || '0') +
      parseFloat(formData.yatriCash || '0') +
      parseFloat(formData.rapidoCash || '0') +
      parseFloat(formData.offlineCash || '0')
    );
  };

  const calculateUberCommission = () => {
    return formData.hasUberCommission ? 117 : 0;
  };

  const calculateYatriCommission = () => {
    const trips = parseInt(formData.yatriTrips) || 0;
    return trips * 10;
  };

  const calculateTotalCommission = () => {
    return calculateUberCommission() + calculateYatriCommission();
  };

  const calculateDriverSalary = () => {
    if (!drivers || drivers.length === 0) return 0;
    const selectedDriver = drivers.find(d => d._id === formData.driverId);
    if (!selectedDriver) return 0;
    
    const totalEarnings = 
      parseFloat(formData.uberEarnings || '0') +
      parseFloat(formData.indriveEarnings || '0') +
      parseFloat(formData.yatriEarnings || '0') +
      parseFloat(formData.rapidoEarnings || '0') +
      parseFloat(formData.offlineEarnings || '0');
    
    const totalCommission = calculateTotalCommission();
    const netEarnings = totalEarnings - totalCommission;
    
    return (netEarnings * selectedDriver.commissionPercentage) / 100;
  };

  const calculateCashInDriverHand = () => {
    const totalCash = calculateTotalCash();
    const onlinePayment = parseFloat(formData.onlinePayment || '0');
    const totalFuelCost = fuelEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const otherExpenses = parseFloat(formData.otherExpenses || '0');
    const driverSalary = formData.driverTookSalary ? calculateDriverSalary() : 0;
    const cashToCashier = parseFloat(formData.cashToCashier || '0');
    
    let cashInHand = totalCash - onlinePayment - totalFuelCost - otherExpenses - driverSalary - cashToCashier;
    
    // If negative cash handling option is selected, adjust the calculation
    if (negativeHandlingOption === 'cashier' && amountFromCashier) {
      cashInHand += parseFloat(amountFromCashier);
    }
    
    return cashInHand;
  };

  // Handle negative cash scenarios
  const handleNegativeCashOption = (option: 'salary' | 'cashier') => {
    setNegativeHandlingOption(option);
    setShowNegativeCashModal(false);
    
    if (option === 'salary') {
      // Add negative amount to driver salary
      setFormData(prev => ({ ...prev, driverTookSalary: true }));
    } else if (option === 'cashier') {
      // Set amount to take from cashier
      setAmountFromCashier(negativeAmount.toString());
    }
  };

  // Generate WhatsApp summary
  const generateWhatsAppSummary = () => {
    const selectedDriver = drivers.find(d => d._id === formData.driverId);
    const totalEarnings = calculateTotalEarnings();
    const totalCommission = calculateTotalCommission();
    const netEarnings = totalEarnings - totalCommission;
    const totalCash = calculateTotalCash();
    const totalFuel = fuelEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const driverSalaryAmount = calculateDriverSalary();
    const cashInHand = calculateCashInDriverHand();
    const otherExpenses = parseFloat(formData.otherExpenses || '0');
    const cashToCashier = parseFloat(formData.cashToCashier || '0');
    
    // Payment status - only show salary info if driver actually took salary
    const driverTookPayment = formData.driverTookSalary;
    const salarySection = driverTookPayment 
      ? `*💸 Driver Payment (${selectedDriver?.commissionPercentage}%):*
💰 Salary Paid Today: ₹${driverSalaryAmount.toFixed(2)}

`
      : `*💸 Driver Salary Info:*
📋 Calculated Salary (${selectedDriver?.commissionPercentage}%): ₹${driverSalaryAmount.toFixed(2)}
⏳ Status: Not taken today (Pending)

`;
    
    // Negative cash handling
    let negativeHandlingText = '';
    if (cashInHand < 0) {
      if (negativeHandlingOption === 'salary') {
        negativeHandlingText = `\n⚠️ *Negative Cash Handled:* Added ₹${Math.abs(cashInHand).toFixed(2)} to driver salary`;
      } else if (negativeHandlingOption === 'cashier') {
        negativeHandlingText = `\n⚠️ *Negative Cash Handled:* ₹${amountFromCashier} taken from cashier`;
      } else {
        negativeHandlingText = `\n⚠️ *Negative Cash:* ₹${Math.abs(cashInHand).toFixed(2)} needs handling`;
      }
    }
    
    const summary = `*🚗 Trip Summary - ${selectedDriver?.name || 'Driver'}*
📅 Date: ${new Date(formData.tripDate).toLocaleDateString('en-IN')}
🛣️ Distance: ${calculateTotalKm()} km

*💰 Platform Earnings:*
🚗 Uber: ₹${formData.uberEarnings || '0'}
🚙 InDrive: ₹${formData.indriveEarnings || '0'}
🛺 Yatri: ₹${formData.yatriEarnings || '0'}${formData.yatriEarnings && parseInt(formData.yatriTrips || '0') > 0 ? ` (${formData.yatriTrips} trips)` : ''}
🏍️ Rapido: ₹${formData.rapidoEarnings || '0'}
💵 Offline: ₹${formData.offlineEarnings || '0'}

*📊 Financial Summary:*
💰 Total Earnings: ₹${totalEarnings.toFixed(2)}
📋 Commission: ₹${totalCommission.toFixed(2)}
💵 Net Earnings: ₹${netEarnings.toFixed(2)}

${salarySection}*💰 Cash Flow:*
💵 Total Cash: ₹${totalCash.toFixed(2)}
⛽ Fuel: ₹${totalFuel.toFixed(2)}
💳 Online: ₹${formData.onlinePayment || '0'}
${otherExpenses > 0 ? `🔧 Other Expenses: ₹${otherExpenses.toFixed(2)}\n` : ''}${cashToCashier > 0 ? `🏦 Cash to Cashier: ₹${cashToCashier.toFixed(2)}\n` : ''}💵 Cash in Hand: ₹${cashInHand.toFixed(2)}${negativeHandlingText}

*📋 Trip Notes:*
${driverTookPayment ? '• Driver received salary payment today' : '• Salary payment pending'}
${formData.cashGivenToCashier ? '• Cash given to cashier' : ''}
${formData.hasUberCommission ? '• Uber commission deducted (₹117)' : ''}

Generated by Fleet Management System`;

    return summary;
  };

  const sendToWhatsApp = () => {
    const summary = generateWhatsAppSummary();
    const encodedSummary = encodeURIComponent(summary);
    const whatsappUrl = `https://wa.me/?text=${encodedSummary}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyToClipboard = async () => {
    const summary = generateWhatsAppSummary();
    try {
      await navigator.clipboard.writeText(summary);
      alert('Summary copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const calculateTotalEarnings = () => {
    return (
      parseFloat(formData.uberEarnings || '0') +
      parseFloat(formData.indriveEarnings || '0') +
      parseFloat(formData.yatriEarnings || '0') +
      parseFloat(formData.rapidoEarnings || '0') +
      parseFloat(formData.offlineEarnings || '0')
    );
  };

  const nextStep = () => {
    console.log('nextStep called, currentStep:', currentStep, 'STEPS.length:', STEPS.length);
    if (currentStep < STEPS.length) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      console.log('Moving to step:', newStep);
      
      // Add a flag if moving to final step to prevent immediate submission
      if (newStep === STEPS.length) {
        console.log('Reached final step, setting delay flag');
        setJustMovedToStep3(true);
        setTimeout(() => {
          setJustMovedToStep3(false);
        }, 500); // 500ms delay before allowing submission
      }
    } else {
      console.log('Already at last step');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.tripDate && formData.driverId;
      case 2:
        return true; // All earnings are optional
      case 3:
        return true; // Cash and expenses are optional
      default:
        return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit called, currentStep:', currentStep, 'justMovedToStep3:', justMovedToStep3);
    e.preventDefault();
    
    // Only allow submission on the final step
    if (currentStep !== STEPS.length) {
      console.log('Preventing submission - not on final step');
      return;
    }
    
    // Prevent submission if we just moved to step 3
    if (justMovedToStep3) {
      console.log('Preventing submission - just moved to step 3');
      return;
    }
    
    setSubmitting(true);

    try {
      const tripData = {
        tripDate: formData.tripDate,
        driverId: formData.driverId,
        startKm: parseFloat(formData.startKm) || null,
        endKm: parseFloat(formData.endKm) || null,
        totalKm: formData.startKm && formData.endKm ? calculateTotalKm() : null,
        
        // Platform earnings
        uberEarnings: parseFloat(formData.uberEarnings) || 0,
        indriveEarnings: parseFloat(formData.indriveEarnings) || 0,
        yatriEarnings: parseFloat(formData.yatriEarnings) || 0,
        rapidoEarnings: parseFloat(formData.rapidoEarnings) || 0,
        offlineEarnings: parseFloat(formData.offlineEarnings) || 0,
        
        // Cash collection
        uberCash: parseFloat(formData.uberCash) || 0,
        indriveCash: parseFloat(formData.indriveCash) || 0,
        yatriCash: parseFloat(formData.yatriCash) || 0,
        rapidoCash: parseFloat(formData.rapidoCash) || 0,
        offlineCash: parseFloat(formData.offlineCash) || 0,
        
        // Expenses
        fuelExpenses: fuelEntries,
        otherExpenses: parseFloat(formData.otherExpenses) || 0,
        
        // Commission
        hasUberCommission: formData.hasUberCommission,
        yatriTrips: parseInt(formData.yatriTrips) || 0,
        
        // Payment details
        onlinePayment: parseFloat(formData.onlinePayment) || 0,
        cashToCashier: parseFloat(formData.cashToCashier) || 0,
        
        // Actions
        driverTookSalary: formData.driverTookSalary,
        cashGivenToCashier: formData.cashGivenToCashier,
        
        // Negative cash handling
        negativeHandlingOption,
        amountFromCashier: negativeHandlingOption === 'cashier' ? parseFloat(amountFromCashier) : 0,
        
        // Calculated values
        totalEarnings: calculateTotalEarnings(),
        totalCommission: calculateTotalCommission(),
        netEarnings: calculateTotalEarnings() - calculateTotalCommission(),
        driverSalary: calculateDriverSalary(),
        totalCash: calculateTotalCash(),
        cashInDriverHand: calculateCashInDriverHand(),
        
        // Platform breakdown for 'multiple' platform support
        platform: 'multiple',
        platformDetails: {
          uber: parseFloat(formData.uberEarnings) || 0,
          indrive: parseFloat(formData.indriveEarnings) || 0,
          yatri: parseFloat(formData.yatriEarnings) || 0,
          rapido: parseFloat(formData.rapidoEarnings) || 0,
          offline: parseFloat(formData.offlineEarnings) || 0,
        },
      };

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      if (response.ok) {
        await response.json(); // Parse response but don't store if not needed
        setTripSummary(tripData);
        setShowWhatsAppModal(true);
        // Don't redirect immediately, let user see WhatsApp options
      } else {
        throw new Error('Failed to add trip');
      }
    } catch (error) {
      console.error('Error submitting trip:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-full blur-xl animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <div className="text-white font-medium">Loading drivers...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl sm:rounded-2xl blur-xl"></div>
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <Link href="/">
                  <Button className="bg-white/20 hover:bg-white/30 border border-white/30 text-white backdrop-blur-md p-2 sm:p-3">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                    ✨ Add New Trip
                  </h1>
                  <p className="text-purple-200 text-sm sm:text-base">Step {currentStep} of {STEPS.length} • {STEPS[currentStep - 1]?.description}</p>
                </div>
              </div>
              
              {/* Auto-save indicator */}
              {autoSaveStatus && (
                <div className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-full backdrop-blur-md text-sm sm:text-base ${
                  autoSaveStatus === 'saved' ? 'bg-green-500/20 text-green-300' :
                  autoSaveStatus === 'saving' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {autoSaveStatus === 'saved' && <CheckCircle className="h-4 w-4" />}
                  <span className="text-sm font-medium">
                    {autoSaveStatus === 'saved' ? 'Auto-saved' :
                     autoSaveStatus === 'saving' ? 'Saving...' : 'Error saving'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl blur-xl"></div>
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const IconComponent = step.icon;
                
                return (
                  <div key={step.id} className="flex-1">
                    <div className="flex items-center">
                      <div className={`relative flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30' :
                        isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        'bg-white/20 border border-white/30'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                        ) : (
                          <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${isActive ? 'text-white' : 'text-purple-300'}`} />
                        )}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full animate-ping bg-purple-500/30"></div>
                        )}
                      </div>
                      
                      {index < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 sm:h-1 mx-2 sm:mx-4 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-white/20'
                        }`}></div>
                      )}
                    </div>
                    
                    <div className="mt-2 sm:mt-4 text-center">
                      <h3 className={`text-xs sm:text-sm font-medium ${
                        isActive ? 'text-white' : isCompleted ? 'text-green-300' : 'text-purple-300'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-purple-400 mt-1 hidden sm:block">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Form Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-xl sm:rounded-2xl blur-xl"></div>
          <div className="relative bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 p-4 sm:p-6 lg:p-8">
            <form 
              onSubmit={handleSubmit} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') {
                  console.log('Enter key pressed, preventing form submission');
                  e.preventDefault();
                }
              }}
              className="space-y-6 sm:space-y-8"
            >
              
              {/* Step 1: Trip Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">🚗 Trip Details</h2>
                    <p className="text-purple-300 text-sm sm:text-base">Let&apos;s start with the basic trip information</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-purple-200 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        Trip Date
                      </label>
                      <input
                        type="date"
                        name="tripDate"
                        value={formData.tripDate}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-purple-200 mb-2">
                        <User className="h-4 w-4 mr-2" />
                        Driver Name
                      </label>
                      <select
                        name="driverId"
                        value={formData.driverId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                      >
                        <option value="" className="bg-gray-800 text-gray-300">Select Driver</option>
                        {loading ? (
                          <option value="" className="bg-gray-800 text-gray-500">Loading drivers...</option>
                        ) : drivers && drivers.length > 0 ? (
                          drivers.map((driver) => (
                            <option key={driver._id} value={driver._id} className="bg-gray-800 text-white">
                              {driver.name}
                            </option>
                          ))
                        ) : (
                          <option value="" className="bg-gray-800 text-gray-500">No drivers found</option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-purple-200 mb-2">
                        <Navigation className="h-4 w-4 mr-2" />
                        Start KM
                      </label>
                      <input
                        type="number"
                        name="startKm"
                        value={formData.startKm}
                        onChange={handleInputChange}
                        placeholder="e.g., 1000"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-purple-200 mb-2">
                        <Navigation className="h-4 w-4 mr-2" />
                        End KM
                      </label>
                      <input
                        type="number"
                        name="endKm"
                        value={formData.endKm}
                        onChange={handleInputChange}
                        placeholder="e.g., 1400"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {/* Total KM Display */}
                  {formData.startKm && formData.endKm && (
                    <div className="relative mt-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-lg"></div>
                      <div className="relative p-6 bg-white/10 rounded-xl border border-green-300/30 backdrop-blur-md">
                        <div className="text-center">
                          <p className="text-green-300 text-sm mb-1">Total Distance</p>
                          <p className="text-3xl font-bold text-white">{calculateTotalKm()} km</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Platform Earnings */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">💰 Platform Earnings & Cash</h2>
                    <p className="text-purple-300 text-sm sm:text-base">Enter earnings and cash collected from each platform</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[
                      { name: 'uber', label: 'Uber', icon: '🚗', color: 'from-yellow-500 to-orange-500', earningsField: 'uberEarnings', cashField: 'uberCash' },
                      { name: 'indrive', label: 'InDrive', icon: '🚙', color: 'from-blue-500 to-indigo-500', earningsField: 'indriveEarnings', cashField: 'indriveCash' },
                      { name: 'yatri', label: 'Yatri', icon: '🛺', color: 'from-green-500 to-emerald-500', earningsField: 'yatriEarnings', cashField: 'yatriCash' },
                      { name: 'rapido', label: 'Rapido', icon: '🏍️', color: 'from-red-500 to-pink-500', earningsField: 'rapidoEarnings', cashField: 'rapidoCash' },
                      { name: 'offline', label: 'Offline', icon: '💵', color: 'from-gray-500 to-slate-500', earningsField: 'offlineEarnings', cashField: 'offlineCash' },
                    ].map((platform) => (
                      <div key={platform.name} className="relative group">
                        <div className={`absolute inset-0 bg-gradient-to-r ${platform.color} opacity-20 rounded-xl blur-lg group-hover:opacity-30 transition-opacity duration-300`}></div>
                        <div className="relative p-4 sm:p-6 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md transition-all duration-300 hover:border-white/40">
                          <div className="text-center mb-3 sm:mb-4">
                            <div className="text-2xl sm:text-3xl mb-2">{platform.icon}</div>
                            <h3 className="text-base sm:text-lg font-semibold text-white">{platform.label}</h3>
                          </div>
                          
                          <div className="space-y-3 sm:space-y-4">
                            {/* Earnings Input */}
                            <div>
                              <label className="block text-sm text-purple-200 mb-2">Earnings</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300">₹</span>
                                <input
                                  type="number"
                                  name={platform.earningsField}
                                  value={formData[platform.earningsField as keyof typeof formData] as string}
                                  onChange={handleInputChange}
                                  placeholder="0.00"
                                  step="0.01"
                                  className="w-full pl-6 sm:pl-8 pr-3 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                                />
                              </div>
                            </div>
                            
                            {/* Cash Input */}
                            <div>
                              <label className="block text-sm text-purple-200 mb-2">Cash Collected</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300">₹</span>
                                <input
                                  type="number"
                                  name={platform.cashField}
                                  value={formData[platform.cashField as keyof typeof formData] as string}
                                  onChange={handleInputChange}
                                  placeholder="0.00"
                                  step="0.01"
                                  className="w-full pl-6 sm:pl-8 pr-3 py-2 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all duration-300 text-sm sm:text-base"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Commission Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Commission Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                        <input
                          type="checkbox"
                          name="hasUberCommission"
                          checked={formData.hasUberCommission}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-white/30 rounded bg-white/10"
                        />
                        <label className="text-purple-200">Uber Commission (₹117)</label>
                      </div>

                      {formData.yatriEarnings && parseFloat(formData.yatriEarnings) > 0 && (
                        <div className="space-y-2 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                          <label className="block text-sm text-purple-200">Yatri Trips Count</label>
                          <input
                            type="number"
                            name="yatriTrips"
                            value={formData.yatriTrips}
                            onChange={handleInputChange}
                            placeholder="Number of trips"
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Earnings Summary */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-lg"></div>
                    <div className="relative p-6 bg-white/10 rounded-xl border border-purple-300/30 backdrop-blur-md">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-purple-300 text-sm">Total Earnings</p>
                          <p className="text-2xl font-bold text-white">₹{(
                            parseFloat(formData.uberEarnings || '0') +
                            parseFloat(formData.indriveEarnings || '0') +
                            parseFloat(formData.yatriEarnings || '0') +
                            parseFloat(formData.rapidoEarnings || '0') +
                            parseFloat(formData.offlineEarnings || '0')
                          ).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-sm">Commission</p>
                          <p className="text-2xl font-bold text-orange-400">₹{calculateTotalCommission().toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-sm">Net Earnings</p>
                          <p className="text-2xl font-bold text-green-400">₹{(
                            parseFloat(formData.uberEarnings || '0') +
                            parseFloat(formData.indriveEarnings || '0') +
                            parseFloat(formData.yatriEarnings || '0') +
                            parseFloat(formData.rapidoEarnings || '0') +
                            parseFloat(formData.offlineEarnings || '0') -
                            calculateTotalCommission()
                          ).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-sm">Driver Share</p>
                          <p className="text-2xl font-bold text-blue-400">₹{calculateDriverSalary().toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Cash & Expenses */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">� Expenses & Payments</h2>
                    <p className="text-purple-300">Manage fuel costs, payments and final calculations</p>
                  </div>

                  {/* Expenses */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Fuel Expenses</h3>
                      {fuelEntries.length === 0 ? (
                        <div className="text-sm text-purple-300 italic mb-3 p-4 bg-white/5 rounded-xl border border-white/10">
                          No fuel entries added yet. Click &quot;Add Fuel Entry&quot; to begin.
                        </div>
                      ) : (
                        <div className="space-y-3 mb-4">
                          {fuelEntries.map((entry) => (
                            <div key={entry.id} className="flex items-center space-x-3 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                              <input
                                type="number"
                                value={entry.amount}
                                onChange={(e) => updateFuelEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="Amount"
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500"
                              />
                              <select
                                value={entry.description}
                                onChange={(e) => updateFuelEntry(entry.id, 'description', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                              >
                                <option value="" className="bg-gray-800">Select Type</option>
                                <option value="CNG" className="bg-gray-800">CNG</option>
                                <option value="Petrol" className="bg-gray-800">Petrol</option>
                                <option value="Other" className="bg-gray-800">Other</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeFuelEntry(entry.id)}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-3 py-2 rounded-lg transition-all duration-200"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={addFuelEntry}
                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg transition-all duration-200 flex items-center"
                      >
                        <Fuel className="h-4 w-4 mr-2" />
                        Add Fuel Entry
                      </button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Other Expenses & Payments</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm text-purple-200">Other Expenses</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300">₹</span>
                            <input
                              type="number"
                              name="otherExpenses"
                              value={formData.otherExpenses}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              step="0.01"
                              className="w-full pl-8 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm text-purple-200">Online Payments Received</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300">₹</span>
                            <input
                              type="number"
                              name="onlinePayment"
                              value={formData.onlinePayment}
                              onChange={handleInputChange}
                              placeholder="0.00"
                              step="0.01"
                              className="w-full pl-8 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Cashier Section - Initially Hidden */}
                        {!showCashierSection ? (
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => setShowCashierSection(true)}
                              className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 hover:from-emerald-600/30 hover:to-green-600/30 text-emerald-300 border border-emerald-500/30 px-6 py-3 rounded-xl transition-all duration-200 flex items-center mx-auto"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Cash to Cashier
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 p-4 bg-emerald-600/10 border border-emerald-500/20 rounded-xl">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm text-emerald-200 font-semibold">Cash Given to Cashier</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCashierSection(false);
                                  setFormData(prev => ({ ...prev, cashToCashier: '', cashGivenToCashier: false }));
                                }}
                                className="text-emerald-300 hover:text-emerald-200 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-300">₹</span>
                              <input
                                type="number"
                                name="cashToCashier"
                                value={formData.cashToCashier}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                step="0.01"
                                className="w-full pl-8 pr-3 py-3 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-100 placeholder-emerald-400 focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Driver Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Driver Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                        <input
                          type="checkbox"
                          name="driverTookSalary"
                          checked={formData.driverTookSalary}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-white/30 rounded bg-white/10"
                        />
                        <label className="text-purple-200">Driver took salary today</label>
                      </div>

                      <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                        <input
                          type="checkbox"
                          name="cashGivenToCashier"
                          checked={formData.cashGivenToCashier}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-white/30 rounded bg-white/10"
                        />
                        <label className="text-purple-200">Cash given to cashier</label>
                      </div>
                    </div>
                  </div>

                  {/* Final Summary */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-lg"></div>
                    <div className="relative p-6 bg-white/10 rounded-xl border border-green-300/30 backdrop-blur-md">
                      <h3 className="text-lg font-semibold text-white mb-4">Final Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-purple-300 text-sm">Total Cash</p>
                          <p className="text-xl font-bold text-white">₹{calculateTotalCash().toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-purple-300 text-sm">Driver Salary</p>
                          <p className="text-xl font-bold text-blue-400">₹{formData.driverTookSalary ? calculateDriverSalary().toFixed(2) : '0.00'}</p>
                          <p className="text-xs text-blue-300 mt-1">
                            {formData.driverTookSalary ? 'Paid Today' : `Pending: ₹${calculateDriverSalary().toFixed(2)}`}
                          </p>
                        </div>
                        <div className="animate-fadeInUp" style={{animationDelay: '0.3s'}}>
                          <p className="text-purple-300 text-sm">Cash with Driver</p>
                          <p className={`text-xl font-bold transition-all duration-500 ${calculateCashInDriverHand() < 0 ? 'text-red-400 animate-pulse' : 'text-orange-400'}`}>
                            ₹{calculateCashInDriverHand().toFixed(2)}
                          </p>
                          {calculateCashInDriverHand() < 0 && (
                            <div className="mt-1 animate-slideInDown">
                              <p className="text-xs text-red-300 animate-fadeIn">
                                {negativeHandlingOption === 'salary' ? '(Added to salary)' : 
                                 negativeHandlingOption === 'cashier' ? '(From cashier)' : '(Needs handling)'}
                              </p>
                              {!negativeHandlingOption && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNegativeAmount(Math.abs(calculateCashInDriverHand()));
                                    setShowNegativeCashModal(true);
                                  }}
                                  className="mt-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-bounce"
                                >
                                  Handle Negative
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-purple-300 text-sm">To Cashier</p>
                          <p className="text-xl font-bold text-green-400">₹{parseFloat(formData.cashToCashier || '0').toFixed(2)}</p>
                          <p className="text-xs text-green-300 mt-1">
                            {formData.cashGivenToCashier ? 'Given' : 'Amount'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Calculation Breakdown */}
                      <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-sm text-purple-200 font-medium mb-2">Cash Breakdown:</p>
                        <div className="text-xs text-purple-300 space-y-1">
                          <div className="flex justify-between">
                            <span>Total Cash Collected:</span>
                            <span>₹{calculateTotalCash().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>- Online Payments:</span>
                            <span>₹{parseFloat(formData.onlinePayment || '0').toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>- Fuel Expenses:</span>
                            <span>₹{fuelEntries.reduce((sum, entry) => sum + entry.amount, 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>- Other Expenses:</span>
                            <span>₹{parseFloat(formData.otherExpenses || '0').toFixed(2)}</span>
                          </div>
                          {formData.driverTookSalary && (
                            <div className="flex justify-between">
                              <span>- Driver Salary:</span>
                              <span>₹{calculateDriverSalary().toFixed(2)}</span>
                            </div>
                          )}
                          {parseFloat(formData.cashToCashier || '0') > 0 && (
                            <div className="flex justify-between">
                              <span>- Cash to Cashier:</span>
                              <span>₹{parseFloat(formData.cashToCashier || '0').toFixed(2)}</span>
                            </div>
                          )}
                          <div className="border-t border-white/20 pt-1 mt-2">
                            <div className="flex justify-between font-medium">
                              <span>= Cash with Driver:</span>
                              <span className={calculateCashInDriverHand() < 0 ? 'text-red-400' : 'text-green-400'}>
                                ₹{calculateCashInDriverHand().toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-8 border-t border-white/20 animate-fadeInUp">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white backdrop-blur-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm sm:text-base transform hover:scale-105 hover:shadow-lg"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">←</span>
                    Previous
                  </span>
                </button>

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Next button clicked, currentStep:', currentStep);
                      nextStep();
                    }}
                    disabled={!canProceedToNextStep()}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transform hover:scale-105 hover:shadow-lg animate-pulse"
                  >
                    <span className="flex items-center justify-center">
                      Next
                      <span className="ml-2 animate-bounce">→</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || justMovedToStep3}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base transform hover:scale-105 hover:shadow-xl relative overflow-hidden"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding Trip...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <span className="animate-bounce mr-2">🚗</span>
                        Add Trip
                        <span className="ml-2 animate-pulse">✨</span>
                      </span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Negative Cash Modal */}
      {showNegativeCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-slideInUp transform transition-all duration-300">
            <h3 className="text-xl font-bold text-red-600 mb-4 animate-pulse">⚠️ Negative Cash Alert</h3>
            <p className="text-gray-700 mb-4 animate-fadeInUp" style={{animationDelay: '0.1s'}}>
              Cash in hand is negative by <strong className="text-red-600">₹{negativeAmount.toFixed(2)}</strong>. 
              Please choose how to handle this:
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleNegativeCashOption('salary')}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-fadeInUp"
                style={{animationDelay: '0.2s'}}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="animate-bounce">📊</span>
                  <span>Add to Driver Salary</span>
                </div>
                <div className="text-sm opacity-90 mt-1">Include deficit in driver&apos;s salary calculation</div>
              </button>
              
              <button
                onClick={() => handleNegativeCashOption('cashier')}
                className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-fadeInUp"
                style={{animationDelay: '0.3s'}}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="animate-bounce" style={{animationDelay: '0.5s'}}>💰</span>
                  <span>Take from Cashier</span>
                </div>
                <div className="text-sm opacity-90 mt-1">Deduct amount from cashier balance</div>
              </button>
            </div>
            
            {negativeHandlingOption === 'cashier' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg animate-slideInDown transition-all duration-500">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to take from cashier:
                </label>
                <input
                  type="number"
                  value={amountFromCashier}
                  onChange={(e) => setAmountFromCashier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 transition-all duration-300 focus:scale-105"
                  placeholder={negativeAmount.toString()}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Summary Modal */}
      {showWhatsAppModal && tripSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-slideInUp transform transition-all duration-500">
            <div className="text-center mb-4">
              <div className="inline-block animate-bounce">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                  <span className="text-2xl text-white">✅</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-green-600 animate-fadeInUp">Trip Added Successfully!</h3>
            </div>
            
            <div className="mb-6 animate-fadeInUp" style={{animationDelay: '0.2s'}}>
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <span className="animate-bounce mr-2">📱</span>
                Share Summary on WhatsApp:
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono whitespace-pre-line max-h-40 overflow-y-auto border-2 border-dashed border-gray-300 hover:border-green-400 transition-colors duration-300">
                {generateWhatsAppSummary()}
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={sendToWhatsApp}
                className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 animate-fadeInUp"
                style={{animationDelay: '0.3s'}}
              >
                <span className="animate-pulse">📱</span>
                <span>Send via WhatsApp</span>
              </button>
              
              <button
                onClick={copyToClipboard}
                className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 animate-fadeInUp"
                style={{animationDelay: '0.4s'}}
              >
                <span className="animate-bounce">📋</span>
                <span>Copy to Clipboard</span>
              </button>
              
              <button
                onClick={() => {
                  setShowWhatsAppModal(false);
                  router.push('/');
                }}
                className="w-full p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg animate-fadeInUp"
                style={{animationDelay: '0.5s'}}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
