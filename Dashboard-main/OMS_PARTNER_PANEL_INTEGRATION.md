# OMS & Partner Panel Dashboard Integration

## Overview

This document describes the integration of OMS (Order Management System) and Partner Panel data fetching into the Sentinel Dashboard, similar to how Desktop Site data is currently fetched from Supabase.

## Implementation Summary

### What Was Added

1. **Enhanced Test Data Service** (`src/services/testDataService.ts`)
   - Added functions to fetch OMS and Partner Panel data from Supabase
   - Added system health metrics fetching
   - Added correlated runs fetching (OMS + Partner Panel from same execution)
   - Added tab performance analysis
   - Added recent failures tracking
   - Includes fallback manual queries if database functions don't exist

2. **New API Endpoints** (`src/index.tsx`)
   - `/api/system-health` - Get health metrics for OMS and Partner Panel
   - `/api/correlated-runs` - Get OMS and Partner Panel runs from same execution
   - `/api/tab-performance/:system` - Get tab performance for OMS or Partner Panel
   - `/api/recent-failures` - Get recent failures for both systems
   - Enhanced `/api/test-results` to include real OMS and Partner Panel data
   - Enhanced `/api/test-results/:platform` to support OMS and Partner Panel

3. **Database Functions** (`supabase-functions.sql`)
   - `get_system_health_24h()` - System health for last 24 hours
   - `get_correlated_runs()` - Correlated OMS + Partner Panel runs
   - `get_tab_performance()` - Tab performance metrics
   - `get_recent_failures()` - Recent failure analysis

## Data Flow

### Current Implementation
- **Desktop Site**: Real Supabase data ✅
- **Mobile Site**: Mock data (unchanged)
- **OMS**: Real Supabase data ✅ (NEW)
- **Partner Panel**: Real Supabase data ✅ (NEW - mapped to "android" tab)
- **iOS**: Mock data (unchanged)

### Data Sources

1. **OMS Data**: Fetched from `test_runs` table where `metadata->>'system' = 'OMS'`
2. **Partner Panel Data**: Fetched from `test_runs` table where `metadata->>'system' = 'PARTNER_PANEL'`
3. **Correlated Data**: Links OMS and Partner Panel runs using `master_execution_id`

## Database Schema Requirements

The implementation expects the following Supabase database structure (as described in your documentation):

### Tables
- `test_runs` - Run-level summary with system metadata
- `journeys` - Journey-level details
- `steps` - Step-level details with timing and error information
- `raw_test_logs` - Raw JSON payloads (optional, used as fallback)

### Key Metadata Fields
```json
{
  "system": "OMS" | "PARTNER_PANEL",
  "readable_run_id": "OMS-1736697600000-abc123",
  "master_execution_id": "EXEC-1736697600000-xyz789",
  "total_tabs_tested": "11"
}
```

## Setup Instructions

### 1. Database Functions (Optional but Recommended)
Run the SQL functions in `supabase-functions.sql` in your Supabase SQL Editor:

```bash
# Copy the contents of supabase-functions.sql and run in Supabase SQL Editor
```

### 2. Test the Integration
The dashboard will automatically fetch OMS and Partner Panel data when:
- Data exists in the `test_runs` table with appropriate `metadata->>'system'` values
- The Supabase connection is properly configured

### 3. Verify Data
Check that your test automation is logging data with the correct system identifiers:
- OMS runs should have `metadata.system = "OMS"`
- Partner Panel runs should have `metadata.system = "PARTNER_PANEL"`
- Both should include `master_execution_id` for correlation

## API Usage Examples

### Get System Health
```javascript
fetch('/api/system-health')
  .then(response => response.json())
  .then(data => {
    // data contains health metrics for OMS and PARTNER_PANEL
    console.log(data);
  });
```

### Get OMS Data
```javascript
fetch('/api/test-results/oms')
  .then(response => response.json())
  .then(omsData => {
    // Real OMS data with journeys and steps
    console.log(omsData.modules); // Journey details
  });
```

### Get Partner Panel Data
```javascript
fetch('/api/test-results/android') // Partner Panel mapped to android tab
  .then(response => response.json())
  .then(ppData => {
    // Real Partner Panel data with journeys and steps
    console.log(ppData.modules); // Journey details
  });
```

### Get Correlated Runs
```javascript
fetch('/api/correlated-runs?limit=10')
  .then(response => response.json())
  .then(correlatedRuns => {
    // OMS and Partner Panel runs from same execution
    correlatedRuns.forEach(execution => {
      console.log(`Execution: ${execution.master_execution_id}`);
      console.log(`OMS: ${execution.oms_status} (${execution.oms_success_rate}%)`);
      console.log(`PP: ${execution.pp_status} (${execution.pp_success_rate}%)`);
    });
  });
```

