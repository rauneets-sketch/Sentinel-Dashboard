/**
 * SupabaseLogger - Centralized JSON logging service for test execution metadata
 * 
 * Purpose:
 * - Captures complete execution metadata after every test run
 * - Sends logs directly to Supabase (remote storage only, no local files)
 * - Provides data for React dashboard analytics and visualizations
 * - Framework-agnostic design supporting multiple automation frameworks
 * 
 * Features:
 * - Dynamic nested JSON structure (runs -> journeys -> steps)
 * - Step-level execution timing and failure tracking
 * - API call tracking with request/response details
 * - Retry logic for network failures
 * - Non-blocking operation (logging failures don't fail tests)
 * 
 * @author FNP Automation Team
 * @version 1.0.0
 * @created January 8, 2026
 */

const axios = require('axios');
const logger = require('../utils/Logger');

class SupabaseLogger {
  /**
   * Initialize Supabase logger with configuration
   * 
   * @param {Object} config - Supabase configuration
   * @param {string} config.supabaseUrl - Supabase project URL
   * @param {string} config.supabaseKey - Supabase anon/service key
   * @param {number} config.maxRetries - Maximum retry attempts (default: 3)
   * @param {number} config.retryDelay - Delay between retries in ms (default: 1000)
   */
  constructor(config = {}) {
    // Supabase configuration
    this.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
    this.supabaseKey = config.supabaseKey || process.env.SUPABASE_KEY;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Validate configuration
    if (!this.supabaseUrl || !this.supabaseKey) {
      logger.warn('⚠️ SupabaseLogger: Missing Supabase configuration. Logging will be disabled.');
      logger.warn('   Set SUPABASE_URL and SUPABASE_KEY environment variables to enable logging.');
      this.enabled = false;
    } else {
      this.enabled = true;
      logger.info('✅ SupabaseLogger: Initialized successfully');
      logger.info(`   Supabase URL: ${this.supabaseUrl}`);
    }
    
    // Axios instance for Supabase REST API
    this.client = axios.create({
      baseURL: `${this.supabaseUrl}/rest/v1`,
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      timeout: 30000 // 30 second timeout
    });
    
    // Current run tracking
    this.currentRun = null;
    this.currentRunId = null;
  }

  /**
   * Check if logger is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Ingest raw JSON payload (immutable storage)
   * This is the primary ingestion method called from CI pipeline
   * 
   * @param {Object} rawPayload - Complete JSON payload from test execution
   * @param {string} ingestionSource - Source of ingestion (e.g., 'jenkins', 'github-actions')
   * @returns {Promise<string>} - Log ID
   */
  async ingestRawLog(rawPayload, ingestionSource = 'jenkins') {
    if (!this.enabled) {
      logger.debug('SupabaseLogger: Disabled, skipping ingestRawLog');
      return null;
    }

    try {
      logger.info('📊 SupabaseLogger: Ingesting raw test log...');
      
      // Extract metadata from payload for indexing
      const runId = rawPayload.run_id || rawPayload.runId;
      const framework = rawPayload.framework || 'playwright';
      const environment = rawPayload.environment || process.env.ENV || 'dev';
      const executedAt = rawPayload.executed_at || rawPayload.executedAt || new Date().toISOString();
      
      const rawLog = {
        raw_payload: rawPayload,
        run_id: runId,
        framework: framework,
        environment: environment,
        executed_at: executedAt,
        ingestion_source: ingestionSource,
        processed: false
      };

      const response = await this.executeWithRetry(async () => {
        return await this.client.post('/raw_test_logs', rawLog);
      });

      if (response && response.data && response.data.length > 0) {
        const logId = response.data[0].log_id;
        logger.info(`✅ SupabaseLogger: Raw log ingested with ID: ${logId}`);
        
        // Now process the raw log into normalized tables
        await this.processRawLog(logId, rawPayload);
        
        return logId;
      } else {
        throw new Error('Failed to ingest raw log: No data returned');
      }
    } catch (error) {
      logger.error(`❌ SupabaseLogger: Failed to ingest raw log: ${error.message}`);
      return null;
    }
  }

