#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { execSync } = require('child_process');

console.log('🚀 FNP Automation Test Runner\n');
console.log('📊 Supabase Logging:', process.env.SUPABASE_URL ? '✅ ENABLED' : '❌ DISABLED');
console.log('🌍 Environment:', process.env.ENV || 'dev');
console.log('');

try {
  // Run Cucumber tests with memory optimization
  execSync(
    'node --expose-gc --max-old-space-size=2048 node_modules/.bin/cucumber-js ' +
    'src/test/features/web/home-page-exploration.feature ' +
    '--require src/main/hooks/hooks.js ' +
    '--require "src/test/stepdefinitions/**/*.js"',
    { stdio: 'inherit', timeout: 5400000 }
  );
  
  console.log('\n✅ Tests completed successfully');
  console.log('📊 Check Supabase dashboard: https://wnymknrycmldwqzdqoct.supabase.co');
  process.exit(0);
} catch (error) {
  console.log('\n⚠️ Tests completed with failures');
  console.log('📸 Check allure-results/ directory for failure screenshots');
  console.log('📊 Check Supabase dashboard: https://wnymknrycmldwqzdqoct.supabase.co');
  process.exit(error.status || 1);
}
