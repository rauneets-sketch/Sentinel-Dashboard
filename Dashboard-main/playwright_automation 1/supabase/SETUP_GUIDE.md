# Supabase Setup Guide
## Complete Step-by-Step Installation

This guide walks you through setting up the complete Supabase-based logging infrastructure for the FNP Automation Framework.

---

## Prerequisites

- Supabase account (free tier works)
- Node.js 18+ installed
- Jenkins or CI/CD pipeline access
- Basic SQL knowledge

---

## Step 1: Create Supabase Project

1. **Sign up for Supabase**:
   - Go to https://supabase.com
   - Click "Start your project"
   - Sign in with GitHub/Google

2. **Create New Project**:
   - Click "New Project"
   - Organization: Select or create
   - Project Name: `fnp-automation-logs`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your CI server
   - Pricing Plan: Free tier is sufficient for testing

3. **Wait for Project Setup**:
   - Takes 2-3 minutes
   - Project will show "Active" when ready

---

## Step 2: Get API Keys

1. **Navigate to Project Settings**:
   - Click Settings (gear icon) in sidebar
   - Go to "API" section

2. **Copy Keys**:
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Security Notes**:
   - `anon public`: Safe for frontend (read-only with RLS)
   - `service_role`: Full access, use in CI only (never commit!)

---

## Step 3: Run Database Schema

1. **Open SQL Editor**:
   - Click "SQL Editor" in Supabase sidebar
   - Click "New query"

2. **Copy Schema**:
   - Open `supabase/schema.sql` from this repo
   - Copy entire contents (all ~1000 lines)

3. **Execute Schema**:
   - Paste into SQL Editor
   - Click "Run" (or Ctrl+Enter)
   - Wait for completion (~10-15 seconds)

4. **Verify Tables Created**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   
   Expected tables:
   - `raw_test_logs`
   - `test_runs`
   - `journeys`
   - `steps`
   - `health_scores`

5. **Verify Views Created**:
   ```sql
   SELECT table_name 
   FROM information_schema.views 
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   
   Expected views:
   - `v_execution_timeline`
   - `v_daily_metrics`
   - `v_journey_health_heatmap`
   - `v_step_performance_heatmap`
   - `v_realtime_health`
   - `v_failure_hotspots`
   - `v_performance_trends`
   - `v_latest_test_runs`
   - `v_journey_failure_analysis`
   - `v_framework_comparison`
   - `mv_journey_reliability` (materialized view)

6. **Verify RLS Policies**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```
   
   Should see read-only policies for all tables.

---

## Step 4: Configure CI Pipeline (Jenkins)

1. **Add Environment Variables**:
   
   **Jenkins Credentials**:
   - Go to Jenkins → Manage Jenkins → Credentials
   - Add "Secret text" credentials:
     - ID: `SUPABASE_URL`
     - Secret: Your Supabase project URL
     - ID: `SUPABASE_KEY`
     - Secret: Your service_role key

2. **Update Jenkinsfile**:
   ```groovy
   environment {
       ENV = 'prod'
       SUPABASE_URL = credentials('SUPABASE_URL')
       SUPABASE_KEY = credentials('SUPABASE_KEY')
       REPORT_URL = "https://fnp-test-reports.s3.us-east-1.amazonaws.com/latest-report/index.html"
   }
   ```

3. **Or Use Environment Variables** (less secure):
   ```bash
   export SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
   export SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   export ENV="prod"
   export REPORT_URL="https://fnp-test-reports.s3.us-east-1.amazonaws.com/latest-report/index.html"
   ```

---

## Step 5: Install Dependencies

1. **Update package.json**:
   Already done! The `@supabase/supabase-js` dependency is included.

2. **Install**:
   ```bash
   npm install
   ```

3. **Verify Installation**:
   ```bash
   npm list @supabase/supabase-js
   ```

---

## Step 6: Test Integration

### 6.1 Test Supabase Connection