  /**
   * Process raw log into normalized tables
   * 
   * @param {string} logId - Raw log ID
   * @param {Object} rawPayload - Raw JSON payload
   * @returns {Promise<boolean>} - Success status
   */
  async processRawLog(logId, rawPayload) {
    try {
      logger.info('📊 SupabaseLogger: Processing raw log into normalized tables...');
      
      // Create test run
      const runId = await this.createTestRunFromRaw(rawPayload, logId);
      
      if (!runId) {
        throw new Error('Failed to create test run from raw log');
      }
      
      // Mark raw log as processed
      await this.executeWithRetry(async () => {
        return await this.client.patch(
          `/raw_test_logs?log_id=eq.${logId}`,
          { processed: true }
        );
      });
      
      logger.info('✅ SupabaseLogger: Raw log processed successfully');
      return true;
    } catch (error) {
      logger.error(`❌ SupabaseLogger: Failed to process raw log: ${error.message}`);
      
      // Mark processing error
      await this.executeWithRetry(async () => {
        return await this.client.patch(
          `/raw_test_logs?log_id=eq.${logId}`,
          { 
            processed: false,
            processing_error: error.message
          }
        );
      });
      
      return false;
    }
  }

  /**
   * Create test run from raw payload
   * 
   * @param {Object} rawPayload - Raw JSON payload
   * @param {string} rawLogId - Raw log ID
   * @returns {Promise<string>} - Run ID
   */
  async createTestRunFromRaw(rawPayload, rawLogId) {
    const summary = rawPayload.summary || {};
    const totalSteps = summary.total_steps || summary.totalSteps || 0;
    const passedSteps = summary.passed_steps || summary.passedSteps || 0;
    const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(2) : 0;
    
    const testRun = {
      run_id: rawPayload.run_id || rawPayload.runId,
      framework: rawPayload.framework || 'playwright',
      suite_name: rawPayload.suite_name || rawPayload.suiteName || 'FNP Automation Framework',
      environment: rawPayload.environment || process.env.ENV || 'dev',
      platform: rawPayload.platform || 'web',
      executed_at: rawPayload.executed_at || rawPayload.executedAt,
      completed_at: rawPayload.completed_at || rawPayload.completedAt,
      total_runtime_ms: rawPayload.total_runtime_ms || rawPayload.totalRuntimeMs,
      total_journeys: summary.total_journeys || summary.totalJourneys || 0,
      passed_journeys: summary.passed_journeys || summary.passedJourneys || 0,
      failed_journeys: summary.failed_journeys || summary.failedJourneys || 0,
      skipped_journeys: summary.skipped_journeys || summary.skippedJourneys || 0,
      total_steps: totalSteps,
      passed_steps: passedSteps,
      failed_steps: summary.failed_steps || summary.failedSteps || 0,
      skipped_steps: summary.skipped_steps || summary.skippedSteps || 0,
      success_rate: parseFloat(successRate),
      build_number: rawPayload.build_number || rawPayload.buildNumber || process.env.BUILD_NUMBER,
      build_url: rawPayload.build_url || rawPayload.buildUrl || process.env.BUILD_URL,
      job_name: rawPayload.job_name || rawPayload.jobName || process.env.JOB_NAME,
      report_url: rawPayload.report_url || rawPayload.reportUrl,
      slack_notification_sent: rawPayload.slack_notification_sent || rawPayload.slackNotificationSent || false,
      metadata: rawPayload.metadata || {},
      raw_log_id: rawLogId
    };

    const response = await this.executeWithRetry(async () => {
      return await this.client.post('/test_runs', testRun);
    });

    if (response && response.data && response.data.length > 0) {
      const runId = response.data[0].run_id;
      
      // Process journeys
      const journeys = rawPayload.journeys || [];
      for (const journey of journeys) {
        await this.createJourneyFromRaw(runId, journey);
      }
      
      return runId;
    }
    
    return null;
  }

