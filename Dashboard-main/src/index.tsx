/// <reference lib="dom" />
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono();

// Enable CORS for API routes
app.use("/api/*", cors());

// Serve static files
app.use("/static/*", serveStatic({ root: "./public", manifest: {} }));

// Mock data for test results
const generateMockTestResults = () => {
  return {
    desktop: {
      total: 145,
      passed: 132,
      failed: 8,
      skipped: 5,
      duration: 1245,
      lastRun: new Date().toISOString(),
      modules: [
        { name: "Login", passed: 12, failed: 0, duration: 145 },
        { name: "Checkout", passed: 18, failed: 2, duration: 234 },
        { name: "Product Search", passed: 25, failed: 1, duration: 189 },
        { name: "Cart Operations", passed: 20, failed: 1, duration: 167 },
        { name: "Payment Flow", passed: 15, failed: 2, duration: 298 },
        { name: "User Profile", passed: 22, failed: 1, duration: 134 },
        { name: "Order History", passed: 20, failed: 1, duration: 78 },
      ],
    },
    mobile: {
      total: 138,
      passed: 125,
      failed: 10,
      skipped: 3,
      duration: 1389,
      lastRun: new Date().toISOString(),
      modules: [
        { name: "Login", passed: 11, failed: 1, duration: 156 },
        { name: "Checkout", passed: 17, failed: 2, duration: 245 },
        { name: "Product Search", passed: 24, failed: 2, duration: 201 },
        { name: "Cart Operations", passed: 19, failed: 2, duration: 178 },
        { name: "Payment Flow", passed: 14, failed: 2, duration: 312 },
        { name: "User Profile", passed: 21, failed: 1, duration: 145 },
        { name: "Order History", passed: 19, failed: 0, duration: 152 },
      ],
    },
    android: {
      total: 142,
      passed: 128,
      failed: 9,
      skipped: 5,
      duration: 1456,
      lastRun: new Date().toISOString(),
      modules: [
        { name: "Login", passed: 12, failed: 0, duration: 167 },
        { name: "Checkout", passed: 17, failed: 2, duration: 267 },
        { name: "Product Search", passed: 23, failed: 2, duration: 212 },
        { name: "Cart Operations", passed: 20, failed: 1, duration: 189 },
        { name: "Payment Flow", passed: 14, failed: 3, duration: 334 },
        { name: "User Profile", passed: 22, failed: 1, duration: 156 },
        { name: "Order History", passed: 20, failed: 0, duration: 131 },
      ],
    },
    ios: {
      comingSoon: true,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      lastRun: new Date().toISOString(),
      modules: [],
    },
    oms: {
      total: 156,
      passed: 142,
      failed: 11,
      skipped: 3,
      duration: 1678,
      lastRun: new Date().toISOString(),
      modules: [
        { name: "Order Management", passed: 28, failed: 2, duration: 345 },
        { name: "Inventory Sync", passed: 25, failed: 3, duration: 289 },
        { name: "Shipping Integration", passed: 22, failed: 2, duration: 267 },
        { name: "Returns Processing", passed: 20, failed: 1, duration: 234 },
        { name: "Vendor Management", passed: 24, failed: 2, duration: 278 },
        { name: "Reporting", passed: 23, failed: 1, duration: 265 },
      ],
    },
  };
};

// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://wnymknrycmldwqzdqoct.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'your_supabase_service_role_key_here';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Import enhanced test data service
import { 
  fetchSystemHealth, 
  fetchLatestSystemRun, 
  fetchCorrelatedRuns, 
  fetchTabPerformance, 
  fetchRecentFailures 
} from './services/testDataService';

