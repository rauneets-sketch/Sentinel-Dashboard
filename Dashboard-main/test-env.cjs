#!/usr/bin/env node

// Test script to verify environment variables are properly configured
console.log('🔍 Testing Environment Variables Configuration...\n');

// Load environment variables from .env file if it exists
try {
  const dotenv = require('dotenv');
  const path = require('path');
  const result = dotenv.config({ path: path.join(__dirname, '.env') });
  if (result.error) {
    console.log('ℹ️  No .env file found, using system environment variables only');
  } else {
    console.log('✅ Loaded .env file successfully');
  }
} catch (e) {
  console.log('ℹ️  dotenv not available, using system environment variables only');
  console.log('Error:', e.message);
}

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_KEY'
];

let allGood = true;

console.log('\n📋 Environment Variables Status:');
console.log('================================');

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = varName === 'SUPABASE_KEY' && value 
    ? `${value.substring(0, 20)}...` 
    : value || 'NOT SET';
  
  console.log(`${status} ${varName}: ${displayValue}`);
  
  if (!value) {
    allGood = false;
  }
});

console.log('\n🔧 Configuration Check:');
console.log('=======================');

if (allGood) {
  console.log('✅ All required environment variables are set!');
  console.log('🚀 Ready for Render deployment');
} else {
  console.log('❌ Some environment variables are missing');
  console.log('📝 Please check your .env file or Render environment variables');
}

console.log('\n📖 For deployment help, see: RENDER_DEPLOYMENT.md');