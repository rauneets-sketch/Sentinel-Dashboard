/**
 * ExecutionDataCollector - Collects and transforms test execution data
 * 
 * Purpose:
 * - Bridges existing tracking systems (StepTracker, ApiResponseTracker) with SupabaseLogger
 * - Transforms Cucumber/Playwright execution data into Supabase-compatible format
 * - Aggregates journey and step data for centralized logging
 * - Provides high-fidelity execution metadata for analytics
 * 
 * @author FNP Automation Team
 * @version 1.0.0
 * @created January 8, 2026
 */

const logger = require('../utils/Logger');

class ExecutionDataCollector {
  constructor() {
    // Execution tracking
    this.testRunData = null;
    this.journeys = [];
    this.currentJourney = null;
    this.journeyCounter = 0;
    
    // Timing
    this.runStartTime = null;
    this.journeyStartTime = null;
  }

  /**
   * Initialize a new test run
   * 
   * @param {Object} config - Test run configuration
   * @param {string} config.framework - Framework name (default: 'playwright')
   * @param {string} config.suiteName - Test suite name
   * @param {string} config.environment - Environment (dev/uat/prod)
   * @param {string} config.platform - Platform (web/mobile/api)
   */
  initializeTestRun(config = {}) {
    this.runStartTime = Date.now();
    this.journeys = [];
    this.journeyCounter = 0;
    
    this.testRunData = {
      framework: config.framework || 'playwright',
      suite_name: config.suiteName || 'FNP Automation Framework',
      environment: config.environment || process.env.ENV || 'dev',
      platform: config.platform || 'web',
      executed_at: new Date().toISOString(),
      build_number: process.env.BUILD_NUMBER || 'local',
      build_url: process.env.BUILD_URL || null,
      job_name: process.env.JOB_NAME || 'local-test',
      metadata: {
        node_version: process.version,
        ci: process.env.CI === 'true',
        headless: process.env.HEADLESS === 'true'
      }
    };
    
    logger.info('📊 ExecutionDataCollector: Test run initialized');
  }

  /**
   * Start tracking a new journey
   * 
   * @param {string} scenarioName - Cucumber scenario name
   */
  startJourney(scenarioName) {
    this.journeyCounter++;
    this.journeyStartTime = Date.now();
    
    // Extract journey number and name from scenario
    const journeyInfo = this.parseJourneyInfo(scenarioName);
    
    this.currentJourney = {
      journey_number: journeyInfo.number,
      journey_name: journeyInfo.name,
      journey_description: scenarioName,
      status: 'PASSED', // Default, will be updated on failure
      start_time: new Date().toISOString(),
      steps: []
    };
    
    logger.info(`📝 ExecutionDataCollector: Started Journey ${this.journeyCounter}: ${journeyInfo.name}`);
  }

  /**
   * Add a step to the current journey
   * 
   * @param {Object} stepData - Step execution data from StepTracker
   * @param {string} stepData.name - Step name
   * @param {string} stepData.status - Step status (PASSED/FAILED/SKIPPED)
   * @param {number} stepData.duration - Step duration in ms
   * @param {number} stepData.timestamp - Step start timestamp
   * @param {Object} stepData.error - Error details (if failed)
   * @param {Array} apiCalls - API calls made during this step (from ApiResponseTracker)
   */
  addStep(stepData, apiCalls = []) {
    if (!this.currentJourney) {
      logger.warn('⚠️ ExecutionDataCollector: No active journey, cannot add step');
      return;
    }

    const step = {
      step_name: stepData.name,
      status: stepData.status,
      start_time: new Date(stepData.timestamp).toISOString(),
      end_time: new Date(stepData.timestamp + stepData.duration).toISOString(),
      duration_ms: stepData.duration,
      error_type: stepData.error?.type || null,
      error_message: stepData.error?.message || null,
      error_stack: stepData.error?.stack || null,
      api_calls: apiCalls.length > 0 ? this.sanitizeApiCalls(apiCalls) : null,
      metadata: {}
    };

    this.currentJourney.steps.push(step);
    
    // Update journey status if step failed
    if (stepData.status === 'FAILED') {
      this.currentJourney.status = 'FAILED';
      
      // Set journey failure information from first failed step
      if (!this.currentJourney.failure_reason) {
        this.currentJourney.failure_reason = this.extractFailureReason(stepData);
        this.currentJourney.error_type = stepData.error?.type || 'UnknownError';
        this.currentJourney.error_message = stepData.error?.message || 'Unknown error occurred';
        this.currentJourney.error_stack = stepData.error?.stack || null;
      }
    }
  }

