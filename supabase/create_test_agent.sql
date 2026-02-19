-- Insert a test agent for development purposes
-- You must also create a corresponding user in Supabase Auth with:
-- Email: AGT123@app.local
-- Password: your_password

INSERT INTO public.agents (
    agent_id, 
    agent_name, 
    contact_no, 
    gender, 
    joining_date, 
    active_status, 
    must_change_password
)
VALUES (
    'AGT123', 
    'Test Agent', 
    '9876543210', 
    'Male', 
    CURRENT_DATE, 
    TRUE, 
    TRUE
)
ON CONFLICT (agent_id) DO NOTHING;
