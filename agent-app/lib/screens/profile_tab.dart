import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants/colors.dart';
import 'change_password_screen.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  Map<String, dynamic>? _agent;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final userEmail = Supabase.instance.client.auth.currentUser?.email;
      if (userEmail != null) {
        final agentId = userEmail.split('@')[0];
        final data = await Supabase.instance.client
            .from('agents')
            .select()
            .eq('agent_id', agentId)
            .maybeSingle();
        
        if (mounted) {
          setState(() {
            _agent = data;
          });
        }
      }
    } catch (e) {
      debugPrint('Profile error: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleLogout() async {
    await Supabase.instance.client.auth.signOut();
    if (mounted) {
      // Navigate back to login (handled by AuthGate usually, but manual push helps UX)
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final name = _agent?['agent_name'] ?? 'Agent';
    final id = _agent?['agent_id'] ?? 'Unknown ID';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Profile', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.background,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: _handleLogout,
            tooltip: 'Logout',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Avatar
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.secondaryContainer,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.onSecondaryContainer, width: 2),
              ),
              child: Center(
                child: Text(
                  name.isNotEmpty ? name[0] : 'A',
                  style: GoogleFonts.outfit(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: AppColors.onSecondaryContainer,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              name,
              style: GoogleFonts.outfit(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.onBackground,
              ),
            ),
            Text(
              id,
              style: GoogleFonts.outfit(
                fontSize: 16,
                color: AppColors.outline,
              ),
            ),
            const SizedBox(height: 32),

            // Details Card
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.outline.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                   _buildProfileRow(Icons.phone_android, 'Device ID', _agent?['assigned_device_id'] ?? 'Not Assigned'),
                   const Divider(height: 1, indent: 56),
                   _buildProfileRow(Icons.call, 'Contact', _agent?['contact_no'] ?? 'N/A'),
                   const Divider(height: 1, indent: 56),
                   _buildProfileRow(Icons.calendar_today, 'Joining Date', _agent?['joining_date'] ?? 'N/A'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Actions Card
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.outline.withOpacity(0.2)),
              ),
              child: ListTile(
                leading: const Icon(Icons.lock_reset, color: AppColors.secondary),
                title: Text(
                  'Change Password',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w500),
                ),
                trailing: const Icon(Icons.chevron_right, color: AppColors.outline),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const ChangePasswordScreen(isForced: false)),
                  );
                },
              ),
            ),

            const SizedBox(height: 40),

            // Logout Button (Text based)
            TextButton.icon(
              onPressed: _handleLogout,
              icon: const Icon(Icons.logout, color: AppColors.error),
              label: Text(
                'Sign Out',
                style: GoogleFonts.outfit(
                  color: AppColors.error,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            
             const SizedBox(height: 20),
             Text(
              'App Version 1.0.0',
              style: GoogleFonts.outfit(color: AppColors.outline, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: AppColors.secondary, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.outline,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    color: AppColors.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
