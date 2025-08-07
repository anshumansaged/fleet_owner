// Test script to check if drivers exist in MongoDB
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://anshumansaged:Anshu6291@cluster0.ms5pgjg.mongodb.net/fleet-management?retryWrites=true&w=majority&appName=Cluster0';

// Driver schema
const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  commissionPercentage: { type: Number, required: true },
  totalEarnings: { type: Number, default: 0 },
  totalSalaryPaid: { type: Number, default: 0 },
  pendingSalary: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

const Driver = mongoose.model('Driver', DriverSchema);

async function testDrivers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if drivers exist
    console.log('\n📋 Checking existing drivers...');
    const drivers = await Driver.find({ isActive: true }).sort({ name: 1 });
    console.log(`Found ${drivers.length} drivers:`);
    
    if (drivers.length === 0) {
      console.log('❌ No drivers found! Creating default drivers...');
      
      // Create default drivers
      const defaultDrivers = [
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
          name: 'Vikash Bali',
          commissionPercentage: 35,
          totalEarnings: 0,
          totalSalaryPaid: 0,
          pendingSalary: 0,
          isActive: true
        }
      ];
      
      const createdDrivers = await Driver.insertMany(defaultDrivers);
      console.log(`✅ Created ${createdDrivers.length} drivers successfully!`);
      
      // Show created drivers
      createdDrivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name} (${driver.commissionPercentage}% commission) - ID: ${driver._id}`);
      });
    } else {
      // Show existing drivers
      drivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name} (${driver.commissionPercentage}% commission) - ID: ${driver._id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDrivers();
