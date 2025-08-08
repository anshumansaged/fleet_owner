// Script to update Vikash Bali to Vikash Yadav in MongoDB
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

async function updateDriverName() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find and update Vikash Bali to Vikash Yadav
    console.log('\n🔍 Searching for Vikash Bali...');
    const result = await Driver.updateOne(
      { name: 'Vikash Bali' },
      { name: 'Vikash Yadav' }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Successfully updated Vikash Bali to Vikash Yadav');
      console.log(`Modified ${result.modifiedCount} record(s)`);
    } else {
      console.log('❌ No driver found with name "Vikash Bali"');
    }
    
    // Show all current drivers
    console.log('\n📋 Current drivers in database:');
    const drivers = await Driver.find({ isActive: true }).sort({ name: 1 });
    drivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name} (${driver.commissionPercentage}% commission)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

updateDriverName();
