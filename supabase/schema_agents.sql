-- =====================================================
-- AGENTS TABLE SCHEMA
-- =====================================================
-- Re-created for Flutter App
-- =====================================================

CREATE TABLE IF NOT EXISTS public.agents (
  agent_id text not null,
  agent_name text not null,
  contact_no text null,
  gender text null,
  joining_date date not null,
  assigned_device_id text null,
  active_status boolean null default true,
  created_at timestamp without time zone null default now(),
  
  -- Added for Agent App Login Requirement
  must_change_password boolean default true,
  
  constraint agents_pkey primary key (agent_id),
  constraint agents_assigned_device_id_fkey foreign KEY (assigned_device_id) references devices (device_id)
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Agents can view their own profile
-- Mapping agent_id to auth.uid via email convention (agentId@app.local)
CREATE POLICY agent_view_own_profile ON public.agents
  FOR SELECT
  USING (
    agent_id = split_part(auth.jwt() ->> 'email', '@', 1)
  );

-- Admins can view all
CREATE POLICY admin_all_access_agents ON public.agents
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