  /**
   * Create journey from raw payload
   * 
   * @param {string} runId - Test run ID
   * @param {Object} journeyData - Journey data from raw payload
   * @returns {Promise<string>} - Journey ID
   */
  async createJourneyFromRaw(runId, journeyData) {
    const steps = journeyData.steps || [];
    const totalSteps = steps.length;
    const passedSteps = steps.filter(s => s.status === 'PASSED').length;
    const failedSteps = steps.filter(s => s.status === 'FAILED').length;
    
    const journey = {
      run_id: runId,
      journey_number: journeyData.journey_number || journeyData.journeyNumber,
      journey_name: journeyData.journey_name || journeyData.journeyName,
      journey_description: journeyData.journey_description || journeyData.journeyDescription,
      status: journeyData.status,
      start_time: journeyData.start_time || journeyData.startTime,
      end_time: journeyData.end_time || journeyData.endTime,
      duration_ms: journeyData.duration_ms || journeyData.durationMs,
      failure_reason: journeyData.failure_reason || journeyData.failureReason,
      error_type: journeyData.error_type || journeyData.errorType,
      error_message: journeyData.error_message || journeyData.errorMessage,
      error_stack: journeyData.error_stack || journeyData.errorStack,
      total_steps: totalSteps,
      passed_steps: passedSteps,
      failed_steps: failedSteps,
      screenshot_url: journeyData.screenshot_url || journeyData.screenshotUrl,
      video_url: journeyData.video_url || journeyData.videoUrl,
      metadata: journeyData.metadata || {}
    };

    const response = await this.executeWithRetry(async () => {
      return await this.client.post('/journeys', journey);
    });

    if (response && response.data && response.data.length > 0) {
      const journeyId = response.data[0].journey_id;
      
      // Process steps
      if (steps.length > 0) {
        await this.createStepsFromRaw(journeyId, runId, steps);
      }
      
      return journeyId;
    }
    
    return null;
  }

  /**
   * Create steps from raw payload
   * 
   * @param {string} journeyId - Journey ID
   * @param {string} runId - Run ID
   * @param {Array} stepsData - Steps data from raw payload
   * @returns {Promise<boolean>} - Success status
   */
  async createStepsFromRaw(journeyId, runId, stepsData) {
    const steps = stepsData.map((step, index) => ({
      journey_id: journeyId,
      run_id: runId,
      step_number: index + 1,
      step_name: step.step_name || step.stepName || step.name,
      step_description: step.step_description || step.stepDescription || step.description,
      status: step.status,
      start_time: step.start_time || step.startTime,
      end_time: step.end_time || step.endTime,
      duration_ms: step.duration_ms || step.durationMs || step.duration,
      error_type: step.error_type || step.errorType || step.error?.type,
      error_message: step.error_message || step.errorMessage || step.error?.message,
      error_stack: step.error_stack || step.errorStack || step.error?.stack,
      api_calls: step.api_calls || step.apiCalls,
      screenshot_url: step.screenshot_url || step.screenshotUrl,
      metadata: step.metadata || {}
    }));

    const response = await this.executeWithRetry(async () => {
      return await this.client.post('/steps', steps);
    });

    return response && response.data;
  }

  /**
   * Start a new test run
   * 
   * @param {Object} runData - Test run metadata
   * @param {string} runData.framework - Framework name (e.g., 'playwright')
   * @param {string} runData.suiteName - Test suite name
   * @param {string} runData.environment - Environment (dev/uat/prod)
   * @param {string} runData.platform - Platform (web/mobile/api)
   * @param {string} runData.buildNumber - CI build number
   * @param {string} runData.buildUrl - CI build URL
   * @param {string} runData.jobName - CI job name
   * @param {Object} runData.metadata - Additional metadata
   * @returns {Promise<string>} - Run ID
   */
  async startTestRun(runData) {
    if (!this.enabled) {
      logger.debug('SupabaseLogger: Disabled, skipping startTestRun');
      return null;
    }

    try {
      logger.info('📊 SupabaseLogger: Starting new test run...');
      
      const testRun = {
        framework: runData.framework || 'playwright',
        suite_name: runData.suiteName || 'FNP Automation Framework',
        environment: runData.environment || process.env.ENV || 'dev',
        platform: runData.platform || 'web',
        executed_at: new Date().toISOString(),
        build_number: runData.buildNumber || process.env.BUILD_NUMBER || 'local',
        build_url: runData.buildUrl || process.env.BUILD_URL || null,
        job_name: runData.jobName || process.env.JOB_NAME || 'local-test',
        metadata: runData.metadata || {}
      };

      const response = await this.executeWithRetry(async () => {
        return await this.client.post('/test_runs', testRun);
      });

      if (response && response.data && response.data.length > 0) {
        this.currentRunId = response.data[0].run_id;
        this.currentRun = {
          ...testRun,
          run_id: this.currentRunId,
          journeys: [],
          startTime: Date.now()
        };
        
        logger.info(`✅ SupabaseLogger: Test run created with ID: ${this.currentRunId}`);
        return this.currentRunId;
      } else {
        throw new Error('Failed to create test run: No data returned');
      }
    } catch (error) {
      logger.error(`❌ SupabaseLogger: Failed to start test run: ${error.message}`);
      this.enabled = false; // Disable for this session to avoid repeated failures
      return null;
    }
  }

