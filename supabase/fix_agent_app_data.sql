-- =====================================================
-- FIX AGENT APP DATA VISIBILITY (ROBUST VERSION)
-- =====================================================
-- 1. Fix commissions RLS to use case-insensitive email mapping
-- 2. Reinforce daily_performance RLS with case-insensitivity
-- =====================================================

-- 1. FIX COMMISSIONS POLICY
DROP POLICY IF EXISTS agent_view_own_approved ON commissions;

CREATE POLICY agent_view_own_approved ON commissions
  FOR SELECT
  USING (
    -- Case-insensitive match for Agent ID
    LOWER(agent_id) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1))
    AND approved = TRUE
  );

-- 2. FIX DAILY PERFORMANCE POLICY
DROP POLICY IF EXISTS agent_read_own_device ON daily_performance;

CREATE POLICY agent_read_own_device ON daily_performance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      -- Case-insensitive match for Agent ID
      WHERE LOWER(agents.agent_id) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1))
      -- Robust Device ID Match: Ignore leading zeros
      AND LTRIM(agents.assigned_device_id, '0') = LTRIM(daily_performance.device_id, '0')
    )
  );

-- 3. FIX AGENTS POLICY
DROP POLICY IF EXISTS agent_view_own_profile ON agents;

CREATE POLICY agent_view_own_profile ON public.agents
  FOR SELECT
  USING (
    LOWER(agent_id) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1))
  );
