import { createClient } from '@supabase/supabase-js';

// Supabase configuration from Playwright automation
const supabaseUrl = 'https://wnymknrycmldwqzdqoct.supabase.co';
// Using service_role key to bypass RLS for reading data
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueW1rbnJ5Y21sZHdxemRxb2N0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzcwMDk1MywiZXhwIjoyMDgzMjc2OTUzfQ.HCK8yC6jRIb67LUxOEEXI_dLs_fXcLK6m4_50iN8tPU';

// Create Supabase client with service role access (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Database types
export interface TestRun {
  run_id: string;
  framework: string;
  suite_name: string;
  environment: string;
  platform: string;
  executed_at: string;
  completed_at: string | null;
  total_runtime_ms: number | null;
  total_journeys: number;
  passed_journeys: number;
  failed_journeys: number;
  skipped_journeys: number;
  total_steps: number;
  passed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  success_rate: number | null;
  build_number: string | null;
  build_url: string | null;
  job_name: string | null;
  report_url: string | null;
  slack_notification_sent: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Journey {
  journey_id: string;
  run_id: string;
  journey_number: number;
  journey_name: string;
  journey_description: string | null;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  failure_reason: string | null;
  error_type: string | null;
  error_message: string | null;
  error_stack: string | null;
  total_steps: number;
  passed_steps: number;
  failed_steps: number;
  screenshot_url: string | null;
  video_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Step {
  step_id: string;
  journey_id: string;
  run_id: string;
  step_number: number;
  step_name: string;
  step_description: string | null;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  start_time: string;
  end_time: string | null;
  duration_ms: number | null;
  error_type: string | null;
  error_message: string | null;
  error_stack: string | null;
  api_calls: any;
  screenshot_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}
