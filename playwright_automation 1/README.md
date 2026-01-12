# FNP Automation Framework

Production-grade automation framework for FNP e-commerce testing using Playwright, Cucumber, and JavaScript. Covers 19 complete user journeys with intelligent Slack reporting, Gmail OTP integration, and Jenkins CI/CD pipeline.

## 🚀 Quick Start

```bash
# Install dependencies
npm install
npx playwright install chromium

# Run complete test suite (19 journeys)
npm run test:complete-18-journeys

# Run with Docker
./scripts/docker-build.sh
./scripts/docker-run.sh
```

---

## 📋 Architecture

**Framework**: Playwright + Cucumber (BDD)  
**Language**: JavaScript (Node.js 20+)  
**Pattern**: Page Object Model with enhanced addon handling  
**Reporting**: Intelligent Slack notifications + Supabase analytics dashboard  
**CI/CD**: Jenkins + Docker (runs every 20 minutes)  
**Analytics**: Supabase-based centralized logging with React dashboard

---

## 📊 Supabase Analytics Dashboard (NEW)

Complete data platform for long-term test analytics and health monitoring.

### Features
- ✅ **Real-time Health Monitoring**: Success rates, runtime trends, failure analysis
- ✅ **Journey Heatmaps**: Visual reliability tracking over time
- ✅ **Step Performance Analysis**: Identify slow and failing steps with percentiles
- ✅ **Trend Analysis**: Week-over-week comparisons with categorized changes
- ✅ **Failure Analysis**: Root cause grouping by error type and severity
- ✅ **Framework Comparison**: Multi-framework support with health grades
- ✅ **Full-text Search**: Find specific test runs instantly with filters
- ✅ **Immutable Audit Trail**: Complete JSON payloads stored forever

### Architecture
```
CI Pipeline → SupabaseLogger → Raw Storage (Immutable) → Normalized Tables → SQL Views/Functions → React Dashboard
```

### Quick Start
```bash
# 1. Setup Supabase (5 minutes)
# See supabase/SETUP_GUIDE.md for complete instructions

# 2. Configure environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-service-role-key"

# 3. Run tests (logs automatically sent to Supabase)
npm test

# 4. Build React dashboard
# See supabase/react-queries.md for examples
```

### Documentation
- 📖 **Setup Guide**: `supabase/SETUP_GUIDE.md` - Step-by-step installation
- 🏗️ **Integration Guide**: `supabase/INTEGRATION_GUIDE.md` - Architecture and data flow
- ⚛️ **React Queries**: `supabase/react-queries.md` - Industry-standard dashboard patterns
- 🔧 **SQL Functions**: `supabase/dashboard-functions.sql` - Backend logic (8 RPC functions)
- 📊 **Example Payload**: `supabase/example-payload.json` - Sample test execution data

### Key Benefits
- **Backend prepares data, Frontend displays data** - Industry-standard approach
- **All computation in SQL** - Fast, scalable, maintainable
- **Read-only React queries** - Secure, stateless dashboard
- **Pre-computed aggregations** - Instant dashboard load times
- **Immutable raw storage** - Complete audit trail and reprocessing capability

---

## 📁 Project Structure

```
src/
├── main/
│   ├── pages/                     # Page objects with enhanced addon handling
│   │   ├── BasePage.js           # Base class with Skip & Continue fallback
│   │   ├── HomePage.js           # Journey 1: Home exploration
│   │   ├── PaymentPage.js        # Journey 2: Payment methods
│   │   ├── ProfilePage.js        # Journey 3: Phone number change
│   │   ├── InternationalPage.js  # Journey 5: International purchase
│   │   ├── DAPage.js            # Journey 6: DA page modification
│   │   ├── AddOnPage.js         # Journey 8: Addon testing
│   │   └── ...                  # Additional journey pages
│   ├── utils/
│   │   ├── SlackNotifier.js     # Intelligent reporting system
│   │   ├── StepTracker.js       # Journey progress tracking
│   │   ├── ApiResponseTracker.js # API failure analysis
│   │   ├── GmailOtpClient.js    # Gmail OTP automation
│   │   └── Logger.js            # Winston logging
│   └── hooks/
│       └── hooks.js             # Test lifecycle management
└── test/
    ├── features/web/            # Gherkin feature files
    └── stepdefinitions/         # Step implementations

config/                          # Environment configurations
locators/                       # YAML locator definitions
test-assets/                    # Photo upload assets
scripts/                        # CI/CD helper scripts
```

