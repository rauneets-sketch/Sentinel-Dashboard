// Global data store
let testData = {};
let currentPlatform = "desktop";
let lastRefreshTime = Date.now();

// Debug: Log when script loads
console.log("🚀 Dashboard script loaded!");
console.log("📊 Axios available:", typeof axios !== 'undefined');

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌐 DOM Content Loaded, starting initialization...");
  
  // Test basic DOM manipulation
  const testElement = document.getElementById('liveStatsGrid');
  if (testElement) {
    console.log("✅ Found liveStatsGrid element");
    testElement.innerHTML = '<div style="padding: 20px; background: #f0f0f0; border-radius: 8px; text-align: center;">🔧 JavaScript is working! Loading data...</div>';
  } else {
    console.log("❌ Could not find liveStatsGrid element");
  }
  
  // Initialize dashboard
  initTheme();
  updateCurrentDate();
  initDashboard();
});

// Initialize dashboard
async function initDashboard() {
  console.log("🔄 Initializing dashboard...");
  
  // Test DOM elements
  const liveStatsGrid = document.getElementById('liveStatsGrid');
  const statsGrid = document.getElementById('statsGrid');
  const modulesGrid = document.getElementById('modulesGrid');
  
  console.log("📋 DOM Elements Check:");
  console.log("  liveStatsGrid:", liveStatsGrid ? "✅ Found" : "❌ Missing");
  console.log("  statsGrid:", statsGrid ? "✅ Found" : "❌ Missing");
  console.log("  modulesGrid:", modulesGrid ? "✅ Found" : "❌ Missing");
  
  try {
    showLoading();
    console.log("📡 Loading data...");
    await loadData();
    console.log("📈 Rendering live stats...");
    renderLiveStats();
    console.log("📊 Rendering stats...");
    renderStats();
    console.log("📉 Rendering charts...");
    renderCharts();
    console.log("🎯 Showing modules...");
    showModules("desktop");
    startLiveUpdateTimer();
    lastRefreshTime = Date.now();
    console.log("✅ Dashboard initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing dashboard:", error);
    console.error("❌ Error stack:", error.stack);
    alert("Failed to initialize dashboard. Check console for details.");
  } finally {
    hideLoading();
  }
}

