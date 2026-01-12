# React Dashboard - Supabase Query Examples

**Philosophy**: Backend prepares data, Frontend consumes data. React never "figures out" data.

All heavy computation, aggregation, categorization, and formatting happens in Supabase SQL functions. React simply calls functions and displays the results.

## Architecture Principles

✅ **Backend (Supabase)**:
- All data aggregation
- All calculations
- All categorization
- All formatting
- All business logic

✅ **Frontend (React)**:
- Call RPC functions
- Display data
- Handle user interactions
- Manage UI state

❌ **Frontend NEVER**:
- Loops through data to calculate
- Filters/sorts large datasets
- Computes aggregations
- Determines categories/colors

---

## Setup

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Industry-Standard Pattern: RPC Functions

### ✅ CORRECT: Call backend function (Fast, Scalable, Maintainable)

```javascript
// Single function call returns complete dashboard
const { data, error } = await supabase.rpc('get_dashboard_overview', {
  p_framework: 'playwright',
  p_environment: 'prod',
  p_days: 30
});

// Data is ready to display - no processing needed
const { summary, recent_runs, top_failures, trend_data } = data;
```

### ❌ WRONG: Fetch raw data and process in React (Slow, Unscalable, Hard to maintain)

```javascript
// DON'T DO THIS - fetches too much data, processes in browser
const { data: runs } = await supabase.from('test_runs').select('*');
const avgSuccessRate = runs.reduce((sum, r) => sum + r.success_rate, 0) / runs.length;
```

---

## 1. Complete Dashboard Overview (Single Call)

**Backend does**: Aggregation, categorization, health status determination

```javascript
const { data, error } = await supabase.rpc('get_dashboard_overview', {
  p_framework: 'playwright',
  p_environment: 'prod',
  p_days: 30
});

// Data structure (ready to display):
{
  summary: {
    total_runs: 45,
    successful_runs: 42,
    failed_runs: 3,
    avg_success_rate: 95.67,
    avg_runtime_minutes: 75.5,
    total_journeys: 855,
    total_failures: 12,
    last_execution: "2026-01-08T11:45:00Z",
    health_status: "excellent"  // ← Backend categorized
  },
  recent_runs: [...],  // ← Pre-formatted
  top_failures: [...],  // ← Pre-sorted
  trend_data: [...]  // ← Ready for chart
}

// React component (just displays):
function DashboardOverview() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    supabase.rpc('get_dashboard_overview', {
      p_framework: 'playwright',
      p_environment: 'prod',
      p_days: 30
    }).then(({ data }) => setData(data));
  }, []);
  
  if (!data) return <Loading />;
  
  return (
    <div>
      <KPICard 
        title="Success Rate" 
        value={`${data.summary.avg_success_rate}%`}
        status={data.summary.health_status}  // ← Use backend category
      />
      <KPICard 
        title="Avg Runtime" 
        value={`${data.summary.avg_runtime_minutes} min`}
      />
      {/* Just display, no calculation */}
    </div>
  );
}
```

---

## 2. Journey Heatmap (Pre-computed Colors)

**Backend does**: Color intensity calculation, categorization

```javascript
const { data, error } = await supabase.rpc('get_journey_heatmap_data', {
  p_framework: 'playwright',
  p_environment: 'prod',
  p_days: 14
});

// Data structure:
{
  journeys: ["Home Page Exploration", "ADD-On Testing", ...],
  dates: ["2026-01-08", "2026-01-07", ...],
  data: [
    {
      journey: "Home Page Exploration",
      date: "2026-01-08",
      success_rate: 98.5,
      execution_count: 5,
      avg_duration_ms: 330000,
      color_intensity: "green-high"  // ← Backend determined color
    },
    ...
  ]
}

// React component (just renders):
function JourneyHeatmap() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    supabase.rpc('get_journey_heatmap_data', {
      p_days: 14
    }).then(({ data }) => setData(data));
  }, []);
  
  return (
    <HeatmapGrid>
      {data.data.map(cell => (
        <HeatmapCell
          key={`${cell.journey}-${cell.date}`}
          className={cell.color_intensity}  // ← Use backend color
          value={cell.success_rate}
        />
      ))}
    </HeatmapGrid>
  );
}
```

