const { defineConfig, devices } = require('@playwright/test');

const env = process.env.ENV || 'dev';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Global timeout settings for robustness
  timeout: 180000, // 3 minutes per test
  expect: {
    timeout: 30000 // 30 seconds for assertions
  },
  
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['junit', { outputFile: 'reports/junit-results.xml' }]
  ],
  
  use: {
    baseURL: getBaseURL(env),
    
    // Action and navigation timeouts
    actionTimeout: 60000, // 60 seconds for actions (click, fill, etc.)
    navigationTimeout: 60000, // 60 seconds for page navigations
    
    // Trace and debugging
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Headless mode: true in CI/Docker, false for local development
    headless: process.env.HEADLESS === 'true' || process.env.CI === 'true',
    slowMo: process.env.CI === 'true' ? 0 : 300,
    
    // Browser context options for robustness
    contextOptions: {
      ignoreDefaultArgs: ['--disable-web-security'],
    },
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
  },
  
  projects: [
    {
      name: 'chromium-web',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.spec\.js/,
    }
  ],
});

function getBaseURL(environment) {
  const urls = {
    dev: 'https://dev.example.com',
    uat: 'https://uat.example.com',
    prod: 'https://prod.example.com'
  };
  return urls[environment] || urls.dev;
}