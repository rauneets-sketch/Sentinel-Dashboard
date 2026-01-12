# FNP Sentinel Dashboard

## Project Overview

- **Name**: FNP Sentinel (formerly FNP Pulse)
- **Goal**: Unified automation testing dashboard integrated with Supabase for real-time Playwright test results
- **Features**:
  - **✅ Real-time Supabase Integration**: Fetches live test execution data
  - **✅ Journey & Step Tracking**: Detailed view of test journeys and individual steps
  - **✅ Multi-Platform Support**: Desktop, Mobile, Android, OMS, iOS
  - **✅ Health Metrics**: Success rates, execution times, failure analysis
  - Interactive 3D charts and graphs
  - User-friendly interface designed for non-technical users
  - Module-level test breakdown
  - Success rate analytics

## 🔗 Supabase Integration (NEW)

The dashboard is now connected to a live Supabase database that receives test execution data from the Playwright automation framework.

### Data Flow
```
Playwright Tests → SupabaseLogger → Supabase DB → Dashboard API → React UI
```

### Key Features
- **Real-time Data**: Fetches latest test runs from Supabase
- **Journey Tracking**: Maps Playwright journeys to dashboard modules
- **Step-Level Details**: Shows individual test steps with timing and status
- **Error Tracking**: Displays failure reasons and error messages
- **API Call Tracking**: Monitors API calls made during test execution

### Database Tables
- `test_runs`: High-level test execution metadata
- `journeys`: Individual test scenarios (e.g., "Home Page Exploration")
- `steps`: Step-level execution details with API calls
- `health_scores`: Pre-computed health metrics