---

## 🧪 Test Execution

### Local Testing

```bash
# Core test execution
npm test                        # All 19 journeys
npm run test:complete-18-journeys # 18 journeys (no Gmail OTP)
npm run test:journey20          # Gmail OTP login only

# Journey subsets
npm run test:journey12-16       # Personalization journeys
npm run test:journey15-17       # Search & location testing
npm run test:journey18          # Icon exploration

# Environment-specific
npm run test:dev               # Development environment
npm run test:uat               # UAT environment
npm run test:prod              # Production environment

# Reporting
npm run report                 # Open Playwright HTML report
npm run allure:serve           # Allure report server
```

### Docker Testing

```bash
# Build Docker image
./scripts/docker-build.sh

# Run tests in Docker (headless)
./scripts/docker-run.sh

# Run with Docker Compose
docker-compose up

# Test Slack notification
./scripts/test-slack-notification.sh
```

---

## 🎯 Journey Coverage (19 Active)

1. **Home Page Exploration** - Login, cart, gift finder
2. **Payment Methods Testing** - QR, UPI, card validation
3. **International Phone Change** - Profile management
4. **Reminder & FAQ Testing** - Reminder creation, FAQ
5. **International Purchase** - Cross-border commerce
6. **DA Page Modification** - Address management
7. **Combinational Purchase** - Domestic + international
8. **ADD-On Testing** - Product addon functionality
9. **Cake Variant Testing** - Product variants
10. **Coupon Testing** - Invalid/valid coupon flows
11. **Personalized Text Product** - Custom text
12. **Message Card Integration** - Free message cards
13. **Product Exploration** - Photo gallery, reviews
14. **Same SKU Exploration** - Delivery comparisons
15. **Search Based Purchase** - Search functionality
16. **Personalized Photo Upload** - Single/multi photo
17. **Location Testing** - Pincode validation
18. **Spherical Icon Exploration** - Category navigation
20. **Gmail OTP Login** - Automated OTP retrieval

*Journey 19 is commented out*

---

## 🐳 CI/CD Pipeline

### Jenkins Pipeline

**Schedule**: Runs every 20 minutes  
**Execution Time**: ~50-70 minutes  
**Notification**: Slack after every run

#### Pipeline Stages

1. **🔧 Setup** - Clean workspace, create directories
2. **📥 Checkout** - Clone repository from Git
3. **🐳 Build Docker Image** - Build optimized container (1.34GB)
4. **🧪 Run Tests** - Execute all 18 user journeys (headless)
5. **📊 Archive Results** - Save reports, screenshots, logs
6. **🧹 Cleanup** - Remove old Docker images

#### Artifacts Archived
- Test reports (HTML, JSON)
- Screenshots (on failure)
- Logs (execution logs)
- Allure results

### Docker Configuration

**Base Image**: node:20-bookworm-slim  
**Browser**: Chromium (headless)  
**Size**: 1.34GB  
**Memory**: 4GB limit  
**Shared Memory**: 2GB

### Jenkins Setup

```bash
# View setup instructions
./scripts/jenkins-setup.sh

# Required Jenkins Plugins:
# - Docker Pipeline
# - Git Plugin
# - Pipeline
# - Timestamper
# - AnsiColor
# - Workspace Cleanup
```

### CI/CD Files

- `Jenkinsfile` - Pipeline definition
- `Dockerfile` - Container image
- `docker-compose.yml` - Local testing
- `.dockerignore` - Build optimization
- `jenkins.properties` - Configuration
- `scripts/` - Helper scripts

---

## ⚙️ Configuration

### Environment Variables

```bash
# Test Configuration
ENV=dev|uat|prod              # Environment selection
PLATFORM=web                  # Platform (web/mobile/api)
HEADLESS=true                 # Headless mode (auto in CI/Docker)
CI=true                       # CI mode flag

# Gmail OTP (Journey 20)
GMAIL_EMAIL="your-email@gmail.com"
GMAIL_APP_PASSWORD="16-char-app-password"
```

### Slack Reporting

**Status**: Enabled by default  
**Webhook**: Configured in `src/main/utils/SlackNotifier.js`

**Notification Features**:
- Test summary with pass/fail counts
- Journey breakdown (all 18 journeys)
- Failure analysis (top 3 failures)
- Execution time and metrics
- Report preview with ASCII art