### Get Tab Performance
```javascript
// OMS tab performance
fetch('/api/tab-performance/OMS?days=7')
  .then(response => response.json())
  .then(tabData => {
    tabData.forEach(tab => {
      console.log(`${tab.tab_name}: ${tab.avg_load_time_ms}ms average`);
    });
  });

// Partner Panel tab performance
fetch('/api/tab-performance/PARTNER_PANEL?days=7')
  .then(response => response.json())
  .then(tabData => {
    tabData.forEach(tab => {
      console.log(`${tab.tab_name}: ${tab.avg_load_time_ms}ms average`);
    });
  });
```

## Dashboard UI Integration

The dashboard tabs now show:
- **Desktop Site**: Real Supabase data (existing)
- **Mobile Site**: Mock data (existing)
- **OMS**: Real OMS data from Supabase (NEW)
- **Partner Panel**: Real Partner Panel data from Supabase (NEW - shown in "Android" tab)
- **Android**: Mock data (moved to iOS tab)

## Data Format

The OMS and Partner Panel data follows the same format as Desktop Site data:

```javascript
{
  total: 12,                    // Total journeys
  passed: 10,                   // Passed journeys
  failed: 2,                    // Failed journeys
  skipped: 0,                   // Skipped journeys
  totalSteps: 156,              // Total steps across all journeys
  passedSteps: 142,             // Passed steps
  failedSteps: 14,              // Failed steps
  successRate: 91.0,            // Success rate percentage
  duration: 1678,               // Total runtime in seconds
  durationFormatted: "27m 58s", // Formatted duration
  lastRun: "2026-01-12T10:30:00Z", // Last execution timestamp
  buildNumber: "123",           // Build number (if available)
  reportUrl: "https://...",     // Report URL (if available)
  environment: "prod",          // Environment
  modules: [                    // Journey details with steps
    {
      journeyNumber: 1,
      name: "Order Management",
      status: "PASSED",
      statusIcon: "✅",
      totalSteps: 28,
      passed: 26,
      failed: 2,
      duration: 345,
      durationFormatted: "5m 45s",
      failureReason: null,
      errorType: null,
      errorMessage: null,
      steps: [                  // Individual step details
        {
          stepNumber: 1,
          name: "Login to OMS",
          status: "PASSED",
          statusIcon: "✅",
          duration: 2500,
          durationFormatted: "2.5s",
          timestamp: "2026-01-12T10:30:01Z",
          errorType: null,
          errorMessage: null,
          apiCalls: []
        }
        // ... more steps
      ]
    }
    // ... more journeys
  ],
  overallStatus: "ISSUES DETECTED ❌", // Overall status
  isSuccess: false              // Boolean success indicator
}
```

## Error Handling

The implementation includes comprehensive error handling:
- Falls back to manual queries if database functions don't exist
- Falls back to mock data if Supabase data is unavailable
- Logs errors to console for debugging
- Gracefully handles missing or malformed data

## Performance Considerations

- Database functions are optimized for performance
- Manual fallback queries include appropriate indexes
- Data is fetched only when needed
- Results can be cached at the API level if needed

## Monitoring and Debugging

### Check Data Availability
```sql
-- Check if OMS data exists
SELECT COUNT(*) FROM test_runs WHERE metadata->>'system' = 'OMS';

-- Check if Partner Panel data exists  
SELECT COUNT(*) FROM test_runs WHERE metadata->>'system' = 'PARTNER_PANEL';

-- Check recent runs
SELECT 
  metadata->>'system' as system,
  metadata->>'readable_run_id' as run_id,
  executed_at,
  success_rate
FROM test_runs 
WHERE metadata->>'system' IN ('OMS', 'PARTNER_PANEL')
ORDER BY executed_at DESC 
LIMIT 10;
```

### Debug API Endpoints
- Check browser console for error messages
- Verify Supabase connection and permissions
- Test API endpoints directly: `/api/system-health`, `/api/test-results/oms`, etc.

## Next Steps

1. **Deploy the Changes**: Deploy the updated dashboard code
2. **Run Database Functions**: Execute the SQL functions in Supabase
3. **Verify Data Flow**: Ensure OMS and Partner Panel tests are logging to Supabase correctly
4. **Test Dashboard**: Verify that real data appears in the OMS and Partner Panel tabs
5. **Monitor Performance**: Watch for any performance issues with the new queries

## Troubleshooting

### No OMS/Partner Panel Data Showing
1. Check if test automation is logging with correct `metadata.system` values
2. Verify Supabase connection and permissions
3. Check browser console for API errors
4. Test database queries directly in Supabase SQL Editor

### Performance Issues
1. Ensure database indexes exist on frequently queried columns
2. Consider adding caching at the API level
3. Monitor Supabase query performance

### Data Format Issues
1. Verify that journey and step data follows expected schema
2. Check that metadata fields are properly populated
3. Ensure step timing and error information is captured correctly

This integration provides the same rich, detailed view for OMS and Partner Panel that currently exists for Desktop Site, enabling comprehensive monitoring and analysis across all three systems.