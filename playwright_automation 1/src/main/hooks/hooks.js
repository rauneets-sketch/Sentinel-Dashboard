const { Before, After, setDefaultTimeout, AfterStep, BeforeStep } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const { SlackNotifier } = require('../utils/SlackNotifier');
const { stepTracker } = require('../utils/StepTracker');
const { apiResponseTracker } = require('../utils/ApiResponseTracker');
const { supabaseLogger } = require('../services/SupabaseLogger');
const { executionDataCollector } = require('../services/ExecutionDataCollector');
const fs = require('fs');
const path = require('path');

// Import logger - Logger.js exports logger directly
const logger = require('../utils/Logger');

// Allure results directory
const allureResultsDir = path.join(process.cwd(), 'allure-results');
if (!fs.existsSync(allureResultsDir)) {
  fs.mkdirSync(allureResultsDir, { recursive: true });
}

// Increase timeout to 180 seconds (3 minutes) for long-running steps
setDefaultTimeout(180000);

// Memory management tracking
let stepCounter = 0;
let journeyCounter = 0;
let lastJourneyCleanup = 0;
const JOURNEY_CLEANUP_INTERVAL = 2; // Clean up after every 2 completed journeys
const CRITICAL_STEP_KEYWORDS = [
  'payment', 'pay', 'checkout', 'cart', 'address', 'upload', 'photo', 
  'order', 'proceed', 'add to cart', 'clear cart', 'delivery location'
];

// Function to check if current step is critical
function isCriticalStep(stepText) {
  const lowerStep = stepText.toLowerCase();
  return CRITICAL_STEP_KEYWORDS.some(keyword => lowerStep.includes(keyword));
}

// Slack reporting is controlled in SlackNotifier.js (#ENABLED = true)
console.log('📱 Slack reporting ENABLED globally');

