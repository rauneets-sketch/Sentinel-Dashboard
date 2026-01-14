-- ============================================================================
-- FNP Automation Framework - Supabase Database Schema
-- Purpose: Centralized test execution logging for React dashboard analytics
-- Architecture: Hybrid approach with immutable raw storage + normalized metrics
-- Version: 2.0.0
-- Created: January 8, 2026
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- TABLE: raw_test_logs (Immutable Raw Storage)
-- Purpose: Store complete JSON payloads immutably for audit and reprocessing
-- Strategy: Write-once, never update. Complete execution fidelity.
-- ============================================================================
CREATE TABLE IF NOT EXISTS raw_test_logs (
    -- Primary Key
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Immutable raw payload (complete JSON from CI pipeline)
    raw_payload JSONB NOT NULL,
    
    -- Metadata for quick filtering (extracted from payload)
    run_id UUID NOT NULL,                              -- Extracted from payload.run_id
    framework VARCHAR(50) NOT NULL,                    -- Extracted from payload.framework
    environment VARCHAR(50) NOT NULL,                  -- Extracted from payload.environment
    executed_at TIMESTAMPTZ NOT NULL,                  -- Extracted from payload.executed_at
    
    -- Ingestion metadata
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- When log was received
    ingestion_source VARCHAR(100),                     -- e.g., 'jenkins', 'github-actions', 'manual'
    
    -- Processing status
    processed BOOLEAN DEFAULT FALSE,                   -- Whether normalized tables were populated
    processing_error TEXT,                             -- Error message if processing failed
    
    -- Audit fields (immutable - no updates allowed)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent updates to raw logs (immutability enforcement)
CREATE OR REPLACE FUNCTION prevent_raw_log_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'raw_test_logs table is immutable - updates not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_raw_log_immutability
    BEFORE UPDATE ON raw_test_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_raw_log_updates();

-- ============================================================================
-- TABLE: test_runs (Normalized Metrics)
-- Purpose: Stores high-level test execution metadata extracted from raw logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_runs (
    -- Primary Key
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Framework & Suite Information
    framework VARCHAR(50) NOT NULL,                    -- e.g., 'playwright', 'selenium', 'cypress'
    suite_name VARCHAR(255) NOT NULL,                  -- e.g., 'FNP Automation Framework'
    
    -- Environment & Platform
    environment VARCHAR(50) NOT NULL,                  -- e.g., 'dev', 'uat', 'prod'
    platform VARCHAR(50) NOT NULL,                     -- e.g., 'web', 'mobile', 'api'
    
    -- Execution Timing
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- When the test run started
    completed_at TIMESTAMPTZ,                          -- When the test run completed
    total_runtime_ms BIGINT,                           -- Total execution time in milliseconds
    
    -- Summary Statistics
    total_journeys INTEGER NOT NULL DEFAULT 0,         -- Total number of journeys executed
    passed_journeys INTEGER NOT NULL DEFAULT 0,        -- Number of journeys that passed
    failed_journeys INTEGER NOT NULL DEFAULT 0,        -- Number of journeys that failed
    skipped_journeys INTEGER NOT NULL DEFAULT 0,       -- Number of journeys that were skipped
    total_steps INTEGER NOT NULL DEFAULT 0,            -- Total number of steps executed
    passed_steps INTEGER NOT NULL DEFAULT 0,           -- Number of steps that passed
    failed_steps INTEGER NOT NULL DEFAULT 0,           -- Number of steps that failed
    skipped_steps INTEGER NOT NULL DEFAULT 0,          -- Number of steps that were skipped
    success_rate DECIMAL(5,2),                         -- Overall success rate (0-100)
    
    -- Build & CI Information
    build_number VARCHAR(100),                         -- Jenkins/CI build number
    build_url TEXT,                                    -- Jenkins/CI build URL
    job_name VARCHAR(255),                             -- Jenkins/CI job name
    
    -- Report URLs
    report_url TEXT,                                   -- S3 or external report URL
    slack_notification_sent BOOLEAN DEFAULT FALSE,     -- Whether Slack notification was sent
    
    -- Additional Metadata (JSONB for flexibility)
    metadata JSONB,                                    -- Additional custom metadata
    
    -- Link to raw log
    raw_log_id UUID REFERENCES raw_test_logs(log_id) ON DELETE SET NULL,
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100),
    CONSTRAINT valid_journey_counts CHECK (
        total_journeys = passed_journeys + failed_journeys + skipped_journeys
    ),
    CONSTRAINT valid_step_counts CHECK (
        total_steps = passed_steps + failed_steps + skipped_steps
    )
);

