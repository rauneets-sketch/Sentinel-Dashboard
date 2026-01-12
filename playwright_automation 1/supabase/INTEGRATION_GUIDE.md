# Supabase Integration Guide
## FNP Automation Framework - Centralized Logging System

This guide explains the complete integration flow from test execution to React dashboard visualization.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CI Pipeline (Jenkins)                        │
│                                                                       │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │   Cucumber   │ ───> │ StepTracker  │ ───> │ ExecutionData│      │
│  │   Execution  │      │ ApiTracker   │      │  Collector   │      │
│  └──────────────┘      └──────────────┘      └──────────────┘      │
│                                                        │              │
│                                                        ▼              │
│                                              ┌──────────────┐        │
│                                              │  Supabase    │        │
│                                              │   Logger     │        │
│                                              └──────────────┘        │
└───────────────────────────────────────────────────┬─────────────────┘
                                                     │
                                                     │ HTTPS POST
                                                     │ (Service Role Key)
                                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase Platform                            │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    raw_test_logs (Immutable)                  │  │
│  │  • Complete JSON payload stored as JSONB                      │  │
│  │  • Write-once, never updated                                  │  │
│  │  • Audit trail for reprocessing                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                     │
│                                │ Automatic Processing                │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Normalized Tables (Relational)                   │  │
│  │  • test_runs    (High-level metrics)                          │  │
│  │  • journeys     (Scenario-level details)                      │  │
│  │  • steps        (Step-level execution)                        │  │
│  │  • health_scores (Pre-computed aggregations)                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                     │
│                                │ Indexed & Optimized                 │
│                                ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SQL Views & Functions                      │  │
│  │  • v_execution_timeline                                       │  │
│  │  • v_daily_metrics                                            │  │
│  │  • v_journey_health_heatmap                                   │  │
│  │  • v_step_performance_heatmap                                 │  │
│  │  • v_failure_hotspots                                         │  │
│  │  • mv_journey_reliability (Materialized)                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                     │
│                                │ Row Level Security (RLS)            │
│                                │ Read-Only for Frontend              │
│                                ▼                                     │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 │ Supabase JS Client
                                 │ (Anon Key - Read Only)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      React Health Dashboard                          │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Trend       │  │  Heatmaps    │  │  Failure     │             │
│  │  Charts      │  │  (Journey/   │  │  Analysis    │             │
│  │              │  │   Step)      │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Real-time   │  │  Performance │  │  Framework   │             │
│  │  Health      │  │  Trends      │  │  Comparison  │             │
│  │              │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Test Execution Phase

**Location**: `src/main/hooks/hooks.js`

```javascript
Before(async function (scenario) {
  // Initialize test run (once per suite)
  executionDataCollector.initializeTestRun({
    framework: 'playwright',
    suiteName: 'FNP Automation Framework',
    environment: process.env.ENV || 'dev',
    platform: 'web'
  });
  
  // Start journey tracking
  executionDataCollector.startJourney(scenario.pickle?.name);
});

AfterStep(async function ({ pickleStep, result }) {
  // Track each step with API calls
  const stepData = stepTracker.getCurrentJourneySteps().slice(-1)[0];
  const apiCalls = apiResponseTracker.getCurrentStepApiCalls();
  executionDataCollector.addStep(stepData, apiCalls);
});

After(async function (scenario) {
  // Complete journey
  executionDataCollector.completeJourney();
  
  // On last scenario, log to Supabase
  if (isLastScenario) {
    const executionData = executionDataCollector.getExecutionData({
      reportUrl: process.env.REPORT_URL,
      slackNotificationSent: true
    });
    
    // Immutable ingestion
    await supabaseLogger.ingestRawLog(executionData, 'jenkins');
  }
});
```

### 2. Supabase Ingestion Phase

**Location**: `src/main/services/SupabaseLogger.js`

```javascript
// Step 1: Store raw payload immutably
async ingestRawLog(rawPayload, ingestionSource) {
  // Insert into raw_test_logs (immutable)
  const rawLog = {
    raw_payload: rawPayload,  // Complete JSON
    run_id: rawPayload.run_id,
    framework: rawPayload.framework,
    environment: rawPayload.environment,
    executed_at: rawPayload.executed_at,
    ingestion_source: ingestionSource,
    processed: false
  };
  
  const { data } = await supabase.post('/raw_test_logs', rawLog);
  const logId = data[0].log_id;
  
  // Step 2: Process into normalized tables
  await this.processRawLog(logId, rawPayload);
  
  return logId;
}

// Step 2: Extract and normalize
async processRawLog(logId, rawPayload) {
  // Create test_runs record
  const runId = await this.createTestRunFromRaw(rawPayload, logId);
  
  // Create journeys records
  for (const journey of rawPayload.journeys) {
    const journeyId = await this.createJourneyFromRaw(runId, journey);
    
    // Create steps records
    await this.createStepsFromRaw(journeyId, runId, journey.steps);
  }
  
  // Mark as processed
  await supabase.patch(`/raw_test_logs?log_id=eq.${logId}`, {
    processed: true
  });
}
```

