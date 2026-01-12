# React Dashboard Developer Guide
## FNP Automation Framework - Complete Integration Reference

**Last Updated**: January 8, 2026  
**Version**: 1.0.0  
**Target Audience**: React Dashboard Developers

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Supabase Credentials](#supabase-credentials)
3. [Database Schema Overview](#database-schema-overview)
4. [Complete Logging Format](#complete-logging-format)
5. [React Integration Examples](#react-integration-examples)
6. [Essential Queries](#essential-queries)
7. [Performance Best Practices](#performance-best-practices)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Create Supabase Client

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Environment Variables

Create `.env` file in your React project root:

```bash
REACT_APP_SUPABASE_URL=https://wnymknrycmldwqzdqoct.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueW1rbnJ5Y21sZHdxemRxb2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDA5NTMsImV4cCI6MjA4MzI3Njk1M30.RO25k77AcJHYcaCtmqjYUifdfsG6NiOJ7UuGu2-LSq0
```

**Security Note**: The anon key is safe for frontend use. Row Level Security (RLS) policies enforce read-only access.

---

## Supabase Credentials

### Project Information

**Project URL**: `https://wnymknrycmldwqzdqoct.supabase.co`

**Project Reference**: `wnymknrycmldwqzdqoct`

### API Keys

#### 1. Anon (Public) Key - FOR REACT DASHBOARD
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueW1rbnJ5Y21sZHdxemRxb2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDA5NTMsImV4cCI6MjA4MzI3Njk1M30.RO25k77AcJHYcaCtmqjYUifdfsG6NiOJ7UuGu2-LSq0
```
- **Use**: React dashboard (frontend)
- **Access**: Read-only (enforced by RLS)
- **Safe**: Yes, can be exposed in client-side code

#### 2. Service Role Key - FOR CI PIPELINE ONLY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueW1rbnJ5Y21sZHdxemRxb2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcwMDk1MywiZXhwIjoyMDgzMjc2OTUzfQ.HCK8yC6jRIb67LUxOEEXI_dLs_fXcLK6m4_50iN8tPU
```
- **Use**: CI pipeline (backend logging)
- **Access**: Full read/write access
- **Safe**: NO - Keep secret, never expose in frontend

### Direct Database Access (Optional)

**Connection String**:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Note**: For dashboard development, use the Supabase JS client with anon key. Direct database access is not needed.

---

## Database Schema Overview

### Tables

#### 1. `raw_test_logs` (Immutable Storage)
Complete JSON payloads stored immutably for audit trail and reprocessing.

**Columns**:
- `log_id` (UUID, PK)
- `raw_payload` (JSONB) - Complete test execution data
- `run_id` (UUID) - Links to test_runs
- `framework` (TEXT)
- `environment` (TEXT)
- `executed_at` (TIMESTAMPTZ)
- `ingested_at` (TIMESTAMPTZ)
- `processed` (BOOLEAN)
- `ingestion_source` (TEXT)

#### 2. `test_runs` (High-Level Metrics)
One record per test suite execution.

**Key Columns**:
- `run_id` (UUID, PK)
- `framework` (TEXT) - e.g., 'playwright'
- `suite_name` (TEXT)
- `environment` (TEXT) - dev/uat/prod
- `platform` (TEXT) - web/mobile/api
- `executed_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)
- `total_runtime_ms` (INTEGER)
- `total_journeys` (INTEGER)
- `passed_journeys` (INTEGER)
- `failed_journeys` (INTEGER)
- `total_steps` (INTEGER)
- `passed_steps` (INTEGER)
- `failed_steps` (INTEGER)
- `success_rate` (NUMERIC)
- `build_number` (TEXT)
- `report_url` (TEXT)

#### 3. `journeys` (Scenario-Level Details)
One record per test scenario/journey.

**Key Columns**:
- `journey_id` (UUID, PK)
- `run_id` (UUID, FK)
- `journey_number` (INTEGER)
- `journey_name` (TEXT)
- `status` (TEXT) - PASSED/FAILED/SKIPPED
- `start_time` (TIMESTAMPTZ)
- `end_time` (TIMESTAMPTZ)
- `duration_ms` (INTEGER)
- `failure_reason` (TEXT)
- `error_type` (TEXT)
- `error_message` (TEXT)
- `total_steps` (INTEGER)
- `passed_steps` (INTEGER)
- `failed_steps` (INTEGER)

#### 4. `steps` (Step-Level Execution)
One record per test step.

**Key Columns**:
- `step_id` (UUID, PK)
- `journey_id` (UUID, FK)
- `run_id` (UUID, FK)
- `step_number` (INTEGER)
- `step_name` (TEXT)
- `status` (TEXT) - PASSED/FAILED/SKIPPED
- `start_time` (TIMESTAMPTZ)
- `end_time` (TIMESTAMPTZ)
- `duration_ms` (INTEGER)
- `error_type` (TEXT)
- `error_message` (TEXT)
- `api_calls` (JSONB) - Array of API call details

#### 5. `health_scores` (Pre-computed Aggregations)
Pre-calculated metrics for dashboard performance.

**Key Columns**:
- `score_id` (UUID, PK)
- `framework` (TEXT)
- `environment` (TEXT)
- `time_period` (TEXT) - hourly/daily/weekly
- `period_start` (TIMESTAMPTZ)
- `period_end` (TIMESTAMPTZ)
- `total_runs` (INTEGER)
- `avg_success_rate` (NUMERIC)
- `avg_runtime_ms` (INTEGER)
- `total_failures` (INTEGER)

### Views (Pre-optimized Queries)

All views are indexed and optimized for dashboard queries:

1. **v_execution_timeline** - Ordered test runs with summary
2. **v_daily_metrics** - Daily aggregated metrics
3. **v_journey_health_heatmap** - Journey reliability over time
4. **v_step_performance_heatmap** - Step timing analysis
5. **v_realtime_health** - Last 24 hours health metrics
6. **v_failure_hotspots** - Most problematic areas
7. **v_framework_comparison** - Compare frameworks/environments
8. **v_performance_trends** - Week-over-week trends

**Materialized View**:
- **mv_journey_reliability** - 30-day journey reliability scores (refreshed hourly)

---

## Complete Logging Format

### Test Run Payload Structure

```json
{
  "run_id": "550e8400-e29b-41d4-a716-446655440000",
  "framework": "playwright",
  "suite_name": "FNP Automation Framework",
  "environment": "prod",
  "platform": "web",
  "executed_at": "2026-01-08T10:30:00.000Z",
  "completed_at": "2026-01-08T11:45:00.000Z",
  "total_runtime_ms": 4500000,
  "build_number": "123",
  "build_url": "https://jenkins.example.com/job/fnp-automation/123",
  "job_name": "fnp-automation-prod",
  "report_url": "https://fnp-test-reports.s3.us-east-1.amazonaws.com/latest-report/index.html",
  "slack_notification_sent": true,
  "metadata": {
    "node_version": "v18.17.0",
    "ci": true,
    "headless": true
  },
  "summary": {
    "total_journeys": 19,
    "passed_journeys": 17,
    "failed_journeys": 2,
    "skipped_journeys": 0,
    "total_steps": 247,
    "passed_steps": 235,
    "failed_steps": 12,
    "skipped_steps": 0,
    "success_rate": 95.14
  },
  "journeys": [...]
}
```

### Journey Structure

```json
{
  "journey_number": 1,
  "journey_name": "Home Page Exploration",
  "journey_description": "Complete Nineteen Journey Flow",
  "status": "PASSED",
  "start_time": "2026-01-08T10:30:15.000Z",
  "end_time": "2026-01-08T10:35:45.000Z",
  "duration_ms": 330000,
  "failure_reason": null,
  "error_type": null,
  "error_message": null,
  "error_stack": null,
  "metadata": {},
  "steps": [...]
}
```

### Step Structure

```json
{
  "step_name": "User Authentication: Navigate to Login Page",
  "status": "PASSED",
  "start_time": "2026-01-08T10:30:15.000Z",
  "end_time": "2026-01-08T10:30:18.000Z",
  "duration_ms": 3000,
  "error_type": null,
  "error_message": null,
  "error_stack": null,
  "api_calls": [
    {
      "url": "https://www.fnp.com/api/auth/session",
      "method": "GET",
      "status": 200,
      "status_text": "OK",
      "timestamp": 1704708015500,
      "response_body": null
    }
  ],
  "metadata": {}
}
```

### Failed Step Example

```json
{
  "step_name": "Delivery Setup: Set Qatar Delivery Date",
  "status": "FAILED",
  "start_time": "2026-01-08T11:20:15.000Z",
  "end_time": "2026-01-08T11:20:45.000Z",
  "duration_ms": 30000,
  "error_type": "TimeoutError",
  "error_message": "locator.click: Timeout 30000ms exceeded",
  "error_stack": "TimeoutError: locator.click: Timeout 30000ms exceeded\n    at AddOnPage.setDeliveryDate...",
  "api_calls": [
    {
      "url": "https://www.fnp.com/api/delivery/slots",
      "method": "GET",
      "status": 500,
      "status_text": "Internal Server Error",
      "timestamp": 1704710415000,
      "response_body": "{\"error\":\"Failed to fetch delivery slots\"}"
    }
  ],
  "metadata": {}
}
```

---

## React Integration Examples

### 1. Basic Dashboard Component

```javascript
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function Dashboard() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestRuns();
  }, []);

  async function fetchLatestRuns() {
    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error fetching runs:', error);
    } else {
      setRuns(data);
    }
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Test Runs</h1>
      <table>
        <thead>
          <tr>
            <th>Executed At</th>
            <th>Environment</th>
            <th>Success Rate</th>
            <th>Runtime</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr key={run.run_id}>
              <td>{new Date(run.executed_at).toLocaleString()}</td>
              <td>{run.environment}</td>
              <td>{run.success_rate.toFixed(2)}%</td>
              <td>{(run.total_runtime_ms / 1000 / 60).toFixed(2)} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
```

### 2. Real-time Health Metrics

```javascript
function HealthMetrics() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    const { data, error } = await supabase
      .from('v_realtime_health')
      .select('*')
      .eq('framework', 'playwright')
      .eq('environment', 'prod')
      .single();
    
    if (!error) setHealth(data);
  }

  if (!health) return <div>Loading...</div>;

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>Success Rate</h3>
        <p className="metric-value">{health.avg_success_rate.toFixed(2)}%</p>
      </div>
      <div className="metric-card">
        <h3>Runs (24h)</h3>
        <p className="metric-value">{health.runs_last_24h}</p>
      </div>
      <div className="metric-card">
        <h3>Avg Runtime</h3>
        <p className="metric-value">
          {(health.avg_runtime_ms / 1000 / 60).toFixed(2)} min
        </p>
      </div>
      <div className="metric-card">
        <h3>Failures</h3>
        <p className="metric-value">{health.total_failures}</p>
      </div>
    </div>
  );
}
```

### 3. Journey Details with Steps

```javascript
function JourneyDetails({ journeyId }) {
  const [journey, setJourney] = useState(null);
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    fetchJourneyDetails();
  }, [journeyId]);

  async function fetchJourneyDetails() {
    // Fetch journey
    const { data: journeyData } = await supabase
      .from('journeys')
      .select('*')
      .eq('journey_id', journeyId)
      .single();
    
    // Fetch steps
    const { data: stepsData } = await supabase
      .from('steps')
      .select('*')
      .eq('journey_id', journeyId)
      .order('step_number', { ascending: true });
    
    setJourney(journeyData);
    setSteps(stepsData);
  }

  if (!journey) return <div>Loading...</div>;

  return (
    <div>
      <h2>{journey.journey_name}</h2>
      <p>Status: <span className={journey.status}>{journey.status}</span></p>
      <p>Duration: {(journey.duration_ms / 1000).toFixed(2)}s</p>
      
      {journey.status === 'FAILED' && (
        <div className="error-details">
          <h3>Failure Details</h3>
          <p><strong>Reason:</strong> {journey.failure_reason}</p>
          <p><strong>Error:</strong> {journey.error_message}</p>
        </div>
      )}

      <h3>Steps ({steps.length})</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Step Name</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {steps.map(step => (
            <tr key={step.step_id} className={step.status.toLowerCase()}>
              <td>{step.step_number}</td>
              <td>{step.step_name}</td>
              <td>{step.status}</td>
              <td>{step.duration_ms}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 4. Trend Chart with Chart.js

```javascript
import { Line } from 'react-chartjs-2';

function TrendChart() {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetchTrendData();
  }, []);

  async function fetchTrendData() {
    const { data } = await supabase
      .from('v_daily_metrics')
      .select('*')
      .eq('framework', 'playwright')
      .eq('environment', 'prod')
      .order('date', { ascending: true })
      .limit(30);
    
    setChartData({
      labels: data.map(d => d.date),
      datasets: [{
        label: 'Success Rate (%)',
        data: data.map(d => d.avg_success_rate),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    });
  }

  if (!chartData) return <div>Loading...</div>;

  return (
    <div>
      <h2>Success Rate Trend (30 Days)</h2>
      <Line data={chartData} />
    </div>
  );
}
```

---

## Essential Queries

### 1. Latest Test Runs

```javascript
const { data, error } = await supabase
  .from('test_runs')
  .select('*')
  .order('executed_at', { ascending: false })
  .limit(50);
```

### 2. Runs by Environment

```javascript
const { data, error } = await supabase
  .from('test_runs')
  .select('*')
  .eq('environment', 'prod')
  .order('executed_at', { ascending: false });
```

### 3. Failed Journeys

```javascript
const { data, error } = await supabase
  .from('journeys')
  .select('*, test_runs(environment, executed_at)')
  .eq('status', 'FAILED')
  .order('start_time', { ascending: false })
  .limit(20);
```

### 4. Journey with All Steps

```javascript
const { data, error } = await supabase
  .from('journeys')
  .select(`
    *,
    test_runs(framework, environment, executed_at),
    steps(*)
  `)
  .eq('journey_id', journeyId)
  .single();
```

### 5. Daily Metrics

```javascript
const { data, error } = await supabase
  .from('v_daily_metrics')
  .select('*')
  .eq('framework', 'playwright')
  .eq('environment', 'prod')
  .gte('date', '2026-01-01')
  .order('date', { ascending: false });
```

### 6. Failure Hotspots

```javascript
const { data, error } = await supabase
  .from('v_failure_hotspots')
  .select('*')
  .limit(10);
```

### 7. Journey Health Heatmap

```javascript
const { data, error } = await supabase
  .from('v_journey_health_heatmap')
  .select('*')
  .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
  .order('date', { ascending: false });
```

### 8. Search Runs by Build Number

```javascript
const { data, error } = await supabase
  .from('test_runs')
  .select('*')
  .ilike('build_number', `%${searchTerm}%`)
  .order('executed_at', { ascending: false});
```

### 9. Pagination

```javascript
const page = 1;
const perPage = 50;
const { data, error } = await supabase
  .from('test_runs')
  .select('*')
  .order('executed_at', { ascending: false })
  .range((page - 1) * perPage, page * perPage - 1);
```

### 10. Count Total Runs

```javascript
const { count, error } = await supabase
  .from('test_runs')
  .select('*', { count: 'exact', head: true })
  .eq('environment', 'prod');
```

---

## Performance Best Practices

### 1. Use Views for Complex Queries

✅ **Good**: Use pre-optimized views
```javascript
const { data } = await supabase
  .from('v_execution_timeline')
  .select('*')
  .limit(50);
```

❌ **Bad**: Complex joins in frontend
```javascript
const { data } = await supabase
  .from('test_runs')
  .select('*, journeys(*), steps(*)')
  .limit(50);
```

### 2. Select Only Needed Columns

✅ **Good**: Specific columns
```javascript
const { data } = await supabase
  .from('test_runs')
  .select('run_id, executed_at, success_rate, environment')
  .limit(100);
```

❌ **Bad**: Select all
```javascript
const { data } = await supabase
  .from('test_runs')
  .select('*');
```

### 3. Always Use Pagination

✅ **Good**: Paginated results
```javascript
const { data } = await supabase
  .from('test_runs')
  .select('*')
  .range(0, 49);
```

❌ **Bad**: No limit
```javascript
const { data } = await supabase
  .from('steps')
  .select('*');  // Could return thousands
```

### 4. Use React Query for Caching

```javascript
import { useQuery } from 'react-query';

function useTestRuns(environment) {
  return useQuery(
    ['test-runs', environment],
    async () => {
      const { data } = await supabase
        .from('test_runs')
        .select('*')
        .eq('environment', environment)
        .limit(50);
      return data;
    },
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );
}
```

### 5. Error Handling

```javascript
async function fetchData() {
  try {
    const { data, error } = await supabase
      .from('test_runs')
      .select('*');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase error:', error.message);
    // Show user-friendly message
    toast.error('Failed to load data');
    return [];
  }
}
```

---

## Troubleshooting

### Issue: "Failed to fetch" or CORS errors

**Solution**: Check environment variables are set correctly
```javascript
console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('Key:', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

### Issue: Empty results

**Solution**: Check RLS policies and verify data exists
```javascript
// Test connection
const { data, error } = await supabase
  .from('test_runs')
  .select('count');
console.log('Total runs:', data, error);
```

### Issue: Slow queries

**Solution**: 
1. Use views instead of complex joins
2. Add pagination with `.range()`
3. Select specific columns only
4. Check indexes exist in database

### Issue: Real-time updates not working

**Solution**: Subscribe to changes
```javascript
const subscription = supabase
  .channel('test_runs_channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'test_runs'
  }, (payload) => {
    console.log('New run:', payload.new);
  })
  .subscribe();

// Cleanup
return () => subscription.unsubscribe();
```

---

## Additional Resources

- **Full Query Examples**: See `supabase/react-queries.md`
- **Database Schema**: See `supabase/schema.sql`
- **Integration Guide**: See `supabase/INTEGRATION_GUIDE.md`
- **Example Payload**: See `supabase/example-payload.json`
- **Supabase Docs**: https://supabase.com/docs

---

## Support

For questions or issues:
1. Check existing documentation in `supabase/` directory
2. Review SQL schema for table structure
3. Test queries in Supabase SQL Editor
4. Contact FNP Automation Team

---

**Happy Dashboard Building! 🚀**