-- ============================================================================
-- TABLE: journeys
-- Purpose: Stores individual journey (scenario) execution details
-- ============================================================================
CREATE TABLE IF NOT EXISTS journeys (
    -- Primary Key
    journey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key to test_runs
    run_id UUID NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
    
    -- Journey Identification
    journey_number INTEGER NOT NULL,                   -- e.g., 1, 2, 3... (Journey 1, Journey 2, etc.)
    journey_name VARCHAR(500) NOT NULL,                -- e.g., 'Home Page Exploration', 'ADD-On Testing on PDP'
    journey_description TEXT,                          -- Detailed description of the journey
    
    -- Execution Status
    status VARCHAR(20) NOT NULL,                       -- 'PASSED', 'FAILED', 'SKIPPED'
    
    -- Timing Information
    start_time TIMESTAMPTZ NOT NULL,                   -- When the journey started
    end_time TIMESTAMPTZ,                              -- When the journey completed
    duration_ms BIGINT,                                -- Journey execution time in milliseconds
    
    -- Failure Information
    failure_reason TEXT,                               -- High-level failure reason
    error_type VARCHAR(255),                           -- Error type (e.g., 'TimeoutError', 'AssertionError')
    error_message TEXT,                                -- Detailed error message
    error_stack TEXT,                                  -- Stack trace (truncated)
    
    -- Step Statistics
    total_steps INTEGER NOT NULL DEFAULT 0,            -- Total steps in this journey
    passed_steps INTEGER NOT NULL DEFAULT 0,           -- Passed steps in this journey
    failed_steps INTEGER NOT NULL DEFAULT 0,           -- Failed steps in this journey
    
    -- Screenshot & Artifacts
    screenshot_url TEXT,                               -- URL to failure screenshot (if any)
    video_url TEXT,                                    -- URL to execution video (if any)
    
    -- Additional Metadata
    metadata JSONB,                                    -- Additional journey-specific metadata
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: steps
-- Purpose: Stores individual step execution details within journeys
-- ============================================================================
CREATE TABLE IF NOT EXISTS steps (
    -- Primary Key
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    journey_id UUID NOT NULL REFERENCES journeys(journey_id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
    
    -- Step Identification
    step_number INTEGER NOT NULL,                      -- Sequential step number within journey
    step_name VARCHAR(500) NOT NULL,                   -- e.g., 'Navigate to Login Page', 'Add Product to Cart'
    step_description TEXT,                             -- Detailed step description
    
    -- Execution Status
    status VARCHAR(20) NOT NULL,                       -- 'PASSED', 'FAILED', 'SKIPPED'
    
    -- Timing Information
    start_time TIMESTAMPTZ NOT NULL,                   -- When the step started
    end_time TIMESTAMPTZ,                              -- When the step completed
    duration_ms BIGINT,                                -- Step execution time in milliseconds
    
    -- Failure Information
    error_type VARCHAR(255),                           -- Error type (e.g., 'TimeoutError', 'LocatorError')
    error_message TEXT,                                -- Detailed error message
    error_stack TEXT,                                  -- Stack trace (truncated to first 5 lines)
    
    -- API Call Information (for steps that make API calls)
    api_calls JSONB,                                   -- Array of API calls made during this step
    
    -- Screenshot & Artifacts
    screenshot_url TEXT,                               -- URL to step screenshot (if captured)
    
    -- Additional Metadata
    metadata JSONB,                                    -- Additional step-specific metadata
    
    -- Audit Fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: health_scores (Aggregated Health Metrics)
-- Purpose: Pre-computed health scores for dashboard performance
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_scores (
    -- Primary Key
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Scope
    framework VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    time_period VARCHAR(20) NOT NULL,                  -- 'daily', 'weekly', 'monthly'
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Health Metrics
    total_runs INTEGER NOT NULL DEFAULT 0,
    successful_runs INTEGER NOT NULL DEFAULT 0,
    failed_runs INTEGER NOT NULL DEFAULT 0,
    avg_success_rate DECIMAL(5,2),
    avg_runtime_ms BIGINT,
    
    -- Journey Metrics
    total_journeys INTEGER NOT NULL DEFAULT 0,
    most_failed_journey VARCHAR(500),
    most_failed_journey_count INTEGER,
    
    -- Step Metrics
    total_steps INTEGER NOT NULL DEFAULT 0,
    avg_step_duration_ms BIGINT,
    slowest_step VARCHAR(500),
    slowest_step_duration_ms BIGINT,
    
    -- Trend Indicators
    success_rate_trend DECIMAL(5,2),                   -- Change from previous period
    runtime_trend_ms BIGINT,                           -- Change from previous period
    
    -- Metadata
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE(framework, environment, time_period, period_start)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- raw_test_logs indexes
CREATE INDEX idx_raw_logs_run_id ON raw_test_logs(run_id);
CREATE INDEX idx_raw_logs_framework ON raw_test_logs(framework);
CREATE INDEX idx_raw_logs_environment ON raw_test_logs(environment);
CREATE INDEX idx_raw_logs_executed_at ON raw_test_logs(executed_at DESC);
CREATE INDEX idx_raw_logs_ingested_at ON raw_test_logs(ingested_at DESC);
CREATE INDEX idx_raw_logs_processed ON raw_test_logs(processed);
CREATE INDEX idx_raw_logs_payload ON raw_test_logs USING GIN(raw_payload);

-- test_runs indexes
CREATE INDEX idx_test_runs_framework ON test_runs(framework);
CREATE INDEX idx_test_runs_environment ON test_runs(environment);
CREATE INDEX idx_test_runs_platform ON test_runs(platform);
CREATE INDEX idx_test_runs_executed_at ON test_runs(executed_at DESC);
CREATE INDEX idx_test_runs_status ON test_runs(failed_journeys, passed_journeys);
CREATE INDEX idx_test_runs_build_number ON test_runs(build_number);

-- journeys indexes
CREATE INDEX idx_journeys_run_id ON journeys(run_id);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_journeys_journey_number ON journeys(journey_number);
CREATE INDEX idx_journeys_start_time ON journeys(start_time DESC);
CREATE INDEX idx_journeys_duration ON journeys(duration_ms DESC);
CREATE INDEX idx_journeys_run_status ON journeys(run_id, status);

-- steps indexes
CREATE INDEX idx_steps_journey_id ON steps(journey_id);
CREATE INDEX idx_steps_run_id ON steps(run_id);
CREATE INDEX idx_steps_status ON steps(status);
CREATE INDEX idx_steps_step_number ON steps(step_number);
CREATE INDEX idx_steps_duration ON steps(duration_ms DESC);
CREATE INDEX idx_steps_journey_status ON steps(journey_id, status);

-- JSONB indexes for metadata queries
CREATE INDEX idx_test_runs_metadata ON test_runs USING GIN(metadata);
CREATE INDEX idx_journeys_metadata ON journeys USING GIN(metadata);
CREATE INDEX idx_steps_metadata ON steps USING GIN(metadata);
CREATE INDEX idx_steps_api_calls ON steps USING GIN(api_calls);

-- health_scores indexes
CREATE INDEX idx_health_scores_framework_env ON health_scores(framework, environment);
CREATE INDEX idx_health_scores_period ON health_scores(time_period, period_start DESC);
CREATE INDEX idx_health_scores_computed_at ON health_scores(computed_at DESC);

-- Composite indexes for common dashboard queries
CREATE INDEX idx_test_runs_timeline ON test_runs(framework, environment, executed_at DESC);
CREATE INDEX idx_journeys_failure_analysis ON journeys(journey_name, status, start_time DESC) WHERE status = 'FAILED';
CREATE INDEX idx_steps_timing_analysis ON steps(step_name, duration_ms DESC, status);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to test_runs
CREATE TRIGGER update_test_runs_updated_at
    BEFORE UPDATE ON test_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to journeys
CREATE TRIGGER update_journeys_updated_at
    BEFORE UPDATE ON journeys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to steps
CREATE TRIGGER update_steps_updated_at
    BEFORE UPDATE ON steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to health_scores
CREATE TRIGGER update_health_scores_updated_at
    BEFORE UPDATE ON health_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Purpose: Enforce read-only access for frontend, write access for service role
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE raw_test_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for CI pipeline ingestion)
-- Note: Service role bypasses RLS by default, but we define policies for clarity

-- Policy: Authenticated users (frontend) have read-only access to all tables
CREATE POLICY "Frontend read-only access to raw_test_logs"
    ON raw_test_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Frontend read-only access to test_runs"
    ON test_runs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Frontend read-only access to journeys"
    ON journeys FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Frontend read-only access to steps"
    ON steps FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Frontend read-only access to health_scores"
    ON health_scores FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Anonymous users (public dashboard) have limited read access
-- Uncomment if you want to allow public access to certain views
-- CREATE POLICY "Public read access to health_scores"
--     ON health_scores FOR SELECT
--     TO anon
--     USING (true);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES (React Dashboard Optimization)
-- ============================================================================

-- View: Latest test runs with summary (ordered timeline)
CREATE OR REPLACE VIEW v_latest_test_runs AS
SELECT 
    run_id,
    framework,
    suite_name,
    environment,
    platform,
    executed_at,
    completed_at,
    total_runtime_ms,
    total_journeys,
    passed_journeys,
    failed_journeys,
    total_steps,
    passed_steps,
    failed_steps,
    success_rate,
    build_number,
    report_url,
    CASE 
        WHEN failed_journeys = 0 THEN 'SUCCESS'
        ELSE 'FAILURE'
    END as overall_status
FROM test_runs
ORDER BY executed_at DESC
LIMIT 100;

-- View: Journey failure analysis
CREATE OR REPLACE VIEW v_journey_failure_analysis AS
SELECT 
    j.journey_name,
    j.journey_number,
    COUNT(*) as failure_count,
    AVG(j.duration_ms) as avg_duration_ms,
    MAX(j.start_time) as last_failure_time,
    j.error_type,
    j.failure_reason
FROM journeys j
WHERE j.status = 'FAILED'
GROUP BY j.journey_name, j.journey_number, j.error_type, j.failure_reason
ORDER BY failure_count DESC;

-- View: Step-level timing heatmap data
CREATE OR REPLACE VIEW v_step_timing_heatmap AS
SELECT 
    s.step_name,
    j.journey_name,
    AVG(s.duration_ms) as avg_duration_ms,
    MIN(s.duration_ms) as min_duration_ms,
    MAX(s.duration_ms) as max_duration_ms,
    STDDEV(s.duration_ms) as stddev_duration_ms,
    COUNT(*) as execution_count,
    SUM(CASE WHEN s.status = 'FAILED' THEN 1 ELSE 0 END) as failure_count
FROM steps s
JOIN journeys j ON s.journey_id = j.journey_id
GROUP BY s.step_name, j.journey_name
ORDER BY avg_duration_ms DESC;

-- View: Framework comparison
CREATE OR REPLACE VIEW v_framework_comparison AS
SELECT 
    framework,
    environment,
    COUNT(*) as total_runs,
    AVG(success_rate) as avg_success_rate,
    AVG(total_runtime_ms) as avg_runtime_ms,
    SUM(total_journeys) as total_journeys_executed,
    SUM(failed_journeys) as total_failures
FROM test_runs
GROUP BY framework, environment
ORDER BY framework, environment;

-- View: Execution timeline (ordered by time for trend charts)
CREATE OR REPLACE VIEW v_execution_timeline AS
SELECT 
    run_id,
    framework,
    environment,
    executed_at,
    DATE(executed_at) as execution_date,
    EXTRACT(HOUR FROM executed_at) as execution_hour,
    success_rate,
    total_runtime_ms,
    total_journeys,
    failed_journeys,
    CASE 
        WHEN failed_journeys = 0 THEN 'SUCCESS'
        ELSE 'FAILURE'
    END as status
FROM test_runs
ORDER BY executed_at DESC;

-- View: Daily aggregated metrics (for trend charts)
CREATE OR REPLACE VIEW v_daily_metrics AS
SELECT 
    DATE(executed_at) as date,
    framework,
    environment,
    COUNT(*) as total_runs,
    SUM(CASE WHEN failed_journeys = 0 THEN 1 ELSE 0 END) as successful_runs,
    SUM(CASE WHEN failed_journeys > 0 THEN 1 ELSE 0 END) as failed_runs,
    AVG(success_rate) as avg_success_rate,
    AVG(total_runtime_ms) as avg_runtime_ms,
    SUM(total_journeys) as total_journeys,
    SUM(failed_journeys) as total_failed_journeys
FROM test_runs
GROUP BY DATE(executed_at), framework, environment
ORDER BY date DESC, framework, environment;

-- View: Journey health heatmap (journey x time)
CREATE OR REPLACE VIEW v_journey_health_heatmap AS
SELECT 
    j.journey_name,
    j.journey_number,
    DATE(j.start_time) as date,
    COUNT(*) as execution_count,
    SUM(CASE WHEN j.status = 'PASSED' THEN 1 ELSE 0 END) as passed_count,
    SUM(CASE WHEN j.status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
    AVG(j.duration_ms) as avg_duration_ms,
    ROUND(100.0 * SUM(CASE WHEN j.status = 'PASSED' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM journeys j
GROUP BY j.journey_name, j.journey_number, DATE(j.start_time)
ORDER BY date DESC, j.journey_number;

-- View: Step performance heatmap (step x journey)
CREATE OR REPLACE VIEW v_step_performance_heatmap AS
SELECT 
    s.step_name,
    j.journey_name,
    COUNT(*) as execution_count,
    AVG(s.duration_ms) as avg_duration_ms,
    MIN(s.duration_ms) as min_duration_ms,
    MAX(s.duration_ms) as max_duration_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY s.duration_ms) as median_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY s.duration_ms) as p95_duration_ms,
    STDDEV(s.duration_ms) as stddev_duration_ms,
    SUM(CASE WHEN s.status = 'FAILED' THEN 1 ELSE 0 END) as failure_count,
    ROUND(100.0 * SUM(CASE WHEN s.status = 'FAILED' THEN 1 ELSE 0 END) / COUNT(*), 2) as failure_rate
FROM steps s
JOIN journeys j ON s.journey_id = j.journey_id
GROUP BY s.step_name, j.journey_name
ORDER BY avg_duration_ms DESC;

-- View: Real-time health dashboard (last 24 hours)
CREATE OR REPLACE VIEW v_realtime_health AS
SELECT 
    framework,
    environment,
    COUNT(*) as runs_last_24h,
    SUM(CASE WHEN failed_journeys = 0 THEN 1 ELSE 0 END) as successful_runs,
    AVG(success_rate) as avg_success_rate,
    AVG(total_runtime_ms) as avg_runtime_ms,
    MAX(executed_at) as last_execution,
    SUM(failed_journeys) as total_failures
FROM test_runs
WHERE executed_at >= NOW() - INTERVAL '24 hours'
GROUP BY framework, environment;

-- View: Failure hotspots (most problematic areas)
CREATE OR REPLACE VIEW v_failure_hotspots AS
SELECT 
    'journey' as failure_type,
    j.journey_name as name,
    COUNT(*) as failure_count,
    MAX(j.start_time) as last_failure,
    j.error_type as common_error_type,
    AVG(j.duration_ms) as avg_duration_ms
FROM journeys j
WHERE j.status = 'FAILED'
    AND j.start_time >= NOW() - INTERVAL '7 days'
GROUP BY j.journey_name, j.error_type
UNION ALL
SELECT 
    'step' as failure_type,
    s.step_name as name,
    COUNT(*) as failure_count,
    MAX(s.start_time) as last_failure,
    s.error_type as common_error_type,
    AVG(s.duration_ms) as avg_duration_ms
FROM steps s
WHERE s.status = 'FAILED'
    AND s.start_time >= NOW() - INTERVAL '7 days'
GROUP BY s.step_name, s.error_type
ORDER BY failure_count DESC
LIMIT 20;

-- View: Performance trends (week-over-week comparison)
CREATE OR REPLACE VIEW v_performance_trends AS
WITH weekly_stats AS (
    SELECT 
        DATE_TRUNC('week', executed_at) as week_start,
        framework,
        environment,
        AVG(success_rate) as avg_success_rate,
        AVG(total_runtime_ms) as avg_runtime_ms,
        COUNT(*) as run_count
    FROM test_runs
    WHERE executed_at >= NOW() - INTERVAL '8 weeks'
    GROUP BY DATE_TRUNC('week', executed_at), framework, environment
)
SELECT 
    w1.week_start as current_week,
    w1.framework,
    w1.environment,
    w1.avg_success_rate as current_success_rate,
    w2.avg_success_rate as previous_success_rate,
    w1.avg_success_rate - w2.avg_success_rate as success_rate_change,
    w1.avg_runtime_ms as current_runtime_ms,
    w2.avg_runtime_ms as previous_runtime_ms,
    w1.avg_runtime_ms - w2.avg_runtime_ms as runtime_change_ms,
    w1.run_count as current_run_count,
    w2.run_count as previous_run_count
FROM weekly_stats w1
LEFT JOIN weekly_stats w2 
    ON w1.framework = w2.framework 
    AND w1.environment = w2.environment
    AND w2.week_start = w1.week_start - INTERVAL '1 week'
ORDER BY w1.week_start DESC, w1.framework, w1.environment;

-- ============================================================================
-- MATERIALIZED VIEWS FOR EXPENSIVE AGGREGATIONS
-- Purpose: Pre-compute expensive queries for dashboard performance
-- ============================================================================

-- Materialized view: Journey reliability scores (updated hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_journey_reliability AS
SELECT 
    journey_name,
    journey_number,
    COUNT(*) as total_executions,
    SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) as passed_executions,
    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_executions,
    ROUND(100.0 * SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) / COUNT(*), 2) as reliability_score,
    AVG(duration_ms) as avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    MAX(start_time) as last_execution,
    COUNT(DISTINCT run_id) as unique_runs
FROM journeys
WHERE start_time >= NOW() - INTERVAL '30 days'
GROUP BY journey_name, journey_number;

-- Create index on materialized view
CREATE INDEX idx_mv_journey_reliability_score ON mv_journey_reliability(reliability_score DESC);
CREATE INDEX idx_mv_journey_reliability_name ON mv_journey_reliability(journey_name);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_journey_reliability;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTIONS FOR HEALTH SCORE COMPUTATION
-- ============================================================================

-- Function: Compute health scores for a given period
CREATE OR REPLACE FUNCTION compute_health_scores(
    p_framework VARCHAR,
    p_environment VARCHAR,
    p_time_period VARCHAR,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS void AS $$
DECLARE
    v_total_runs INTEGER;
    v_successful_runs INTEGER;
    v_failed_runs INTEGER;
    v_avg_success_rate DECIMAL(5,2);
    v_avg_runtime_ms BIGINT;
    v_total_journeys INTEGER;
    v_most_failed_journey VARCHAR(500);
    v_most_failed_journey_count INTEGER;
    v_total_steps INTEGER;
    v_avg_step_duration_ms BIGINT;
    v_slowest_step VARCHAR(500);
    v_slowest_step_duration_ms BIGINT;
BEGIN
    -- Compute run-level metrics
    SELECT 
        COUNT(*),
        SUM(CASE WHEN failed_journeys = 0 THEN 1 ELSE 0 END),
        SUM(CASE WHEN failed_journeys > 0 THEN 1 ELSE 0 END),
        AVG(success_rate),
        AVG(total_runtime_ms),
        SUM(total_journeys)
    INTO 
        v_total_runs,
        v_successful_runs,
        v_failed_runs,
        v_avg_success_rate,
        v_avg_runtime_ms,
        v_total_journeys
    FROM test_runs
    WHERE framework = p_framework
        AND environment = p_environment
        AND executed_at >= p_period_start
        AND executed_at < p_period_end;
    
    -- Find most failed journey
    SELECT journey_name, COUNT(*)
    INTO v_most_failed_journey, v_most_failed_journey_count
    FROM journeys j
    JOIN test_runs tr ON j.run_id = tr.run_id
    WHERE tr.framework = p_framework
        AND tr.environment = p_environment
        AND j.status = 'FAILED'
        AND j.start_time >= p_period_start
        AND j.start_time < p_period_end
    GROUP BY journey_name
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Compute step-level metrics
    SELECT 
        COUNT(*),
        AVG(duration_ms)
    INTO 
        v_total_steps,
        v_avg_step_duration_ms
    FROM steps s
    JOIN test_runs tr ON s.run_id = tr.run_id
    WHERE tr.framework = p_framework
        AND tr.environment = p_environment
        AND s.start_time >= p_period_start
        AND s.start_time < p_period_end;
    
    -- Find slowest step
    SELECT step_name, AVG(duration_ms)
    INTO v_slowest_step, v_slowest_step_duration_ms
    FROM steps s
    JOIN test_runs tr ON s.run_id = tr.run_id
    WHERE tr.framework = p_framework
        AND tr.environment = p_environment
        AND s.start_time >= p_period_start
        AND s.start_time < p_period_end
    GROUP BY step_name
    ORDER BY AVG(duration_ms) DESC
    LIMIT 1;
    
    -- Insert or update health score
    INSERT INTO health_scores (
        framework,
        environment,
        time_period,
        period_start,
        period_end,
        total_runs,
        successful_runs,
        failed_runs,
        avg_success_rate,
        avg_runtime_ms,
        total_journeys,
        most_failed_journey,
        most_failed_journey_count,
        total_steps,
        avg_step_duration_ms,
        slowest_step,
        slowest_step_duration_ms
    ) VALUES (
        p_framework,
        p_environment,
        p_time_period,
        p_period_start,
        p_period_end,
        v_total_runs,
        v_successful_runs,
        v_failed_runs,
        v_avg_success_rate,
        v_avg_runtime_ms,
        v_total_journeys,
        v_most_failed_journey,
        v_most_failed_journey_count,
        v_total_steps,
        v_avg_step_duration_ms,
        v_slowest_step,
        v_slowest_step_duration_ms
    )
    ON CONFLICT (framework, environment, time_period, period_start)
    DO UPDATE SET
        total_runs = EXCLUDED.total_runs,
        successful_runs = EXCLUDED.successful_runs,
        failed_runs = EXCLUDED.failed_runs,
        avg_success_rate = EXCLUDED.avg_success_rate,
        avg_runtime_ms = EXCLUDED.avg_runtime_ms,
        total_journeys = EXCLUDED.total_journeys,
        most_failed_journey = EXCLUDED.most_failed_journey,
        most_failed_journey_count = EXCLUDED.most_failed_journey_count,
        total_steps = EXCLUDED.total_steps,
        avg_step_duration_ms = EXCLUDED.avg_step_duration_ms,
        slowest_step = EXCLUDED.slowest_step,
        slowest_step_duration_ms = EXCLUDED.slowest_step_duration_ms,
        computed_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE raw_test_logs IS 'Immutable storage for complete JSON payloads from CI pipeline';
COMMENT ON TABLE test_runs IS 'Normalized test execution metadata extracted from raw logs';
COMMENT ON TABLE journeys IS 'Individual journey (scenario) execution details';
COMMENT ON TABLE steps IS 'Individual step execution details within journeys';
COMMENT ON TABLE health_scores IS 'Pre-computed aggregated health metrics for dashboard performance';

COMMENT ON COLUMN raw_test_logs.raw_payload IS 'Complete immutable JSON payload - never modified after insertion';
COMMENT ON COLUMN raw_test_logs.processed IS 'Flag indicating whether normalized tables were populated from this log';

COMMENT ON COLUMN test_runs.run_id IS 'Unique identifier for each test run';
COMMENT ON COLUMN test_runs.framework IS 'Testing framework used (playwright, selenium, cypress, etc.)';
COMMENT ON COLUMN test_runs.success_rate IS 'Overall success rate calculated as (passed_steps / total_steps) * 100';

COMMENT ON COLUMN journeys.journey_number IS 'Sequential journey number (1, 2, 3...) matching business journey IDs';
COMMENT ON COLUMN journeys.failure_reason IS 'High-level business-friendly failure reason';

COMMENT ON COLUMN steps.api_calls IS 'JSONB array of API calls made during step execution with request/response details';

-- ============================================================================
-- SAMPLE QUERIES FOR REACT DASHBOARD
-- ============================================================================

-- Query 1: Get latest 10 test runs with summary
-- SELECT * FROM v_latest_test_runs LIMIT 10;

-- Query 2: Get execution trend for last 30 days
-- SELECT 
--     DATE(executed_at) as execution_date,
--     COUNT(*) as total_runs,
--     AVG(success_rate) as avg_success_rate,
--     SUM(CASE WHEN failed_journeys = 0 THEN 1 ELSE 0 END) as successful_runs
-- FROM test_runs
-- WHERE executed_at >= NOW() - INTERVAL '30 days'
-- GROUP BY DATE(executed_at)
-- ORDER BY execution_date DESC;

-- Query 3: Get journey pass/fail distribution for a specific run
-- SELECT 
--     journey_name,
--     status,
--     duration_ms,
--     total_steps,
--     failed_steps
-- FROM journeys
-- WHERE run_id = 'YOUR_RUN_ID'
-- ORDER BY journey_number;

-- Query 4: Get step-level details for a specific journey
-- SELECT 
--     step_number,
--     step_name,
--     status,
--     duration_ms,
--     error_message
-- FROM steps
-- WHERE journey_id = 'YOUR_JOURNEY_ID'
-- ORDER BY step_number;

-- Query 5: Get most frequently failing steps
-- SELECT 
--     step_name,
--     COUNT(*) as failure_count,
--     AVG(duration_ms) as avg_duration_ms
-- FROM steps
-- WHERE status = 'FAILED'
-- GROUP BY step_name
-- ORDER BY failure_count DESC
-- LIMIT 10;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
