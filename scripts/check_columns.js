const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
    console.log("Checking 'devices' table...");
    const { data: devices, error: devError } = await supabase
        .from('devices')
        .select('*')
        .limit(1);

    if (devError) {
        console.error("Error fetching devices:", devError);
    } else if (devices && devices.length > 0) {
        console.log("Devices columns:", Object.keys(devices[0]));
    } else {
        console.log("Devices table is empty or no access.");
    }

    console.log("\nChecking 'agents' table...");
    const { data: agents, error: agError } = await supabase
        .from('agents')
        .select('*')
        .limit(1);

    if (agError) {
        console.error("Error fetching agents:", agError);
    } else if (agents && agents.length > 0) {
        console.log("Agents columns:", Object.keys(agents[0]));
    } else {
        console.log("Agents table is empty or no access.");
    }
}

checkColumns();
