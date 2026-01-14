-- Supabase Database Functions for OMS & Partner Panel Dashboard
-- Run these functions in your Supabase SQL Editor if they don't already exist

-- Function: Get system health for last 24 hours
CREATE OR REPLACE FUNCTION get_system_health_24h()
RETURNS TABLE (
  system TEXT,
  runs_last_24h BIGINT,
  successful_runs BIGINT,
  failed_runs BIGINT,
  avg_success_rate NUMERIC,
  avg_runtime_ms NUMERIC,
  last_execution TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (metadata->>'system')::TEXT as system,
    COUNT(*)::BIGINT as runs_last_24h,
    SUM(CASE WHEN failed_journeys = 0 THEN 1 ELSE 0 END)::BIGINT as successful_runs,
    SUM(CASE WHEN failed_journeys > 0 THEN 1 ELSE 0 END)::BIGINT as failed_runs,
    ROUND(AVG(success_rate), 2) as avg_success_rate,
    ROUND(AVG(total_runtime_ms)) as avg_runtime_ms,
    MAX(executed_at) as last_execution
  FROM test_runs
  WHERE executed_at >= NOW() - INTERVAL '24 hours'
    AND metadata->>'system' IS NOT NULL
    AND metadata->>'system' IN ('OMS', 'PARTNER_PANEL')
  GROUP BY metadata->>'system';
END;
$$ LANGUAGE plpgsql;

-- Function: Get correlated runs (OMS + Partner Panel from same execution)
CREATE OR REPLACE FUNCTION get_correlated_runs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  master_execution_id TEXT,
  oms_run_id TEXT,
  oms_status TEXT,
  oms_success_rate NUMERIC,
  oms_tabs TEXT,
  oms_runtime_ms INTEGER,
  pp_run_id TEXT,
  pp_status TEXT,
  pp_success_rate NUMERIC,
  pp_tabs TEXT,
  pp_runtime_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (oms.metadata->>'master_execution_id')::TEXT as master_execution_id,
    (oms.metadata->>'readable_run_id')::TEXT AS oms_run_id,
    CASE WHEN oms.failed_journeys = 0 THEN 'PASSED' ELSE 'FAILED' END AS oms_status,
    oms.success_rate AS oms_success_rate,
    (oms.metadata->>'total_tabs_tested')::TEXT AS oms_tabs,
    oms.total_runtime_ms AS oms_runtime_ms,
    (pp.metadata->>'readable_run_id')::TEXT AS pp_run_id,
    CASE WHEN pp.failed_journeys = 0 THEN 'PASSED' ELSE 'FAILED' END AS pp_status,
    pp.success_rate AS pp_success_rate,
    (pp.metadata->>'total_tabs_tested')::TEXT AS pp_tabs,
    pp.total_runtime_ms AS pp_runtime_ms,
    oms.executed_at,
    oms.completed_at
  FROM test_runs oms
  LEFT JOIN test_runs pp ON oms.metadata->>'master_execution_id' = pp.metadata->>'master_execution_id'
    AND pp.metadata->>'system' = 'PARTNER_PANEL'
  WHERE oms.metadata->>'system' = 'OMS'
  ORDER BY oms.executed_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get tab performance for a specific system
CREATE OR REPLACE FUNCTION get_tab_performance(
  system_name TEXT,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  tab_name TEXT,
  test_count BIGINT,
  avg_load_time_ms NUMERIC,
  min_load_time_ms NUMERIC,
  max_load_time_ms NUMERIC,
  passed_count BIGINT,
  failed_count BIGINT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (s.metadata->>'tab_name')::TEXT as tab_name,
    COUNT(*)::BIGINT as test_count,
    ROUND(AVG((s.metadata->>'load_time_ms')::numeric)) as avg_load_time_ms,
    MIN((s.metadata->>'load_time_ms')::numeric) as min_load_time_ms,
    MAX((s.metadata->>'load_time_ms')::numeric) as max_load_time_ms,
    COUNT(*) FILTER (WHERE s.status = 'PASSED')::BIGINT as passed_count,
    COUNT(*) FILTER (WHERE s.status = 'FAILED')::BIGINT as failed_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE s.status = 'PASSED') / COUNT(*), 2) as success_rate
  FROM steps s
  JOIN test_runs tr ON s.run_id = tr.run_id
  WHERE s.metadata->>'load_time_ms' IS NOT NULL
    AND s.step_name LIKE 'Tab:%'
    AND tr.metadata->>'system' = system_name
    AND s.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY s.metadata->>'tab_name'
  ORDER BY avg_load_time_ms DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get recent failures for OMS and Partner Panel
CREATE OR REPLACE FUNCTION get_recent_failures(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  system TEXT,
  readable_run_id TEXT,
  step_name TEXT,
  error_type TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (tr.metadata->>'system')::TEXT as system,
    (tr.metadata->>'readable_run_id')::TEXT as readable_run_id,
    s.step_name::TEXT,
    s.error_type::TEXT,
    s.error_message::TEXT,
    s.duration_ms,
    s.created_at
  FROM steps s
  JOIN test_runs tr ON s.run_id = tr.run_id
  WHERE s.status = 'FAILED'
    AND tr.metadata->>'system' IN ('OMS', 'PARTNER_PANEL')
  ORDER BY s.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_system_health_24h() TO authenticated;
GRANT EXECUTE ON FUNCTION get_correlated_runs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tab_performance(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_failures(INTEGER) TO authenticated;

-- Grant execute permissions to service_role (for API access)
GRANT EXECUTE ON FUNCTION get_system_health_24h() TO service_role;
GRANT EXECUTE ON FUNCTION get_correlated_runs(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_tab_performance(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_recent_failures(INTEGER) TO service_role;