  /**
   * Log a journey (scenario) execution
   * 
   * @param {Object} journeyData - Journey execution data
   * @param {number} journeyData.journeyNumber - Journey number (1, 2, 3...)
   * @param {string} journeyData.journeyName - Journey name
   * @param {string} journeyData.journeyDescription - Journey description
   * @param {string} journeyData.status - Status (PASSED/FAILED/SKIPPED)
   * @param {string} journeyData.startTime - ISO timestamp
   * @param {string} journeyData.endTime - ISO timestamp
   * @param {number} journeyData.durationMs - Duration in milliseconds
   * @param {string} journeyData.failureReason - Failure reason (if failed)
   * @param {string} journeyData.errorType - Error type (if failed)
   * @param {string} journeyData.errorMessage - Error message (if failed)
   * @param {string} journeyData.errorStack - Error stack trace (if failed)
   * @param {Array} journeyData.steps - Array of step objects
   * @param {Object} journeyData.metadata - Additional metadata
   * @returns {Promise<string>} - Journey ID
   */
  async logJourney(journeyData) {
    if (!this.enabled || !this.currentRunId) {
      logger.debug('SupabaseLogger: Disabled or no active run, skipping logJourney');
      return null;
    }

    try {
      logger.info(`📝 SupabaseLogger: Logging journey ${journeyData.journeyNumber}: ${journeyData.journeyName}`);
      
      // Calculate step statistics
      const steps = journeyData.steps || [];
      const totalSteps = steps.length;
      const passedSteps = steps.filter(s => s.status === 'PASSED').length;
      const failedSteps = steps.filter(s => s.status === 'FAILED').length;
      
      const journey = {
        run_id: this.currentRunId,
        journey_number: journeyData.journeyNumber,
        journey_name: journeyData.journeyName,
        journey_description: journeyData.journeyDescription || null,
        status: journeyData.status,
        start_time: journeyData.startTime,
        end_time: journeyData.endTime || new Date().toISOString(),
        duration_ms: journeyData.durationMs,
        failure_reason: journeyData.failureReason || null,
        error_type: journeyData.errorType || null,
        error_message: journeyData.errorMessage || null,
        error_stack: journeyData.errorStack || null,
        total_steps: totalSteps,
        passed_steps: passedSteps,
        failed_steps: failedSteps,
        screenshot_url: journeyData.screenshotUrl || null,
        video_url: journeyData.videoUrl || null,
        metadata: journeyData.metadata || {}
      };

      const response = await this.executeWithRetry(async () => {
        return await this.client.post('/journeys', journey);
      });

      if (response && response.data && response.data.length > 0) {
        const journeyId = response.data[0].journey_id;
        logger.info(`✅ SupabaseLogger: Journey logged with ID: ${journeyId}`);
        
        // Log all steps for this journey
        if (steps.length > 0) {
          await this.logSteps(journeyId, steps);
        }
        
        return journeyId;
      } else {
        throw new Error('Failed to log journey: No data returned');
      }
    } catch (error) {
      logger.error(`❌ SupabaseLogger: Failed to log journey: ${error.message}`);
      return null;
    }
  }