### 3. React Dashboard Query Phase

**Location**: React Dashboard (Frontend)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY  // Read-only access
);

// Query execution timeline
const { data } = await supabase
  .from('v_execution_timeline')
  .select('*')
  .order('executed_at', { ascending: false })
  .limit(30);

// Query journey health heatmap
const { data: heatmap } = await supabase
  .from('v_journey_health_heatmap')
  .select('*')
  .gte('date', startDate);

// Query failure hotspots
const { data: hotspots } = await supabase
  .from('v_failure_hotspots')
  .select('*')
  .limit(10);
```

---

## Configuration

### 1. Environment Variables

**CI Pipeline (Jenkins)**:
```bash
# Supabase Configuration
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key-here"  # Service role (write access)

# Test Configuration
export ENV="prod"
export BUILD_NUMBER="${BUILD_NUMBER}"
export BUILD_URL="${BUILD_URL}"
export JOB_NAME="${JOB_NAME}"
export REPORT_URL="https://fnp-test-reports.s3.us-east-1.amazonaws.com/latest-report/index.html"
```

**React Dashboard (.env)**:
```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here  # Anon key (read-only)
```

### 2. Supabase Project Setup

1. **Create Supabase Project**:
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and keys

2. **Run Schema**:
   ```bash
   # Connect to Supabase SQL Editor
   # Copy and paste contents of supabase/schema.sql
   # Execute to create all tables, views, indexes, and RLS policies
   ```

3. **Verify Setup**:
   ```sql
   -- Check tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Check RLS policies
   SELECT * FROM pg_policies;
   
   -- Check views
   SELECT table_name FROM information_schema.views 
   WHERE table_schema = 'public';
   ```

### 3. Security Configuration

**Row Level Security (RLS)**:
- Service role key bypasses RLS (for CI pipeline writes)
- Anon key enforces RLS (for frontend reads)
- All tables have read-only policies for authenticated users

**API Keys**:
- **Service Role Key**: Full access, use in CI pipeline only
- **Anon Key**: Read-only access, safe for frontend

---

## JSON Payload Structure

### Complete Execution Payload

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
  "journeys": [
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
      "steps": [
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
        },
        {
          "step_name": "User Authentication: Dismiss Notification Popup",
          "status": "PASSED",
          "start_time": "2026-01-08T10:30:18.000Z",
          "end_time": "2026-01-08T10:30:20.000Z",
          "duration_ms": 2000,
          "error_type": null,
          "error_message": null,
          "error_stack": null,
          "api_calls": [],
          "metadata": {}
        }
      ]
    },
    {
      "journey_number": 8,
      "journey_name": "ADD-On Testing on PDP",
      "journey_description": "Journey 8 - ADD-On Testing Flow",
      "status": "FAILED",
      "start_time": "2026-01-08T11:15:00.000Z",
      "end_time": "2026-01-08T11:20:30.000Z",
      "duration_ms": 330000,
      "failure_reason": "Delivery date selector disabled",
      "error_type": "TimeoutError",
      "error_message": "locator.click: Timeout 30000ms exceeded",
      "error_stack": "TimeoutError: locator.click: Timeout 30000ms exceeded\n    at AddOnPage.setDeliveryDate...",
      "metadata": {},
      "steps": [
        {
          "step_name": "Delivery Setup: Set Qatar Delivery Date with Midnight",
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
      ]
    }
  ]
}
```

---

## Database Schema Justification

### Hybrid Approach: Immutable Raw + Normalized Tables

**Why This Design?**

1. **Immutable Raw Storage (`raw_test_logs`)**:
   - **Audit Trail**: Complete payload preserved forever
   - **Reprocessing**: Can reprocess if schema changes
   - **Debugging**: Full context for troubleshooting
   - **Compliance**: Immutable records for audit requirements

2. **Normalized Tables (`test_runs`, `journeys`, `steps`)**:
   - **Query Performance**: Indexed columns for fast queries
   - **Aggregations**: Efficient GROUP BY and JOIN operations
   - **Relationships**: Foreign keys for data integrity
   - **Dashboard Speed**: Pre-computed metrics

3. **Pre-computed Aggregations (`health_scores`)**:
   - **Dashboard Performance**: Instant load times
   - **Historical Trends**: Pre-calculated metrics
   - **Reduced Load**: Fewer real-time calculations

4. **Materialized Views**:
   - **Expensive Queries**: Pre-computed for speed
   - **Refresh Strategy**: Updated hourly or on-demand
   - **Concurrent Refresh**: No locking during refresh

