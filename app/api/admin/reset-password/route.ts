import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const { agentId } = await request.json();

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
        }

        const email = `${agentId}@app.local`;
        const defaultPassword = 'uco@rcds';

        // 1. Find the User by Email to get UID
        // Using listUsers with filter (this assumes not too many users, or we get lucky on first page)
        // Actually, listUsers doesn't support filter by email in all versions efficiently.
        // BUT, we can use `deleteUser`? No.
        // We will try to update it. If we can't find ID, we can't update.

        // Robust way: Use the admin method to list users and find the one.
        // Ideally we should have a lookup table or Custom RPC. 
        // For now, we'll fetch the first page. If not found, we might need a better way.
        // Wait! Admin API has `getUserByEmail`? No.
        // It has `listUsers`.

        // Let's try to iterate (naive but works for < 50 users). If > 50, pagination needed.
        // BETTER: We can just use the Admin "updateUserById" if we knew the ID. 
        // We don't.
        // Alternative: Delete and Recreate?
        // Deleting changes the UID. RLS uses email. `agents` table links by `agent_id`.
        // So UID change is technically fine for RLS/App logic!
        // But it destroys any "user specific" data in `auth` schema if any. We don't use any.
        // So Deletion + Creation is a valid strategy for "Reset".

        // STRATEGY: 
        // 1. List users to find ID? (Slow)
        // 2. Just try to Create. If fails (already exists), we absolutely need to Update.
        // 3. To Update, we need ID.
        // 4. So we MUST find ID.

        // Let's use a loop to find user. 
        // Optimization: In production, use a SQL function `get_user_id_by_email`.
        // Since I can't easily add SQL right now without user running it, I'll try the loop.

        let existingUser: any = null;
        let page = 1;
        let hasMore = true;

        while (hasMore && !existingUser) {
            const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
                page: page,
                perPage: 1000,
            });

            if (error) throw error;

            const found = users.find(u => u.email === email);
            if (found) {
                existingUser = found;
            }

            if (users.length < 1000) hasMore = false;
            page++;
        }

        if (!existingUser) {
            // User doesn't exist? Create them!
            const { error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: defaultPassword,
                email_confirm: true,
                user_metadata: { role: 'agent', must_change_password: true }
            });

            if (createError) throw createError;
        } else {
            // User exists, Update password
            const userId = existingUser.id;
            const data = existingUser.user_metadata;
            const newPassword = defaultPassword;

            const updatePayload = {
                password: newPassword,
                user_metadata: {
                    ...(typeof data === "object" && data !== null ? data : {}),
                    must_change_password: true
                }
            };

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                updatePayload
            );

            if (updateError) throw updateError;
        }

        // 2. Update agents table flag
        const { error: dbError } = await supabaseAdmin
            .from('agents')
            .update({ must_change_password: true })
            .eq('agent_id', agentId);

        if (dbError) throw dbError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