  /**
   * Log multiple steps for a journey
   * 
   * @param {string} journeyId - Journey ID
   * @param {Array} steps - Array of step objects
   * @returns {Promise<boolean>} - Success status
   */
  async logSteps(journeyId, steps) {
    if (!this.enabled || !this.currentRunId) {
      logger.debug('SupabaseLogger: Disabled or no active run, skipping logSteps');
      return false;
    }

    try {
      logger.info(`📝 SupabaseLogger: Logging ${steps.length} steps for journey ${journeyId}`);
      
      // Transform steps to database format
      const stepsData = steps.map((step, index) => {
        // Handle timestamp conversion safely
        let startTime, endTime;
        
        if (step.start_time) {
          startTime = step.start_time;
        } else if (step.startTime) {
          startTime = step.startTime;
        } else if (step.timestamp) {
          startTime = new Date(step.timestamp).toISOString();
        } else {
          startTime = new Date().toISOString();
        }
        
        if (step.end_time) {
          endTime = step.end_time;
        } else if (step.endTime) {
          endTime = step.endTime;
        } else if (step.timestamp && step.duration) {
          endTime = new Date(step.timestamp + step.duration).toISOString();
        } else {
          endTime = startTime;
        }
        
        return {
          journey_id: journeyId,
          run_id: this.currentRunId,
          step_number: index + 1,
          step_name: step.step_name || step.name || step.stepName || 'Unknown Step',
          step_description: step.step_description || step.description || null,
          status: step.status,
          start_time: startTime,
          end_time: endTime,
          duration_ms: step.duration_ms || step.duration || step.durationMs || 0,
          error_type: step.error_type || step.error?.type || step.errorType || null,
          error_message: step.error_message || step.error?.message || step.errorMessage || null,
          error_stack: step.error_stack || step.error?.stack || step.errorStack || null,
          api_calls: step.api_calls || step.apiCalls || null,
          screenshot_url: step.screenshot_url || step.screenshotUrl || null,
          metadata: step.metadata || {}
        };
      });

      // Batch insert steps (Supabase supports bulk inserts)
      const response = await this.executeWithRetry(async () => {
        return await this.client.post('/steps', stepsData);
      });

      if (response && response.data) {
        logger.info(`✅ SupabaseLogger: ${stepsData.length} steps logged successfully`);
        return true;
      } else {
        throw new Error('Failed to log steps: No data returned');
      }
    } catch (error) {
      logger.error(`❌ SupabaseLogger: Failed to log steps: ${error.message}`);
      logger.error(`   Stack: ${error.stack}`);
      return false;
    }
  }

  /**
   * Complete the current test run with final statistics
   * 
   * @param {Object} summary - Test run summary
   * @param {number} summary.totalJourneys - Total journeys executed
   * @param {number} summary.passedJourneys - Passed journeys
   * @param {number} summary.failedJourneys - Failed journeys
   * @param {number} summary.skippedJourneys - Skipped journeys
   * @param {number} summary.totalSteps - Total steps executed
   * @param {number} summary.passedSteps - Passed steps
   * @param {number} summary.failedSteps - Failed steps
   * @param {number} summary.skippedSteps - Skipped steps
   * @param {string} summary.reportUrl - Report URL
   * @param {boolean} summary.slackNotificationSent - Slack notification status
   * @returns {Promise<boolean>} - Success status
   */
  async completeTestRun(summary) {
    if (!this.enabled || !this.currentRunId) {
      logger.debug('SupabaseLogger: Disabled or no active run, skipping completeTestRun');
      return false;
    }

    try {
      logger.info('📊 SupabaseLogger: Completing test run...');
      
      const totalSteps = summary.totalSteps || 0;
      const passedSteps = summary.passedSteps || 0;
      const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(2) : 0;
      
      const completionData = {
        completed_at: new Date().toISOString(),
        total_runtime_ms: Date.now() - this.currentRun.startTime,
        total_journeys: summary.totalJourneys || 0,
        passed_journeys: summary.passedJourneys || 0,
        failed_journeys: summary.failedJourneys || 0,
        skipped_journeys: summary.skippedJourneys || 0,
        total_steps: totalSteps,
        passed_steps: passedSteps,
        failed_steps: summary.failedSteps || 0,
        skipped_steps: summary.skippedSteps || 0,
        success_rate: parseFloat(successRate),
        report_url: summary.reportUrl || null,
        slack_notification_sent: summary.slackNotificationSent || false
      };

      const response = await this.executeWithRetry(async () => {
        return await this.client.patch(
          `/test_runs?run_id=eq.${this.currentRunId}`,
          completionData
        );
      });

      if (response) {
        logger.info(`✅ SupabaseLogger: Test run completed successfully`);
        logger.info(`   Run ID: ${this.currentRunId}`);
        logger.info(`   Success Rate: ${successRate}%`);
        logger.info(`   Total Runtime: ${completionData.total_runtime_ms}ms`);
        
        // Reset current run
        this.currentRun = null;
        this.currentRunId = null;
        
        return true;
      } else {
        throw new Error('Failed to complete test run: No response');
      }
    } catch (error) {
      logger.error(`❌ SupabaseLogger: Failed to complete test run: ${error.message}`);
      return false;
    }
  }

