# Testing Guide - Supabase Integration

## Quick Start

### 1. Start the Dashboard
```bash
npm run dev
# Dashboard will be available at http://localhost:5173
```

### 2. Access the Dashboard
Open your browser and navigate to:
```
http://localhost:5173
```

### 3. Verify Data Loading
The dashboard should automatically fetch and display:
- Latest test run statistics
- Journey breakdown by platform
- Module-level test results
- Success/failure metrics

## Testing Scenarios

### Scenario 1: Fresh Dashboard Load
**Expected Behavior:**
1. Dashboard loads with FNP branding
2. API calls to `/api/test-results` fetch latest Supabase data
3. Platform cards show real journey counts
4. Modules section displays actual journey names
5. Charts render with real data

**Verification:**
- Open browser DevTools → Network tab
- Look for successful API calls to `/api/test-results`
- Check Console for any errors
- Verify data matches Supabase database

### Scenario 2: Platform Tab Switching
**Expected Behavior:**
1. Click different platform tabs (Desktop, Mobile, Android, OMS)
2. Modules section updates with platform-specific data
3. Charts refresh with new data
4. No errors in console

**Verification:**
- All platforms show the same journeys (current implementation)
- Module cards display journey names correctly
- Pass/fail counts are accurate

### Scenario 3: Data Refresh
**Expected Behavior:**
1. Click "Refresh Data" button
2. Loading indicator appears
3. Fresh data fetched from Supabase
4. Dashboard updates with latest results

**Verification:**
- Network tab shows new API calls
- Timestamps update to latest execution
- Metrics reflect current database state

### Scenario 4: No Data Available
**Expected Behavior:**
1. If no data in Supabase, dashboard falls back to mock data
2. Console shows warning message
3. Dashboard still functional with sample data

**Verification:**
- Check console for "Error fetching latest run" message
- Dashboard displays mock data gracefully
- No crashes or blank screens

## API Endpoint Testing

### Test All Endpoints

```bash
# 1. Get all test results
curl http://localhost:5173/api/test-results | jq

# 2. Get platform-specific results
curl http://localhost:5173/api/test-results/desktop | jq

# 3. Get test run history
curl http://localhost:5173/api/test-runs?limit=5 | jq

# 4. Get health metrics
curl http://localhost:5173/api/health?framework=playwright&environment=dev | jq
```

### Expected Responses

#### /api/test-results
```json
{
  "desktop": {
    "total": 19,
    "passed": 17,
    "failed": 2,
    "skipped": 0,
    "duration": 4500,
    "lastRun": "2026-01-10T...",
    "modules": [
      {
        "name": "Home Page Exploration",
        "passed": 9,
        "failed": 0,
        "duration": 330
      }
    ]
  }
}
```


#### /api/test-runs
```json
[
  {
    "run_id": "550e8400-e29b-41d4-a716-446655440000",
    "framework": "playwright",
    "suite_name": "FNP Automation Framework",
    "environment": "dev",
    "executed_at": "2026-01-10T10:30:00.000Z",
    "total_journeys": 19,
    "passed_journeys": 17,
    "failed_journeys": 2,
    "success_rate": 95.14
  }
]
```

## Integration Testing with Playwright

### Step 1: Run Playwright Tests
```bash
cd "playwright_automation 1"
npm test
```

### Step 2: Verify Data in Supabase
1. Go to https://wnymknrycmldwqzdqoct.supabase.co
2. Navigate to Table Editor
3. Check `test_runs` table for new entries
4. Verify `journeys` and `steps` tables populated

### Step 3: Refresh Dashboard
1. Click "Refresh Data" button in dashboard
2. Verify new test run appears
3. Check journey counts updated
4. Confirm timestamps are recent

## Data Validation Checklist

### ✅ Test Run Data
- [ ] `run_id` is valid UUID
- [ ] `framework` is "playwright"
- [ ] `environment` matches test environment
- [ ] `total_journeys` matches actual journey count
- [ ] `passed_journeys` + `failed_journeys` + `skipped_journeys` = `total_journeys`
- [ ] `success_rate` is between 0-100
- [ ] `executed_at` is recent timestamp

