-- =====================================================
-- MASTER SYNC FUNCTION
-- =====================================================
-- This function handles the synchronization of Agents and Devices
-- from the Master CSV upload.
-- It ensures that:
-- 1. Devices are created if they don't exist.
-- 2. Agents are created or updated.
-- 3. Agents are correctly linked to their assigned devices.
-- 4. In 'full' mode, missing agents are deactivated.

DROP FUNCTION IF EXISTS public.master_sync(jsonb, text);

CREATE OR REPLACE FUNCTION public.master_sync(
    master_data JSONB,
    sync_mode TEXT DEFAULT 'incremental'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item JSONB;
    _agent_id TEXT;
    _agent_name TEXT;
    _joining_date DATE;
    _device_id TEXT;
    
    _added_count INT := 0;
    _updated_count INT := 0;
    _existing_agent RECORD;
BEGIN
    -- Loop through each item in the input array
    FOR item IN SELECT * FROM jsonb_array_elements(master_data)
    LOOP
        _agent_id := item->>'Agent id';
        _agent_name := item->>'Agent Name';
        _joining_date := (item->>'DATE OF JOINING')::DATE;
        _device_id := item->>'DLM_DeviceId';
        
        -- 1. Upsert Device (Ensure device exists before linking)
        IF _device_id IS NOT NULL AND _device_id != '' THEN
            INSERT INTO public.devices (device_id, created_at)
            VALUES (_device_id, NOW())
            ON CONFLICT (device_id) DO NOTHING;
        END IF;

        -- 2. Upsert Agent
        SELECT * INTO _existing_agent FROM public.agents WHERE agent_id = _agent_id;
        
        IF FOUND THEN
            -- Update existing agent
            UPDATE public.agents
            SET 
                agent_name = _agent_name,
                joining_date = _joining_date,
                assigned_device_id = _device_id, -- CRITICAL LINK
                active_status = true
            WHERE agent_id = _agent_id;
            
            _updated_count := _updated_count + 1;
        ELSE
            -- Insert new agent
            INSERT INTO public.agents (
                agent_id, 
                agent_name, 
                joining_date, 
                assigned_device_id, 
                active_status
            )
            VALUES (
                _agent_id, 
                _agent_name, 
                _joining_date, 
                _device_id, 
                true
            );
            
            _added_count := _added_count + 1;
        END IF;

    END LOOP;

    -- 3. Handle Full Sync (Deactivation)
    IF sync_mode = 'full' THEN
        UPDATE public.agents
        SET active_status = false
        WHERE agent_id NOT IN (
            SELECT value->>'Agent id' 
            FROM jsonb_array_elements(master_data)
        );
    END IF;

    -- Return stats
    RETURN jsonb_build_object(
        'added_agents', _added_count,
        'updated_agents', _updated_count
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Master Sync Failed: %', SQLERRM;
END;
$$;