---

## 3. Step Performance Analysis (Pre-categorized)

**Backend does**: Percentile calculation, performance categorization, reliability scoring

```javascript
const { data, error } = await supabase.rpc('get_step_performance_analysis', {
  p_framework: 'playwright',
  p_environment: 'prod',
  p_limit: 50
});

// Data structure:
[
  {
    step_name: "Payment Process: Test QR Payment",
    journey_name: "Home Page Exploration",
    execution_count: 45,
    avg_duration_ms: 4250.5,
    min_duration_ms: 3000,
    max_duration_ms: 8000,
    median_duration_ms: 4000,
    p95_duration_ms: 6500,
    failure_count: 2,
    failure_rate: 4.44,
    performance_category: "normal",  // ← Backend categorized
    reliability_category: "good"  // ← Backend categorized
  },
  ...
]

// React component (just displays):
function StepPerformanceTable() {
  const [steps, setSteps] = useState([]);
  
  useEffect(() => {
    supabase.rpc('get_step_performance_analysis', {
      p_limit: 50
    }).then(({ data }) => setSteps(data));
  }, []);
  
  return (
    <Table>
      {steps.map(step => (
        <TableRow key={step.step_name}>
          <td>{step.step_name}</td>
          <td>{step.avg_duration_ms}ms</td>
          <td>
            <Badge color={getCategoryColor(step.performance_category)}>
              {step.performance_category}  {/* ← Use backend category */}
            </Badge>
          </td>
          <td>
            <Badge color={getCategoryColor(step.reliability_category)}>
              {step.reliability_category}  {/* ← Use backend category */}
            </Badge>
          </td>
        </TableRow>
      ))}
    </Table>
  );
}

// Simple mapping function (no calculation)
function getCategoryColor(category) {
  const colors = {
    excellent: 'green',
    good: 'blue',
    warning: 'yellow',
    critical: 'red',
    fast: 'green',
    normal: 'blue',
    slow: 'yellow',
    very_slow: 'red'
  };
  return colors[category] || 'gray';
}
```

---

## 4. Trend Analysis (Pre-computed Trends)

**Backend does**: Week-over-week comparison, trend categorization

```javascript
const { data, error } = await supabase.rpc('get_trend_analysis', {
  p_framework: 'playwright',
  p_environment: 'prod',
  p_weeks: 8
});

// Data structure:
[
  {
    week_start: "2026-01-06",
    current_success_rate: 95.5,
    previous_success_rate: 93.2,
    success_rate_change: 2.3,
    success_rate_trend: "improving",  // ← Backend categorized
    current_runtime_minutes: 75.5,
    previous_runtime_minutes: 78.2,
    runtime_change_minutes: -2.7,
    runtime_trend: "faster",  // ← Backend categorized
    run_count: 12
  },
  ...
]

// React component (just displays):
function TrendChart() {
  const [trends, setTrends] = useState([]);
  
  useEffect(() => {
    supabase.rpc('get_trend_analysis', {
      p_weeks: 8
    }).then(({ data }) => setTrends(data));
  }, []);
  
  return (
    <LineChart
      data={{
        labels: trends.map(t => t.week_start),
        datasets: [{
          label: 'Success Rate',
          data: trends.map(t => t.current_success_rate)
        }]
      }}
    />
  );
}
```

---

## 5. Failure Analysis (Pre-categorized by Severity)

**Backend does**: Grouping, percentage calculation, severity determination