// API Routes - Enhanced to support OMS and Partner Panel data fetching
app.get("/api/test-results", async (c) => {
  try {
    // Get mock data for mobile and ios platforms
    const mockResults = generateMockTestResults();
    
    let latestRun: any = null;
    let journeys: any[] = [];
    let omsData: any = null;
    let partnerPanelData: any = null;

    // Get recent data range, prioritizing January 12th (yesterday)
    const today = new Date();
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // January 12th
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // January 11th
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`Prioritizing January 12th data from ${twoDaysAgo.toISOString()} to ${endOfToday.toISOString()}`);

    // DESKTOP SITE DATA - Find the real Desktop Site data (not OMS or Partner Panel)
    // PRIORITY 1: Try raw_test_logs table first (this is where Playwright sends data)
    console.log('Checking raw_test_logs table for Desktop Site data...');
    const { data: rawLogs, error: rawError } = await supabase
      .from('raw_test_logs')
      .select('*')
      .gte('executed_at', twoDaysAgo.toISOString())
      .lt('executed_at', endOfToday.toISOString())
      .order('executed_at', { ascending: false });

    if (rawError) {
      console.error('Error fetching raw_test_logs:', rawError);
    }

    // Debug: Log all available systems to understand what's in the database
    if (rawLogs && rawLogs.length > 0) {
      console.log('📋 Available systems in raw_test_logs:');
      rawLogs.forEach((log, index) => {
        const system = log.raw_payload?.metadata?.system;
        const journeyCount = log.raw_payload?.journeys?.length || 0;
        console.log(`  ${index + 1}. System: ${system || 'NO_SYSTEM'}, Journeys: ${journeyCount}, Run ID: ${log.raw_payload?.run_id}`);
      });
    }

    // Look for Desktop Site data - it might not have system metadata or could be the one with most journeys
    let desktopRawLog = null;
    if (rawLogs && rawLogs.length > 0) {
      console.log('📋 Available raw logs by date:');
      rawLogs.forEach((log, index) => {
        const system = log.raw_payload?.metadata?.system;
        const journeyCount = log.raw_payload?.journeys?.length || 0;
        const date = new Date(log.executed_at).toLocaleDateString();
        console.log(`  ${index + 1}. Date: ${date}, System: ${system || 'NO_SYSTEM'}, Journeys: ${journeyCount}, Run ID: ${log.raw_payload?.run_id}`);
      });
      
      // First try to find January 12th data without system metadata (likely Desktop Site)
      desktopRawLog = rawLogs.find(log => {
        const system = log.raw_payload?.metadata?.system;
        const logDate = new Date(log.executed_at);
        const isJan12 = logDate.getDate() === 12 && logDate.getMonth() === 0; // January is month 0
        return !system && isJan12;
      });
      
      // If no January 12th data, look for any recent Desktop Site data (no system metadata)
      if (!desktopRawLog) {
        desktopRawLog = rawLogs.find(log => {
          const system = log.raw_payload?.metadata?.system;
          return !system;
        });
      }
      
      // If still not found, look for the most recent data with the most journeys (likely Desktop Site)
      if (!desktopRawLog) {
        desktopRawLog = rawLogs.reduce((max, log) => {
          const journeyCount = log.raw_payload?.journeys?.length || 0;
          const maxJourneyCount = max?.raw_payload?.journeys?.length || 0;
          const system = log.raw_payload?.metadata?.system;
          
          // Skip OMS and Partner Panel systems
          if (system === 'OMS' || system === 'PARTNER_PANEL') {
            return max;
          }
          
          return journeyCount > maxJourneyCount ? log : max;
        }, null);
      }
    }

    if (desktopRawLog) {
      const rawPayload = desktopRawLog.raw_payload;
      const journeyCount = rawPayload?.journeys?.length || 0;
      console.log(`Found Desktop Site raw log data with ${journeyCount} journeys, run_id:`, rawPayload?.run_id);
      console.log('Executed at:', desktopRawLog.executed_at);
      
      // Extract journeys directly from raw_payload (matching Slack format exactly)
      journeys = rawPayload?.journeys || [];
      
      latestRun = {
        run_id: rawPayload?.run_id || desktopRawLog.run_id,
        framework: rawPayload?.framework || 'playwright',
        suite_name: rawPayload?.suite_name || 'FNP Automation Framework',
        environment: rawPayload?.environment || 'dev',
        platform: rawPayload?.platform || 'web',
        executed_at: rawPayload?.executed_at || desktopRawLog.executed_at,
        completed_at: rawPayload?.completed_at,
        total_runtime_ms: rawPayload?.total_runtime_ms || 0,
        total_journeys: rawPayload?.summary?.total_journeys || journeys.length,
        passed_journeys: rawPayload?.summary?.passed_journeys || journeys.filter((j: any) => j.status === 'PASSED').length,
        failed_journeys: rawPayload?.summary?.failed_journeys || journeys.filter((j: any) => j.status === 'FAILED').length,
        skipped_journeys: rawPayload?.summary?.skipped_journeys || 0,
        total_steps: rawPayload?.summary?.total_steps || 0,
        passed_steps: rawPayload?.summary?.passed_steps || 0,
        failed_steps: rawPayload?.summary?.failed_steps || 0,
        skipped_steps: rawPayload?.summary?.skipped_steps || 0,
        success_rate: rawPayload?.summary?.success_rate || 0,
        build_number: rawPayload?.build_number,
        report_url: rawPayload?.report_url
      };
    }

    // PRIORITY 2: If no raw logs, try test_runs + journeys tables for Desktop Site
    if (!latestRun) {
      console.log('No Desktop Site raw_test_logs found, checking test_runs table...');
      const { data: testRuns } = await supabase
        .from('test_runs')
        .select('*')
        .gte('executed_at', twoDaysAgo.toISOString())
        .lt('executed_at', endOfToday.toISOString())
        .order('executed_at', { ascending: false });

      // Debug: Log all available systems in test_runs
      if (testRuns && testRuns.length > 0) {
        console.log('📋 Available systems in test_runs:');
        testRuns.forEach((run, index) => {
          const system = run.metadata?.system;
          console.log(`  ${index + 1}. System: ${system || 'NO_SYSTEM'}, Journeys: ${run.total_journeys}, Run ID: ${run.run_id}`);
        });
      }

      // Look for Desktop Site runs - exclude OMS and Partner Panel
      const desktopRuns = testRuns?.filter(run => {
        const system = run.metadata?.system;
        return system !== 'OMS' && system !== 'PARTNER_PANEL';
      }) || [];

      if (desktopRuns.length > 0) {
        // Take the one with most journeys (likely the Desktop Site with 19 journeys)
        latestRun = desktopRuns.reduce((max, run) => {
          return (run.total_journeys || 0) > (max.total_journeys || 0) ? run : max;
        });
        
        console.log(`Found Desktop Site test_run with ${latestRun.total_journeys} journeys:`, latestRun.run_id);
        
        // Get journeys from journeys table
        const { data: journeyData } = await supabase
          .from('journeys')
          .select('*')
          .eq('run_id', latestRun.run_id)
          .order('journey_number', { ascending: true });
        
        if (journeyData && journeyData.length > 0) {
          // Get steps for each journey
          for (const journey of journeyData) {
            const { data: stepsData } = await supabase
              .from('steps')
              .select('*')
              .eq('journey_id', journey.journey_id)
              .order('step_number', { ascending: true });
            
            journey.steps = stepsData || [];
          }
          journeys = journeyData;
          console.log(`Loaded ${journeys.length} journeys for Desktop Site`);
        }
      }
    }

    // FETCH OMS DATA
    console.log('Fetching OMS data...');
    try {
      const omsRunData = await fetchLatestSystemRun('OMS');
      if (omsRunData && omsRunData.latestRun) {
        const omsJourneys = omsRunData.journeys;
        const omsModules = omsJourneys.map((journey: any) => {
          const steps = journey.steps || [];
          const passedSteps = steps.filter((s: any) => s.status === 'PASSED').length;
          const failedSteps = steps.filter((s: any) => s.status === 'FAILED').length;
          
          return {
            journeyNumber: journey.journey_number,
            name: journey.journey_name || `Journey ${journey.journey_number}`,
            description: journey.journey_description,
            status: journey.status,
            statusIcon: journey.status === 'PASSED' ? '✅' : journey.status === 'FAILED' ? '❌' : '⚪',
            totalSteps: steps.length || journey.total_steps || 0,
            passed: passedSteps || journey.passed_steps || 0,
            failed: failedSteps || journey.failed_steps || 0,
            duration: Math.round((journey.duration_ms || 0) / 1000),
            durationFormatted: formatDuration(journey.duration_ms || 0),
            failureReason: journey.failure_reason,
            errorType: journey.error_type,
            errorMessage: journey.error_message,
            steps: steps.map((step: any, index: number) => ({
              stepNumber: step.step_number || index + 1,
              name: step.step_name || 'Unknown Step',
              status: step.status,
              statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
              duration: step.duration_ms || 0,
              durationFormatted: formatDuration(step.duration_ms || 0),
              timestamp: step.start_time,
              errorType: step.error_type,
              errorMessage: step.error_message,
              apiCalls: step.api_calls || []
            }))
          };
        });

        // Calculate OMS totals
        const omsRun = omsRunData.latestRun;
        const totalOmsJourneys = omsJourneys.length;
        const passedOmsJourneys = omsJourneys.filter((j: any) => j.status === 'PASSED').length;
        const failedOmsJourneys = omsJourneys.filter((j: any) => j.status === 'FAILED').length;
        
        let totalOmsSteps = 0, passedOmsSteps = 0, failedOmsSteps = 0;
        omsJourneys.forEach((j: any) => {
          const steps = j.steps || [];
          totalOmsSteps += steps.length;
          passedOmsSteps += steps.filter((s: any) => s.status === 'PASSED').length;
          failedOmsSteps += steps.filter((s: any) => s.status === 'FAILED').length;
        });

        // Use summary from run if available
        if (omsRun.total_steps > 0) {
          totalOmsSteps = omsRun.total_steps;
          passedOmsSteps = omsRun.passed_steps;
          failedOmsSteps = omsRun.failed_steps;
        }

        const omsSuccessRate = totalOmsSteps > 0 ? ((passedOmsSteps / totalOmsSteps) * 100).toFixed(1) : '0';

        omsData = {
          total: totalOmsJourneys,
          passed: passedOmsJourneys,
          failed: failedOmsJourneys,
          skipped: omsRun.skipped_journeys || 0,
          totalSteps: totalOmsSteps,
          passedSteps: passedOmsSteps,
          failedSteps: failedOmsSteps,
          successRate: parseFloat(omsSuccessRate),
          duration: Math.round((omsRun.total_runtime_ms || 0) / 1000),
          durationFormatted: formatDuration(omsRun.total_runtime_ms || 0),
          lastRun: omsRun.executed_at,
          buildNumber: omsRun.build_number,
          reportUrl: omsRun.report_url,
          environment: omsRun.environment || 'prod',
          modules: omsModules,
          overallStatus: failedOmsJourneys === 0 ? 'ALL SYSTEMS GO ✅' : 'ISSUES DETECTED ❌',
          isSuccess: failedOmsJourneys === 0 && passedOmsJourneys > 0
        };
        console.log('OMS data prepared:', { totalJourneys: totalOmsJourneys, modulesCount: omsModules.length });
      }
    } catch (error) {
      console.error('Error fetching OMS data:', error);
    }

    // FETCH PARTNER PANEL DATA
    console.log('Fetching Partner Panel data...');
    try {
      const ppRunData = await fetchLatestSystemRun('PARTNER_PANEL');
      if (ppRunData && ppRunData.latestRun) {
        const ppJourneys = ppRunData.journeys;
        const ppModules = ppJourneys.map((journey: any) => {
          const steps = journey.steps || [];
          const passedSteps = steps.filter((s: any) => s.status === 'PASSED').length;
          const failedSteps = steps.filter((s: any) => s.status === 'FAILED').length;
          
          return {
            journeyNumber: journey.journey_number,
            name: journey.journey_name || `Journey ${journey.journey_number}`,
            description: journey.journey_description,
            status: journey.status,
            statusIcon: journey.status === 'PASSED' ? '✅' : journey.status === 'FAILED' ? '❌' : '⚪',
            totalSteps: steps.length || journey.total_steps || 0,
            passed: passedSteps || journey.passed_steps || 0,
            failed: failedSteps || journey.failed_steps || 0,
            duration: Math.round((journey.duration_ms || 0) / 1000),
            durationFormatted: formatDuration(journey.duration_ms || 0),
            failureReason: journey.failure_reason,
            errorType: journey.error_type,
            errorMessage: journey.error_message,
            steps: steps.map((step: any, index: number) => ({
              stepNumber: step.step_number || index + 1,
              name: step.step_name || 'Unknown Step',
              status: step.status,
              statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
              duration: step.duration_ms || 0,
              durationFormatted: formatDuration(step.duration_ms || 0),
              timestamp: step.start_time,
              errorType: step.error_type,
              errorMessage: step.error_message,
              apiCalls: step.api_calls || []
            }))
          };
        });

        // Calculate Partner Panel totals
        const ppRun = ppRunData.latestRun;
        const totalPpJourneys = ppJourneys.length;
        const passedPpJourneys = ppJourneys.filter((j: any) => j.status === 'PASSED').length;
        const failedPpJourneys = ppJourneys.filter((j: any) => j.status === 'FAILED').length;
        
        let totalPpSteps = 0, passedPpSteps = 0, failedPpSteps = 0;
        ppJourneys.forEach((j: any) => {
          const steps = j.steps || [];
          totalPpSteps += steps.length;
          passedPpSteps += steps.filter((s: any) => s.status === 'PASSED').length;
          failedPpSteps += steps.filter((s: any) => s.status === 'FAILED').length;
        });

        // Use summary from run if available
        if (ppRun.total_steps > 0) {
          totalPpSteps = ppRun.total_steps;
          passedPpSteps = ppRun.passed_steps;
          failedPpSteps = ppRun.failed_steps;
        }

        const ppSuccessRate = totalPpSteps > 0 ? ((passedPpSteps / totalPpSteps) * 100).toFixed(1) : '0';

        partnerPanelData = {
          total: totalPpJourneys,
          passed: passedPpJourneys,
          failed: failedPpJourneys,
          skipped: ppRun.skipped_journeys || 0,
          totalSteps: totalPpSteps,
          passedSteps: passedPpSteps,
          failedSteps: failedPpSteps,
          successRate: parseFloat(ppSuccessRate),
          duration: Math.round((ppRun.total_runtime_ms || 0) / 1000),
          durationFormatted: formatDuration(ppRun.total_runtime_ms || 0),
          lastRun: ppRun.executed_at,
          buildNumber: ppRun.build_number,
          reportUrl: ppRun.report_url,
          environment: ppRun.environment || 'prod',
          modules: ppModules,
          overallStatus: failedPpJourneys === 0 ? 'ALL SYSTEMS GO ✅' : 'ISSUES DETECTED ❌',
          isSuccess: failedPpJourneys === 0 && passedPpJourneys > 0
        };
        console.log('Partner Panel data prepared:', { totalJourneys: totalPpJourneys, modulesCount: ppModules.length });
      }
    } catch (error) {
      console.error('Error fetching Partner Panel data:', error);
    }

    // DESKTOP SITE DATA PROCESSING (existing logic continues...)
    // If still no desktop data, return mock data for desktop
    if (!latestRun || journeys.length === 0) {
      console.log('No Supabase data found in recent days, using mock data for desktop');
      const desktopData = mockResults.desktop;
      
      return c.json({
        desktop: desktopData,
        mobile: mockResults.mobile,
        android: partnerPanelData || mockResults.android, // Use Partner Panel data for android tab
        ios: mockResults.ios,
        oms: omsData || mockResults.oms, // Use OMS data or fallback to mock
      });
    }

    // Transform journeys to match Slack notification format exactly
    const desktopModules = journeys.map((journey: any) => {
      // Steps can be in journey.steps (from raw_payload) or need to be fetched
      const allSteps = journey.steps || [];
      
      // IMPORTANT: Split steps into separate journeys based on logical boundaries
      // Journey boundaries are identified by "PNC Created Successfully" or "Order Completion" steps
      const journeyBoundaries = [];
      let currentJourneySteps = [];
      let journeyNumber = 1;
      
      allSteps.forEach((step: any, index: number) => {
        currentJourneySteps.push(step);
        
        // Check if this step marks the end of a journey (PNC creation, order completion, etc.)
        const stepName = step.step_name || step.stepName || step.name || '';
        const isJourneyEnd = stepName.includes('PNC Created Successfully') || 
                           stepName.includes('Order Completion') ||
                           stepName.includes('All Payment Methods Tested') ||
                           stepName.includes('Phone Number Change Completed') ||
                           stepName.includes('Reminder and FAQ Flow Completed');
        
        if (isJourneyEnd || index === allSteps.length - 1) {
          // Create a journey from current steps
          const passedSteps = currentJourneySteps.filter((s: any) => s.status === 'PASSED').length;
          const failedSteps = currentJourneySteps.filter((s: any) => s.status === 'FAILED').length;
          const journeyDuration = currentJourneySteps.reduce((sum, s) => sum + (s.duration_ms || s.durationMs || 0), 0);
          const journeyStatus = failedSteps > 0 ? 'FAILED' : 'PASSED';
          
          // Determine journey name based on step content
          let journeyName = `Journey ${journeyNumber}`;
          if (journeyNumber === 1) journeyName = "User Authentication & Product Selection";
          else if (journeyNumber === 2) journeyName = "Payment Methods Testing";
          else if (journeyNumber === 3) journeyName = "Profile & Address Management";
          else if (journeyNumber === 4) journeyName = "International & Advanced Features";
          
          journeyBoundaries.push({
            journeyNumber: journeyNumber,
            name: journeyName,
            description: `Journey ${journeyNumber} - Steps ${currentJourneySteps[0].step_number || currentJourneySteps[0].stepNumber || (journeyBoundaries.length * 10 + 1)} to ${currentJourneySteps[currentJourneySteps.length - 1].step_number || currentJourneySteps[currentJourneySteps.length - 1].stepNumber || (journeyBoundaries.length * 10 + currentJourneySteps.length)}`,
            status: journeyStatus,
            statusIcon: journeyStatus === 'PASSED' ? '✅' : '❌',
            totalSteps: currentJourneySteps.length,
            passed: passedSteps,
            failed: failedSteps,
            duration: Math.round(journeyDuration / 1000),
            durationFormatted: formatDuration(journeyDuration),
            failureReason: failedSteps > 0 ? currentJourneySteps.find(s => s.status === 'FAILED')?.error_message || 'Step failed' : null,
            errorType: failedSteps > 0 ? currentJourneySteps.find(s => s.status === 'FAILED')?.error_type : null,
            errorMessage: failedSteps > 0 ? currentJourneySteps.find(s => s.status === 'FAILED')?.error_message : null,
            steps: currentJourneySteps.map((step: any, stepIdx: number) => ({
              stepNumber: step.step_number || step.stepNumber || stepIdx + 1,
              name: step.step_name || step.stepName || step.name || 'Unknown Step',
              status: step.status,
              statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
              duration: step.duration_ms || step.durationMs || step.duration || 0,
              durationFormatted: formatDuration(step.duration_ms || step.durationMs || step.duration || 0),
              timestamp: step.start_time || step.startTime || step.timestamp,
              errorType: step.error_type || step.errorType || null,
              errorMessage: step.error_message || step.errorMessage || null,
              apiCalls: step.api_calls || step.apiCalls || []
            }))
          });
          
          // Reset for next journey
          currentJourneySteps = [];
          journeyNumber++;
        }
      });
      
      // If no journey boundaries found, treat as single journey but still return array
      if (journeyBoundaries.length === 0) {
        const passedSteps = allSteps.filter((s: any) => s.status === 'PASSED').length;
        const failedSteps = allSteps.filter((s: any) => s.status === 'FAILED').length;
        
        return [{
          journeyNumber: journey.journey_number || journey.journeyNumber || 1,
          name: journey.journey_name || journey.journeyName || journey.name || 'Complete Journey Flow',
          description: journey.journey_description || journey.journeyDescription || 'Complete test execution flow',
          status: journey.status,
          statusIcon: journey.status === 'PASSED' ? '✅' : journey.status === 'FAILED' ? '❌' : '⚪',
          totalSteps: allSteps.length || journey.total_steps || journey.totalSteps || 0,
          passed: passedSteps || journey.passed_steps || journey.passedSteps || 0,
          failed: failedSteps || journey.failed_steps || journey.failedSteps || 0,
          duration: Math.round((journey.duration_ms || journey.durationMs || 0) / 1000),
          durationFormatted: formatDuration(journey.duration_ms || journey.durationMs || 0),
          failureReason: journey.failure_reason || journey.failureReason || null,
          errorType: journey.error_type || journey.errorType || null,
          errorMessage: journey.error_message || journey.errorMessage || null,
          steps: allSteps.map((step: any, index: number) => ({
            stepNumber: step.step_number || step.stepNumber || index + 1,
            name: step.step_name || step.stepName || step.name || 'Unknown Step',
            status: step.status,
            statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
            duration: step.duration_ms || step.durationMs || step.duration || 0,
            durationFormatted: formatDuration(step.duration_ms || step.durationMs || step.duration || 0),
            timestamp: step.start_time || step.startTime || step.timestamp,
            errorType: step.error_type || step.errorType || null,
            errorMessage: step.error_message || step.errorMessage || null,
            apiCalls: step.api_calls || step.apiCalls || []
          }))
        }];
      }
      
      return journeyBoundaries;
    }).flat(); // Flatten array since each journey can now produce multiple sub-journeys

    // Calculate totals from the split journeys
    const totalJourneys = desktopModules.length;
    const passedJourneys = desktopModules.filter((j: any) => j.status === 'PASSED').length;
    const failedJourneys = desktopModules.filter((j: any) => j.status === 'FAILED').length;
    
    // Calculate step totals across all journeys
    let totalSteps = 0;
    let passedSteps = 0;
    let failedSteps = 0;
    desktopModules.forEach((j: any) => {
      totalSteps += j.totalSteps || 0;
      passedSteps += j.passed || 0;
      failedSteps += j.failed || 0;
    });

    // Use summary from payload if available, otherwise use calculated values
    if (latestRun.total_steps > 0) {
      totalSteps = latestRun.total_steps;
      passedSteps = latestRun.passed_steps;
      failedSteps = latestRun.failed_steps;
    }

    // Calculate success rate
    const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';

    // Desktop data matching Slack notification structure exactly
    const desktopData = {
      // Summary stats (matching Slack header format) - now shows split journeys
      total: totalJourneys,
      passed: passedJourneys,
      failed: failedJourneys,
      skipped: latestRun.skipped_journeys || 0,
      
      // Step-level stats
      totalSteps: totalSteps,
      passedSteps: passedSteps,
      failedSteps: failedSteps,
      successRate: parseFloat(successRate),
      
      // Timing (matching Slack format)
      duration: Math.round((latestRun.total_runtime_ms || 0) / 1000),
      durationFormatted: formatDuration(latestRun.total_runtime_ms || 0),
      lastRun: latestRun.executed_at,
      
      // Build info
      buildNumber: latestRun.build_number,
      reportUrl: latestRun.report_url,
      environment: latestRun.environment || 'dev',
      
      // Journey modules with steps (main data - matching Slack journeySteps)
      modules: desktopModules,
      
      // Status indicator (matching Slack format)
      overallStatus: failedJourneys === 0 ? 'ALL SYSTEMS GO ✅' : 'ISSUES DETECTED ❌',
      isSuccess: failedJourneys === 0 && passedJourneys > 0
    };

    console.log('Desktop data prepared:', {
      totalJourneys,
      passedJourneys,
      failedJourneys,
      totalSteps,
      modulesCount: desktopModules.length,
      dataDate: latestRun.executed_at
    });

    // Return Supabase data for Desktop, OMS, and Partner Panel; mock data for mobile and ios
    return c.json({
      desktop: desktopData,  // Real Supabase data with steps
      mobile: mockResults.mobile,  // Mock data
      android: partnerPanelData || mockResults.android,  // Real Partner Panel data or mock
      ios: mockResults.ios,  // Mock data
      oms: omsData || mockResults.oms,  // Real OMS data or mock
    });
  } catch (error) {
    console.error('Error in /api/test-results:', error);
    // Fallback to mock data on error
    const results = generateMockTestResults();
    return c.json(results);
  }
});