### Documentation
- **Integration Guide**: [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Playwright Automation**: `playwright_automation 1/` (Read-Only Reference)

## 🌐 URLs

- **Development**: https://3000-iy9ew8qpqvvxbrlkg8mz9-b32ec7bb.sandbox.novita.ai
- **Production**: (Will be generated after deployment to Cloudflare Pages)
- **Target Website**: https://www.fnp.com/

## ✅ Currently Completed Features

### 1. **Unified Dashboard Interface**

- Clean, light-colored UI inspired by FNP website design
- FNP logo and branding integration
- Responsive design for desktop and mobile viewing

### 2. **Platform Statistics Cards**

- Real-time stats for all 4 testing modes:
  - Desktop Site
  - Mobile Site
  - Partner Panel
  - OMS
- Each card displays:
  - Total tests count
  - Passed tests (with percentage)
  - Failed tests (with percentage)
  - Skipped tests
  - Execution duration
  - Success rate
- Interactive hover effects with tooltips

### 3. **Visual Analytics Charts**

- **Test Results Overview** (Grouped Bar Chart)

  - Compares Passed/Failed/Skipped tests across all platforms
  - Easy comparison of test health

- **Success Rate by Platform** (Doughnut Chart)

  - Visual representation of success percentage for each platform
  - Color-coded by platform type

- **Execution Time Comparison** (Line Chart)
  - Shows execution duration trends across platforms
  - Helps identify performance bottlenecks

### 4. **Module-Level Breakdown**

- Tab-based navigation for each platform
- Individual module cards showing:

  - Module name with icon
  - Pass/Fail counts
  - Execution duration
  - Visual progress bar
  - Success rate percentage

- **Desktop Site Modules**: Login, Checkout, Product Search, Cart Operations, Payment Flow, User Profile, Order History
- **Mobile Site Modules**: Same as Desktop with mobile-specific metrics
- **Partner Panel Modules**: Native app testing modules
- **OMS Modules**: Order Management, Inventory Sync, Shipping Integration, Returns Processing, Vendor Management, Reporting

### 5. **API Endpoints**

- `GET /api/test-results` - Fetch all platform test results
- `GET /api/test-results/:platform` - Fetch specific platform results
- `POST /api/run-test` - Trigger test execution (mock implementation)

### 6. **User Experience Features**

- One-click refresh functionality
- Loading indicators during data fetch
- Hover tooltips for additional information
- Smooth animations and transitions
- Click-to-view-details on platform cards

## 🔄 Functional Entry URIs

### Main Dashboard

- **Path**: `/`
- **Method**: GET
- **Description**: Main dashboard interface with all visualizations

### API Endpoints

1. **Get All Test Results** (Supabase-powered)

   - **Path**: `/api/test-results`
   - **Method**: GET
   - **Description**: Fetches latest test run from Supabase with all journeys
   - **Response**: JSON object with results for all platforms

   ```json
   {
     "desktop": { "total": 19, "passed": 17, "failed": 2, "modules": [...] },
     "mobile": { "total": 19, "passed": 17, "failed": 2, "modules": [...] },
     "android": { "total": 19, "passed": 17, "failed": 2, "modules": [...] },
     "oms": { "total": 19, "passed": 17, "failed": 2, "modules": [...] }
   }
   ```

2. **Get Platform-Specific Results**

   - **Path**: `/api/test-results/:platform`
   - **Method**: GET
   - **Parameters**: `platform` - one of: desktop, mobile, android, oms, ios

3. **Get Journey Details** (NEW)

   - **Path**: `/api/journey/:journeyId`
   - **Method**: GET
   - **Description**: Fetches detailed journey information with all steps
   - **Response**: Journey object with steps array

4. **Get Test Run History** (NEW)

   - **Path**: `/api/test-runs?limit=10`
   - **Method**: GET
   - **Description**: Fetches recent test runs from Supabase

5. **Get Health Metrics** (NEW)
   - **Path**: `/api/health?framework=playwright&environment=dev`
   - **Method**: GET
   - **Description**: Fetches real-time health metrics from last 24 hours

## 📊 Data Architecture

### Supabase Database Schema

#### test_runs Table
```sql
- run_id (UUID, Primary Key)
- framework (String) - e.g., "playwright"
- suite_name (String) - e.g., "FNP Automation Framework"
- environment (String) - dev/uat/prod
- platform (String) - web/mobile/api
- executed_at (Timestamp)
- total_journeys, passed_journeys, failed_journeys
- total_steps, passed_steps, failed_steps
- success_rate (Decimal)
- build_number, build_url, job_name
```

#### journeys Table
```sql
- journey_id (UUID, Primary Key)
- run_id (UUID, Foreign Key)
- journey_number (Integer) - 1, 2, 3...
- journey_name (String) - e.g., "Home Page Exploration"
- status (String) - PASSED/FAILED/SKIPPED
- duration_ms (BigInt)
- failure_reason, error_type, error_message
- total_steps, passed_steps, failed_steps
```

#### steps Table
```sql
- step_id (UUID, Primary Key)
- journey_id (UUID, Foreign Key)
- step_number (Integer)
- step_name (String)
- status (String) - PASSED/FAILED/SKIPPED
- duration_ms (BigInt)
- error_type, error_message, error_stack
- api_calls (JSONB) - Array of API calls made
```

### Data Flow

1. **Playwright Tests Execute**
   - Located in `playwright_automation 1/`
   - Tracks steps via `StepTracker`
   - Collects data via `ExecutionDataCollector`

2. **Data Sent to Supabase**
   - `SupabaseLogger` sends complete execution data
   - Stored in `raw_test_logs` (immutable)
   - Normalized into `test_runs`, `journeys`, `steps`

3. **Dashboard Fetches Data**
   - API endpoints query Supabase
   - Data transformed to dashboard format
   - Real-time updates on refresh

### Storage Services

- **Current**: Supabase PostgreSQL database
- **Connection**: `https://wnymknrycmldwqzdqoct.supabase.co`
- **Access**: Read-only via Row Level Security (RLS)
- **Backup**: Immutable raw logs in `raw_test_logs` table

## 📱 User Guide

### For Non-Technical Users

1. **Viewing Dashboard**

   - Open the dashboard URL in your browser
   - The main page shows an overview of all test results

2. **Understanding Platform Cards**

   - **Desktop Site Card** (Green): Tests for desktop website
   - **Mobile Site Card** (Blue): Tests for mobile website
   - **Partner Panel Card** (Orange): Tests for Partner Panel
   - **OMS Card** (Purple): Tests for Order Management System
   - Each card shows how many tests passed, failed, or were skipped

3. **Reading the Charts**

   - **Bar Chart**: Compare test results side-by-side
   - **Doughnut Chart**: See success rates as percentages
   - **Line Chart**: View how long each platform takes to test

4. **Viewing Module Details**

   - Click on any platform card to see detailed module breakdown
   - Or use the tabs below the charts (Desktop Site, Mobile Site, OMS, Partner Panel)
   - Each module shows its own pass/fail status and duration

5. **Refreshing Data**

   - Click the "Refresh Data" button in the top-right corner
   - This fetches the latest test results

6. **What the Colors Mean**
   - 🟢 Green = Tests Passed
   - 🔴 Red = Tests Failed
   - 🟡 Yellow = Tests Skipped

## 🚀 Deployment

### Current Status

- ✅ **Development Active**: Running on sandbox environment
- ⏳ **Production Deployment**: Ready for Cloudflare Pages

### Tech Stack

- **Backend**: Hono (Lightweight web framework)
- **Frontend**: Vanilla JavaScript with Chart.js
- **Styling**: TailwindCSS + Custom CSS
- **Charts**: Chart.js for data visualization
- **HTTP Client**: Axios for API calls
- **Deployment**: Cloudflare Pages (Workers runtime)

### Local Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev:sandbox

# Clean port if needed
npm run clean-port
```

### Production Deployment to Cloudflare Pages

```bash
# Build and deploy
npm run deploy:prod
```

## 🔮 Features Implemented vs. Planned

### ✅ Implemented Features

1. **Supabase Integration**
   - ✅ Real-time data fetching from Supabase
   - ✅ Journey and step-level tracking
   - ✅ Error and failure tracking
   - ✅ API call monitoring
   - ✅ Multiple test run history

2. **Dashboard Features**
   - ✅ Unified dashboard interface
   - ✅ Platform statistics cards
   - ✅ Visual analytics charts
   - ✅ Module-level breakdown
   - ✅ One-click refresh functionality
   - ✅ Dark/Light mode toggle

3. **API Endpoints**
   - ✅ Get all test results
   - ✅ Get platform-specific results
   - ✅ Get journey details with steps
   - ✅ Get test run history
   - ✅ Get health metrics

### 🔄 Features Not Yet Implemented

1. **Real-time Updates**
   - WebSocket connection for live updates
   - Auto-refresh on new test completion
   - Live test execution progress

2. **Authentication & Access Control**

   - User login system
   - Role-based access (Admin, Developer, Viewer)
   - Team management

3. **Advanced Analytics**

   - Test trend analysis over time
   - Failure pattern detection
   - Automated alerts for test failures
   - Email notifications

4. **Test Management Features**

   - Trigger test runs from dashboard
   - Schedule automated test runs
   - Rerun failed tests only
   - Test configuration management

5. **Detailed Test Reports**

   - View individual test case details
   - Screenshots and videos of failed tests
   - Stack traces and error logs
   - Test execution timeline

6. **Comparison Features**

   - Compare test results between runs
   - Compare performance across platforms
   - Historical data visualization

7. **Export Capabilities**

   - Download test reports as PDF
   - Export data to CSV/Excel
   - Share reports via email

8. **Custom Dashboards**
   - Create custom views for different teams
   - Personalized widgets and metrics
   - Saved filters and preferences

## 📝 Quick Start Guide

### For Users

1. **View Latest Test Results**
   - Open the dashboard URL
   - Latest test run automatically loads from Supabase
   - View overall statistics and journey breakdown

2. **Refresh Data**
   - Click "Refresh Data" button to fetch latest results
   - Dashboard updates with most recent test execution

3. **Switch Platforms**
   - Click platform tabs (Desktop, Mobile, Android, OMS)
   - View platform-specific journey details

4. **Understanding the Data**
   - **Green**: Tests passed successfully
   - **Red**: Tests failed (click for error details)
   - **Gray**: Tests skipped
   - **Duration**: Time taken for execution

### For Developers

1. **Run Playwright Tests**
   ```bash
   cd "playwright_automation 1"
   npm test
   ```

2. **Verify Data in Supabase**
   - Go to https://wnymknrycmldwqzdqoct.supabase.co
   - Check `test_runs`, `journeys`, `steps` tables

3. **View in Dashboard**
   - Refresh dashboard to see new test results
   - Verify journey counts and statuses

4. **Integration Details**
   - See [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)
   - See [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## 📝 Recommended Next Steps

### Phase 1: Enhanced Visualization (Priority: High)

1. **Step-Level Visualization**
   - Expandable journey cards showing all steps
   - Step timeline view with timing
   - API call details for each step

2. **Advanced Filtering**
   - Filter by date range
   - Filter by status (passed/failed)
   - Filter by journey name
   - Search functionality

### Phase 2: Real-time Features (Priority: Medium)

3. **Live Updates**
   - WebSocket connection for real-time data
   - Auto-refresh on new test completion
   - Live test execution progress

4. **Multi-Environment Support**
   - Switch between dev/uat/prod environments
   - Compare environments side-by-side
   - Environment-specific metrics

### Phase 3: Advanced Analytics (Priority: Low)

5. **Trend Analysis**
   - Historical trend charts
   - Week-over-week comparisons
   - Performance regression detection

6. **Failure Analysis**
   - Failure pattern detection
   - Root cause analysis
   - Flaky test identification

### Phase 4: Production Readiness

7. **Notifications**
   - Email alerts for test failures
   - Slack/Teams integration
   - Custom notification rules

8. **Security & Access Control**

   - Add authentication system
   - Implement user roles
   - API key management

9. **Performance Optimization**

   - Add caching layer
   - Optimize chart rendering
   - Lazy loading for large datasets

10. **Documentation**
    - Create user manual
    - Add inline help tooltips
    - Video tutorials for team

## 🛠️ Integration Status

### ✅ Completed
- Supabase database connection
- Real-time data fetching
- Journey and step tracking
- Error and failure tracking
- API endpoints for all data access
- Dashboard UI with real data
- Documentation and testing guides

### 🔄 In Progress
- None (integration complete)

### 📋 Next Steps
1. Run Playwright tests to populate Supabase
2. Verify dashboard displays real data
3. Test all API endpoints
4. Implement advanced visualizations
5. Add real-time updates

## 🛠️ Developer Guide

### Project Structure
```
Dashboard-main/
├── src/
│   ├── index.tsx              # Main API and UI
│   ├── lib/
│   │   └── supabase.ts        # Supabase client config
│   └── services/
│       └── testDataService.ts # Data fetching service
├── playwright_automation 1/   # Playwright tests (Read-Only)
│   ├── src/main/services/
│   │   ├── SupabaseLogger.js
│   │   └── ExecutionDataCollector.js
│   └── supabase/
│       ├── schema.sql
│       └── example-payload.json
├── SUPABASE_INTEGRATION.md    # Integration documentation
├── TESTING_GUIDE.md           # Testing guide
└── README.md                  # This file
```

### Running the Dashboard
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy:prod
```

### Testing the Integration
```bash
# 1. Start dashboard
npm run dev

# 2. In another terminal, run Playwright tests
cd "playwright_automation 1"
npm test

# 3. Refresh dashboard to see new data
# Click "Refresh Data" button in dashboard
```

## 🛠️ Integration Guide for Developers (Legacy)

**Note**: The dashboard now uses Supabase for data storage. The Playwright automation framework automatically sends data to Supabase. No manual integration needed.

For reference, here's how data flows from Playwright to the dashboard:

### Playwright → Supabase (Automatic)
```javascript
// In playwright_automation 1/src/main/hooks/hooks.js
// After test execution completes:
const executionData = executionDataCollector.getExecutionData();
await supabaseLogger.ingestRawLog(executionData, 'jenkins');
```

### Supabase → Dashboard (Automatic)
```typescript
// In src/index.tsx
// Dashboard API fetches from Supabase:
const { data: latestRun } = await supabase
  .from('test_runs')
  .select('*')
  .order('executed_at', { ascending: false })
  .limit(1)
  .single();
```

For detailed integration information, see [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)

### How to Send Test Results to Dashboard (Old Method - Not Used)

After your Playwright tests complete, send results to the API:

```javascript
// Example: Send test results from Playwright
async function sendTestResults(platform, results) {
  const response = await fetch(
    "https://your-dashboard-url.pages.dev/api/test-results",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform: platform,
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        skipped: results.skipped,
        duration: results.duration,
        modules: results.modules,
      }),
    }
  );

  return response.json();
}
```

### Playwright Reporter Integration

```javascript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [
    ["html"],
    ["./custom-reporter.ts"], // Custom reporter to send data to dashboard
  ],
});
```

## 📞 Support

For questions or issues with the dashboard, contact your SDET team.

---

**Last Updated**: January 10, 2026
**Version**: 2.0.0 (Supabase Integration Complete)
**Maintained by**: SDET Team

## 📚 Additional Documentation

- [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md) - Complete integration guide
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing scenarios and validation
- `playwright_automation 1/README.md` - Playwright automation framework docs
- `playwright_automation 1/SUPABASE_LOGGING_SUMMARY.md` - Logging implementation details
