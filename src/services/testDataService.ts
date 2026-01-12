import { supabase, TestRun, Journey, Step } from '../lib/supabase';

/**
 * Service for fetching test execution data from Supabase
 * Maps Playwright automation data to dashboard format
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
 * Fetch journey health heatmap data
 */
export async function fetchJourneyHealthHeatmap(days: number = 14) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('v_journey_health_heatmap')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .order('journey_number', { ascending: true });

    if (error) {
      console.error('Error fetching journey health heatmap:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchJourneyHealthHeatmap:', error);
    return [];
  }
}
