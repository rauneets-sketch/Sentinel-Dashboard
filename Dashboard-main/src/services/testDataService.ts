import { supabase, TestRun, Journey, Step } from '../lib/supabase';

/**
 * Service for fetching test execution data from Supabase
 * Maps Playwright automation data to dashboard format
 * Enhanced to support OMS and Partner Panel data fetching
 */

export interface DashboardData {
  latestRun: TestRun | null;
  journeys: Journey[];
  steps: Step[];
  summary: {
    totalRuns: number;
    successRate: number;
    avgRuntime: number;
    lastExecution: string | null;
  };
}

export interface SystemHealthData {
  system: string;
  runs_last_24h: number;
  successful_runs: number;
  failed_runs: number;
  avg_success_rate: number;
  avg_runtime_ms: number;
  last_execution: string | null;
}

export interface CorrelatedRunData {
  master_execution_id: string;
  oms_run_id: string | null;
  oms_status: string | null;
  oms_success_rate: number | null;
  oms_tabs: string | null;
  oms_runtime_ms: number | null;
  pp_run_id: string | null;
  pp_status: string | null;
  pp_success_rate: number | null;
  pp_tabs: string | null;
  pp_runtime_ms: number | null;
  executed_at: string;
  completed_at: string | null;
}

/**
 * Fetch the latest test run with all related data
 */
export async function fetchLatestTestRun(): Promise<DashboardData | null> {
  try {
    // Get the latest test run
    const { data: latestRun, error: runError } = await supabase
      .from('test_runs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(1)
      .single();

    if (runError) {
      console.error('Error fetching latest test run:', runError);
      return null;
    }

    if (!latestRun) {
      return null;
    }

    // Get all journeys for this run
    const { data: journeys, error: journeysError } = await supabase
      .from('journeys')
      .select('*')
      .eq('run_id', latestRun.run_id)
      .order('journey_number', { ascending: true });

    if (journeysError) {
      console.error('Error fetching journeys:', journeysError);
      return null;
    }

    // Get all steps for this run
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('*')
      .eq('run_id', latestRun.run_id)
      .order('step_number', { ascending: true });

    if (stepsError) {
      console.error('Error fetching steps:', stepsError);
      return null;
    }

    // Calculate summary statistics
    const { data: recentRuns, error: summaryError } = await supabase
      .from('test_runs')
      .select('success_rate, total_runtime_ms, executed_at')
      .order('executed_at', { ascending: false })
      .limit(10);

    const summary = {
      totalRuns: recentRuns?.length || 0,
      successRate: recentRuns && recentRuns.length > 0
        ? recentRuns.reduce((sum, run) => sum + (run.success_rate || 0), 0) / recentRuns.length
        : 0,
      avgRuntime: recentRuns && recentRuns.length > 0
        ? recentRuns.reduce((sum, run) => sum + (run.total_runtime_ms || 0), 0) / recentRuns.length
        : 0,
      lastExecution: latestRun.executed_at,
    };

    return {
      latestRun,
      journeys: journeys || [],
      steps: steps || [],
      summary,
    };
  } catch (error) {
    console.error('Error in fetchLatestTestRun:', error);
    return null;
  }
}

/**
 * Fetch test runs for a specific time period
 */
export async function fetchTestRunsByPeriod(days: number = 7): Promise<TestRun[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .gte('executed_at', startDate.toISOString())
      .order('executed_at', { ascending: false });

    if (error) {
      console.error('Error fetching test runs by period:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchTestRunsByPeriod:', error);
    return [];
  }
}

/**
 * Fetch journeys with their steps for a specific run
 */
export async function fetchJourneysWithSteps(runId: string): Promise<(Journey & { steps: Step[] })[]> {
  try {
    const { data: journeys, error: journeysError } = await supabase
      .from('journeys')
      .select('*')
      .eq('run_id', runId)
      .order('journey_number', { ascending: true });

    if (journeysError || !journeys) {
      console.error('Error fetching journeys:', journeysError);
      return [];
    }

    // Fetch steps for all journeys
    const journeysWithSteps = await Promise.all(
      journeys.map(async (journey) => {
        const { data: steps, error: stepsError } = await supabase
          .from('steps')
          .select('*')
          .eq('journey_id', journey.journey_id)
          .order('step_number', { ascending: true });

        return {
          ...journey,
          steps: steps || [],
        };
      })
    );

    return journeysWithSteps;
  } catch (error) {
    console.error('Error in fetchJourneysWithSteps:', error);
    return [];
  }
}

/**
 * Fetch real-time health metrics (last 24 hours)
 */
export async function fetchRealtimeHealth(framework: string = 'playwright', environment: string = 'dev') {
  try {
    const { data, error } = await supabase
      .from('v_realtime_health')
      .select('*')
      .eq('framework', framework)
      .eq('environment', environment)
      .single();

    if (error) {
      console.error('Error fetching realtime health:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchRealtimeHealth:', error);
    return null;
  }
}

/**
 * Fetch daily metrics for trend analysis
 */
export async function fetchDailyMetrics(framework: string = 'playwright', environment: string = 'dev', days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('v_daily_metrics')
      .select('*')
      .eq('framework', framework)
      .eq('environment', environment)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching daily metrics:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchDailyMetrics:', error);
    return [];
  }
}

/**
 * Fetch failure hotspots
 */
export async function fetchFailureHotspots(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('v_failure_hotspots')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('Error fetching failure hotspots:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchFailureHotspots:', error);
    return [];
  }
}