// New API endpoint: Get system health metrics for OMS and Partner Panel
app.get("/api/system-health", async (c) => {
  try {
    const healthData = await fetchSystemHealth();
    return c.json(healthData);
  } catch (error) {
    console.error('Error in /api/system-health:', error);
    return c.json({ error: "Failed to fetch system health" }, 500);
  }
});

// New API endpoint: Get correlated runs (OMS + Partner Panel)
app.get("/api/correlated-runs", async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const correlatedRuns = await fetchCorrelatedRuns(limit);
    return c.json(correlatedRuns);
  } catch (error) {
    console.error('Error in /api/correlated-runs:', error);
    return c.json({ error: "Failed to fetch correlated runs" }, 500);
  }
});

// New API endpoint: Get tab performance for OMS or Partner Panel
app.get("/api/tab-performance/:system", async (c) => {
  try {
    const system = c.req.param("system").toUpperCase();
    if (system !== 'OMS' && system !== 'PARTNER_PANEL') {
      return c.json({ error: "Invalid system. Use 'OMS' or 'PARTNER_PANEL'" }, 400);
    }
    
    const days = parseInt(c.req.query('days') || '7');
    const tabPerformance = await fetchTabPerformance(system as 'OMS' | 'PARTNER_PANEL', days);
    return c.json(tabPerformance);
  } catch (error) {
    console.error('Error in /api/tab-performance:', error);
    return c.json({ error: "Failed to fetch tab performance" }, 500);
  }
});