Before(async function (scenario) {
  // Track start time for Slack reporting
  this.startTime = Date.now();
  
  // Initialize test run on first scenario (only once per test suite)
  if (!global.testRunInitialized) {
    executionDataCollector.initializeTestRun({
      framework: 'playwright',
      suiteName: 'FNP Automation Framework',
      environment: process.env.ENV || 'dev',
      platform: 'web'
    });
    
    // Start Supabase logging
    if (supabaseLogger.isEnabled()) {
      await supabaseLogger.startTestRun({
        framework: 'playwright',
        suiteName: 'FNP Automation Framework',
        environment: process.env.ENV || 'dev',
        platform: 'web',
        buildNumber: process.env.BUILD_NUMBER,
        buildUrl: process.env.BUILD_URL,
        jobName: process.env.JOB_NAME
      });
    }
    
    global.testRunInitialized = true;
  }
  
  // Start scenario tracking
  stepTracker.startScenario(scenario.pickle?.name || 'Unknown Scenario');
  executionDataCollector.startJourney(scenario.pickle?.name || 'Unknown Scenario');
  global.scenarioStartTime = Date.now();
  
  // Reset counters for this scenario
  stepCounter = 0;
  journeyCounter = 0;
  
  // Log initial memory usage
  if (process.env.CI === 'true') {
    const memUsage = process.memoryUsage();
    console.log(`🧠 Initial Memory: RSS=${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, Heap=${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }

  try {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS === 'true' || process.env.CI === 'true',
      slowMo: process.env.CI === 'true' ? 0 : 300,
      args: [
        // Essential flags only (matching successful Java framework)
        '--no-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-web-security', 
        '--disable-blink-features=AutomationControlled'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });

    this.page = await this.context.newPage();
    
    // Simple session keep-alive (matching Java framework approach)
    this.page.on('response', async (response) => {
      const request = response.request();
      apiResponseTracker.recordApiResponse(response, request);
    });

    // Block Freshchat and external URLs (essential only)
    await this.page.route('**/*', async (route, request) => {
      const url = request.url();
      if (url.includes('freshchat.com') || url.includes('widget') || url.includes('chat')) {
        await route.abort();
        return;
      }
      await route.continue();
    });

    // Override window.open to prevent new tabs
    await this.page.addInitScript(() => {
      window.open = (url, target, features) => {
        if (url && !url.includes('freshchat') && !url.includes('widget')) {
          window.location.href = url;
        }
        return window;
      };
    });

    // Prevent page from being closed accidentally
    this.page.on('close', () => {
      console.log('Page was closed unexpectedly');
    });

    // Clear tracking data at scenario start
    stepTracker.clear();
    apiResponseTracker.clear();

    console.log('✅ Browser launched successfully');
  } catch (error) {
    console.error('❌ CRITICAL: Failed to launch browser:', error.message);
    console.error('This indicates a Playwright/browser setup issue');
    
    // Track this as a critical setup failure
    stepTracker.startStep('Browser Setup: Launch Playwright Browser');
    stepTracker.completeCurrentStep('FAILED', error);
    
    // Re-throw to fail the scenario immediately
    throw new Error(`Browser launch failed: ${error.message}. Check Playwright installation and Docker configuration.`);
  }
});

// Memory cleanup and journey tracking before each step
BeforeStep(async function ({ pickleStep }) {
  stepCounter++;
  
  // Simple session keep-alive after every step (matching Java framework approach)
  if (this.page && !this.page.isClosed()) {
    try {
      await this.page.evaluate(() => navigator.userAgent);
    } catch (error) {
      // Ignore keep-alive errors
    }
  }
  
  // Track journey starts
  const stepText = pickleStep.text.toLowerCase();
  const isJourneyStart = stepText.includes('navigate to fnp homepage') || 
                        stepText.includes('navigate back to homepage') ||
                        stepText.includes('navigate to homepage') ||
                        (stepText.includes('when i') && stepText.includes('navigate'));
  
  if (isJourneyStart) {
    journeyCounter++;
    console.log(`🚀 Starting Journey ${journeyCounter}: "${pickleStep.text}"`);
    
    // Memory cleanup ONLY at journey boundaries (never during critical steps)
    // Only if we've completed at least JOURNEY_CLEANUP_INTERVAL journeys since last cleanup
    if (journeyCounter > 1 && 
        (journeyCounter - lastJourneyCleanup) >= JOURNEY_CLEANUP_INTERVAL && 
        process.env.CI === 'true') {
      
      console.log(`🧹 Journey boundary memory cleanup (after ${journeyCounter - 1} journeys completed)`);
      
      if (global.gc) {
        global.gc();
        const memUsage = process.memoryUsage();
        console.log(`🧠 Memory after cleanup: RSS=${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, Heap=${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }
      
      lastJourneyCleanup = journeyCounter;
    }
  }
  
  // Log if we're about to execute a critical step (for monitoring)
  if (isCriticalStep(pickleStep.text)) {
    console.log(`🔒 Critical step detected: "${pickleStep.text}" - No memory operations will be performed`);
  }
});

// Track each step execution
AfterStep(async function ({ pickleStep, result }) {
  const stepDefinition = pickleStep.text;
  const status = result.status === 'PASSED' ? 'PASSED' : result.status === 'FAILED' ? 'FAILED' : 'SKIPPED';
  const error = result.exception || null;

  // Complete API tracking for this step
  apiResponseTracker.completeStepTracking(stepDefinition, status);

  // Track step execution with StepTracker
  stepTracker.startStep(stepDefinition);
  stepTracker.completeCurrentStep(status, error);
  
  // Add step to execution data collector with API calls
  const currentStepData = stepTracker.getCurrentJourneySteps().slice(-1)[0]; // Get last added step
  if (currentStepData) {
    const apiCalls = apiResponseTracker.getCurrentStepApiCalls();
    executionDataCollector.addStep(currentStepData, apiCalls);
  }

  // CRITICAL: Capture screenshot ONLY on failure
  if (status === 'FAILED' && this.page && !this.page.isClosed()) {
    try {
      const timestamp = Date.now();
      const sanitizedStepName = stepDefinition.replace(/[^a-z0-9]/gi, '_').substring(0, 80);
      const screenshotName = `failure_${timestamp}_${sanitizedStepName}.png`;
      const screenshotPath = path.join(allureResultsDir, screenshotName);
      
      console.log(`📸 [SCREENSHOT] Capturing failure screenshot: ${screenshotName}`);
      
      // Take and save screenshot
      await this.page.screenshot({ 
        path: screenshotPath,
        type: 'png',
        fullPage: true 
      });
      
      console.log(`✅ [SCREENSHOT] Saved to: ${screenshotPath}`);
    } catch (screenshotError) {
      console.error(`❌ [SCREENSHOT] Failed to capture: ${screenshotError.message}`);
    }
  }

  // Start API tracking for next step
  apiResponseTracker.startStepTracking(stepDefinition);
});

After(async function (scenario) {
  // Stop API tracking
  apiResponseTracker.stopTracking();

  // Complete scenario tracking
  const duration = Date.now() - (global.scenarioStartTime || this.startTime || Date.now());
  const finalStatus = scenario.result.status === 'PASSED' ? 'PASSED' : 'FAILED';
  const error = scenario.result.exception || null;
  stepTracker.completeScenario(finalStatus, error);

  // Complete journey in execution data collector
  executionDataCollector.completeJourney();

  // Get journey steps for Slack reporting
  const journeySteps = stepTracker.getCurrentJourneySteps();

  // Send Slack notification if enabled
  if (SlackNotifier.isGlobalEnabled()) {
    // Determine test results
    const totalSteps = journeySteps.length;
    const passedSteps = journeySteps.filter(step => step.status === 'PASSED').length;
    const failedSteps = totalSteps - passedSteps;
    
    console.log('📱 Slack notifications are ENABLED - preparing to send notification...');
    console.log(`📊 Scenario: ${scenario.pickle?.name || 'Unknown'}`);
    console.log(`📊 Status: ${finalStatus}`);
    console.log(`📊 Total steps: ${totalSteps}, Passed: ${passedSteps}, Failed: ${failedSteps}`);
    
    const slackNotifier = new SlackNotifier();

    // Collect failure reasons from journey steps with API context
    const failureReasons = [];
    journeySteps.forEach(step => {
      if (step.status === 'FAILED' && step.error) {
        const failureInfo = {
          step: step.name,
          errorType: step.error.type,
          errorMessage: step.error.message,
          stack: step.error.stack
        };

        // Get API calls for this failed step
        const failedStepData = apiResponseTracker.getFailedStepApiCalls();
        if (failedStepData && failedStepData.apiCalls && failedStepData.apiCalls.length > 0) {
          failureInfo.apiCalls = failedStepData.apiCalls;
        }

        failureReasons.push(failureInfo);
      }
    });

    // Send detailed suite summary
    const suiteName = 'FNP Automation Framework - Playwright Test Suite';
    const platform = 'WEB';
    const reportUrl = process.env.REPORT_URL || 'https://fnp-test-reports.s3.us-east-1.amazonaws.com/latest-report/index.html';

    await slackNotifier.sendDetailedSuiteSummary(
      suiteName,
      platform,
      reportUrl,
      passedSteps,
      failedSteps,
      0, // skipped
      journeySteps,
      failureReasons
    );
    
    console.log('📱 Slack notification process completed');
  } else {
    console.log('📱 Slack notifications are DISABLED - skipping notification');
  }
  
  // ALWAYS log to Supabase after every scenario (pass or fail)
  // This matches Slack behavior - logs are sent regardless of test outcome
  if (supabaseLogger.isEnabled()) {
    try {
      logger.info('📊 Logging execution to Supabase...');
      
      // Get complete execution data
      const executionData = executionDataCollector.getExecutionData({
        reportUrl: process.env.REPORT_URL || 'https://fnp-test-reports.s3.us-east-1.amazonaws.com/latest-report/index.html',
        slackNotificationSent: SlackNotifier.isGlobalEnabled()
      });
      
      logger.info(`📊 Logging ${executionData.journeys.length} journeys...`);
      
      // Log journeys
      for (const journey of executionData.journeys) {
        try {
          logger.info(`📝 Logging journey: ${journey.journey_name}`);
          await supabaseLogger.logJourney({
            journeyNumber: journey.journey_number,
            journeyName: journey.journey_name,
            journeyDescription: journey.journey_description,
            status: journey.status,
            startTime: journey.start_time,
            endTime: journey.end_time,
            durationMs: journey.duration_ms,
            failureReason: journey.failure_reason,
            errorType: journey.error_type,
            errorMessage: journey.error_message,
            errorStack: journey.error_stack,
            steps: journey.steps,
            metadata: journey.metadata
          });
          logger.info(`✅ Journey logged: ${journey.journey_name}`);
        } catch (journeyError) {
          logger.error(`❌ Failed to log journey ${journey.journey_name}: ${journeyError.message}`);
          console.error(journeyError.stack);
        }
      }
      
      // Complete the test run with final statistics
      await supabaseLogger.completeTestRun({
        totalJourneys: executionData.summary.total_journeys,
        passedJourneys: executionData.summary.passed_journeys,
        failedJourneys: executionData.summary.failed_journeys,
        skippedJourneys: executionData.summary.skipped_journeys,
        totalSteps: executionData.summary.total_steps,
        passedSteps: executionData.summary.passed_steps,
        failedSteps: executionData.summary.failed_steps,
        skippedSteps: executionData.summary.skipped_steps,
        reportUrl: executionData.report_url,
        slackNotificationSent: executionData.slack_notification_sent
      });
      
      logger.info(`✅ Execution logged to Supabase successfully`);
      console.log(`\n📊 View logs at: https://wnymknrycmldwqzdqoct.supabase.co`);
    } catch (error) {
      logger.error(`❌ Error logging to Supabase: ${error.message}`);
      console.error(error.stack);
    }
  }

  // Aggressive cleanup
  try {
    if (this.page && !this.page.isClosed()) {
      await this.page.close();
    }
  } catch (error) {
    console.log('Error closing page:', error.message);
  }

  try {
    if (this.context) {
      await this.context.close();
    }
  } catch (error) {
    console.log('Error closing context:', error.message);
  }

  try {
    if (this.browser) {
      await this.browser.close();
    }
  } catch (error) {
    console.log('Error closing browser:', error.message);
  }
  
  // Force garbage collection after scenario
  if (global.gc && process.env.CI === 'true') {
    global.gc();
    const memUsage = process.memoryUsage();
    console.log(`🧠 Final Memory: RSS=${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, Heap=${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`📊 Total steps executed: ${stepCounter}, Total journeys: ${journeyCounter}`);
  }
});