/**
 * Fetch system health metrics for OMS and Partner Panel (last 24 hours)
 */
export async function fetchSystemHealth(): Promise<SystemHealthData[]> {
  try {
    const { data, error } = await supabase.rpc('get_system_health_24h');
    
    if (error) {
      console.error('Error fetching system health:', error);
      // Fallback to manual query if function doesn't exist
      return await fetchSystemHealthManual();
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchSystemHealth:', error);
    return await fetchSystemHealthManual();
  }
}

/**
 * Manual system health query (fallback)
 */
async function fetchSystemHealthManual(): Promise<SystemHealthData[]> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('test_runs')
      .select('metadata, failed_journeys, success_rate, total_runtime_ms, executed_at')
      .gte('executed_at', twentyFourHoursAgo)
      .not('metadata->>system', 'is', null);

    if (error) {
      console.error('Error in manual system health query:', error);
      return [];
    }

    // Group by system
    const grouped = (data || []).reduce((acc: any, run) => {
      const system = run.metadata?.system;
      if (!system) return acc;
      
      if (!acc[system]) {
        acc[system] = { runs: 0, successful: 0, failed: 0, totalSuccessRate: 0, totalRuntime: 0, lastExecution: null };
      }
      
      acc[system].runs++;
      acc[system].successful += run.failed_journeys === 0 ? 1 : 0;
      acc[system].failed += run.failed_journeys > 0 ? 1 : 0;
      acc[system].totalSuccessRate += run.success_rate || 0;
      acc[system].totalRuntime += run.total_runtime_ms || 0;
      
      if (!acc[system].lastExecution || run.executed_at > acc[system].lastExecution) {
        acc[system].lastExecution = run.executed_at;
      }
      
      return acc;
    }, {});

    // Convert to array format
    return Object.entries(grouped).map(([system, stats]: [string, any]) => ({
      system,
      runs_last_24h: stats.runs,
      successful_runs: stats.successful,
      failed_runs: stats.failed,
      avg_success_rate: stats.runs > 0 ? (stats.totalSuccessRate / stats.runs) : 0,
      avg_runtime_ms: stats.runs > 0 ? (stats.totalRuntime / stats.runs) : 0,
      last_execution: stats.lastExecution,
    }));
  } catch (error) {
    console.error('Error in fetchSystemHealthManual:', error);
    return [];
  }
}

/**
 * Fetch latest test runs for a specific system (OMS or PARTNER_PANEL)
 */