// New API endpoint: Get recent failures for OMS and Partner Panel
app.get("/api/recent-failures", async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const failures = await fetchRecentFailures(limit);
    return c.json(failures);
  } catch (error) {
    console.error('Error in /api/recent-failures:', error);
    return c.json({ error: "Failed to fetch recent failures" }, 500);
  }
});

// New endpoint: Get screenshots for test runs (FAILURES ONLY)
app.get("/api/screenshots", async (c) => {
  try {
    const platform = c.req.query('platform') || 'all';
    const limit = parseInt(c.req.query('limit') || '50');
    
    // Get recent data range (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    console.log(`Fetching FAILURE screenshots for platform: ${platform}`);
    
    // Query ONLY FAILED steps that have screenshot URLs
    const { data: screenshotSteps, error } = await supabase
      .from('steps')
      .select(`
        *,
        journeys!inner(journey_name, journey_number, run_id, status),
        test_runs!inner(metadata, executed_at, environment)
      `)
      .eq('status', 'FAILED')  // Only failed steps
      .not('metadata->>screenshot_url', 'is', null)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching failure screenshots:', error);
      return c.json({ error: "Failed to fetch failure screenshots" }, 500);
    }

    // Process and organize failure screenshots
    const screenshots = (screenshotSteps || []).map((step: any) => {
      const system = step.test_runs?.metadata?.system || 'Desktop Site';
      const screenshotUrl = step.metadata?.screenshot_url;
      
      return {
        id: step.step_id,
        stepName: step.step_name,
        stepNumber: step.step_number,
        journeyName: step.journeys?.journey_name,
        journeyNumber: step.journeys?.journey_number,
        runId: step.journeys?.run_id,
        system: system,
        platform: system === 'OMS' ? 'oms' : system === 'PARTNER_PANEL' ? 'android' : 'desktop',
        status: 'FAILED', // All screenshots are from failures
        screenshotUrl: screenshotUrl,
        timestamp: step.created_at,
        executedAt: step.test_runs?.executed_at,
        environment: step.test_runs?.environment || 'dev',
        errorMessage: step.error_message,
        errorType: step.error_type,
        duration: step.duration_ms,
        // Additional failure context
        failureContext: {
          beforeFailure: step.metadata?.before_failure_screenshot,
          afterFailure: step.metadata?.after_failure_screenshot,
          pageUrl: step.metadata?.page_url,
          selector: step.metadata?.failed_selector,
          expectedValue: step.metadata?.expected_value,
          actualValue: step.metadata?.actual_value
        }
      };
    });

    // Filter by platform if specified
    const filteredScreenshots = platform === 'all' 
      ? screenshots 
      : screenshots.filter(s => s.platform === platform);

    // Group by system for better organization
    const groupedScreenshots = filteredScreenshots.reduce((acc: any, screenshot: any) => {
      const system = screenshot.system;
      if (!acc[system]) {
        acc[system] = [];
      }
      acc[system].push(screenshot);
      return acc;
    }, {});

    // Calculate failure statistics
    const failureStats = {
      totalFailures: filteredScreenshots.length,
      bySystem: Object.keys(groupedScreenshots).map(system => ({
        system,
        count: groupedScreenshots[system].length,
        latestFailure: groupedScreenshots[system][0]?.timestamp
      })),
      commonErrors: filteredScreenshots.reduce((acc: any, screenshot: any) => {
        const errorType = screenshot.errorType || 'Unknown Error';
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {}),
      timeRange: {
        from: sevenDaysAgo.toISOString(),
        to: today.toISOString()
      }
    };

    return c.json({
      total: filteredScreenshots.length,
      screenshots: filteredScreenshots,
      groupedBySystem: groupedScreenshots,
      platforms: [...new Set(screenshots.map(s => s.platform))],
      systems: Object.keys(groupedScreenshots),
      failureStats: failureStats
    });
  } catch (error) {
    console.error('Error in /api/screenshots:', error);
    return c.json({ error: "Failed to fetch failure screenshots" }, 500);
  }
});

// New endpoint: Get failure screenshots for a specific journey
app.get("/api/screenshots/journey/:runId/:journeyNumber", async (c) => {
  try {
    const runId = c.req.param("runId");
    const journeyNumber = parseInt(c.req.param("journeyNumber"));
    
    console.log(`Fetching FAILURE screenshots for journey ${journeyNumber} in run ${runId}`);
    
    // Get ONLY FAILED journey screenshots
    const { data: journeyScreenshots, error } = await supabase
      .from('steps')
      .select(`
        *,
        journeys!inner(journey_name, journey_number, run_id)
      `)
      .eq('journeys.run_id', runId)
      .eq('journeys.journey_number', journeyNumber)
      .eq('status', 'FAILED')  // Only failed steps
      .not('metadata->>screenshot_url', 'is', null)
      .order('step_number', { ascending: true });

    if (error) {
      console.error('Error fetching journey failure screenshots:', error);
      return c.json({ error: "Failed to fetch journey failure screenshots" }, 500);
    }

    const screenshots = (journeyScreenshots || []).map((step: any) => ({
      stepNumber: step.step_number,
      stepName: step.step_name,
      status: 'FAILED',
      screenshotUrl: step.metadata?.screenshot_url,
      timestamp: step.created_at,
      errorMessage: step.error_message,
      errorType: step.error_type,
      duration: step.duration_ms,
      failureContext: {
        pageUrl: step.metadata?.page_url,
        selector: step.metadata?.failed_selector,
        expectedValue: step.metadata?.expected_value,
        actualValue: step.metadata?.actual_value
      }
    }));

    return c.json({
      runId,
      journeyNumber,
      journeyName: journeyScreenshots?.[0]?.journeys?.journey_name,
      screenshots,
      totalFailures: screenshots.length
    });
  } catch (error) {
    console.error('Error fetching journey failure screenshots:', error);
    return c.json({ error: "Failed to fetch journey failure screenshots" }, 500);
  }
});

