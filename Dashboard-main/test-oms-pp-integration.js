#!/usr/bin/env node

/**
 * Test script for OMS & Partner Panel integration
 * Run this after deploying the dashboard to test the new endpoints
 */

const BASE_URL = process.env.DASHBOARD_URL || 'http://localhost:8787';

async function testEndpoint(endpoint, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📡 Endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status})`);
      console.log(`📊 Data preview:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
      return data;
    } else {
      console.log(`❌ Error (${response.status}):`, data);
      return null;
    }
  } catch (error) {
    console.log(`💥 Request failed:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing OMS & Partner Panel Integration');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  // Test system health
  await testEndpoint('/api/system-health', 'System Health Metrics');
  
  // Test OMS data
  await testEndpoint('/api/test-results/oms', 'OMS Test Results');
  
  // Test Partner Panel data (mapped to android)
  await testEndpoint('/api/test-results/android', 'Partner Panel Test Results');
  
  // Test correlated runs
  await testEndpoint('/api/correlated-runs?limit=5', 'Correlated Runs (OMS + Partner Panel)');
  
  // Test tab performance
  await testEndpoint('/api/tab-performance/OMS?days=7', 'OMS Tab Performance');
  await testEndpoint('/api/tab-performance/PARTNER_PANEL?days=7', 'Partner Panel Tab Performance');
  
  // Test recent failures
  await testEndpoint('/api/recent-failures?limit=10', 'Recent Failures');
  
  // Test overall results (should include real OMS and Partner Panel data)
  const overallResults = await testEndpoint('/api/test-results', 'Overall Test Results');
  
  if (overallResults) {
    console.log('\n📋 Summary:');
    console.log(`Desktop: ${overallResults.desktop ? 'Real Data' : 'Mock Data'}`);
    console.log(`Mobile: ${overallResults.mobile ? 'Mock Data' : 'No Data'}`);
    console.log(`OMS: ${overallResults.oms && !overallResults.oms.comingSoon ? 'Real Data' : 'Mock Data'}`);
    console.log(`Partner Panel: ${overallResults.android && !overallResults.android.comingSoon ? 'Real Data' : 'Mock Data'}`);
    console.log(`iOS: ${overallResults.ios ? 'Mock Data' : 'No Data'}`);
  }
  
  console.log('\n✨ Integration test completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Ensure OMS and Partner Panel tests are logging to Supabase with correct metadata.system values');
  console.log('2. Run the SQL functions in supabase-functions.sql in your Supabase SQL Editor');
  console.log('3. Check the dashboard UI to see real data in OMS and Partner Panel tabs');
}

// Run the tests
runTests().catch(console.error);