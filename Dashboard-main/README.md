# Sentinel - Test Automation Dashboard

A comprehensive real-time dashboard for monitoring test automation results across multiple platforms including Desktop Site, Mobile Site, OMS, and Partner Panel systems.

## 🚀 Features

- **Real-time Test Monitoring**: Live updates of test execution results
- **Multi-Platform Support**: Desktop Site, Mobile Site, OMS, Partner Panel, and Android
- **Journey-Based Testing**: Intelligent journey splitting with step-by-step tracking
- **Failure Analysis**: Screenshot capture and detailed error reporting for failed tests
- **Interactive Charts**: 3D visualizations and trend analysis
- **Dark/Light Theme**: Toggle between themes for better user experience
- **Supabase Integration**: Real-time data from PostgreSQL database

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Hono.js framework with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Charts**: Highcharts for data visualization
- **Build Tool**: Vite
- **Deployment**: Render.com (with Cloudflare Workers support)
- **Testing**: Playwright automation framework

## 📊 Dashboard Sections

1. **Live Test Execution Context**: Real-time status of all platforms
2. **Overall Statistics**: Combined metrics and success rates
3. **Test Modules by Platform**: Detailed journey breakdowns with steps
4. **Visual Analytics**: 3D charts, trend analysis, and bubble charts
5. **Failure Screenshots**: Automated capture for failed test steps

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and database

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/rauneets-sketch/Sentinel.git
   cd Sentinel/Dashboard-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual Supabase credentials
   ```

4. **Test environment configuration**
   ```bash
   npm run test-env
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Deployment

### Option 1: Render.com Deployment (Recommended)

This application is configured for easy deployment on Render.com:

1. **Push to GitHub** (if not already done)
2. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint" 
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

3. **Environment Variables** (automatically configured in render.yaml):
   - `NODE_ENV=production`
   - `PORT=10000`
   - `SUPABASE_URL=your_supabase_url`
   - `SUPABASE_KEY=your_service_role_key`

4. **Deploy**: Click "Apply" and wait for deployment

📖 **Detailed deployment guide**: See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

### Option 2: Vercel Deployment

This application also supports Vercel deployment:

1. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Environment Variables** (configure in Vercel dashboard):
   - `NODE_ENV=production`
   - `SUPABASE_URL=your_supabase_url`
   - `SUPABASE_KEY=your_service_role_key`

3. **Deploy**: Vercel will auto-detect the configuration and deploy

### Option 3: Cloudflare Workers
```bash
npm run deploy
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
SLACK_WEBHOOK_URL=your_slack_webhook_url  # Optional
```

### Database Schema
The dashboard expects the following Supabase tables:
- `test_runs` - Test execution metadata
- `journeys` - Individual test journeys
- `steps` - Detailed test steps
- `raw_test_logs` - Raw Playwright logs

## 📱 Platform Support

| Platform | Status | Features |
|----------|--------|----------|
| Desktop Site | ✅ Active | Real data, journey splitting, screenshots |
| Mobile Site | 🔄 Mock Data | Coming soon |
| OMS | ✅ Active | Real data, failure tracking |
| Partner Panel | ✅ Active | Real data, performance metrics |
| Android | 🔄 Mock Data | Coming soon |

## 🎯 Key Features

### Journey Intelligence
- Automatically splits long test sequences into logical journeys
- Identifies completion markers like "PNC Created Successfully"
- Provides step-by-step execution details

### Failure Analysis
- Screenshots captured only for failed steps
- Detailed error messages and stack traces
- Failure context with page URLs and selectors

### Real-time Updates
- Live status indicators with pulse animations
- Auto-refresh functionality
- Recent data prioritization (focuses on latest test runs)

## 🔍 Monitoring & Analytics

- **Success Rate Tracking**: Platform-wise success percentages
- **Performance Metrics**: Execution time analysis
- **Trend Analysis**: Historical performance data
- **Failure Patterns**: Common error identification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For deployment issues or questions:
- Check the [deployment guide](./RENDER_DEPLOYMENT.md)
- Review build logs in Render dashboard
- Verify environment variables
- Test locally first

## 📄 License

This project is licensed under the MIT License.

---

**Live Dashboard**: [Your Render URL]  
**Last Updated**: January 13, 2025  
**Version**: 1.0.0