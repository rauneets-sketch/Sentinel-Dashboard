# Supabase Integration - Dashboard

## Overview

This dashboard fetches real test execution data from Supabase **ONLY for the Desktop Site platform**. All other platforms (Mobile, Android, OMS, iOS) continue to use mock data.

## Data Distribution

| Platform | Data Source | Description |
|----------|-------------|-------------|
| **Desktop Site** | ✅ Supabase | Real Playwright automation data |
| Mobile Site | Mock Data | Sample test results |
| Android | Mock Data | Sample test results |
| OMS | Mock Data | Sample test results |
| iOS | Mock Data | Coming Soon |

## Architecture

```
Playwright Tests → SupabaseLogger → Supabase Database → Dashboard API → Desktop Site UI
                                                                      → Mock Data → Other Platforms
```

### Data Flow

1. **Playwright Automation** (`playwright_automation 1/`)
   - Executes test journeys and steps
   - Tracks execution data via `StepTracker` and `ApiResponseTracker`
   - Collects data via `ExecutionDataCollector`
   - Sends to Supabase via `SupabaseLogger`

2. **Supabase Database**
   - **Tables**: `raw_test_logs`, `test_runs`, `journeys`, `steps`, `health_scores`
   - **Views**: Pre-computed aggregations for dashboard performance
   - **Connection**: `https://wnymknrycmldwqzdqoct.supabase.co`

3. **Dashboard Backend** (`src/index.tsx`)
   - Fetches data from Supabase using `@supabase/supabase-js`
   - Transforms data to dashboard format
   - Provides REST API endpoints

4. **Dashboard Frontend**
   - Displays test results, journeys, and steps
   - Shows real-time health metrics
   - Supports multiple platforms (Desktop, Mobile, Android, OMS)

## Database Schema

### test_runs
- Complete test execution metadata
- Success rates, timing, build information
- Links to journeys and steps

### journeys
- Individual test scenarios (e.g., "Home Page Exploration")
- Status (PASSED/FAILED/SKIPPED)
- Duration, error details
- Links to steps

### steps
- Individual test steps within journeys
- Execution timing, status
- API call tracking
- Error details with stack traces

## API Endpoints

### GET /api/test-results
Fetches the latest test run. **Desktop Site uses Supabase data, other platforms use mock data.**

**Response:**
```json
{
  "desktop": {
    "total": 19,
    "passed": 17,
    "failed": 2,
    "skipped": 0,
    "duration": 4500,
    "lastRun": "2026-01-10T...",
    "modules": [...]  // Real journeys from Playwright
  },
  "mobile": {...},    // Mock data
  "android": {...},   // Mock data
  "oms": {...},       // Mock data
  "ios": {...}        // Mock data
}
```


### GET /api/test-results/:platform
Fetches test results for a specific platform.
- **Desktop**: Returns real Supabase data
- **Other platforms**: Returns mock data

### GET /api/journey/:journeyId
Fetches detailed information about a specific journey including all steps.
**Note**: This endpoint is for Desktop Site journeys only.

**Response:**
```json
{
  "journey": {
    "journey_id": "...",
    "journey_name": "Home Page Exploration",
    "status": "PASSED",
    "duration_ms": 330000,
    ...
  },
  "steps": [
    {
      "step_number": 1,
      "step_name": "Navigate to Login Page",
      "status": "PASSED",
      "duration_ms": 3000,
      ...
    }
  ]
}
```

### GET /api/test-runs?limit=10
Fetches recent test runs (default: 10 most recent).

### GET /api/health?framework=playwright&environment=dev
Fetches real-time health metrics from the last 24 hours.

## Configuration

### Supabase Connection
The dashboard connects to Supabase using:
- **URL**: `https://wnymknrycmldwqzdqoct.supabase.co`
- **Anon Key**: Configured in `src/lib/supabase.ts`
- **Access**: Read-only via Row Level Security (RLS)

### Environment Variables
No environment variables needed - credentials are hardcoded for this specific Supabase instance.

## Data Mapping

### Journey Mapping
The dashboard maps Playwright journeys to platform modules:

| Journey Number | Journey Name | Platform |
|---------------|--------------|----------|
| 1 | Home Page Exploration | All |
| 2 | Payment Methods Testing | All |
| 3 | International Phone Change | All |
| 8 | ADD-On Testing on PDP | All |
| 20 | Gmail OTP Login | All |
| ... | ... | ... |

### Status Mapping
- **PASSED** → Green indicators, success metrics
- **FAILED** → Red indicators, failure analysis
- **SKIPPED** → Gray indicators, skipped count

### Timing Conversion
- Database stores milliseconds (`duration_ms`)
- Dashboard displays seconds (divided by 1000)
- Runtime displayed in minutes for test runs

## Features

### ✅ Implemented
1. **Real-time Data Fetching**
   - Latest test run with all journeys
   - Journey-level details with steps
   - Historical test runs

2. **Data Transformation**
   - Supabase format → Dashboard format
   - Multiple platform support
   - Proper status and timing mapping

3. **Error Handling**
   - Graceful fallback to mock data
   - Console error logging
   - 404/500 error responses

4. **API Endpoints**
   - Test results (all platforms)
   - Platform-specific results
   - Journey details
   - Test run history
   - Health metrics

### 🔄 Data Refresh
The dashboard automatically refreshes data when:
- User clicks "Refresh Data" button
- Page is loaded/reloaded
- Platform tab is switched

### 📊 Supported Metrics
- Total journeys/tests
- Pass/fail/skip counts
- Success rate percentage
- Execution duration
- Last run timestamp
- Module-level breakdown
- Step-level details

## Testing the Integration

### 1. Verify Supabase Connection
```bash
# Check if data exists in Supabase
curl https://wnymknrycmldwqzdqoct.supabase.co/rest/v1/test_runs?limit=1 \
  -H "apikey: YOUR_ANON_KEY"
```

### 2. Test Dashboard API
```bash
# Start the dashboard
npm run dev

# Test endpoints
curl http://localhost:3000/api/test-results
curl http://localhost:3000/api/test-runs?limit=5
curl http://localhost:3000/api/health
```

### 3. Run Playwright Tests
```bash
cd "playwright_automation 1"
npm test

# Data will be automatically sent to Supabase
# Dashboard will show updated results on next refresh
```

## Troubleshooting

### No Data Showing
1. Check if Playwright tests have run and sent data to Supabase
2. Verify Supabase connection in browser console
3. Check API endpoint responses for errors
4. Ensure RLS policies allow read access

### Incorrect Data Format
1. Check data transformation in `src/index.tsx`
2. Verify journey/step mapping logic
3. Review console logs for transformation errors

### Performance Issues
1. Supabase queries are optimized with indexes
2. Views pre-compute aggregations
3. Limit query results with `limit` parameter
4. Consider caching for frequently accessed data

## Future Enhancements

### Planned Features
1. **Real-time Updates**
   - WebSocket connection for live data
   - Auto-refresh on new test completion

2. **Advanced Filtering**
   - Filter by date range
   - Filter by status (passed/failed)
   - Filter by journey name

3. **Detailed Analytics**
   - Trend charts over time
   - Failure analysis
   - Performance heatmaps

4. **Step-Level Visualization**
   - Expandable journey cards
   - Step timeline view
   - API call details

5. **Multi-Environment Support**
   - Switch between dev/uat/prod
   - Compare environments
   - Environment-specific metrics

## Related Files

### Dashboard
- `src/index.tsx` - Main API and UI
- `src/lib/supabase.ts` - Supabase client configuration
- `src/services/testDataService.ts` - Data fetching service

### Playwright Automation (Read-Only)
- `playwright_automation 1/src/main/services/SupabaseLogger.js`
- `playwright_automation 1/src/main/services/ExecutionDataCollector.js`
- `playwright_automation 1/supabase/schema.sql`
- `playwright_automation 1/supabase/example-payload.json`

## Support

For issues or questions:
1. Check console logs for errors
2. Verify Supabase connection
3. Review API endpoint responses
4. Check Playwright automation logs

---

**Last Updated**: January 10, 2026
**Status**: ✅ Production Ready
**Integration**: Complete