Create a test script `test-supabase-connection.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log(`   URL: ${supabaseUrl}`);
    
    // Test read access
    const { data, error } = await supabase
      .from('raw_test_logs')
      .select('count');
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Connection successful!');
    console.log(`   Current log count: ${data[0]?.count || 0}`);
    
    // Test write access
    console.log('\n🔍 Testing write access...');
    const testLog = {
      raw_payload: { test: true },
      run_id: '00000000-0000-0000-0000-000000000000',
      framework: 'test',
      environment: 'test',
      executed_at: new Date().toISOString(),
      ingestion_source: 'test',
      processed: false
    };
    
    const { data: writeData, error: writeError } = await supabase
      .from('raw_test_logs')
      .insert(testLog)
      .select();
    
    if (writeError) {
      console.error('❌ Write failed:', writeError.message);
      process.exit(1);
    }
    
    console.log('✅ Write successful!');
    console.log(`   Test log ID: ${writeData[0].log_id}`);
    
    // Clean up test log
    await supabase
      .from('raw_test_logs')
      .delete()
      .eq('log_id', writeData[0].log_id);
    
    console.log('✅ Cleanup successful!');
    console.log('\n🎉 All tests passed! Supabase is ready to use.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

testConnection();
```

Run the test:
```bash
node test-supabase-connection.js
```

### 6.2 Test with Example Payload

Create a test script `test-supabase-ingestion.js`:

```javascript
const { supabaseLogger } = require('./src/main/services/SupabaseLogger');
const examplePayload = require('./supabase/example-payload.json');

async function testIngestion() {
  try {
    console.log('📊 Testing Supabase ingestion with example payload...');
    
    if (!supabaseLogger.isEnabled()) {
      console.error('❌ SupabaseLogger is not enabled. Check environment variables.');
      process.exit(1);
    }
    
    // Ingest example payload
    const logId = await supabaseLogger.ingestRawLog(examplePayload, 'test');
    
    if (logId) {
      console.log(`✅ Ingestion successful! Log ID: ${logId}`);
      console.log('   Check Supabase dashboard to verify data.');
    } else {
      console.error('❌ Ingestion failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testIngestion();
```

Run the test:
```bash
node test-supabase-ingestion.js
```

### 6.3 Verify in Supabase Dashboard

1. **Check Raw Logs**:
   - Go to Supabase → Table Editor
   - Select `raw_test_logs` table
   - Should see your test log

2. **Check Normalized Tables**:
   - Check `test_runs` table (should have 1 row)
   - Check `journeys` table (should have 3 rows from example)
   - Check `steps` table (should have multiple rows)

3. **Test Views**:
   ```sql
   -- Check execution timeline
   SELECT * FROM v_execution_timeline LIMIT 10;
   
   -- Check journey health
   SELECT * FROM v_journey_health_heatmap LIMIT 10;
   
   -- Check failure hotspots
   SELECT * FROM v_failure_hotspots LIMIT 10;
   ```

---

## Step 7: Run Full Test Suite

1. **Run Tests**:
   ```bash
   npm test
   ```

2. **Monitor Logs**:
   ```bash
   tail -f logs/test-execution.log
   ```

3. **Look for Supabase Logs**:
   ```
   📊 SupabaseLogger: Initialized successfully
   📊 SupabaseLogger: Ingesting raw test log...
   ✅ SupabaseLogger: Raw log ingested with ID: xxx
   📊 SupabaseLogger: Processing raw log into normalized tables...
   ✅ SupabaseLogger: Raw log processed successfully
   ```

4. **Verify in Supabase**:
   - Check `raw_test_logs` for new entry
   - Check `test_runs` for execution summary
   - Check `journeys` and `steps` for details

---

## Step 8: Setup React Dashboard

### 8.1 Create React App

```bash
npx create-react-app fnp-health-dashboard
cd fnp-health-dashboard
npm install @supabase/supabase-js chart.js react-chartjs-2
```