  /**
   * Complete the current journey
   */
  completeJourney() {
    if (!this.currentJourney) {
      logger.warn('⚠️ ExecutionDataCollector: No active journey to complete');
      return;
    }

    const endTime = Date.now();
    this.currentJourney.end_time = new Date(endTime).toISOString();
    this.currentJourney.duration_ms = endTime - this.journeyStartTime;
    
    // Add completed journey to collection
    this.journeys.push({ ...this.currentJourney });
    
    logger.info(`✅ ExecutionDataCollector: Completed Journey ${this.journeyCounter}: ${this.currentJourney.journey_name}`);
    logger.info(`   Status: ${this.currentJourney.status}, Steps: ${this.currentJourney.steps.length}, Duration: ${this.currentJourney.duration_ms}ms`);
    
    this.currentJourney = null;
  }

  /**
   * Get complete execution data for logging
   * 
   * @param {Object} additionalData - Additional data to include
   * @param {string} additionalData.reportUrl - Report URL
   * @param {boolean} additionalData.slackNotificationSent - Slack notification status
   * @returns {Object} - Complete execution data
   */
  getExecutionData(additionalData = {}) {
    // Calculate summary statistics
    const summary = this.calculateSummary();
    
    const executionData = {
      ...this.testRunData,
      executed_at: this.testRunData.executed_at,
      completed_at: new Date().toISOString(),
      total_runtime_ms: Date.now() - this.runStartTime,
      summary: summary,
      journeys: this.journeys,
      report_url: additionalData.reportUrl || process.env.REPORT_URL || null,
      slack_notification_sent: additionalData.slackNotificationSent || false
    };
    
    logger.info('📊 ExecutionDataCollector: Execution data prepared');
    logger.info(`   Total Journeys: ${summary.total_journeys}`);
    logger.info(`   Passed: ${summary.passed_journeys}, Failed: ${summary.failed_journeys}`);
    logger.info(`   Total Steps: ${summary.total_steps}`);
    logger.info(`   Success Rate: ${summary.success_rate}%`);
    
    return executionData;
  }

  /**
   * Calculate summary statistics from collected journeys
   * 
   * @returns {Object} - Summary statistics
   */
  calculateSummary() {
    const totalJourneys = this.journeys.length;
    const passedJourneys = this.journeys.filter(j => j.status === 'PASSED').length;
    const failedJourneys = this.journeys.filter(j => j.status === 'FAILED').length;
    const skippedJourneys = this.journeys.filter(j => j.status === 'SKIPPED').length;
    
    // Calculate step statistics across all journeys
    let totalSteps = 0;
    let passedSteps = 0;
    let failedSteps = 0;
    let skippedSteps = 0;
    
    this.journeys.forEach(journey => {
      journey.steps.forEach(step => {
        totalSteps++;
        if (step.status === 'PASSED') passedSteps++;
        else if (step.status === 'FAILED') failedSteps++;
        else if (step.status === 'SKIPPED') skippedSteps++;
      });
    });
    
    const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(2) : 0;
    
    return {
      total_journeys: totalJourneys,
      passed_journeys: passedJourneys,
      failed_journeys: failedJourneys,
      skipped_journeys: skippedJourneys,
      total_steps: totalSteps,
      passed_steps: passedSteps,
      failed_steps: failedSteps,
      skipped_steps: skippedSteps,
      success_rate: parseFloat(successRate)
    };
  }

