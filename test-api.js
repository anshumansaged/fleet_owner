// Test the drivers API endpoint
const fetch = require('node-fetch');

async function testDriversAPI() {
  try {
    console.log('🔗 Testing drivers API endpoint...');
    const response = await fetch('http://localhost:3000/api/drivers');
    
    if (!response.ok) {
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response received:');
    console.log(`Found ${data.drivers?.length || 0} drivers:`);
    
    if (data.drivers && data.drivers.length > 0) {
      data.drivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name} (${driver.commissionPercentage}% commission)`);
      });
    } else {
      console.log('❌ No drivers found in API response');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('💡 Make sure the development server is running with: npm run dev');
  }
}

testDriversAPI();