// Helper function to format duration (matching Slack format)
function formatDuration(durationMs: number): string {
  if (!durationMs || durationMs <= 0) return '0ms';
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

app.get("/api/test-results/:platform", async (c) => {
  const platform = c.req.param("platform");
  
  try {
    // For Desktop Site, fetch from Supabase for today only
    if (platform === 'desktop') {
      let latestRun: any = null;
      let journeys: any[] = [];

      // Get recent data range, prioritizing January 12th (yesterday)
      const today = new Date();
      const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // January 12th
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000); // January 11th
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      console.log(`Prioritizing January 12th desktop data from ${twoDaysAgo.toISOString()} to ${endOfToday.toISOString()}`);

      // PRIORITY 1: Try raw_test_logs first (where Playwright sends data) - Filter for Desktop Site
      const { data: rawLogs } = await supabase
        .from('raw_test_logs')
        .select('*')
        .gte('executed_at', twoDaysAgo.toISOString())
        .lt('executed_at', endOfToday.toISOString())
        .order('executed_at', { ascending: false });

      // Filter for Desktop Site data (not OMS or Partner Panel)
      let desktopRawLog = null;
      if (rawLogs && rawLogs.length > 0) {
        desktopRawLog = rawLogs.find(log => {
          const system = log.raw_payload?.metadata?.system;
          // Desktop Site data should not have system metadata or should be explicitly 'DESKTOP'
          return !system || system === 'DESKTOP' || system === 'WEB';
        });
      }

      if (desktopRawLog) {
        const rawPayload = desktopRawLog.raw_payload;
        journeys = rawPayload?.journeys || [];
        
        latestRun = {
          run_id: rawPayload?.run_id || rawLogs[0].run_id,
          total_journeys: rawPayload?.summary?.total_journeys || journeys.length,
          passed_journeys: rawPayload?.summary?.passed_journeys || journeys.filter((j: any) => j.status === 'PASSED').length,
          failed_journeys: rawPayload?.summary?.failed_journeys || journeys.filter((j: any) => j.status === 'FAILED').length,
          skipped_journeys: rawPayload?.summary?.skipped_journeys || 0,
          total_runtime_ms: rawPayload?.total_runtime_ms || 0,
          executed_at: rawPayload?.executed_at || rawLogs[0].executed_at,
          success_rate: rawPayload?.summary?.success_rate || 0,
          total_steps: rawPayload?.summary?.total_steps || 0,
          passed_steps: rawPayload?.summary?.passed_steps || 0,
          failed_steps: rawPayload?.summary?.failed_steps || 0,
          build_number: rawPayload?.build_number,
          report_url: rawPayload?.report_url,
          environment: rawPayload?.environment || 'dev'
        };
      }

      // PRIORITY 2: Try test_runs + journeys tables for Desktop Site
      if (!latestRun) {
        const { data: testRuns } = await supabase
          .from('test_runs')
          .select('*')
          .gte('executed_at', twoDaysAgo.toISOString())
          .lt('executed_at', endOfToday.toISOString())
          .order('executed_at', { ascending: false });

        // Filter for Desktop Site runs (not OMS or Partner Panel)
        const desktopRuns = testRuns?.filter(run => {
          const system = run.metadata?.system;
          return !system || system === 'DESKTOP' || system === 'WEB';
        }) || [];

        if (desktopRuns.length > 0) {
          latestRun = desktopRuns[0];
          
          const { data: journeyData } = await supabase
            .from('journeys')
            .select('*')
            .eq('run_id', latestRun.run_id)
            .order('journey_number', { ascending: true });
          
          if (journeyData) {
            for (const journey of journeyData) {
              const { data: stepsData } = await supabase
                .from('steps')
                .select('*')
                .eq('journey_id', journey.journey_id)
                .order('step_number', { ascending: true });
              journey.steps = stepsData || [];
            }
            journeys = journeyData;
          }
        }
      }

      if (!latestRun || journeys.length === 0) {
        const mockResults = generateMockTestResults();
        return c.json(mockResults.desktop);
      }

      // Transform to desktop format with steps (matching Slack format)
      const desktopModules = journeys.map((journey: any) => {
        const steps = journey.steps || [];
        return {
          journeyNumber: journey.journey_number || journey.journeyNumber,
          name: journey.journey_name || journey.journeyName || journey.name,
          status: journey.status,
          statusIcon: journey.status === 'PASSED' ? '✅' : journey.status === 'FAILED' ? '❌' : '⚪',
          totalSteps: steps.length || journey.total_steps || journey.totalSteps || 0,
          passed: steps.filter((s: any) => s.status === 'PASSED').length || journey.passed_steps || journey.passedSteps || 0,
          failed: steps.filter((s: any) => s.status === 'FAILED').length || journey.failed_steps || journey.failedSteps || 0,
          duration: Math.round((journey.duration_ms || journey.durationMs || 0) / 1000),
          durationFormatted: formatDuration(journey.duration_ms || journey.durationMs || 0),
          failureReason: journey.failure_reason || journey.failureReason,
          errorType: journey.error_type || journey.errorType,
          errorMessage: journey.error_message || journey.errorMessage,
          steps: steps.map((step: any, index: number) => ({
            stepNumber: step.step_number || step.stepNumber || index + 1,
            name: step.step_name || step.stepName || step.name || 'Unknown Step',
            status: step.status,
            statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
            duration: step.duration_ms || step.durationMs || step.duration || 0,
            durationFormatted: formatDuration(step.duration_ms || step.durationMs || step.duration || 0),
            timestamp: step.start_time || step.startTime || step.timestamp,
            errorType: step.error_type || step.errorType,
            errorMessage: step.error_message || step.errorMessage,
            apiCalls: step.api_calls || step.apiCalls || []
          }))
        };
      });

      // Calculate totals
      let totalSteps = 0, passedSteps = 0, failedSteps = 0;
      journeys.forEach((j: any) => {
        const steps = j.steps || [];
        totalSteps += steps.length;
        passedSteps += steps.filter((s: any) => s.status === 'PASSED').length;
        failedSteps += steps.filter((s: any) => s.status === 'FAILED').length;
      });

      // Use summary from payload if available
      if (latestRun.total_steps > 0) {
        totalSteps = latestRun.total_steps;
        passedSteps = latestRun.passed_steps;
        failedSteps = latestRun.failed_steps;
      }

      const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';
      const failedJourneys = journeys.filter((j: any) => j.status === 'FAILED').length;

      return c.json({
        total: journeys.length,
        passed: journeys.filter((j: any) => j.status === 'PASSED').length,
        failed: failedJourneys,
        skipped: latestRun.skipped_journeys || 0,
        totalSteps,
        passedSteps,
        failedSteps,
        successRate: parseFloat(successRate),
        duration: Math.round((latestRun.total_runtime_ms || 0) / 1000),
        durationFormatted: formatDuration(latestRun.total_runtime_ms || 0),
        lastRun: latestRun.executed_at,
        buildNumber: latestRun.build_number,
        reportUrl: latestRun.report_url,
        environment: latestRun.environment || 'dev',
        modules: desktopModules,
        overallStatus: failedJourneys === 0 ? 'ALL SYSTEMS GO ✅' : 'ISSUES DETECTED ❌',
        isSuccess: failedJourneys === 0 && journeys.length > 0
      });
    }

    // For OMS, fetch from Supabase
    if (platform === 'oms') {
      console.log('Fetching OMS platform data...');
      try {
        const omsRunData = await fetchLatestSystemRun('OMS');
        if (omsRunData && omsRunData.latestRun) {
          const omsJourneys = omsRunData.journeys;
          const omsModules = omsJourneys.map((journey: any) => {
            const steps = journey.steps || [];
            return {
              journeyNumber: journey.journey_number,
              name: journey.journey_name || `Journey ${journey.journey_number}`,
              status: journey.status,
              statusIcon: journey.status === 'PASSED' ? '✅' : journey.status === 'FAILED' ? '❌' : '⚪',
              totalSteps: steps.length || journey.total_steps || 0,
              passed: steps.filter((s: any) => s.status === 'PASSED').length || journey.passed_steps || 0,
              failed: steps.filter((s: any) => s.status === 'FAILED').length || journey.failed_steps || 0,
              duration: Math.round((journey.duration_ms || 0) / 1000),
              durationFormatted: formatDuration(journey.duration_ms || 0),
              failureReason: journey.failure_reason,
              errorType: journey.error_type,
              errorMessage: journey.error_message,
              steps: steps.map((step: any, index: number) => ({
                stepNumber: step.step_number || index + 1,
                name: step.step_name || 'Unknown Step',
                status: step.status,
                statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
                duration: step.duration_ms || 0,
                durationFormatted: formatDuration(step.duration_ms || 0),
                timestamp: step.start_time,
                errorType: step.error_type,
                errorMessage: step.error_message,
                apiCalls: step.api_calls || []
              }))
            };
          });

          const omsRun = omsRunData.latestRun;
          const totalJourneys = omsJourneys.length;
          const passedJourneys = omsJourneys.filter((j: any) => j.status === 'PASSED').length;
          const failedJourneys = omsJourneys.filter((j: any) => j.status === 'FAILED').length;
          
          let totalSteps = 0, passedSteps = 0, failedSteps = 0;
          omsJourneys.forEach((j: any) => {
            const steps = j.steps || [];
            totalSteps += steps.length;
            passedSteps += steps.filter((s: any) => s.status === 'PASSED').length;
            failedSteps += steps.filter((s: any) => s.status === 'FAILED').length;
          });

          if (omsRun.total_steps > 0) {
            totalSteps = omsRun.total_steps;
            passedSteps = omsRun.passed_steps;
            failedSteps = omsRun.failed_steps;
          }

          const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';

          return c.json({
            total: totalJourneys,
            passed: passedJourneys,
            failed: failedJourneys,
            skipped: omsRun.skipped_journeys || 0,
            totalSteps,
            passedSteps,
            failedSteps,
            successRate: parseFloat(successRate),
            duration: Math.round((omsRun.total_runtime_ms || 0) / 1000),
            durationFormatted: formatDuration(omsRun.total_runtime_ms || 0),
            lastRun: omsRun.executed_at,
            buildNumber: omsRun.build_number,
            reportUrl: omsRun.report_url,
            environment: omsRun.environment || 'prod',
            modules: omsModules,
            overallStatus: failedJourneys === 0 ? 'ALL SYSTEMS GO ✅' : 'ISSUES DETECTED ❌',
            isSuccess: failedJourneys === 0 && passedJourneys > 0
          });
        }
      } catch (error) {
        console.error('Error fetching OMS platform data:', error);
      }
    }

    // For Partner Panel (mapped to android), fetch from Supabase
    if (platform === 'android') {
      console.log('Fetching Partner Panel platform data...');
      try {
        const ppRunData = await fetchLatestSystemRun('PARTNER_PANEL');
        if (ppRunData && ppRunData.latestRun) {
          const ppJourneys = ppRunData.journeys;
          const ppModules = ppJourneys.map((journey: any) => {
            const steps = journey.steps || [];
            return {
              journeyNumber: journey.journey_number,
              name: journey.journey_name || `Journey ${journey.journey_number}`,
              status: journey.status,
              statusIcon: journey.status === 'PASSED' ? '✅' : journey.status === 'FAILED' ? '❌' : '⚪',
              totalSteps: steps.length || journey.total_steps || 0,
              passed: steps.filter((s: any) => s.status === 'PASSED').length || journey.passed_steps || 0,
              failed: steps.filter((s: any) => s.status === 'FAILED').length || journey.failed_steps || 0,
              duration: Math.round((journey.duration_ms || 0) / 1000),
              durationFormatted: formatDuration(journey.duration_ms || 0),
              failureReason: journey.failure_reason,
              errorType: journey.error_type,
              errorMessage: journey.error_message,
              steps: steps.map((step: any, index: number) => ({
                stepNumber: step.step_number || index + 1,
                name: step.step_name || 'Unknown Step',
                status: step.status,
                statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
                duration: step.duration_ms || 0,
                durationFormatted: formatDuration(step.duration_ms || 0),
                timestamp: step.start_time,
                errorType: step.error_type,
                errorMessage: step.error_message,
                apiCalls: step.api_calls || []
              }))
            };
          });

          const ppRun = ppRunData.latestRun;
          const totalJourneys = ppJourneys.length;
          const passedJourneys = ppJourneys.filter((j: any) => j.status === 'PASSED').length;
          const failedJourneys = ppJourneys.filter((j: any) => j.status === 'FAILED').length;
          
          let totalSteps = 0, passedSteps = 0, failedSteps = 0;
          ppJourneys.forEach((j: any) => {
            const steps = j.steps || [];
            totalSteps += steps.length;
            passedSteps += steps.filter((s: any) => s.status === 'PASSED').length;
            failedSteps += steps.filter((s: any) => s.status === 'FAILED').length;
          });

          if (ppRun.total_steps > 0) {
            totalSteps = ppRun.total_steps;
            passedSteps = ppRun.passed_steps;
            failedSteps = ppRun.failed_steps;
          }

          const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';

          return c.json({
            total: totalJourneys,
            passed: passedJourneys,
            failed: failedJourneys,
            skipped: ppRun.skipped_journeys || 0,
            totalSteps,
            passedSteps,
            failedSteps,
            successRate: parseFloat(successRate),
            duration: Math.round((ppRun.total_runtime_ms || 0) / 1000),
            durationFormatted: formatDuration(ppRun.total_runtime_ms || 0),
            lastRun: ppRun.executed_at,
            buildNumber: ppRun.build_number,
            reportUrl: ppRun.report_url,
            environment: ppRun.environment || 'prod',
            modules: ppModules,
            overallStatus: failedJourneys === 0 ? 'ALL SYSTEMS GO ✅' : 'ISSUES DETECTED ❌',
            isSuccess: failedJourneys === 0 && passedJourneys > 0
          });
        }
      } catch (error) {
        console.error('Error fetching Partner Panel platform data:', error);
      }
    }

    // For all other platforms (mobile, ios), return mock data
    const mockResults = generateMockTestResults();
    if (!mockResults[platform as keyof typeof mockResults]) {
      return c.json({ error: "Platform not found" }, 404);
    }
    return c.json(mockResults[platform as keyof typeof mockResults]);
  } catch (error) {
    console.error('Error fetching platform results:', error);
    const mockResults = generateMockTestResults();
    return c.json(mockResults[platform as keyof typeof mockResults] || { error: "Failed to fetch results" });
  }
});