  /**
   * Parse journey information from scenario name
   * 
   * @param {string} scenarioName - Cucumber scenario name
   * @returns {Object} - Journey number and name
   */
  parseJourneyInfo(scenarioName) {
    // Default values
    let journeyNumber = this.journeyCounter;
    let journeyName = scenarioName;
    
    // Try to extract journey number from scenario name
    // Example: "Complete Nineteen Journey Flow" -> Journey 1, 2, 3...
    // We'll use the journey counter as the number
    
    // Map common scenario patterns to journey names
    if (scenarioName.includes('Home Page Exploration')) {
      journeyName = 'Home Page Exploration';
    } else if (scenarioName.includes('Payment Methods')) {
      journeyName = 'Payment Methods Testing';
    } else if (scenarioName.includes('International Phone')) {
      journeyName = 'International Phone Number Change';
    } else if (scenarioName.includes('Reminder') && scenarioName.includes('FAQ')) {
      journeyName = 'Reminder and FAQ Testing';
    } else if (scenarioName.includes('International Purchase')) {
      journeyName = 'International Purchase';
    } else if (scenarioName.includes('DA Page')) {
      journeyName = 'DA Page Modification';
    } else if (scenarioName.includes('Combinational')) {
      journeyName = 'Combinational Purchase';
    } else if (scenarioName.includes('ADD-On') || scenarioName.includes('Addon')) {
      journeyName = 'ADD-On Testing on PDP';
    } else if (scenarioName.includes('Cake Variant')) {
      journeyName = 'Cake Variant Testing';
    } else if (scenarioName.includes('Coupon')) {
      journeyName = 'Coupon Testing';
    } else if (scenarioName.includes('Personalized') && scenarioName.includes('Text')) {
      journeyName = 'Personalized Text Product';
    } else if (scenarioName.includes('Message Card')) {
      journeyName = 'Message Card Integration';
    } else if (scenarioName.includes('Product Exploration')) {
      journeyName = 'Product Exploration';
    } else if (scenarioName.includes('Same SKU')) {
      journeyName = 'Same SKU Product Exploration';
    } else if (scenarioName.includes('Search Based')) {
      journeyName = 'Search Based Purchase';
    } else if (scenarioName.includes('Photo Upload')) {
      journeyName = 'Personalized Photo Upload';
    } else if (scenarioName.includes('Location Testing')) {
      journeyName = 'Location Testing';
    } else if (scenarioName.includes('Spherical') || scenarioName.includes('Icon')) {
      journeyName = 'Spherical Home Page Icon Exploration';
    } else if (scenarioName.includes('Gmail OTP')) {
      journeyName = 'Gmail OTP Login';
    }
    
    return {
      number: journeyNumber,
      name: journeyName
    };
  }

  /**
   * Extract user-friendly failure reason from step error
   * 
   * @param {Object} stepData - Step data with error
   * @returns {string} - User-friendly failure reason
   */
  extractFailureReason(stepData) {
    if (!stepData.error) {
      return 'Unknown failure';
    }

    const errorMessage = stepData.error.message || '';
    const errorType = stepData.error.type || '';
    
    // Map technical errors to business-friendly reasons
    if (errorMessage.toLowerCase().includes('timeout')) {
      return 'Page or element took too long to respond';
    } else if (errorMessage.toLowerCase().includes('not found') || errorMessage.toLowerCase().includes('locator')) {
      return 'Required page element was not found';
    } else if (errorMessage.toLowerCase().includes('click')) {
      return 'Unable to interact with page element';
    } else if (errorMessage.toLowerCase().includes('network')) {
      return 'Network connectivity issue';
    } else if (errorMessage.toLowerCase().includes('navigation')) {
      return 'Page navigation failed';
    } else if (errorMessage.toLowerCase().includes('detached')) {
      return 'Page element became detached from DOM';
    } else if (errorType.includes('Assertion')) {
      return 'Assertion failed - expected condition not met';
    }
    
    // Default to step name + error type
    return `${stepData.name} failed: ${errorType}`;
  }

  /**
   * Sanitize API calls for storage
   * Removes sensitive data and limits size
   * 
   * @param {Array} apiCalls - Raw API calls from ApiResponseTracker
   * @returns {Array} - Sanitized API calls
   */
  sanitizeApiCalls(apiCalls) {
    return apiCalls.map(call => ({
      url: call.url,
      method: call.method,
      status: call.status,
      status_text: call.statusText,
      timestamp: call.timestamp,
      // Only include response body for failed calls (4xx, 5xx)
      response_body: call.status >= 400 ? this.truncateResponseBody(call.responseBody) : null,
      // Exclude headers to reduce size (already sanitized in ApiResponseTracker)
      // headers: call.headers
    }));
  }

  /**
   * Truncate response body to reasonable size
   * 
   * @param {any} responseBody - Response body
   * @returns {string|null} - Truncated response body
   */
  truncateResponseBody(responseBody) {
    if (!responseBody) return null;
    
    try {
      const bodyStr = typeof responseBody === 'string' 
        ? responseBody 
        : JSON.stringify(responseBody);
      
      // Limit to 1000 characters
      return bodyStr.length > 1000 
        ? bodyStr.substring(0, 997) + '...' 
        : bodyStr;
    } catch (error) {
      return 'Unable to serialize response body';
    }
  }

  /**
   * Reset collector state
   */
  reset() {
    this.testRunData = null;
    this.journeys = [];
    this.currentJourney = null;
    this.journeyCounter = 0;
    this.runStartTime = null;
    this.journeyStartTime = null;
    
    logger.info('🔄 ExecutionDataCollector: State reset');
  }

  /**
   * Get current journey count
   * @returns {number}
   */
  getJourneyCount() {
    return this.journeyCounter;
  }

  /**
   * Get collected journeys
   * @returns {Array}
   */
  getJourneys() {
    return [...this.journeys];
  }
}

// Singleton instance
const executionDataCollector = new ExecutionDataCollector();

module.exports = { ExecutionDataCollector, executionDataCollector };