```javascript
const { data, error } = await supabase.rpc('get_failure_analysis', {
  p_framework: 'playwright',
  p_environment: 'prod',
  p_days: 7
});

// Data structure:
{
  summary: {
    total_failures: 15,
    unique_failure_types: 4,
    most_common_error: "TimeoutError"
  },
  by_error_type: [
    {
      error_type: "TimeoutError",
      count: 8,
      percentage: 53.33,
      affected_journeys: 3,
      severity: "critical"  // ← Backend determined severity
    },
    ...
  ],
  by_journey: [...],
  recent_failures: [...]
}

// React component (just displays):
function FailureAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  
  useEffect(() => {
    supabase.rpc('get_failure_analysis', {
      p_days: 7
    }).then(({ data }) => setAnalysis(data));
  }, []);
  
  return (
    <div>
      <h2>Failure Analysis</h2>
      <p>Total Failures: {analysis.summary.total_failures}</p>
      
      <h3>By Error Type</h3>
      {analysis.by_error_type.map(error => (
        <ErrorCard
          key={error.error_type}
          type={error.error_type}
          count={error.count}
          percentage={error.percentage}
          severity={error.severity}  // ← Use backend severity
        />
      ))}
    </div>
  );
}
```

---

## 6. Journey Details (Pre-formatted)

**Backend does**: Duration formatting, API call categorization

```javascript
const { data, error } = await supabase.rpc('get_journey_details', {
  p_journey_id: journeyId
});

// Data structure:
{
  journey: {
    journey_id: "...",
    journey_name: "ADD-On Testing on PDP",
    status: "FAILED",
    duration_ms: 330000,
    duration_formatted: "5.5min",  // ← Backend formatted
    failure_reason: "Delivery date selector disabled",
    ...
  },
  steps: [
    {
      step_number: 1,
      step_name: "Navigate to Login Page",
      status: "PASSED",
      duration_ms: 3000,
      duration_formatted: "3s",  // ← Backend formatted
      api_calls: [
        {
          url: "/api/auth/session",
          method: "GET",
          status: 200,
          status_category: "success"  // ← Backend categorized
        }
      ]
    },
    ...
  ],
  test_run: {...}
}

// React component (just displays):
function JourneyDetails({ journeyId }) {
  const [details, setDetails] = useState(null);
  
  useEffect(() => {
    supabase.rpc('get_journey_details', {
      p_journey_id: journeyId
    }).then(({ data }) => setDetails(data));
  }, [journeyId]);
  
  return (
    <div>
      <h2>{details.journey.journey_name}</h2>
      <p>Duration: {details.journey.duration_formatted}</p>  {/* ← Pre-formatted */}
      <p>Status: {details.journey.status}</p>
      
      <h3>Steps</h3>
      {details.steps.map(step => (
        <StepCard
          key={step.step_number}
          name={step.step_name}
          duration={step.duration_formatted}  {/* ← Pre-formatted */}
          status={step.status}
        />
      ))}
    </div>
  );
}
```

---

## 7. Framework Comparison (Pre-graded)

**Backend does**: Grading, sorting by performance

```javascript
const { data, error } = await supabase.rpc('get_comparison_data', {
  p_days: 30
});

// Data structure:
[
  {
    framework: "playwright",
    environment: "prod",
    label: "playwright (prod)",
    total_runs: 45,
    avg_success_rate: 95.67,
    avg_runtime_minutes: 75.5,
    total_journeys: 855,
    total_failures: 12,
    health_grade: "A"  // ← Backend assigned grade
  },
  ...
]

// React component (just displays):
function FrameworkComparison() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    supabase.rpc('get_comparison_data', {
      p_days: 30
    }).then(({ data }) => setData(data));
  }, []);
  
  return (
    <BarChart
      data={{
        labels: data.map(d => d.label),
        datasets: [{
          label: 'Success Rate',
          data: data.map(d => d.avg_success_rate),
          backgroundColor: data.map(d => getGradeColor(d.health_grade))
        }]
      }}
    />
  );
}

function getGradeColor(grade) {
  const colors = { A: 'green', B: 'blue', C: 'yellow', D: 'orange', F: 'red' };
  return colors[grade];
}
```

---

## 8. Search with Filters (Backend Pagination)

**Backend does**: Full-text search, filtering, pagination, counting