app.post("/api/run-test", async (c) => {
  const { platform, module } = await c.req.json();

  // Simulate test execution
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return c.json({
    success: true,
    message: `Test execution started for ${platform} - ${module}`,
    jobId: `job-${Date.now()}`,
  });
});

// New endpoint: Get journey details with steps (Desktop Site only)
app.get("/api/journey/:journeyId", async (c) => {
  const journeyId = c.req.param("journeyId");
  
  try {
    // Get journey details from journeys table
    const { data: journeyData, error: journeyError } = await supabase
      .from('journeys')
      .select('*')
      .eq('journey_id', journeyId)
      .limit(1);

    const journey = journeyData && journeyData.length > 0 ? journeyData[0] : null;

    if (!journey) {
      return c.json({ error: "Journey not found" }, 404);
    }

    // Get steps for this journey
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('*')
      .eq('journey_id', journeyId)
      .order('step_number', { ascending: true });

    return c.json({
      journey: {
        ...journey,
        duration_formatted: `${Math.round((journey.duration_ms || 0) / 1000)}s`
      },
      steps: (steps || []).map((step: any) => ({
        ...step,
        duration_formatted: `${step.duration_ms || 0}ms`
      })),
    });
  } catch (error) {
    console.error('Error fetching journey details:', error);
    return c.json({ error: "Failed to fetch journey details" }, 500);
  }
});

// New endpoint: Get all test runs for Desktop Site (for history) - today's data only
app.get("/api/test-runs", async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    
    // Get today's date range (start and end of today in UTC)
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`Fetching today's test runs from ${startOfToday.toISOString()} to ${endOfToday.toISOString()}`);
    
    // PRIORITY 1: Try raw_test_logs first (where Playwright sends data)
    const { data: rawLogs } = await supabase
      .from('raw_test_logs')
      .select('*')
      .gte('executed_at', startOfToday.toISOString())
      .lt('executed_at', endOfToday.toISOString())
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (rawLogs && rawLogs.length > 0) {
      // Transform raw logs to test run format
      const transformedRuns = rawLogs.map((log: any) => {
        const payload = log.raw_payload;
        return {
          run_id: payload?.run_id || log.run_id,
          framework: payload?.framework || 'playwright',
          suite_name: payload?.suite_name || 'FNP Automation Framework',
          environment: payload?.environment || 'dev',
          platform: payload?.platform || 'web',
          executed_at: payload?.executed_at || log.executed_at,
          completed_at: payload?.completed_at,
          total_runtime_ms: payload?.total_runtime_ms || 0,
          total_journeys: payload?.summary?.total_journeys || payload?.journeys?.length || 0,
          passed_journeys: payload?.summary?.passed_journeys || 0,
          failed_journeys: payload?.summary?.failed_journeys || 0,
          success_rate: payload?.summary?.success_rate || 0,
          build_number: payload?.build_number,
          report_url: payload?.report_url
        };
      });
      return c.json(transformedRuns);
    }

    // PRIORITY 2: Try test_runs table for today
    const { data: runs } = await supabase
      .from('test_runs')
      .select('*')
      .gte('executed_at', startOfToday.toISOString())
      .lt('executed_at', endOfToday.toISOString())
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (runs && runs.length > 0) {
      return c.json(runs);
    }

    return c.json([]);
  } catch (error) {
    console.error('Error in /api/test-runs:', error);
    return c.json({ error: "Failed to fetch test runs" }, 500);
  }
});

// New endpoint: Get realtime health metrics for Desktop Site - today's data
app.get("/api/health", async (c) => {
  try {
    // Get today's date range instead of last 24h
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log(`Fetching today's health metrics from ${startOfToday.toISOString()} to ${endOfToday.toISOString()}`);
    
    // PRIORITY 1: Try raw_test_logs first for today
    const { data: rawLogs } = await supabase
      .from('raw_test_logs')
      .select('raw_payload, executed_at')
      .gte('executed_at', startOfToday.toISOString())
      .lt('executed_at', endOfToday.toISOString())
      .order('executed_at', { ascending: false });

    if (rawLogs && rawLogs.length > 0) {
      const healthData = {
        runs_today: rawLogs.length,
        avg_success_rate: rawLogs.reduce((sum, r) => sum + (r.raw_payload?.summary?.success_rate || 0), 0) / rawLogs.length,
        avg_runtime_ms: rawLogs.reduce((sum, r) => sum + (r.raw_payload?.total_runtime_ms || 0), 0) / rawLogs.length,
        last_execution: rawLogs[0].executed_at,
        total_failures: rawLogs.reduce((sum, r) => sum + (r.raw_payload?.summary?.failed_journeys || 0), 0),
      };
      return c.json(healthData);
    }

    // PRIORITY 2: Try test_runs table for today
    const { data: recentRuns } = await supabase
      .from('test_runs')
      .select('success_rate, total_runtime_ms, executed_at, failed_journeys')
      .gte('executed_at', startOfToday.toISOString())
      .lt('executed_at', endOfToday.toISOString())
      .order('executed_at', { ascending: false });

    const healthData = {
      runs_today: recentRuns?.length || 0,
      avg_success_rate: recentRuns && recentRuns.length > 0
        ? recentRuns.reduce((sum, r) => sum + (r.success_rate || 0), 0) / recentRuns.length
        : 0,
      avg_runtime_ms: recentRuns && recentRuns.length > 0
        ? recentRuns.reduce((sum, r) => sum + (r.total_runtime_ms || 0), 0) / recentRuns.length
        : 0,
      last_execution: recentRuns && recentRuns.length > 0 ? recentRuns[0].executed_at : null,
      total_failures: recentRuns?.reduce((sum, r) => sum + (r.failed_journeys || 0), 0) || 0,
    };

    return c.json(healthData);
  } catch (error) {
    console.error('Error in /api/health:', error);
    return c.json({ error: "Failed to fetch health metrics" }, 500);
  }
});

