-- Verify latest test run
SELECT 
  run_id,
  framework,
  environment,
  total_journeys,
  total_steps,
  passed_steps,
  failed_steps,
  success_rate,
  executed_at,
  completed_at
FROM test_runs 
ORDER BY executed_at DESC 
LIMIT 1;

-- Verify journeys for latest run
SELECT 
  journey_id,
  run_id,
  journey_number,
  journey_name,
  status,
  total_steps,
  passed_steps,
  failed_steps,
  duration_ms,
  start_time
FROM journeys 
WHERE run_id = 'd95e825f-98c9-4b7f-b7d5-da9ca6924408'
ORDER BY journey_number;

-- Verify steps for latest journey
SELECT 
  step_id,
  journey_id,
  step_number,
  step_name,
  status,
  duration_ms,
  start_time,
  end_time
FROM steps 
WHERE journey_id = '2b495ec5-6a64-4a28-8cab-48d11f383dd8'
ORDER BY step_number;

-- Count records
SELECT 
  (SELECT COUNT(*) FROM test_runs) as total_runs,
  (SELECT COUNT(*) FROM journeys) as total_journeys,
  (SELECT COUNT(*) FROM steps) as total_steps;