```javascript
const { data, error } = await supabase.rpc('search_test_runs', {
  p_search_term: 'build-123',
  p_framework: 'playwright',
  p_environment: 'prod',
  p_status: 'failure',
  p_date_from: '2026-01-01T00:00:00Z',
  p_date_to: null,
  p_limit: 50,
  p_offset: 0
});

// Data structure:
{
  total_count: 150,  // ← Backend counted
  results: [...]  // ← Backend filtered, sorted, paginated
}

// React component (just displays):
function SearchResults({ searchTerm, filters, page }) {
  const [results, setResults] = useState(null);
  
  useEffect(() => {
    supabase.rpc('search_test_runs', {
      p_search_term: searchTerm,
      ...filters,
      p_limit: 50,
      p_offset: (page - 1) * 50
    }).then(({ data }) => setResults(data));
  }, [searchTerm, filters, page]);
  
  return (
    <div>
      <p>Found {results.total_count} results</p>  {/* ← Backend counted */}
      {results.results.map(run => (
        <RunCard key={run.run_id} {...run} />
      ))}
      <Pagination 
        total={results.total_count} 
        perPage={50} 
        current={page}
      />
    </div>
  );
}
```

---

## Performance Benefits

### Backend Processing (Supabase SQL)
- ✅ Runs on database server (powerful)
- ✅ Optimized with indexes
- ✅ Parallel query execution
- ✅ Minimal data transfer
- ✅ Cached by Supabase

### Frontend Processing (React)
- ❌ Runs on user's device (variable power)
- ❌ No indexes available
- ❌ Single-threaded JavaScript
- ❌ Large data transfer required
- ❌ Recalculated on every render

---

## Complete Dashboard Example

```javascript
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function HealthDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Single function call gets everything
    supabase.rpc('get_dashboard_overview', {
      p_framework: 'playwright',
      p_environment: 'prod',
      p_days: 30
    }).then(({ data, error }) => {
      if (error) console.error(error);
      else setOverview(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="dashboard">
      <h1>FNP Automation Health Dashboard</h1>
      
      {/* KPI Cards - just display backend data */}
      <div className="kpi-grid">
        <KPICard
          title="Success Rate"
          value={`${overview.summary.avg_success_rate}%`}
          status={overview.summary.health_status}
          trend={overview.summary.avg_success_rate > 95 ? 'up' : 'down'}
        />
        <KPICard
          title="Avg Runtime"
          value={`${overview.summary.avg_runtime_minutes} min`}
        />
        <KPICard
          title="Total Runs"
          value={overview.summary.total_runs}
        />
        <KPICard
          title="Failures"
          value={overview.summary.total_failures}
          status={overview.summary.total_failures === 0 ? 'excellent' : 'warning'}
        />
      </div>

      {/* Trend Chart - backend prepared data */}
      <TrendChart data={overview.trend_data} />

      {/* Top Failures - backend sorted */}
      <FailureList failures={overview.top_failures} />

      {/* Recent Runs - backend formatted */}
      <RunsList runs={overview.recent_runs} />
    </div>
  );
}

export default HealthDashboard;
```

---

## Key Takeaways

1. **Always use RPC functions** for dashboard data
2. **Backend does all computation** - aggregation, categorization, formatting
3. **React just displays** - no loops, no calculations, no filtering
4. **Result**: Fast, scalable, maintainable dashboard

---

This is the industry-standard approach used by companies like Stripe, GitHub, and Vercel for their dashboards.


---

## 3. Journey Health Heatmap

**Purpose**: Visualize journey reliability over time

```javascript
// Get journey health data for heatmap
const { data, error } = await supabase
  .from('v_journey_health_heatmap')
  .select('*')
  .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
  .order('date', { ascending: false })
  .order('journey_number', { ascending: true });

// Transform for heatmap library (e.g., react-calendar-heatmap)
const heatmapData = data.map(d => ({
  date: d.date,
  journey: d.journey_name,
  value: d.success_rate,
  count: d.execution_count
}));
```

---

## 4. Step Performance Heatmap

**Purpose**: Identify slow or problematic steps

```javascript
// Get step performance data
const { data, error } = await supabase
  .from('v_step_performance_heatmap')
  .select('*')
  .order('avg_duration_ms', { ascending: false })
  .limit(50);

// For heatmap visualization
const heatmapData = data.map(d => ({
  x: d.journey_name,
  y: d.step_name,
  value: d.avg_duration_ms,
  failures: d.failure_count,
  failureRate: d.failure_rate
}));
```

