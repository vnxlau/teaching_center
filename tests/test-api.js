// Test script to check membership plans API
async function testMembershipPlansAPI() {
  try {
    console.log('Testing membership plans API...');

    // First, let's try to get a session or bypass auth for testing
    const response = await fetch('http://localhost:3001/api/admin/membership-plans', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (data.membershipPlans) {
      console.log('✅ Found', data.membershipPlans.length, 'membership plans');
      data.membershipPlans.forEach((plan: any) => {
        console.log(`  - ${plan.name}: ${plan.daysPerWeek} days/week, €${plan.monthlyPrice}`);
      });
    } else {
      console.log('❌ No membership plans found');
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testMembershipPlansAPI();