**Trade-offs**:
- **Storage**: More storage (raw + normalized) but storage is cheap
- **Write Performance**: Slightly slower writes but acceptable for post-test logging
- **Read Performance**: Significantly faster reads (primary goal)
- **Flexibility**: Can change normalized schema without losing raw data

---

## Performance Optimization

### 1. Indexes

All critical query paths are indexed:
- Timeline queries: `idx_test_runs_executed_at`
- Failure analysis: `idx_journeys_failure_analysis`
- Step timing: `idx_steps_timing_analysis`
- JSONB queries: GIN indexes on `api_calls`, `metadata`

### 2. Views

Pre-defined views for common dashboard queries:
- `v_execution_timeline`: Ordered test runs
- `v_daily_metrics`: Aggregated daily stats
- `v_journey_health_heatmap`: Journey reliability over time
- `v_step_performance_heatmap`: Step timing analysis
- `v_failure_hotspots`: Most problematic areas

### 3. Materialized Views

Expensive aggregations pre-computed:
- `mv_journey_reliability`: 30-day journey reliability scores
- Refresh strategy: Hourly via cron or manual trigger

### 4. Query Optimization Tips

```javascript
// ✅ Good: Use views with indexes
const { data } = await supabase
  .from('v_execution_timeline')
  .select('*')
  .limit(50);

// ✅ Good: Select specific columns
const { data } = await supabase
  .from('test_runs')
  .select('run_id, executed_at, success_rate')
  .limit(100);

// ✅ Good: Use pagination
const { data } = await supabase
  .from('test_runs')
  .select('*')
  .range(0, 49);

// ❌ Bad: Select all without limit
const { data } = await supabase
  .from('steps')
  .select('*');  // Could return thousands of rows
```

---

## Monitoring & Maintenance

### 1. Health Checks

```sql
-- Check raw log processing status
SELECT 
    processed,
    COUNT(*) as count,
    MAX(ingested_at) as last_ingestion
FROM raw_test_logs
GROUP BY processed;

-- Check for processing errors
SELECT 
    log_id,
    ingested_at,
    processing_error
FROM raw_test_logs
WHERE processed = false
    AND processing_error IS NOT NULL
ORDER BY ingested_at DESC;
```

### 2. Refresh Materialized Views

```sql
-- Manual refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_journey_reliability;

-- Or use function
SELECT refresh_dashboard_materialized_views();
```

### 3. Compute Health Scores

```sql
-- Compute daily health scores for last 7 days
DO $$
DECLARE
    day_start TIMESTAMPTZ;
    day_end TIMESTAMPTZ;
BEGIN
    FOR i IN 0..6 LOOP
        day_start := DATE_TRUNC('day', NOW() - (i || ' days')::INTERVAL);
        day_end := day_start + INTERVAL '1 day';
        
        PERFORM compute_health_scores(
            'playwright',
            'prod',
            'daily',
            day_start,
            day_end
        );
    END LOOP;
END $$;
```

### 4. Storage Management

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Archive old raw logs (optional, after 90 days)
-- Note: Only if storage becomes an issue
DELETE FROM raw_test_logs
WHERE ingested_at < NOW() - INTERVAL '90 days'
    AND processed = true;
```

---

## Troubleshooting

### Issue: Logs not appearing in Supabase

**Check**:
1. Environment variables set correctly
2. Service role key has write permissions
3. Network connectivity from CI to Supabase
4. Check logs: `logs/test-execution.log`

**Debug**:
```javascript
// Enable debug logging
logger.level = 'debug';

// Check Supabase connection
const { data, error } = await supabase
  .from('raw_test_logs')
  .select('count');
console.log('Connection test:', data, error);
```

### Issue: Dashboard queries slow

**Check**:
1. Indexes exist: `SELECT * FROM pg_indexes WHERE schemaname = 'public';`
2. Use EXPLAIN ANALYZE: `EXPLAIN ANALYZE SELECT * FROM v_execution_timeline LIMIT 50;`
3. Refresh materialized views
4. Check table statistics: `ANALYZE test_runs; ANALYZE journeys; ANALYZE steps;`

### Issue: RLS blocking queries

**Check**:
1. Using correct API key (anon key for frontend)
2. RLS policies enabled: `SELECT * FROM pg_policies;`
3. User authenticated (if required)

**Debug**:
```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Test query with error handling
const { data, error } = await supabase
  .from('test_runs')
  .select('*')
  .limit(1);
console.log('Query result:', data, error);
```

---

## Next Steps

1. **Deploy Schema**: Run `supabase/schema.sql` in Supabase SQL Editor
2. **Configure CI**: Set environment variables in Jenkins
3. **Test Integration**: Run test suite and verify logs in Supabase
4. **Build Dashboard**: Use React query examples from `supabase/react-queries.md`
5. **Monitor**: Set up health checks and materialized view refresh

---

**Last Updated**: January 8, 2026  
**Version**: 2.0.0  
**Maintained By**: FNP Automation Team
