import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agents } = body;
        // Expects agents: { agent_id: string }[]

        if (!agents || !Array.isArray(agents)) {
            return NextResponse.json({ error: 'Invalid agents data' }, { status: 400 });
        }

        const results = {
            total: agents.length,
            created: 0,
            existing: 0,
            failed: 0,
            errors: [] as string[],
        };

        const DEFAULT_PASSWORD = 'uco@rcds';

        for (const agent of agents) {
            const agentId = agent.agent_id;
            if (!agentId) continue;

            const email = `${agentId}@app.local`;

            try {
                // Attempt to create user
                const { data, error } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: DEFAULT_PASSWORD,
                    email_confirm: true,
                    user_metadata: {
                        role: 'agent',
                        must_change_password: true
                    }
                });

                if (error) {
                    // Check if error is "User already registered" (Status 400 or 422 usually)
                    if (error.message.includes('already registered') || error.status === 400) {
                        results.existing++;
                    } else {
                        results.failed++;
                        results.errors.push(`Failed to create ${agentId}: ${error.message}`);
                    }
                } else {
                    results.created++;
                }
            } catch (err: any) {
                // Fallback catch
                results.failed++;
                results.errors.push(`Exception for ${agentId}: ${err.message}`);
            }
        }

        return NextResponse.json({
            message: 'Sync completed',
            results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
