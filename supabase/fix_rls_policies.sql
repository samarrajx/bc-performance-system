-- =====================================================
-- FIX RLS POLICIES FOR AGENT APP (Flutter)
-- =====================================================

-- 1. FIX daily_performance POLICY
DROP POLICY IF EXISTS agent_read_own_device ON daily_performance;

CREATE POLICY agent_read_own_device ON daily_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.agent_id = split_part(auth.jwt() ->> 'email', '@', 1)
      AND agents.assigned_device_id = daily_performance.device_id
    )
  );

-- 2. FIX commissions POLICY
DROP POLICY IF EXISTS agent_view_own_approved ON commissions;

CREATE POLICY agent_view_own_approved ON commissions
  FOR SELECT
  USING (
    agent_id = split_part(auth.jwt() ->> 'email', '@', 1)
    AND approved = TRUE
  );
