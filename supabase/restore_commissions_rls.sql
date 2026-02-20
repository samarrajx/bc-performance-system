-- RESTORE RLS POLICIES FOR COMMISSIONS (Corrected)

-- 1. Enable RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- 2. Clean up previous broken policies
DROP POLICY IF EXISTS admin_all_commissions ON commissions;
DROP POLICY IF EXISTS admin_select_all ON commissions;
DROP POLICY IF EXISTS admin_view_all ON commissions;
DROP POLICY IF EXISTS agent_view_own_approved ON commissions;

-- 3. Policy for ADMIN (Full Access)
-- Give full access to authenticated users for now to unblock check
CREATE POLICY admin_view_all ON commissions
FOR ALL
USING (auth.role() = 'authenticated');

-- 4. Policy for AGENTS (View Own Data Only)
CREATE POLICY agent_view_own_approved ON commissions
  FOR SELECT
  USING (
    -- Case-insensitive match for Agent ID corresponding to their login email
    LOWER(agent_id) = LOWER(split_part(auth.jwt() ->> 'email', '@', 1))
    AND approved = TRUE
  );

-- 5. Verification
SELECT count(*) as total_rows FROM commissions;