### 8.2 Configure Environment

Create `.env`:
```bash
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 8.3 Create Supabase Client

Create `src/supabaseClient.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 8.4 Use Query Examples

Refer to `supabase/react-queries.md` for complete examples.

Quick example:
```javascript
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function Dashboard() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    const { data } = await supabase
      .from('v_realtime_health')
      .select('*')
      .eq('framework', 'playwright')
      .eq('environment', 'prod')
      .single();
    
    setHealth(data);
  }

  return (
    <div>
      <h1>FNP Automation Health</h1>
      {health && (
        <div>
          <p>Success Rate: {health.avg_success_rate.toFixed(2)}%</p>
          <p>Runs (24h): {health.runs_last_24h}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Step 9: Setup Automated Maintenance

### 9.1 Refresh Materialized Views

Create a cron job or scheduled function:

```sql
-- Create function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_journey_reliability;
    -- Add more materialized views here as needed
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron (if available) or external cron
-- Example: Refresh every hour
-- SELECT cron.schedule('refresh-mv', '0 * * * *', 'SELECT refresh_all_materialized_views()');
```

### 9.2 Compute Health Scores

Create a scheduled job to compute daily health scores:

```sql
-- Compute health scores for yesterday
SELECT compute_health_scores(
    'playwright',
    'prod',
    'daily',
    DATE_TRUNC('day', NOW() - INTERVAL '1 day'),
    DATE_TRUNC('day', NOW())
);
```

### 9.3 Archive Old Logs (Optional)

If storage becomes an issue (unlikely with free tier):

```sql
-- Archive logs older than 90 days
-- WARNING: Only do this if you're sure you don't need the data
DELETE FROM raw_test_logs
WHERE ingested_at < NOW() - INTERVAL '90 days'
    AND processed = true;
```

---

## Troubleshooting

### Issue: "Missing SUPABASE_URL or SUPABASE_KEY"

**Solution**:
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_KEY

# Set them if missing
export SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
export SUPABASE_KEY="your-service-role-key"
```

### Issue: "Failed to ingest raw log"

**Check**:
1. Network connectivity to Supabase
2. Service role key is correct
3. Schema is deployed correctly
4. Check logs: `logs/test-execution.log`

**Debug**:
```javascript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';
```

### Issue: "RLS policy violation"

**Solution**:
- Make sure you're using service_role key in CI (not anon key)
- Verify RLS policies are created:
  ```sql
  SELECT * FROM pg_policies WHERE schemaname = 'public';
  ```

### Issue: "Slow dashboard queries"

**Check**:
1. Indexes exist:
   ```sql
   SELECT * FROM pg_indexes WHERE schemaname = 'public';
   ```

2. Refresh materialized views:
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_journey_reliability;
   ```

3. Analyze tables:
   ```sql
   ANALYZE test_runs;
   ANALYZE journeys;
   ANALYZE steps;
   ```

---

## Verification Checklist

- [ ] Supabase project created
- [ ] API keys copied and secured
- [ ] Database schema deployed
- [ ] Tables created (5 tables)
- [ ] Views created (11 views)
- [ ] RLS policies enabled
- [ ] CI environment variables set
- [ ] Dependencies installed
- [ ] Connection test passed
- [ ] Example payload ingested
- [ ] Full test suite run
- [ ] Data visible in Supabase
- [ ] React dashboard configured
- [ ] Dashboard queries working

---

## Next Steps

1. **Monitor First Few Runs**: Watch logs and Supabase dashboard
2. **Build Dashboard**: Use query examples to build visualizations
3. **Setup Alerts**: Configure Supabase webhooks for failures
4. **Optimize**: Add more indexes if needed
5. **Scale**: Upgrade Supabase plan if needed (unlikely)

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Framework Issues**: Check `logs/test-execution.log`

---

**Last Updated**: January 8, 2026  
**Version**: 2.0.0  
**Maintained By**: FNP Automation Team