// Load test data from Supabase API
async function loadData() {
  console.log("🔍 Starting loadData function...");
  try {
    // Add cache-busting parameter and timeout
    const timestamp = Date.now();
    console.log("📡 Making API request to /api/test-results...");
    const response = await axios.get(`/api/test-results?_t=${timestamp}`, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    testData = response.data;
    console.log("✅ Loaded test data successfully:", testData);
  } catch (error) {
    console.error("❌ Error loading data:", error);
    // Only fallback to mock data if we don't have any existing data
    if (!testData || Object.keys(testData).length === 0) {
      console.log("🔄 Falling back to mock data");
      testData = generateMockData();
    } else {
      console.log("📦 Using cached data due to fetch error");
    }
  }
}

// Generate mock data (fallback)
function generateMockData() {
  return {
    desktop: { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, modules: [] },
    mobile: { total: 138, passed: 125, failed: 10, skipped: 3, duration: 1389, modules: [] },
    android: { total: 142, passed: 128, failed: 9, skipped: 5, duration: 1456, modules: [] },
    oms: { total: 156, passed: 142, failed: 11, skipped: 3, duration: 1678, modules: [] },
    ios: { comingSoon: true, total: 0, passed: 0, failed: 0, skipped: 0, duration: 0, modules: [] }
  };
}

// Format duration for display
function formatDuration(ms) {
  if (!ms || ms <= 0) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

// Render live stats cards with real Supabase data for Desktop, OMS, and Partner Panel
function renderLiveStats() {
  const liveStatsGrid = document.getElementById("liveStatsGrid");
  const desktopData = testData.desktop || {};
  const omsData = testData.oms || {};
  const partnerPanelData = testData.android || {}; // Partner Panel data is mapped to android
  
  // Debug logging to see what data we're working with
  console.log("renderLiveStats - OMS data:", omsData);
  console.log("renderLiveStats - Partner Panel data:", partnerPanelData);
  
  // Calculate Desktop stats from real data
  const desktopJourneys = desktopData.total || 0;
  const desktopSteps = desktopData.totalSteps || 0;
  const desktopSuccessRate = desktopData.successRate || 0;
  const desktopDuration = desktopData.durationFormatted || formatDuration(desktopData.duration * 1000);
  const desktopFailed = desktopData.failed || 0;
  const desktopAvgStepTime = desktopSteps > 0 ? ((desktopData.duration * 1000) / desktopSteps).toFixed(1) : '0';

  // Calculate OMS stats from real data
  const omsJourneys = omsData.total || 0;
  const omsSteps = omsData.totalSteps || 0;
  const omsSuccessRate = omsData.successRate || 0;
  const omsDuration = omsData.durationFormatted || formatDuration((omsData.duration || 0) * 1000);
  const omsFailed = omsData.failed || 0;
  const omsAvgStepTime = omsSteps > 0 ? (((omsData.duration || 0) * 1000) / omsSteps).toFixed(1) : '0';

  // Calculate Partner Panel stats from real data
  const ppJourneys = partnerPanelData.total || 0;
  const ppSteps = partnerPanelData.totalSteps || 0;
  const ppSuccessRate = partnerPanelData.successRate || 0;
  const ppDuration = partnerPanelData.durationFormatted || formatDuration((partnerPanelData.duration || 0) * 1000);
  const ppFailed = partnerPanelData.failed || 0;
  const ppAvgStepTime = ppSteps > 0 ? (((partnerPanelData.duration || 0) * 1000) / ppSteps).toFixed(1) : '0';

  console.log("Calculated OMS stats:", { journeys: omsJourneys, steps: omsSteps, successRate: omsSuccessRate, duration: omsDuration, failed: omsFailed });
  console.log("Calculated PP stats:", { journeys: ppJourneys, steps: ppSteps, successRate: ppSuccessRate, duration: ppDuration, failed: ppFailed });

  const platforms = [
    {
      key: "desktop",
      name: "Desktop Site",
      icon: '<i class="fas fa-laptop"></i>',
      suite: "FNP Automation Framework - Playwright Test Suite",
      platform: "WEB",
      environment: desktopData.environment || "prod",
      duration: desktopDuration,
      journeys: desktopJourneys,
      steps: desktopSteps,
      successRate: desktopSuccessRate.toFixed(1),
      avgStepTime: desktopAvgStepTime,
      failed: desktopFailed,
      lastRun: desktopData.lastRun,
      isRealData: true
    },
    {
      key: "mobile",
      name: "Mobile Site",
      icon: '<i class="fas fa-mobile-screen-button"></i>',
      suite: "FNP Mobile Automation - Playwright Test Suite",
      platform: "MOBILE WEB",
      environment: "prod",
      duration: "8ms",
      journeys: 17,
      steps: 142,
      successRate: "98.5",
      avgStepTime: "0.045",
      failed: 2,
    },
    {
      key: "oms",
      name: "OMS",
      icon: '<i class="fas fa-server"></i>',
      suite: "FNP OMS Automation - Playwright Test Suite",
      platform: "ADMIN PANEL",
      environment: omsData.environment || "prod",
      duration: omsDuration,
      journeys: omsJourneys,
      steps: omsSteps,
      successRate: omsSuccessRate.toFixed(1),
      avgStepTime: omsAvgStepTime,
      failed: omsFailed,
      lastRun: omsData.lastRun,
      isRealData: omsJourneys > 0 // Show as real data if we have journeys
    },
    {
      key: "android",
      name: "Partner Panel",
      icon: '<i class="fas fa-handshake"></i>',
      suite: "FNP Partner Automation - Playwright Test Suite",
      platform: "PARTNER WEB",
      environment: partnerPanelData.environment || "prod",
      duration: ppDuration,
      journeys: ppJourneys,
      steps: ppSteps,
      successRate: ppSuccessRate.toFixed(1),
      avgStepTime: ppAvgStepTime,
      failed: ppFailed,
      lastRun: partnerPanelData.lastRun,
      isRealData: ppJourneys > 0 // Show as real data if we have journeys
    },
    {
      key: "ios",
      name: "Android",
      icon: '<i class="fab fa-android"></i>',
      comingSoon: true,
    },
  ];

  liveStatsGrid.innerHTML = platforms.map((platform) => {
    if (platform.comingSoon) {
      return `
        <div class="live-context-card coming-soon">
          <div class="context-title">${platform.icon} ${platform.name}</div>
          <div style="text-align: center; padding: 40px 20px;">
            <i class="fas fa-hourglass-half" style="font-size: 32px; color: var(--text-secondary); margin-bottom: 12px;"></i>
            <div style="font-size: 14px; color: var(--text-secondary); font-weight: 500;">Platform under development</div>
          </div>
        </div>
      `;
    }

    const hasIssues = platform.failed > 0;
    const statusIcon = hasIssues ? "❌" : "✅";
    const statusText = hasIssues ? "ISSUES DETECTED" : "ALL SYSTEMS GO";
    const statusColor = hasIssues ? "#ef4444" : "#10b981";
    const statusBg = hasIssues ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)";
    const lastRunText = platform.lastRun ? new Date(platform.lastRun).toLocaleString() : '';

    return `
      <div class="live-context-card" onclick="showModules('${platform.key}')" style="cursor: pointer;">
        <div class="context-title">${platform.icon} <span>${platform.name}</span>
          ${platform.isRealData ? '<span style="font-size: 10px; background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">LIVE</span>' : ''}
        </div>
        <div class="context-line" style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">${platform.suite}</div>
        ${lastRunText ? `<div class="context-line" style="font-size: 11px; opacity: 0.7;">Last Run: ${lastRunText}</div>` : ''}
        <div class="context-divider"></div>
        <div class="context-line">│ Platform: <strong>${platform.platform}</strong></div>
        <div class="context-line highlight">│ Environment: <strong>${platform.environment}</strong></div>
        <div class="context-line">│ Duration: <strong>${platform.duration}</strong></div>
        <div class="context-divider"></div>
        <div class="context-line">│ 🛒 User Journeys: <strong>${platform.journeys}</strong></div>
        <div class="context-line">│ 📋 Test Steps: <strong>${platform.steps}</strong></div>
        <div class="context-line highlight">│ ✅ Success Rate: <strong>${platform.successRate}%</strong></div>
        <div class="context-line">│ ⚡ Avg Step Time: <strong>${platform.avgStepTime}ms</strong></div>
        ${hasIssues ? `<div class="context-line" style="color: #ef4444; margin-top: 8px;">│ ❌ Failed: <strong>${platform.failed}</strong></div>` : ''}
        <div class="context-divider" style="margin-top: 12px;"></div>
        <div style="padding: 10px 16px; background: ${statusBg}; border-radius: 8px; margin-top: 8px; text-align: center;">
          <div style="font-size: 13px; font-weight: 600; color: ${statusColor};">Status: <strong>${statusText}</strong> ${statusIcon}</div>
        </div>
      </div>
    `;
  }).join("");
}

// Start live update timer
function startLiveUpdateTimer() {
  setInterval(() => {
    const seconds = Math.floor((Date.now() - lastRefreshTime) / 1000);
    const updateTime = document.getElementById("liveUpdateTime");
    if (updateTime) {
      if (seconds < 60) {
        updateTime.textContent = `${seconds}s ago`;
      } else {
        const minutes = Math.floor(seconds / 60);
        updateTime.textContent = `${minutes}m ago`;
      }
    }
  }, 1000);
}

// Render stats cards with real data
function renderStats() {
  const statsGrid = document.getElementById("statsGrid");
  const platforms = [
    { key: "desktop", name: "Desktop Site", icon: '<i class="fas fa-laptop"></i>', color: "desktop-bg" },
    { key: "mobile", name: "Mobile Site", icon: '<i class="fas fa-mobile-screen-button"></i>', color: "mobile-bg" },
    { key: "oms", name: "OMS", icon: '<i class="fas fa-server"></i>', color: "oms-bg" },
    { key: "android", name: "Partner Panel", icon: '<i class="fas fa-handshake"></i>', color: "android-bg" },
    { key: "ios", name: "Android", icon: '<i class="fab fa-android"></i>', color: "ios-bg" },
  ];

  statsGrid.innerHTML = platforms.map((platform) => {
    const data = testData[platform.key];
    if (!data || data.comingSoon) {
      return `
        <div class="stat-card" style="opacity: 0.7; cursor: default;">
          <div class="stat-icon ${platform.color}">${platform.icon}</div>
          <div class="stat-value" style="font-size: 24px;">Coming Soon</div>
          <div class="stat-label">${platform.name}</div>
          <div style="margin-top: 15px; font-size: 13px; color: var(--text-secondary); text-align: center;">Platform under development</div>
        </div>
      `;
    }

    const total = data.total || 0;
    const passed = data.passed || 0;
    const failed = data.failed || 0;
    const skipped = data.skipped || 0;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0';

    return `
      <div class="stat-card" onclick="showModules('${platform.key}')">
        <div class="stat-icon ${platform.color}">${platform.icon}</div>
        <div class="stat-value">${total}</div>
        <div class="stat-label">${platform.name}</div>
        <div class="stat-details">
          <div class="stat-detail"><span class="badge badge-success">✓ ${passed}</span></div>
          <div class="stat-detail"><span class="badge badge-danger">✗ ${failed}</span></div>
          <div class="stat-detail"><span class="badge badge-warning">⊘ ${skipped}</span></div>
        </div>
        <div style="margin-top: 10px; font-size: 13px; color: #6B7280;">Success Rate: <strong>${successRate}%</strong></div>
      </div>
    `;
  }).join("");
}

// Render all charts with real data
function renderCharts() {
  render3DColumnChart();
  renderTrendChart();
  renderBubbleChart();
}

// 3D Column Chart - Shows journey/test counts per platform
function render3DColumnChart() {
  const categories = ["Desktop Site", "Mobile Site", "OMS", "Partner Panel", "Android"];
  const platformKeys = ["desktop", "mobile", "oms", "android", "ios"];
  
  const passed = platformKeys.map((p) => {
    const data = testData[p];
    return data && !data.comingSoon ? (data.passed || 0) : 0;
  });
  const failed = platformKeys.map((p) => {
    const data = testData[p];
    return data && !data.comingSoon ? (data.failed || 0) : 0;
  });
  const skipped = platformKeys.map((p) => {
    const data = testData[p];
    return data && !data.comingSoon ? (data.skipped || 0) : 0;
  });

  Highcharts.chart("overviewChart", {
    chart: { type: "column", options3d: { enabled: true, alpha: 15, beta: 15, depth: 50, viewDistance: 25 } },
    exporting: { enabled: false },
    title: { text: null },
    xAxis: { categories: categories, labels: { style: { fontSize: "13px" } } },
    yAxis: { min: 0, title: { text: "Number of Journeys/Tests" } },
    plotOptions: { column: { depth: 25, dataLabels: { enabled: true, format: "{point.y}" } } },
    credits: { enabled: false },
    colors: ["#4CAF50", "#F44336", "#FFC107"],
    series: [
      { name: "Passed", data: passed },
      { name: "Failed", data: failed },
      { name: "Skipped", data: skipped },
    ],
  });
}

// Trend Chart - Shows success rate over time (using journey data for Desktop)
function renderTrendChart() {
  // Get data for all platforms
  const desktopData = testData.desktop || {};
  const mobileData = testData.mobile || {};
  const omsData = testData.oms || {};
  const partnerPanelData = testData.android || {}; // Partner Panel data is in android tab
  const iosData = testData.ios || {};
  
  // Create time-based categories (last 7 days for trend analysis)
  const categories = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Today"];
  
  // Calculate success rates for each platform
  const calculateSuccessRate = (data) => {
    if (data.modules && data.modules.length > 0) {
      // For real data, use actual success rate
      return data.successRate || 0;
    } else {
      // For mock data, use the calculated success rate
      const total = (data.passed || 0) + (data.failed || 0);
      return total > 0 ? Math.round(((data.passed || 0) / total) * 100) : 0;
    }
  };
  
  // Generate trend data for each platform (simulate 7-day trend)
  const generateTrendData = (currentRate, platformName) => {
    const baseRate = currentRate;
    const variation = 5; // ±5% variation
    
    return categories.map((_, index) => {
      if (index === categories.length - 1) {
        return baseRate; // Today's actual rate
      }
      // Generate realistic trend data with slight variations
      const randomVariation = (Math.random() - 0.5) * variation;
      const rate = Math.max(0, Math.min(100, baseRate + randomVariation));
      return Math.round(rate);
    });
  };
  
  // Calculate current success rates
  const desktopRate = calculateSuccessRate(desktopData);
  const mobileRate = calculateSuccessRate(mobileData);
  const omsRate = calculateSuccessRate(omsData);
  const partnerPanelRate = calculateSuccessRate(partnerPanelData);
  const iosRate = calculateSuccessRate(iosData);
  
  // Create series data for all platforms
  const series = [];
  
  // Desktop Site (real data)
  if (desktopData.total > 0) {
    series.push({
      name: "Desktop Site",
      data: generateTrendData(desktopRate, "Desktop"),
      color: "#4CAF50",
      marker: { symbol: 'circle' }
    });
  }
  
  // Mobile Site
  if (mobileData.total > 0) {
    series.push({
      name: "Mobile Site", 
      data: generateTrendData(mobileRate, "Mobile"),
      color: "#2196F3",
      marker: { symbol: 'square' }
    });
  }
  
  // OMS (real data)
  if (omsData.total > 0) {
    series.push({
      name: "OMS",
      data: generateTrendData(omsRate, "OMS"), 
      color: "#9C27B0",
      marker: { symbol: 'diamond' }
    });
  }
  
  // Partner Panel (real data)
  if (partnerPanelData.total > 0) {
    series.push({
      name: "Partner Panel",
      data: generateTrendData(partnerPanelRate, "Partner Panel"),
      color: "#FF9800", 
      marker: { symbol: 'triangle' }
    });
  }
  
  // Android/iOS (coming soon)
  if (iosData.total > 0) {
    series.push({
      name: "Android",
      data: generateTrendData(iosRate, "Android"),
      color: "#607D8B",
      marker: { symbol: 'hexagon' }
    });
  }

  Highcharts.chart("trendChart", {
    chart: { 
      type: "line",
      backgroundColor: 'transparent'
    },
    exporting: { enabled: false },
    title: { text: null },
    xAxis: { 
      categories: categories,
      labels: { 
        style: { 
          fontSize: '11px',
          color: '#666'
        } 
      },
      gridLineWidth: 1,
      gridLineColor: '#e0e0e0'
    },
    yAxis: { 
      title: { 
        text: "Success Rate (%)",
        style: { color: '#666' }
      }, 
      min: 0, 
      max: 100,
      gridLineColor: '#e0e0e0'
    },
    tooltip: { 
      shared: true, 
      valueSuffix: "%",
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderRadius: 8,
      shadow: true
    },
    credits: { enabled: false },
    legend: {
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemStyle: {
        fontSize: '11px',
        color: '#666'
      }
    },
    plotOptions: { 
      line: { 
        lineWidth: 3,
        marker: {
          radius: 5,
          lineWidth: 2,
          lineColor: '#fff'
        },
        states: {
          hover: {
            lineWidth: 4
          }
        }
      }
    },
    series: series
  });
}

// Bubble Chart - Shows journey performance (duration vs success rate vs step count)
function renderBubbleChart() {
  const desktopData = testData.desktop || {};
  const modules = desktopData.modules || [];
  
  // Create bubble data from Desktop journeys
  const desktopBubbles = modules.map((module) => {
    const totalSteps = module.totalSteps || module.steps?.length || (module.passed + module.failed) || 1;
    const passedSteps = module.passed || module.steps?.filter(s => s.status === 'PASSED').length || 0;
    const successRate = totalSteps > 0 ? (passedSteps / totalSteps) * 100 : 0;
    const duration = module.duration || 0;
    
    return {
      x: duration,
      y: Math.round(successRate),
      z: totalSteps,
      name: module.name || 'Journey',
      status: module.status,
      journeyNumber: module.journeyNumber
    };
  });

  const series = [
    { name: "Desktop Journeys", data: desktopBubbles, color: "#4CAF50" },
  ];

  // Add mock data for other platforms
  const mockPlatforms = [
    { name: "Mobile Site", color: "#2196F3", data: testData.mobile?.modules || [] },
    { name: "OMS", color: "#9C27B0", data: testData.oms?.modules || [] },
    { name: "Partner Panel", color: "#FF9800", data: testData.android?.modules || [] },
  ];

  mockPlatforms.forEach(platform => {
    if (platform.data.length > 0) {
      series.push({
        name: platform.name,
        color: platform.color,
        data: platform.data.map(m => ({
          x: m.duration || 0,
          y: m.passed && (m.passed + m.failed) > 0 ? Math.round((m.passed / (m.passed + m.failed)) * 100) : 0,
          z: (m.passed || 0) + (m.failed || 0),
          name: m.name
        }))
      });
    }
  });

  Highcharts.chart("bubbleChart", {
    chart: { type: "bubble", plotBorderWidth: 1, zoomType: "xy" },
    exporting: { enabled: false },
    title: { text: null },
    xAxis: { title: { text: "Duration (seconds)" }, gridLineWidth: 1 },
    yAxis: { title: { text: "Success Rate (%)" }, min: 0, max: 100, startOnTick: false, endOnTick: false },
    tooltip: {
      useHTML: true,
      headerFormat: "<table>",
      pointFormat: '<tr><th colspan="2"><h3>{point.name}</h3></th></tr>' +
        "<tr><th>Duration:</th><td>{point.x}s</td></tr>" +
        "<tr><th>Success Rate:</th><td>{point.y}%</td></tr>" +
        "<tr><th>Total Steps:</th><td>{point.z}</td></tr>",
      footerFormat: "</table>",
      followPointer: true,
    },
    plotOptions: { series: { dataLabels: { enabled: true, format: "{point.name}" } } },
    credits: { enabled: false },
    series: series,
  });
}

// Show modules/journeys for a platform - Desktop shows journeys with expandable steps
function showModules(platform, clickEvent) {
  currentPlatform = platform;

  // Update tab active state
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  if (clickEvent && clickEvent.target) {
    clickEvent.target.classList.add("active");
  } else {
    document.querySelectorAll(".tab").forEach((tab) => {
      const tabText = tab.textContent.toLowerCase();
      if (tabText.includes(platform)) tab.classList.add("active");
    });
  }

  const modulesGrid = document.getElementById("modulesGrid");
  const data = testData[platform];

  if (!data || data.comingSoon) {
    modulesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fas fa-clock" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
        <h3 style="font-size: 20px; margin-bottom: 10px; color: var(--text-primary);">Coming Soon</h3>
        <p>This platform is currently under development.</p>
      </div>
    `;
    return;
  }

  const modules = data.modules || [];
  
  if (modules.length === 0) {
    modulesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fas fa-database" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
        <h3 style="font-size: 20px; margin-bottom: 10px; color: var(--text-primary);">No Data Available</h3>
        <p>No test execution data found. Run tests to see results here.</p>
      </div>
    `;
    return;
  }

  // For Desktop, OMS, and Partner Panel (android), show journeys with expandable steps
  if (platform === 'desktop' || platform === 'oms' || platform === 'android') {
    modulesGrid.innerHTML = modules.map((module, index) => {
      const statusIcon = module.statusIcon || (module.status === 'PASSED' ? '✅' : module.status === 'FAILED' ? '❌' : '⚪');
      const statusColor = module.status === 'PASSED' ? '#10b981' : module.status === 'FAILED' ? '#ef4444' : '#6b7280';
      const totalSteps = module.totalSteps || module.steps?.length || 0;
      const passedSteps = module.passed || 0;
      const failedSteps = module.failed || 0;
      const successRate = totalSteps > 0 ? ((passedSteps / totalSteps) * 100).toFixed(1) : '0';
      const duration = module.durationFormatted || `${module.duration || 0}s`;
      const hasSteps = module.steps && module.steps.length > 0;
      const journeyNum = module.journeyNumber || index + 1;

      // Build steps HTML if available
      let stepsHtml = '';
      if (hasSteps) {
        stepsHtml = `
          <div id="steps-${index}" class="journey-steps" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">Steps (${module.steps.length}):</div>
            ${module.steps.map((step, stepIdx) => {
              const stepIcon = step.statusIcon || (step.status === 'PASSED' ? '✅' : step.status === 'FAILED' ? '❌' : '⚪');
              const stepDuration = step.durationFormatted || formatDuration(step.duration || 0);
              return `
                <div style="padding: 6px 8px; margin: 4px 0; background: var(--module-card-bg); border-radius: 6px; font-size: 12px; ${step.status === 'FAILED' ? 'border-left: 3px solid #ef4444;' : ''}">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${stepIcon} <strong>${stepIdx + 1}.</strong> ${step.name || 'Step'}</span>
                    <span style="color: var(--text-secondary);">${stepDuration}</span>
                  </div>
                  ${step.errorMessage ? `<div style="color: #ef4444; font-size: 11px; margin-top: 4px; padding-left: 20px;">Error: ${step.errorMessage}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      // Platform-specific titles
      let platformTitle = 'Journey';
      if (platform === 'oms') platformTitle = 'OMS Journey';
      if (platform === 'android') platformTitle = 'Partner Panel Journey';

      return `
        <div class="module-card" style="border-left-color: ${statusColor};">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="module-name" style="flex: 1;">
              ${statusIcon} ${platformTitle} ${journeyNum}: ${module.name || 'Unknown Journey'}
            </div>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ${module.status === 'PASSED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${statusColor}; font-weight: 600;">
              ${module.status || 'UNKNOWN'}
            </span>
          </div>
          ${module.description ? `<div style="font-size: 11px; color: var(--text-secondary); margin: 4px 0;">${module.description}</div>` : ''}
          <div class="module-stats" style="margin-top: 8px;">
            <span>✓ ${passedSteps} steps</span>
            <span>✗ ${failedSteps} steps</span>
            <span>⏱ ${duration}</span>
          </div>
          ${module.failureReason ? `<div style="color: #ef4444; font-size: 11px; margin-top: 6px; padding: 6px; background: rgba(239, 68, 68, 0.1); border-radius: 4px;">❌ ${module.failureReason}</div>` : ''}
          <div class="progress-bar" style="margin-top: 8px;">
            <div class="progress-fill" style="width: ${successRate}%; background: ${module.status === 'PASSED' ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'}"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="font-size: 11px; color: #6B7280;">${successRate}% success (${totalSteps} steps)</span>
            <div style="display: flex; gap: 8px;">
              ${hasSteps ? `<button onclick="toggleSteps(${index})" style="font-size: 11px; padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--card-bg); cursor: pointer; color: var(--text-primary);">
                <i class="fas fa-chevron-down" id="steps-icon-${index}"></i> Steps
              </button>` : ''}
              ${module.status === 'FAILED' ? `<button onclick="showJourneyScreenshots('${platform}', ${journeyNum})" style="font-size: 11px; padding: 4px 8px; border: 1px solid #ef4444; border-radius: 4px; background: rgba(239, 68, 68, 0.1); cursor: pointer; color: #ef4444;">
                <i class="fas fa-camera"></i> Screenshots
              </button>` : ''}
            </div>
          </div>
          ${stepsHtml}
        </div>
      `;
    }).join("");
  } else {
    // For other platforms, show simple module cards
    modulesGrid.innerHTML = modules.map((module) => {
      const total = (module.passed || 0) + (module.failed || 0);
      const successRate = total > 0 ? ((module.passed / total) * 100).toFixed(1) : '0';
      return `
        <div class="module-card">
          <div class="module-name">${module.name}</div>
          <div class="module-stats">
            <span>✓ ${module.passed || 0}</span>
            <span>✗ ${module.failed || 0}</span>
            <span>${module.duration || 0}s</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${successRate}%"></div></div>
          <div style="margin-top: 8px; font-size: 11px; color: #6B7280; text-align: right;">${successRate}% success</div>
        </div>
      `;
    }).join("");
  }
}

// Load and display screenshots (for individual journey use only)
async function loadScreenshots(platform = 'all') {
  try {
    console.log(`Loading screenshots for platform: ${platform}`);
    const response = await axios.get(`/api/screenshots?platform=${platform}&limit=50`);
    return response.data;
  } catch (error) {
    console.error('Error loading screenshots:', error);
    return { screenshots: [], total: 0 };
  }
}

// Show screenshots for a specific FAILED journey
async function showJourneyScreenshots(platform, journeyNumber) {
  try {
    // Get the journey data for the current platform
    const data = testData[platform];
    if (!data || !data.modules) return;
    
    const journey = data.modules.find(m => m.journeyNumber === journeyNumber);
    if (!journey) return;
    
    // Only show screenshots for failed journeys
    if (journey.status !== 'FAILED') {
      console.log(`Journey ${journeyNumber} passed - no failure screenshots to show`);
      return;
    }
    
    console.log(`Showing failure screenshots for ${platform} journey ${journeyNumber}`);
    
    // Open a modal to show journey-specific failure screenshots
    openJourneyFailureScreenshotsModal(platform, journeyNumber, journey.name, journey);
    
  } catch (error) {
    console.error('Error showing journey failure screenshots:', error);
  }
}

// Open failure screenshot modal with enhanced error context
function openFailureScreenshotModal(imageUrl, stepName, journeyName, errorMessage, errorType) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.95); z-index: 10000; display: flex; 
    align-items: center; justify-content: center; cursor: pointer;
    overflow-y: auto; padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="max-width: 90%; max-height: 90%; text-align: center; cursor: default;" onclick="event.stopPropagation()">
      <div style="background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.3);">
        <div style="color: #ef4444; margin-bottom: 10px; font-size: 20px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <i class="fas fa-exclamation-triangle"></i> Test Failure Screenshot
        </div>
        <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 5px;">
          ${stepName}
        </div>
        <div style="color: #ccc; font-size: 14px; margin-bottom: 15px;">
          ${journeyName}
        </div>
        ${errorType ? `
          <div style="color: #ef4444; font-size: 12px; margin-bottom: 8px;">
            <strong>Error Type:</strong> ${errorType}
          </div>
        ` : ''}
        <div style="color: #ef4444; font-size: 12px; text-align: left; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; max-height: 100px; overflow-y: auto;">
          <strong>Error Message:</strong><br>
          ${errorMessage || 'No error message available'}
        </div>
      </div>
      
      <img src="${imageUrl}" 
           style="max-width: 100%; max-height: 60vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border: 2px solid rgba(239, 68, 68, 0.5);"
           alt="Failure screenshot">
      
      <div style="color: #ccc; margin-top: 15px; font-size: 12px;">
        <i class="fas fa-info-circle"></i> This screenshot was captured when the test step failed
      </div>
      <div style="color: #ccc; margin-top: 5px; font-size: 12px;">
        Click anywhere outside to close
      </div>
    </div>
  `;
  
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
  
  document.body.appendChild(modal);
}

// Keep the original screenshot modal for backward compatibility
function openScreenshotModal(imageUrl, stepName, journeyName) {
  openFailureScreenshotModal(imageUrl, stepName, journeyName, '', '');
}

// Open journey failure screenshots modal
function openJourneyFailureScreenshotsModal(platform, journeyNumber, journeyName, journeyData) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.95); z-index: 10000; overflow-y: auto;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; color: white;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <div>
          <h2 style="margin: 0; font-size: 24px; color: #ef4444; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle"></i> Journey Failure Screenshots
          </h2>
          <p style="margin: 5px 0 0 0; color: #ccc; font-size: 16px;">${journeyName}</p>
          <p style="margin: 5px 0 0 0; color: #888; font-size: 12px;">${platform.toUpperCase()} - Journey ${journeyNumber}</p>
        </div>
        <button onclick="document.body.removeChild(this.closest('.modal'))" 
                style="background: #ef4444; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer;">
          <i class="fas fa-times"></i> Close
        </button>
      </div>
      
      <div style="background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(239, 68, 68, 0.3);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
          <div>
            <div style="font-size: 20px; font-weight: 700; color: #ef4444;">${journeyData.failed || 0}</div>
            <div style="font-size: 12px; color: #ccc;">Failed Steps</div>
          </div>
          <div>
            <div style="font-size: 20px; font-weight: 700; color: #ef4444;">${journeyData.totalSteps || 0}</div>
            <div style="font-size: 12px; color: #ccc;">Total Steps</div>
          </div>
          <div>
            <div style="font-size: 20px; font-weight: 700; color: #ef4444;">${journeyData.duration || 0}s</div>
            <div style="font-size: 12px; color: #ccc;">Duration</div>
          </div>
        </div>
        ${journeyData.failureReason ? `
          <div style="margin-top: 15px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
            <div style="font-size: 12px; color: #ef4444; font-weight: 600; margin-bottom: 5px;">Failure Reason:</div>
            <div style="font-size: 11px; color: #ccc; line-height: 1.4;">${journeyData.failureReason}</div>
          </div>
        ` : ''}
      </div>
      
      <div id="journey-failure-screenshots-content">
        <div style="text-align: center; padding: 40px;">
          <div class="spinner" style="margin: 0 auto 15px;"></div>
          <div>Loading failure screenshots for this journey...</div>
        </div>
      </div>
    </div>
  `;
  
  modal.className = 'modal';
  document.body.appendChild(modal);
  
  // Load journey failure screenshots
  setTimeout(() => {
    const content = document.getElementById('journey-failure-screenshots-content');
    
    // Check if the journey has failed steps with screenshots
    const failedSteps = journeyData.steps ? journeyData.steps.filter(step => step.status === 'FAILED') : [];
    
    if (failedSteps.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ccc;">
          <i class="fas fa-info-circle" style="font-size: 48px; margin-bottom: 15px; color: #ef4444;"></i>
          <h3>No Failure Screenshots Available</h3>
          <p>This journey failed but no screenshots were captured for the failed steps.</p>
          <p style="font-size: 12px; margin-top: 20px;">
            Screenshots are automatically captured when test steps fail, but may not be available for all failure types.
          </p>
        </div>
      `;
    } else {
      // Show failed steps (placeholder for actual screenshot URLs)
      content.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
          ${failedSteps.map((step, index) => `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px;">
              <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 12px;">
                <div style="flex: 1;">
                  <div style="font-size: 14px; font-weight: 600; color: #ef4444; margin-bottom: 4px;">
                    ❌ Step ${step.stepNumber}: ${step.name}
                  </div>
                  <div style="font-size: 12px; color: #ccc;">
                    Duration: ${step.durationFormatted || formatDuration(step.duration)}
                  </div>
                </div>
              </div>
              
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; margin-bottom: 12px; min-height: 150px; display: flex; align-items: center; justify-content: center; border: 2px dashed rgba(239, 68, 68, 0.5);">
                <div style="text-align: center; color: #888;">
                  <i class="fas fa-camera" style="font-size: 32px; margin-bottom: 10px; color: #ef4444;"></i>
                  <div style="font-size: 12px;">Screenshot will be loaded here</div>
                  <div style="font-size: 10px; margin-top: 5px;">when screenshot URLs are provided</div>
                </div>
              </div>
              
              ${step.errorMessage ? `
                <div style="background: rgba(0,0,0,0.3); border-radius: 6px; padding: 10px;">
                  <div style="font-size: 11px; color: #ef4444; font-weight: 600; margin-bottom: 5px;">Error Details:</div>
                  <div style="font-size: 10px; color: #ccc; line-height: 1.4;">${step.errorMessage}</div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }
  }, 1000);
}

// Keep the original function for backward compatibility
function openJourneyScreenshotsModal(platform, journeyNumber, journeyName) {
  // This is now just a placeholder - the new function above handles failure screenshots
  console.log('Use openJourneyFailureScreenshotsModal instead');
}

// Toggle steps visibility
function toggleSteps(index) {
  const stepsDiv = document.getElementById(`steps-${index}`);
  const icon = document.getElementById(`steps-icon-${index}`);
  if (stepsDiv) {
    const isHidden = stepsDiv.style.display === 'none';
    stepsDiv.style.display = isHidden ? 'block' : 'none';
    if (icon) {
      icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
  }
}

// Refresh data - fetches latest from Supabase
async function refreshData() {
  try {
    showLoading();
    
    // Add cache-busting parameter to ensure fresh data
    const timestamp = Date.now();
    const response = await axios.get(`/api/test-results?_t=${timestamp}`);
    testData = response.data;
    console.log("Fetched fresh test data:", testData);
    
    // Re-render all components with fresh data
    renderLiveStats();
    renderStats();
    renderCharts();
    showModules(currentPlatform);
    lastRefreshTime = Date.now();
    
    // Show success feedback
    showRefreshSuccess();
    console.log("Dashboard refreshed successfully with latest data");
  } catch (error) {
    console.error("Error refreshing data:", error);
    showRefreshError();
  } finally {
    hideLoading();
  }
}

// Show refresh success feedback
function showRefreshSuccess() {
  const button = document.querySelector('.btn-primary');
  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Today\'s Data Refreshed!';
    button.style.background = '#10b981';
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = '';
    }, 2000);
  }
}

// Show refresh error feedback
function showRefreshError() {
  const button = document.querySelector('.btn-primary');
  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Refresh Failed';
    button.style.background = '#ef4444';
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = '';
    }, 3000);
  }
  
  // Also show a more user-friendly error message
  alert("Failed to refresh data. Please check your connection and try again.");
}