---

## 5. Real-time Health Dashboard (Last 24 Hours)

**Purpose**: Show current system health

```javascript
// Get real-time health metrics
const { data, error } = await supabase
  .from('v_realtime_health')
  .select('*')
  .eq('framework', 'playwright')
  .eq('environment', 'prod')
  .single();

// Display as KPI cards
const kpis = {
  totalRuns: data.runs_last_24h,
  successRate: data.avg_success_rate.toFixed(2) + '%',
  avgRuntime: (data.avg_runtime_ms / 1000 / 60).toFixed(2) + ' min',
  lastExecution: new Date(data.last_execution).toLocaleString(),
  status: data.total_failures === 0 ? 'Healthy' : 'Issues Detected'
};
```

---

## 6. Failure Hotspots (Most Problematic Areas)

**Purpose**: Identify areas needing attention

```javascript
// Get failure hotspots
const { data, error } = await supabase
  .from('v_failure_hotspots')
  .select('*')
  .limit(10);

// Display as table or list
const hotspots = data.map(d => ({
  type: d.failure_type,
  name: d.name,
  failures: d.failure_count,
  lastFailure: new Date(d.last_failure).toLocaleString(),
  errorType: d.common_error_type
}));
```

---

## 7. Journey Pass/Fail Distribution

**Purpose**: Show journey success rates

```javascript
// Get journey distribution for a specific run
const { data: journeys, error } = await supabase
  .from('journeys')
  .select('journey_name, status, duration_ms')
  .eq('run_id', runId)
  .order('journey_number', { ascending: true });

// For pie chart
const statusCounts = journeys.reduce((acc, j) => {
  acc[j.status] = (acc[j.status] || 0) + 1;
  return acc;
}, {});

const pieData = {
  labels: Object.keys(statusCounts),
  datasets: [{
    data: Object.values(statusCounts),
    backgroundColor: ['#4CAF50', '#F44336', '#FFC107']
  }]
};
```

---

## 8. Step-Level Details for a Journey

**Purpose**: Drill down into journey execution

```javascript
// Get all steps for a journey
const { data: steps, error } = await supabase
  .from('steps')
  .select('*')
  .eq('journey_id', journeyId)
  .order('step_number', { ascending: true });

// Display as timeline or table
const stepTimeline = steps.map(s => ({
  stepNumber: s.step_number,
  name: s.step_name,
  status: s.status,
  duration: s.duration_ms + 'ms',
  error: s.error_message,
  apiCalls: s.api_calls?.length || 0
}));
```

---

## 9. Framework Comparison

**Purpose**: Compare different frameworks or environments

```javascript
// Get framework comparison
const { data, error } = await supabase
  .from('v_framework_comparison')
  .select('*')
  .order('avg_success_rate', { ascending: false });

// For bar chart comparison
const chartData = {
  labels: data.map(d => `${d.framework} (${d.environment})`),
  datasets: [{
    label: 'Success Rate',
    data: data.map(d => d.avg_success_rate),
    backgroundColor: 'rgba(75, 192, 192, 0.6)'
  }]
};
```

---

## 10. Performance Trends (Week-over-Week)

**Purpose**: Show performance changes over time

```javascript
// Get performance trends
const { data, error } = await supabase
  .from('v_performance_trends')
  .select('*')
  .eq('framework', 'playwright')
  .eq('environment', 'prod')
  .order('current_week', { ascending: false })
  .limit(8);

// Display trend indicators
const trends = data.map(d => ({
  week: new Date(d.current_week).toLocaleDateString(),
  successRate: d.current_success_rate.toFixed(2) + '%',
  successRateChange: d.success_rate_change > 0 ? '↑' : '↓',
  successRateChangeValue: Math.abs(d.success_rate_change).toFixed(2) + '%',
  runtime: (d.current_runtime_ms / 1000 / 60).toFixed(2) + ' min',
  runtimeChange: d.runtime_change_ms < 0 ? '↓' : '↑'
}));
```