export async function fetchLatestSystemRun(system: 'OMS' | 'PARTNER_PANEL'): Promise<DashboardData | null> {
  try {
    // Get the latest test run for the system
    const { data: latestRun, error: runError } = await supabase
      .from('test_runs')
      .select('*')
      .eq('metadata->>system', system)
      .order('executed_at', { ascending: false })
      .limit(1)
      .single();

    if (runError || !latestRun) {
      console.error(`Error fetching latest ${system} run:`, runError);
      return null;
    }

    // Get all journeys for this run
    const { data: journeys, error: journeysError } = await supabase
      .from('journeys')
      .select('*')
      .eq('run_id', latestRun.run_id)
      .order('journey_number', { ascending: true });

    if (journeysError) {
      console.error(`Error fetching ${system} journeys:`, journeysError);
      return null;
    }

    // Get all steps for this run
    const { data: steps, error: stepsError } = await supabase
      .from('steps')
      .select('*')
      .eq('run_id', latestRun.run_id)
      .order('step_number', { ascending: true });

    if (stepsError) {
      console.error(`Error fetching ${system} steps:`, stepsError);
      return null;
    }

    // Associate steps with their journeys
    const journeysWithSteps = (journeys || []).map(journey => {
      const journeySteps = (steps || []).filter(step => step.journey_id === journey.journey_id);
      return {
        ...journey,
        steps: journeySteps
      };
    });

    // Calculate summary statistics for the system
    const { data: recentRuns, error: summaryError } = await supabase
      .from('test_runs')
      .select('success_rate, total_runtime_ms, executed_at')
      .eq('metadata->>system', system)
      .order('executed_at', { ascending: false })
      .limit(10);

    const summary = {
      totalRuns: recentRuns?.length || 0,
      successRate: recentRuns && recentRuns.length > 0
        ? recentRuns.reduce((sum, run) => sum + (run.success_rate || 0), 0) / recentRuns.length
        : 0,
      avgRuntime: recentRuns && recentRuns.length > 0
        ? recentRuns.reduce((sum, run) => sum + (run.total_runtime_ms || 0), 0) / recentRuns.length
        : 0,
      lastExecution: latestRun.executed_at,
    };

    return {
      latestRun,
      journeys: journeysWithSteps,
      steps: steps || [],
      summary,
    };
  } catch (error) {
    console.error(`Error in fetchLatestSystemRun for ${system}:`, error);
    return null;
  }
}

/**
 * Fetch correlated runs (OMS + Partner Panel from same execution)
 */