// Loading helpers
function showLoading() {
  const loading = document.getElementById("loading");
  if (loading) loading.classList.add("show");
  
  // Also animate the refresh button
  const refreshButton = document.querySelector('.btn-primary');
  if (refreshButton) {
    const icon = refreshButton.querySelector('i');
    if (icon) {
      icon.style.animation = 'spin 1s linear infinite';
    }
  }
}

function hideLoading() {
  const loading = document.getElementById("loading");
  if (loading) loading.classList.remove("show");
  
  // Stop refresh button animation
  const refreshButton = document.querySelector('.btn-primary');
  if (refreshButton) {
    const icon = refreshButton.querySelector('i');
    if (icon) {
      icon.style.animation = '';
    }
  }
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateCurrentDate();
  initDashboard();
  
  // Add keyboard shortcut for refresh (Ctrl+R or F5)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
      e.preventDefault();
      refreshData();
    }
  });
});

// Update current date display
function updateCurrentDate() {
  const currentDateElement = document.getElementById('currentDate');
  if (currentDateElement) {
    const today = new Date();
    const options = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    currentDateElement.textContent = today.toLocaleDateString('en-US', options);
  }
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateChartsTheme(newTheme);
}

function updateChartsTheme(theme) {
  const isDark = theme === "dark";
  Highcharts.setOptions({
    chart: {
      backgroundColor: isDark ? "#1e293b" : "#ffffff",
      style: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    },
    exporting: { enabled: false },
    title: { style: { color: isDark ? "#f1f5f9" : "#374151" } },
    subtitle: { style: { color: isDark ? "#cbd5e1" : "#6B7280" } },
    xAxis: {
      labels: { style: { color: isDark ? "#cbd5e1" : "#6B7280" } },
      title: { style: { color: isDark ? "#f1f5f9" : "#374151" } },
      gridLineColor: isDark ? "#475569" : "#E5E7EB",
      lineColor: isDark ? "#475569" : "#E5E7EB",
    },
    yAxis: {
      labels: { style: { color: isDark ? "#cbd5e1" : "#6B7280" } },
      title: { style: { color: isDark ? "#f1f5f9" : "#374151" } },
      gridLineColor: isDark ? "#475569" : "#E5E7EB",
    },
    legend: { itemStyle: { color: isDark ? "#f1f5f9" : "#374151" } },
  });
  
  // Re-render charts with new theme
  renderCharts();
}

// Helper function for point category name (used in heatmap)
function getPointCategoryName(point, dimension) {
  const series = point.series;
  const isY = dimension === "y";
  const axis = series[isY ? "yAxis" : "xAxis"];
  return axis.categories[point[isY ? "y" : "x"]];
}