---

## 11. Journey Reliability Scores (Materialized View)

**Purpose**: Show most/least reliable journeys

```javascript
// Get journey reliability scores
const { data, error } = await supabase
  .from('mv_journey_reliability')
  .select('*')
  .order('reliability_score', { ascending: false });

// Display as ranked list
const reliabilityList = data.map(d => ({
  journey: d.journey_name,
  score: d.reliability_score.toFixed(2) + '%',
  executions: d.total_executions,
  avgDuration: (d.avg_duration_ms / 1000).toFixed(2) + 's',
  lastRun: new Date(d.last_execution).toLocaleString()
}));
```

---

## 12. Detailed Run Information

**Purpose**: Get complete details for a specific test run

```javascript
// Get run with all journeys and steps
const { data: run, error: runError } = await supabase
  .from('test_runs')
  .select(`
    *,
    journeys (
      *,
      steps (*)
    )
  `)
  .eq('run_id', runId)
  .single();

// Access nested data
const runDetails = {
  runId: run.run_id,
  framework: run.framework,
  environment: run.environment,
  executedAt: run.executed_at,
  totalRuntime: run.total_runtime_ms,
  successRate: run.success_rate,
  journeys: run.journeys.map(j => ({
    name: j.journey_name,
    status: j.status,
    duration: j.duration_ms,
    steps: j.steps.map(s => ({
      name: s.step_name,
      status: s.status,
      duration: s.duration_ms
    }))
  }))
};
```

---

## 13. Search and Filter Test Runs

**Purpose**: Advanced filtering for dashboard

```javascript
// Filter runs by multiple criteria
const { data, error } = await supabase
  .from('test_runs')
  .select('*')
  .eq('framework', 'playwright')
  .eq('environment', 'prod')
  .gte('executed_at', startDate)
  .lte('executed_at', endDate)
  .gte('success_rate', 80)
  .order('executed_at', { ascending: false })
  .range(0, 49); // Pagination: first 50 results

// With full-text search on build number
const { data: searchResults, error: searchError } = await supabase
  .from('test_runs')
  .select('*')
  .ilike('build_number', `%${searchTerm}%`)
  .order('executed_at', { ascending: false });
```

---

## 14. Real-time Subscriptions (Live Updates)

**Purpose**: Get live updates when new test runs complete

```javascript
// Subscribe to new test runs
const subscription = supabase
  .channel('test_runs_channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'test_runs'
    },
    (payload) => {
      console.log('New test run:', payload.new);
      // Update dashboard with new data
      updateDashboard(payload.new);
    }
  )
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

---

## 15. Aggregated Health Scores

**Purpose**: Display pre-computed health metrics

```javascript
// Get latest health scores
const { data, error } = await supabase
  .from('health_scores')
  .select('*')
  .eq('framework', 'playwright')
  .eq('environment', 'prod')
  .eq('time_period', 'daily')
  .order('period_start', { ascending: false })
  .limit(30);

// Display as trend chart
const healthTrend = {
  labels: data.map(d => new Date(d.period_start).toLocaleDateString()),
  datasets: [{
    label: 'Health Score',
    data: data.map(d => d.avg_success_rate),
    fill: true,
    backgroundColor: 'rgba(75, 192, 192, 0.2)'
  }]
};
```

---

## 16. API Call Analysis (Failed Requests)

**Purpose**: Analyze API failures during test execution

```javascript
// Get steps with failed API calls
const { data, error } = await supabase
  .from('steps')
  .select('step_name, api_calls, start_time')
  .not('api_calls', 'is', null)
  .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .order('start_time', { ascending: false });

// Filter steps with 4xx/5xx responses
const failedApiCalls = data
  .filter(step => {
    const apiCalls = step.api_calls || [];
    return apiCalls.some(call => call.status >= 400);
  })
  .map(step => ({
    step: step.step_name,
    time: step.start_time,
    failedCalls: step.api_calls.filter(call => call.status >= 400)
  }));
