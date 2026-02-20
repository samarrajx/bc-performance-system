import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
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
            .ilike('agent_id', agentId) // Case-insensitive
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
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('Profile', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onBackground)),
        backgroundColor: colorScheme.background,
        elevation: 0,
        actions: [
          // Theme Toggle Icon
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, child) {
              return IconButton(
                icon: Icon(
                  themeProvider.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                  color: colorScheme.primary,
                ),
                onPressed: () {
                  themeProvider.toggleTheme(!themeProvider.isDarkMode);
                },
              );
            },
          ),
          IconButton(
            icon: Icon(Icons.logout, color: colorScheme.error),
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
                color: colorScheme.secondaryContainer,
                shape: BoxShape.circle,
                border: Border.all(color: colorScheme.onSecondaryContainer, width: 2),
              ),
              child: Center(
                child: Text(
                  name.isNotEmpty ? name[0] : 'A',
                  style: GoogleFonts.outfit(
                    fontSize: 40,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onSecondaryContainer,
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
                color: colorScheme.onBackground,
              ),
            ),
            Text(
              id,
              style: GoogleFonts.outfit(
                fontSize: 16,
                color: colorScheme.outline,
              ),
            ),
            const SizedBox(height: 32),

            // Details Card
            Container(
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colorScheme.outline.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                   _buildProfileRow(Icons.phone_android, 'Device ID', _agent?['assigned_device_id'] ?? 'Not Assigned'),
                   Divider(height: 1, indent: 56, color: colorScheme.outline.withOpacity(0.1)),
                   _buildProfileRow(Icons.call, 'Contact', _agent?['contact_no'] ?? 'N/A'),
                   Divider(height: 1, indent: 56, color: colorScheme.outline.withOpacity(0.1)),
                   _buildProfileRow(Icons.calendar_today, 'Joining Date', _agent?['joining_date'] ?? 'N/A'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Actions Card
            Container(
              decoration: BoxDecoration(
                color: colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colorScheme.outline.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(Icons.lock_reset, color: colorScheme.secondary),
                    title: Text(
                      'Change Password',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: colorScheme.onSurface),
                    ),
                    trailing: Icon(Icons.chevron_right, color: colorScheme.outline),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const ChangePasswordScreen(isForced: false)),
                      );
                    },
                  ),
                  Divider(height: 1, indent: 56, color: colorScheme.outline.withOpacity(0.1)),
                  // Dark Mode Toggle List Tile
                  Consumer<ThemeProvider>(
                    builder: (context, themeProvider, child) {
                      return SwitchListTile(
                        title: Text(
                          'Dark Mode',
                          style: GoogleFonts.outfit(fontWeight: FontWeight.w500, color: colorScheme.onSurface),
                        ),
                        secondary: Icon(
                          themeProvider.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                          color: colorScheme.primary,
                        ),
                        value: themeProvider.isDarkMode,
                        onChanged: (value) {
                          themeProvider.toggleTheme(value);
                        },
                        activeColor: colorScheme.primary,
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // Logout Button
            TextButton.icon(
              onPressed: _handleLogout,
              icon: Icon(Icons.logout, color: colorScheme.error),
              label: Text(
                'Sign Out',
                style: GoogleFonts.outfit(
                  color: colorScheme.error,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            
             const SizedBox(height: 20),
             Text(
              'App Version 1.0.0',
              style: GoogleFonts.outfit(color: colorScheme.outline, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: colorScheme.secondary, size: 20),
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
                    color: colorScheme.outline,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    color: colorScheme.onSurface,
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