**Triggers**:
- ✅ Success: All tests pass
- ❌ Failure: One or more tests fail
- ⚠️ Unstable: Tests complete with warnings
- 🚨 Critical: Pipeline failure

---

## 🔧 Key Features

### Enhanced Addon Handling
All page objects use intelligent fallback strategy:
```javascript
// Primary: Skip & Continue (for addon handling)
await page.locator('button').filter({ hasText: 'Skip & Continue' }).click({ timeout: 5000 });

// Fallback: Regular Continue
await page.locator('button').filter({ hasText: 'Continue' }).click({ timeout: 10000 });
```

### Intelligent Reporting
- Real execution times (not placeholder values)
- Unicode emojis for proper rendering
- Sequential journey numbering (1-18, 20)
- Step-level failure analysis with API context
- Automatic Slack notifications

### Gmail OTP Integration
- IMAP-based OTP retrieval
- Multi-pattern extraction (subject/body)
- Environment-based configuration
- Comprehensive error handling

### Headless Mode
- Automatically enabled in CI/Docker
- Configured via environment variables
- No manual configuration needed
- Works seamlessly in Jenkins

---

## 📦 Dependencies

```json
{
  "devDependencies": {
    "@cucumber/cucumber": "^10.0.0",
    "@playwright/test": "^1.57.0",
    "allure-playwright": "^2.9.0",
    "yaml": "^2.3.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "winston": "^3.11.0",
    "imap": "^0.8.19",
    "mailparser": "^3.6.5"
  }
}
```

---

## 🐛 Troubleshooting

### Local Testing Issues
- **Page closure during payment**: Enhanced timeout handling
- **Continue button not found**: Fallback strategy implemented
- **Gmail OTP failures**: Check app password and IMAP settings
- **Slack notification issues**: Verify webhook URL and emoji format

### Docker Issues
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t fnp-automation-playwright:latest .

# Check Docker logs
docker logs <container-id>

# Run interactively
docker run -it fnp-automation-playwright:latest /bin/bash
```

### Jenkins Issues
```bash
# Add Jenkins to Docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Verify Docker access
sudo -u jenkins docker ps

# Check Jenkins logs
sudo tail -f /var/log/jenkins/jenkins.log
```

### Logs
Comprehensive logging in `logs/` directory with Winston integration.

---

## 📚 Coding Standards

### Page Objects
- Extend `BasePage` for common functionality
- Use enhanced addon handling: `Skip & Continue` → `Continue` → CSS/XPath fallbacks
- Implement proper error handling and logging
- Follow consistent naming conventions

### Step Definitions
- Map to business-friendly journey names via `StepTracker`
- Use descriptive step names matching Gherkin scenarios
- Implement proper cleanup and navigation

### Locator Strategy
- Primary: `Skip & Continue` (5s timeout)
- Fallback: `Continue` (10s timeout)
- Final: CSS/XPath selectors
- Store complex locators in `locators/web.yaml`

---

## 🤝 Contributing

1. Follow existing page object patterns
2. Use enhanced addon handling for cart operations
3. Update `StepTracker.js` for new journey mappings
4. Add Unicode emojis to `SlackNotifier.js` for new journeys
5. Maintain sequential journey numbering
6. Test locally before pushing to CI/CD branch
7. Ensure Docker build succeeds

---

## 📖 Additional Documentation

- **Jenkinsfile** - Pipeline definition with inline comments
- **Dockerfile** - Container build instructions
- **docker-compose.yml** - Local development setup
- **jenkins.properties** - Configuration reference
- **scripts/jenkins-setup.sh** - Detailed Jenkins setup guide

---

## 🚀 Deployment

### Push to Git
```bash
git add .
git commit -m "CI/CD pipeline ready"
git push origin cicd
```

### Jenkins Deployment
1. Create Jenkins pipeline job
2. Configure Git repository (branch: `cicd`)
3. Set build trigger: `H/20 * * * *` (every 20 minutes)
4. Run first build
5. Monitor Slack for notifications

---

## 📊 Test Metrics

**Total Journeys**: 19 active  
**Total Steps**: ~160 steps  
**Execution Time**: 45-60 minutes  
**Success Rate**: Tracked in Slack reports  
**Browser**: Chromium (headless in CI)  
**Environments**: dev, uat, prod

---

## 📝 License

Internal FNP Automation Framework

---

**Built with ❤️ by FNP Automation Team**

*Last Updated: January 3, 2026*