// New endpoint: Get steps for a specific journey by run_id and journey_number
app.get("/api/steps/:runId/:journeyNumber", async (c) => {
  const runId = c.req.param("runId");
  const journeyNumber = parseInt(c.req.param("journeyNumber"));
  
  try {
    // PRIORITY 1: Try raw_test_logs first (where Playwright sends data)
    const { data: rawLogs } = await supabase
      .from('raw_test_logs')
      .select('raw_payload')
      .or(`run_id.eq.${runId},raw_payload->>run_id.eq.${runId}`)
      .limit(1);

    if (rawLogs && rawLogs.length > 0) {
      const journeys = rawLogs[0].raw_payload?.journeys || [];
      const journey = journeys.find((j: any) => 
        (j.journey_number || j.journeyNumber) === journeyNumber
      );
      if (journey) {
        const steps = (journey.steps || []).map((step: any, index: number) => ({
          stepNumber: step.step_number || step.stepNumber || index + 1,
          name: step.step_name || step.stepName || step.name || 'Unknown Step',
          status: step.status,
          statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
          duration: step.duration_ms || step.durationMs || step.duration || 0,
          durationFormatted: formatDuration(step.duration_ms || step.durationMs || step.duration || 0),
          timestamp: step.start_time || step.startTime || step.timestamp,
          errorType: step.error_type || step.errorType,
          errorMessage: step.error_message || step.errorMessage,
          apiCalls: step.api_calls || step.apiCalls || []
        }));
        return c.json({ steps });
      }
    }

    // PRIORITY 2: Try steps table via journey
    const { data: journeyData } = await supabase
      .from('journeys')
      .select('journey_id')
      .eq('run_id', runId)
      .eq('journey_number', journeyNumber)
      .limit(1);

    if (journeyData && journeyData.length > 0) {
      const { data: steps } = await supabase
        .from('steps')
        .select('*')
        .eq('journey_id', journeyData[0].journey_id)
        .order('step_number', { ascending: true });

      const formattedSteps = (steps || []).map((step: any, index: number) => ({
        stepNumber: step.step_number || index + 1,
        name: step.step_name || 'Unknown Step',
        status: step.status,
        statusIcon: step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪',
        duration: step.duration_ms || 0,
        durationFormatted: formatDuration(step.duration_ms || 0),
        timestamp: step.start_time,
        errorType: step.error_type,
        errorMessage: step.error_message,
        apiCalls: step.api_calls || []
      }));

      return c.json({ steps: formattedSteps });
    }

    return c.json({ steps: [] });
  } catch (error) {
    console.error('Error fetching steps:', error);
    return c.json({ error: "Failed to fetch steps" }, 500);
  }
});