### ✅ Journey Data
- [ ] Each journey has unique `journey_id`
- [ ] `journey_number` is sequential (1, 2, 3...)
- [ ] `journey_name` is descriptive
- [ ] `status` is PASSED, FAILED, or SKIPPED
- [ ] `duration_ms` is positive number
- [ ] Failed journeys have `error_message`
- [ ] `total_steps` = `passed_steps` + `failed_steps`

### ✅ Step Data
- [ ] Each step has unique `step_id`
- [ ] `step_number` is sequential within journey
- [ ] `step_name` is descriptive
- [ ] `status` is PASSED, FAILED, or SKIPPED
- [ ] `duration_ms` is positive number
- [ ] Failed steps have `error_type` and `error_message`
- [ ] `api_calls` is valid JSON array (if present)

## Performance Testing

### Load Time Benchmarks
- **Initial Load**: < 2 seconds
- **API Response**: < 500ms
- **Data Refresh**: < 1 second
- **Platform Switch**: < 300ms

### Optimization Checks
- [ ] Supabase queries use indexes
- [ ] API responses are cached (if applicable)
- [ ] Large datasets are paginated
- [ ] Images/assets are optimized

## Troubleshooting

### Issue: Dashboard shows mock data
**Cause**: No real data in Supabase or connection error

**Solution**:
1. Check Supabase connection in browser console
2. Verify Playwright tests have run
3. Check API endpoint responses
4. Review Supabase RLS policies

### Issue: Journeys not displaying
**Cause**: Data transformation error or missing journeys

**Solution**:
1. Check console for transformation errors
2. Verify journey data exists in Supabase
3. Review API response structure
4. Check journey mapping logic

### Issue: Incorrect counts
**Cause**: Data aggregation mismatch

**Solution**:
1. Verify database constraints
2. Check summary calculation logic
3. Review step counting in journeys
4. Ensure data consistency in Supabase

### Issue: Slow performance
**Cause**: Large dataset or missing indexes

**Solution**:
1. Add pagination to API endpoints
2. Verify Supabase indexes exist
3. Use materialized views for aggregations
4. Implement client-side caching

## Browser Compatibility

### Tested Browsers
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Mobile Testing
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Responsive design (320px - 1920px)

## Automated Testing (Future)

### Unit Tests
```typescript
// Example test structure
describe('Supabase Integration', () => {
  test('fetches latest test run', async () => {
    const data = await fetchLatestTestRun();
    expect(data).toBeDefined();
    expect(data.latestRun).toHaveProperty('run_id');
  });
});
```

### Integration Tests
```typescript
describe('API Endpoints', () => {
  test('GET /api/test-results returns valid data', async () => {
    const response = await fetch('/api/test-results');
    const data = await response.json();
    expect(data).toHaveProperty('desktop');
    expect(data.desktop).toHaveProperty('total');
  });
});
```

## Monitoring

### Key Metrics to Track
1. **API Response Times**
   - Average: < 500ms
   - P95: < 1000ms
   - P99: < 2000ms

2. **Error Rates**
   - API errors: < 1%
   - Supabase connection errors: < 0.1%
   - Data transformation errors: 0%

3. **Data Freshness**
   - Latest test run age: < 1 hour
   - Dashboard refresh rate: On-demand
   - Supabase sync delay: < 5 seconds

## Success Criteria

### ✅ Integration Complete When:
1. Dashboard loads without errors
2. Real Supabase data displays correctly
3. All API endpoints return valid responses
4. Journey and step details are accurate
5. Platform switching works smoothly
6. Data refresh updates correctly
7. Error handling is graceful
8. Performance meets benchmarks
9. Documentation is complete
10. Testing scenarios pass

---

**Testing Status**: ✅ Ready for Testing
**Last Updated**: January 10, 2026
**Next Steps**: Run Playwright tests and verify dashboard updates
