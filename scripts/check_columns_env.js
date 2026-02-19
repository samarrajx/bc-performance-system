const { createClient } = require('@supabase/supabase-js');

// Using the key exactly as found in .env.local
const supabaseUrl = "https://wvnuukjvbmtdhguoowwp.supabase.co";
const supabaseAnonKey = "sb_publishable_mDqP8ZaXgVoJoV6onqpByQ_U-Choalz";

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
        console.log("Sample device row:", devices[0]);
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
        console.log("Sample agent row:", agents[0]);
    } else {
        console.log("Agents table is empty or no access.");
    }
}

checkColumns();