// Main Dashboard Route
app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sentinel - Test Automation Dashboard</title>
        <link rel="icon" type="image/svg+xml" href="/static/fnp-logo.svg">
        <link rel="icon" type="image/png" href="/static/fnp-favicon.png">
        <link rel="shortcut icon" href="/static/fnp-logo.svg">
        <link rel="apple-touch-icon" href="/static/fnp-favicon.png">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://code.highcharts.com/highcharts.js"></script>
        <script src="https://code.highcharts.com/highcharts-more.js"></script>
        <script src="https://code.highcharts.com/highcharts-3d.js"></script>
        <script src="https://code.highcharts.com/modules/solid-gauge.js"></script>
        <script src="https://code.highcharts.com/modules/heatmap.js"></script>
        <script src="https://code.highcharts.com/modules/funnel.js"></script>
        <script src="https://code.highcharts.com/modules/exporting.js"></script>
        <script src="https://code.highcharts.com/modules/export-data.js"></script>
        <script src="https://code.highcharts.com/modules/accessibility.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>
            :root {
                --bg-gradient-1: #fef7f0;
                --bg-gradient-2: #fefaf7;
                --bg-gradient-3: #f9f5f1;
                --card-bg: #ffffff;
                --text-primary: #374151;
                --text-secondary: #6B7280;
                --text-title: #6B7A3F;
                --border-color: #E5E7EB;
                --shadow-color: rgba(0,0,0,0.06);
                --shadow-hover: rgba(0,0,0,0.1);
                --module-card-bg: #FAFAFA;
                --module-card-hover: #F5F5F5;
                --loading-bg: #F3F4F6;
                --tab-hover: #F9FAFB;
            }
            
            [data-theme="dark"] {
                --bg-gradient-1: #0f172a;
                --bg-gradient-2: #1e293b;
                --bg-gradient-3: #334155;
                --card-bg: #1e293b;
                --text-primary: #f1f5f9;
                --text-secondary: #cbd5e1;
                --text-title: #bef264;
                --border-color: #475569;
                --shadow-color: rgba(0,0,0,0.4);
                --shadow-hover: rgba(0,0,0,0.6);
                --module-card-bg: #0f172a;
                --module-card-hover: #1e293b;
                --loading-bg: #475569;
                --tab-hover: #334155;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, var(--bg-gradient-1) 0%, var(--bg-gradient-2) 50%, var(--bg-gradient-3) 100%);
                min-height: 100vh;
                transition: background 0.3s ease;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                background: var(--card-bg);
                padding: 20px 30px;
                border-radius: 16px;
                box-shadow: 0 2px 12px var(--shadow-color);
                margin-bottom: 30px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: background 0.3s ease, box-shadow 0.3s ease;
            }
            
            .logo-section {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .logo {
                width: 120px;
                height: auto;
                transition: opacity 0.3s ease;
            }
            
            .title {
                font-size: 28px;
                font-weight: 600;
                color: var(--text-title);
                letter-spacing: -0.5px;
            }
            
            .subtitle {
                font-size: 15px;
                font-weight: 600;
                color: var(--text-secondary);
                margin-top: 2px;
            }
            
            .stats-wrapper {
                box-shadow: none;
                border-radius: 0;
                margin-bottom: 30px;
                transition: box-shadow 0.3s ease;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-bottom: 0px;
            }
            
            .stat-card {
                background: var(--card-bg);
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 2px 12px var(--shadow-color);
                transition: all 0.3s ease;
                cursor: pointer;
                border: 2px solid transparent;
            }
            
            .stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px var(--shadow-hover);
                border-color: #E8B86D;
            }
            
            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                margin-bottom: 15px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .stat-card:hover .stat-icon {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
            }
            
            .stat-icon i {
                font-size: 28px;
            }
            
            .stat-value {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 5px;
                color: var(--text-primary);
            }
            
            .stat-label {
                font-size: 14px;
                color: var(--text-secondary);
                margin-bottom: 10px;
            }
            
            .stat-details {
                display: flex;
                gap: 15px;
                font-size: 12px;
                margin-top: 12px;
            }
            
            .stat-detail {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .desktop-bg { background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%); color: #2E7D32; }
            .mobile-bg { background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); color: #1565C0; }
            .android-bg { background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); color: #E65100; }
            .oms-bg { background: linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%); color: #6A1B9A; }
            .ios-bg { background: linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%); color: #00695C; }
            
            [data-theme="dark"] .desktop-bg { background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%); color: #A5D6A7; }
            [data-theme="dark"] .mobile-bg { background: linear-gradient(135deg, #0D47A1 0%, #1565C0 100%); color: #90CAF9; }
            [data-theme="dark"] .android-bg { background: linear-gradient(135deg, #E65100 0%, #F57C00 100%); color: #FFCC80; }
            [data-theme="dark"] .oms-bg { background: linear-gradient(135deg, #4A148C 0%, #6A1B9A 100%); color: #CE93D8; }
            [data-theme="dark"] .ios-bg { background: linear-gradient(135deg, #004D40 0%, #00695C 100%); color: #80CBC4; }
            
            .charts-section {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            
            .chart-card {
                background: var(--card-bg);
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 2px 12px var(--shadow-color);
                transition: background 0.3s ease;
            }
            
            .chart-card .highcharts-container {
                width: 100% !important;
            }
            
            .chart-card canvas {
                max-height: 300px;
                width: 100% !important;
                height: 300px !important;
            }
            
            .full-width-chart {
                grid-column: 1 / -1;
            }
            
            .chart-title {
                font-size: 20px;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                letter-spacing: -0.3px;
            }
            
            .modules-section {
                background: var(--card-bg);
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 2px 12px var(--shadow-color);
                margin-bottom: 30px;
                transition: background 0.3s ease;
            }
            
            .modules-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            
            .module-card {
                background: var(--module-card-bg);
                padding: 16px;
                border-radius: 12px;
                border-left: 4px solid #E8B86D;
                transition: all 0.3s ease;
            }
            
            .module-card:hover {
                background: var(--module-card-hover);
                transform: translateX(4px);
            }
            
            .module-name {
                font-size: 15px;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 8px;
                letter-spacing: -0.2px;
            }
            
            .module-stats {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .live-context-card {
                background: var(--card-bg);
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 2px 12px var(--shadow-color);
                border: 2px solid transparent;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .live-context-card::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: linear-gradient(180deg, #10b981 0%, #059669 100%);
                transition: width 0.3s ease;
            }
            
            .live-context-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px var(--shadow-hover);
                border-color: #10b981;
            }
            
            .live-context-card:hover::before {
                width: 6px;
            }
            
            .live-context-card.coming-soon {
                opacity: 0.6;
            }
            
            .live-context-card.coming-soon::before {
                background: linear-gradient(180deg, #9CA3AF 0%, #6B7280 100%);
            }
            
            .context-title {
                font-size: 18px;
                font-weight: 700;
                color: var(--text-title);
                margin-bottom: 16px;
                letter-spacing: -0.3px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .context-title i {
                font-size: 20px;
            }
            
            .context-line {
                padding: 6px 0;
                padding-left: 16px;
                margin-bottom: 2px;
                font-size: 13px;
                color: var(--text-secondary);
                line-height: 1.6;
                position: relative;
            }
            
            .context-line::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 2px;
                background: var(--border-color);
            }
            
            .context-line strong {
                color: var(--text-primary);
                font-weight: 600;
            }
            
            .context-line.highlight strong {
                color: #10b981;
            }
            
            [data-theme="dark"] .context-line.highlight strong {
                color: #34d399;
            }
            
            .context-divider {
                height: 1px;
                background: var(--border-color);
                margin: 12px 0;
                opacity: 0.5;
            }
            
            .context-line:last-child {
                margin-bottom: 0;
            }
            
            .progress-bar {
                height: 6px;
                background: var(--border-color);
                border-radius: 3px;
                margin-top: 8px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #bef264 0%, #84cc16 100%);
                border-radius: 3px;
                transition: width 0.5s ease;
            }
            
            [data-theme="light"] .progress-fill {
                background: linear-gradient(90deg, #6B7A3F 0%, #8B9467 100%);
            }
            
            .btn {
                padding: 10px 20px;
                border-radius: 8px;
                border: none;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .btn-primary {
                background: #6B7A3F;
                color: white;
            }
            
            [data-theme="dark"] .btn-primary {
                background: #bef264;
                color: #0f172a;
            }
            
            .btn-primary:hover {
                background: #5A6735;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(107, 122, 63, 0.3);
            }
            
            [data-theme="dark"] .btn-primary:hover {
                background: #84cc16;
                box-shadow: 0 4px 12px rgba(190, 242, 100, 0.3);
            }
            
            .btn-secondary {
                background: var(--loading-bg);
                color: var(--text-primary);
            }
            
            .btn-secondary:hover {
                background: var(--border-color);
            }
            
            .tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 2px solid var(--border-color);
                padding-bottom: 10px;
            }
            
            .tab {
                padding: 12px 24px;
                border-radius: 8px 8px 0 0;
                border: none;
                background: transparent;
                color: var(--text-secondary);
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                letter-spacing: -0.2px;
            }
            
            .tab.active {
                background: var(--card-bg);
                color: var(--text-title);
                border-bottom: 3px solid #E8B86D;
            }
            
            .tab:hover {
                background: var(--tab-hover);
            }
            
            .tab i {
                font-size: 18px;
            }
            
            .loading {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--card-bg);
                padding: 30px;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.15);
                z-index: 1000;
                transition: background 0.3s ease;
            }
            
            .loading.show {
                display: block;
            }
            
            .spinner {
                border: 4px solid var(--loading-bg);
                border-top: 4px solid #6B7A3F;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }
            
            .theme-toggle {
                position: relative;
                width: 60px;
                height: 30px;
                background: #64748b;
                border-radius: 30px;
                cursor: pointer;
                transition: background 0.3s ease;
                margin-left: 15px;
            }
            
            [data-theme="dark"] .theme-toggle {
                background: #bef264;
            }
            
            .theme-toggle::before {
                content: '☀️';
                position: absolute;
                top: 3px;
                left: 3px;
                width: 24px;
                height: 24px;
                background: white;
                border-radius: 50%;
                transition: transform 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }
            
            [data-theme="dark"] .theme-toggle::before {
                content: '🌙';
                transform: translateX(30px);
            }
            
            .header-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.6;
                    transform: scale(1.1);
                }
            }
            
            .badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .badge-success {
                background: #D1FAE5;
                color: #065F46;
            }
            
            [data-theme="dark"] .badge-success {
                background: #064e3b;
                color: #6ee7b7;
            }
            
            .badge-danger {
                background: #FEE2E2;
                color: #991B1B;
            }
            
            [data-theme="dark"] .badge-danger {
                background: #7f1d1d;
                color: #fca5a5;
            }
            
            .badge-warning {
                background: #FEF3C7;
                color: #92400E;
            }
            
            [data-theme="dark"] .badge-warning {
                background: #78350f;
                color: #fde047;
            }
            
            .tooltip {
                position: relative;
                display: inline-block;
            }
            
            .tooltip .tooltiptext {
                visibility: hidden;
                background-color: #374151;
                color: white;
                text-align: center;
                border-radius: 6px;
                padding: 8px 12px;
                position: absolute;
                z-index: 1;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s;
                font-size: 12px;
            }
            
            .tooltip:hover .tooltiptext {
                visibility: visible;
                opacity: 1;
            }
            
            .screenshot-card {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            
            .screenshot-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px var(--shadow-hover) !important;
            }
            
            .screenshot-card img {
                transition: transform 0.2s ease;
            }
            
            .screenshot-card:hover img {
                transform: scale(1.02);
            }
            
            .journey-steps {
                animation: slideDown 0.3s ease-out;
            }
            
            @keyframes slideDown {
                from {
                    opacity: 0;
                    max-height: 0;
                }
                to {
                    opacity: 1;
                    max-height: 500px;
                }
            }
            
            @media (max-width: 768px) {
                #liveStatsGrid,
                #statsGrid {
                    grid-template-columns: 1fr !important;
                }
                
                .charts-section {
                    grid-template-columns: 1fr;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .stat-card {
                    border-radius: 16px;
                }
                
                .stat-card:first-child {
                    border-radius: 16px;
                }
                
                .header {
                    flex-direction: column;
                    gap: 15px;
                }
                
                .header-controls {
                    flex-direction: column;
                    width: 100%;
                }
                
                .btn {
                    width: 100%;
                    justify-content: center;
                }
                
                .logo-section {
                    flex-direction: column;
                    text-align: center;
                }
                
                .title {
                    font-size: 24px;
                }
                
                .modules-grid {
                    grid-template-columns: 1fr;
                }
                
                .tabs {
                    flex-wrap: wrap;
                }
                
                .container {
                    padding: 10px;
                }
                
                .chart-card,
                .stat-card,
                .modules-section {
                    padding: 16px;
                }
            }
            
            @media (max-width: 480px) {
                .title {
                    font-size: 20px;
                }
                
                .subtitle {
                    font-size: 12px;
                }
                
                .stat-value {
                    font-size: 28px;
                }
                
                .chart-title {
                    font-size: 16px;
                }
                
                .theme-toggle {
                    width: 50px;
                    height: 26px;
                }
                
                .theme-toggle::before {
                    width: 20px;
                    height: 20px;
                    font-size: 12px;
                }
                
                [data-theme="dark"] .theme-toggle::before {
                    transform: translateX(24px);
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo-section">
                    <img src="/static/fnp-logo.svg" alt="FNP Logo" class="logo" style="height: 50px; width: auto;">
                    <div>
                        <div class="title">Sentinel</div>
                        <div class="subtitle"><strong><em>A system that constantly watches all business flows and alerts on anomalies before impact.</em></strong></div>
                    </div>
                </div>
                <div class="header-controls">
                    <div style="font-size: 12px; color: var(--text-secondary); margin-right: 15px; text-align: right;">
                        <div id="currentDate" style="font-weight: 600; color: var(--text-primary);"></div>
                    </div>
                    <div class="theme-toggle" onclick="toggleTheme()" title="Toggle Dark/Light Mode"></div>
                    <button class="btn btn-primary" onclick="refreshData()" title="Fetch today's latest test data from Supabase (Ctrl+R)">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <!-- Live Updates Section -->
            <div class="modules-section">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                    <div class="chart-title" style="margin-bottom: 0;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2); animation: pulse 2s infinite; margin-right: 4px;"></div>
                        <i class="fas fa-broadcast-tower"></i>
                        Live Test Execution Context
                    </div>
                    <div style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">
                        <i class="fas fa-clock"></i> Updated <span id="liveUpdateTime">just now</span>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px;" id="liveStatsGrid">
                    <!-- Live context cards will be loaded dynamically -->
                </div>
            </div>
            
            <!-- Platform Stats -->
            <div class="modules-section">
                <div class="chart-title">
                    <i class="fas fa-chart-line"></i>
                    Overall
                </div>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; margin-top: 20px;" id="statsGrid">
                    <!-- Combined stats and gauge cards will be loaded dynamically -->
                </div>
            </div>
            
            <!-- Modules Section -->
            <div class="modules-section">
                <div class="chart-title">
                    <i class="fas fa-puzzle-piece"></i>
                    Test Modules by Platform
                </div>
                
                <div class="tabs">
                    <button class="tab active" onclick="showModules('desktop', event)">
                        <i class="fas fa-laptop-code"></i> Desktop Site
                    </button>
                    <button class="tab" onclick="showModules('mobile', event)">
                        <i class="fas fa-mobile-screen"></i> Mobile Site
                    </button>
                    <button class="tab" onclick="showModules('oms', event)">
                        <i class="fas fa-boxes-stacked"></i> OMS
                    </button>
                    <button class="tab" onclick="showModules('android', event)">
                        <i class="fas fa-handshake"></i> Partner Panel
                    </button>
                    <button class="tab" onclick="showModules('ios', event)">
                        <i class="fab fa-android"></i> Android
                    </button>
                </div>
                
                <div class="modules-grid" id="modulesGrid">
                    <!-- Modules will be loaded dynamically -->
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="charts-section">
                <div class="chart-card">
                    <div class="chart-title">
                        <i class="fas fa-chart-bar"></i>
                        Test Results Overview (3D Column)
                    </div>
                    <div id="overviewChart"></div>
                </div>
                
                <div class="chart-card">
                    <div class="chart-title">
                        <i class="fas fa-chart-line"></i>
                        Performance Trend Analysis
                    </div>
                    <div id="trendChart"></div>
                </div>
            </div>
            
            <div class="chart-card full-width-chart">
                <div class="chart-title">
                    <i class="fas fa-chart-scatter"></i>
                    Module Success Rate Bubble Chart
                </div>
                <div id="bubbleChart"></div>
            </div>
        </div>
        
        <!-- Loading Indicator -->
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div style="text-align: center; color: #6B7280;">Loading Sentinel Dashboard...</div>
        </div>
        
        <script src="/static/app.js"></script>
    </body>
    </html>
  `);
});

export default app;