export async function fetchCorrelatedRuns(limit: number = 10): Promise<CorrelatedRunData[]> {
  try {
    const { data, error } = await supabase.rpc('get_correlated_runs', { limit_count: limit });
    
    if (error) {
      console.error('Error fetching correlated runs:', error);
      // Fallback to manual query
      return await fetchCorrelatedRunsManual(limit);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchCorrelatedRuns:', error);
    return await fetchCorrelatedRunsManual(limit);
  }
}

/**
 * Manual correlated runs query (fallback)
 */
async function fetchCorrelatedRunsManual(limit: number): Promise<CorrelatedRunData[]> {
  try {
    // Get OMS runs
    const { data: omsRuns, error: omsError } = await supabase
      .from('test_runs')
      .select('*')
      .eq('metadata->>system', 'OMS')
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (omsError || !omsRuns) {
      console.error('Error fetching OMS runs:', omsError);
      return [];
    }

    // For each OMS run, find matching PP run
    const correlated = await Promise.all(
      omsRuns.map(async (omsRun) => {
        const masterExecId = omsRun.metadata?.master_execution_id;
        
        let ppRun = null;
        if (masterExecId) {
          const { data: ppRuns } = await supabase
            .from('test_runs')
            .select('*')
            .eq('metadata->>system', 'PARTNER_PANEL')
            .eq('metadata->>master_execution_id', masterExecId)
            .limit(1);
          
          ppRun = ppRuns && ppRuns.length > 0 ? ppRuns[0] : null;
        }

        return {
          master_execution_id: masterExecId || omsRun.run_id,
          oms_run_id: omsRun.metadata?.readable_run_id || omsRun.run_id,
          oms_status: omsRun.failed_journeys === 0 ? 'PASSED' : 'FAILED',
          oms_success_rate: omsRun.success_rate,
          oms_tabs: omsRun.metadata?.total_tabs_tested?.toString() || null,
          oms_runtime_ms: omsRun.total_runtime_ms,
          pp_run_id: ppRun?.metadata?.readable_run_id || null,
          pp_status: ppRun ? (ppRun.failed_journeys === 0 ? 'PASSED' : 'FAILED') : null,
          pp_success_rate: ppRun?.success_rate || null,
          pp_tabs: ppRun?.metadata?.total_tabs_tested?.toString() || null,
          pp_runtime_ms: ppRun?.total_runtime_ms || null,
          executed_at: omsRun.executed_at,
          completed_at: omsRun.completed_at,
        };
      })
    );

    return correlated;
  } catch (error) {
    console.error('Error in fetchCorrelatedRunsManual:', error);
    return [];
  }
}

/**
 * Fetch tab performance data for a specific system
 */
export async function fetchTabPerformance(system: 'OMS' | 'PARTNER_PANEL', days: number = 7) {
  try {
    const { data, error } = await supabase.rpc('get_tab_performance', {
      system_name: system,
      days_back: days
    });
    
    if (error) {
      console.error(`Error fetching ${system} tab performance:`, error);
      return await fetchTabPerformanceManual(system, days);
    }

    return data || [];
  } catch (error) {
    console.error(`Error in fetchTabPerformance for ${system}:`, error);
    return await fetchTabPerformanceManual(system, days);
  }
}

/**
 * Manual tab performance query (fallback)
 */
async function fetchTabPerformanceManual(system: 'OMS' | 'PARTNER_PANEL', days: number) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    // Get steps with tab data for the system
    const { data: steps, error } = await supabase
      .from('steps')
      .select(`
        *,
        test_runs!inner(metadata)
      `)
      .like('step_name', 'Tab:%')
      .gte('created_at', startDate)
      .not('metadata->>load_time_ms', 'is', null);

    if (error) {
      console.error(`Error fetching ${system} tab steps:`, error);
      return [];
    }

    // Filter by system and group by tab name
    const systemSteps = (steps || []).filter(step => 
      step.test_runs?.metadata?.system === system
    );

    const grouped = systemSteps.reduce((acc: any, step) => {
      const tabName = step.metadata?.tab_name;
      const loadTime = parseInt(step.metadata?.load_time_ms || '0');
      
      if (!tabName) return acc;
      
      if (!acc[tabName]) {
        acc[tabName] = { loadTimes: [], passed: 0, failed: 0 };
      }
      
      acc[tabName].loadTimes.push(loadTime);
      acc[tabName].passed += step.status === 'PASSED' ? 1 : 0;
      acc[tabName].failed += step.status === 'FAILED' ? 1 : 0;
      
      return acc;
    }, {});

    // Calculate stats
    return Object.entries(grouped).map(([tabName, data]: [string, any]) => ({
      tab_name: tabName,
      test_count: data.loadTimes.length,
      avg_load_time_ms: data.loadTimes.length > 0 
        ? Math.round(data.loadTimes.reduce((a: number, b: number) => a + b, 0) / data.loadTimes.length)
        : 0,
      min_load_time_ms: data.loadTimes.length > 0 ? Math.min(...data.loadTimes) : 0,
      max_load_time_ms: data.loadTimes.length > 0 ? Math.max(...data.loadTimes) : 0,
      passed_count: data.passed,
      failed_count: data.failed,
      success_rate: data.loadTimes.length > 0 
        ? ((data.passed / data.loadTimes.length) * 100).toFixed(2)
        : '0'
    }));
  } catch (error) {
    console.error(`Error in fetchTabPerformanceManual for ${system}:`, error);
    return [];
  }
}

/**
 * Fetch recent failures for OMS and Partner Panel
 */
export async function fetchRecentFailures(limit: number = 20) {
  try {
    const { data, error } = await supabase.rpc('get_recent_failures', { limit_count: limit });
    
    if (error) {
      console.error('Error fetching recent failures:', error);
      return await fetchRecentFailuresManual(limit);
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchRecentFailures:', error);
    return await fetchRecentFailuresManual(limit);
  }
}

/**
 * Manual recent failures query (fallback)
 */
async function fetchRecentFailuresManual(limit: number) {
  try {
    const { data: failedSteps, error } = await supabase
      .from('steps')
      .select(`
        run_id,
        step_name,
        status,
        error_type,
        error_message,
        duration_ms,
        created_at,
        test_runs!inner(metadata)
      `)
      .eq('status', 'FAILED')
      .in('test_runs.metadata->>system', ['OMS', 'PARTNER_PANEL'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching failed steps:', error);
      return [];
    }

    return (failedSteps || []).map(step => ({
      system: step.test_runs?.metadata?.system,
      readable_run_id: step.test_runs?.metadata?.readable_run_id,
      step_name: step.step_name,
      error_type: step.error_type,
      error_message: step.error_message,
      duration_ms: step.duration_ms,
      created_at: step.created_at,
    }));
  } catch (error) {
    console.error('Error in fetchRecentFailuresManual:', error);
    return [];
  }
}