  /**
   * Log complete test execution (all-in-one method)
   * This method accepts the complete execution data and logs everything at once
   * 
   * @param {Object} executionData - Complete execution data
   * @returns {Promise<string>} - Run ID
   */
  async logCompleteExecution(executionData) {
    if (!this.enabled) {
      logger.debug('SupabaseLogger: Disabled, skipping logCompleteExecution');
      return null;
    }

    try {
      logger.info('📊 SupabaseLogger: Logging complete test execution...');
      
      // Start test run
      const runId = await this.startTestRun({
        framework: executionData.framework,
        suiteName: executionData.suite_name || executionData.suiteName,
        environment: executionData.environment,
        platform: executionData.platform,
        buildNumber: executionData.build_number || executionData.buildNumber,
        buildUrl: executionData.build_url || executionData.buildUrl,
        jobName: executionData.job_name || executionData.jobName,
        metadata: executionData.metadata
      });

      if (!runId) {
        throw new Error('Failed to create test run');
      }

      // Log all journeys
      const journeys = executionData.journeys || [];
      for (const journey of journeys) {
        await this.logJourney({
          journeyNumber: journey.journey_number || journey.journeyNumber,
          journeyName: journey.journey_name || journey.journeyName,
          journeyDescription: journey.journey_description || journey.journeyDescription,
          status: journey.status,
          startTime: journey.start_time || journey.startTime,
          endTime: journey.end_time || journey.endTime,
          durationMs: journey.duration_ms || journey.durationMs,
          failureReason: journey.failure_reason || journey.failureReason,
          errorType: journey.error_type || journey.errorType,
          errorMessage: journey.error_message || journey.errorMessage,
          errorStack: journey.error_stack || journey.errorStack,
          steps: journey.steps || [],
          metadata: journey.metadata
        });
      }

      // Complete test run
      await this.completeTestRun({
        totalJourneys: executionData.summary?.total_journeys || executionData.summary?.totalJourneys || journeys.length,
        passedJourneys: executionData.summary?.passed_journeys || executionData.summary?.passedJourneys || 0,
        failedJourneys: executionData.summary?.failed_journeys || executionData.summary?.failedJourneys || 0,
        skippedJourneys: executionData.summary?.skipped_journeys || executionData.summary?.skippedJourneys || 0,
        totalSteps: executionData.summary?.total_steps || executionData.summary?.totalSteps || 0,
        passedSteps: executionData.summary?.passed_steps || executionData.summary?.passedSteps || 0,
        failedSteps: executionData.summary?.failed_steps || executionData.summary?.failedSteps || 0,
        skippedSteps: executionData.summary?.skipped_steps || executionData.summary?.skippedSteps || 0,
        reportUrl: executionData.report_url || executionData.reportUrl,
        slackNotificationSent: executionData.slack_notification_sent || executionData.slackNotificationSent || false
      });

      logger.info(`✅ SupabaseLogger: Complete execution logged successfully with run ID: ${runId}`);
      return runId;
    } catch (error) {
      logger.error(`❌ SupabaseLogger: Failed to log complete execution: ${error.message}`);
      return null;
    }
  }

  /**
   * Execute a function with retry logic
   * 
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>} - Function result
   */
  async executeWithRetry(fn) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt < this.maxRetries) {
          logger.warn(`⚠️ SupabaseLogger: Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          logger.warn(`   Error: ${error.message}`);
          await this.sleep(this.retryDelay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current run ID
   * @returns {string|null}
   */
  getCurrentRunId() {
    return this.currentRunId;
  }

  /**
   * Reset logger state
   */
  reset() {
    this.currentRun = null;
    this.currentRunId = null;
    logger.info('🔄 SupabaseLogger: State reset');
  }
}

// Singleton instance
const supabaseLogger = new SupabaseLogger();

module.exports = { SupabaseLogger, supabaseLogger };