```

---

## Performance Optimization Tips

### 1. Use Indexes
All views are backed by indexed columns for fast queries.

### 2. Pagination
Always use `.range()` for large result sets:
```javascript
const { data, error } = await supabase
  .from('test_runs')
  .select('*')
  .range(0, 49); // First 50 results
```

### 3. Select Specific Columns
Only fetch what you need:
```javascript
const { data, error } = await supabase
  .from('test_runs')
  .select('run_id, executed_at, success_rate, framework')
  .limit(100);
```

### 4. Use Materialized Views
For expensive aggregations, use materialized views:
```javascript
const { data, error } = await supabase
  .from('mv_journey_reliability')
  .select('*');
```

### 5. Cache Results
Use React Query or SWR for client-side caching:
```javascript
import { useQuery } from 'react-query';

const { data, isLoading } = useQuery(
  ['test-runs', framework, environment],
  () => fetchTestRuns(framework, environment),
  { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
);
```

---

## Error Handling

```javascript
const fetchData = async () => {
  try {
    const { data, error } = await supabase
      .from('test_runs')
      .select('*');
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Supabase query error:', error.message);
    // Show user-friendly error message
    toast.error('Failed to load test data');
    return [];
  }
};
```

---

## Environment Variables

Create `.env` file in your React app:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Security Note**: The anon key is safe to use in frontend code. Row Level Security (RLS) policies enforce read-only access.

---

## Complete Dashboard Example

```javascript
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Line, Bar, Pie } from 'react-chartjs-2';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function HealthDashboard() {
  const [realtimeHealth, setRealtimeHealth] = useState(null);
  const [dailyMetrics, setDailyMetrics] = useState([]);
  const [failureHotspots, setFailureHotspots] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    // Fetch real-time health
    const { data: health } = await supabase
      .from('v_realtime_health')
      .select('*')
      .eq('framework', 'playwright')
      .eq('environment', 'prod')
      .single();
    setRealtimeHealth(health);

    // Fetch daily metrics
    const { data: metrics } = await supabase
      .from('v_daily_metrics')
      .select('*')
      .eq('framework', 'playwright')
      .eq('environment', 'prod')
      .order('date', { ascending: false })
      .limit(30);
    setDailyMetrics(metrics);

    // Fetch failure hotspots
    const { data: hotspots } = await supabase
      .from('v_failure_hotspots')
      .select('*')
      .limit(10);
    setFailureHotspots(hotspots);
  };

  return (
    <div className="dashboard">
      <h1>FNP Automation Health Dashboard</h1>
      
      {/* KPI Cards */}
      {realtimeHealth && (
        <div className="kpi-cards">
          <div className="kpi-card">
            <h3>Success Rate</h3>
            <p>{realtimeHealth.avg_success_rate.toFixed(2)}%</p>
          </div>
          <div className="kpi-card">
            <h3>Runs (24h)</h3>
            <p>{realtimeHealth.runs_last_24h}</p>
          </div>
          <div className="kpi-card">
            <h3>Avg Runtime</h3>
            <p>{(realtimeHealth.avg_runtime_ms / 1000 / 60).toFixed(2)} min</p>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {dailyMetrics.length > 0 && (
        <div className="chart-container">
          <h2>Success Rate Trend (30 Days)</h2>
          <Line
            data={{
              labels: dailyMetrics.map(d => d.date),
              datasets: [{
                label: 'Success Rate (%)',
                data: dailyMetrics.map(d => d.avg_success_rate),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            }}
          />
        </div>
      )}

      {/* Failure Hotspots */}
      {failureHotspots.length > 0 && (
        <div className="hotspots">
          <h2>Failure Hotspots</h2>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Failures</th>
                <th>Last Failure</th>
              </tr>
            </thead>
            <tbody>
              {failureHotspots.map((hotspot, i) => (
                <tr key={i}>
                  <td>{hotspot.failure_type}</td>
                  <td>{hotspot.name}</td>
                  <td>{hotspot.failure_count}</td>
                  <td>{new Date(hotspot.last_failure).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HealthDashboard;
```

---

This completes the React query examples. All queries are optimized for performance and use the views/indexes defined in the schema.
