import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/colors.dart';

class ChangePasswordScreen extends StatefulWidget {
  final bool isForced; // True if triggered by 'must_change_password'
  const ChangePasswordScreen({super.key, this.isForced = false});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleChangePassword() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final password = _passwordController.text.trim();
      final confirmPassword = _confirmPasswordController.text.trim();

      if (password.length < 6) {
        throw const AuthException('Password must be at least 6 characters');
      }

      if (password != confirmPassword) {
        throw const AuthException('Passwords do not match');
      }

      // 1. Update Password in Supabase Auth
      await Supabase.instance.client.auth.updateUser(
        UserAttributes(password: password),
      );

      // 2. Update 'must_change_password' flag in DB
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null && user.email != null) {
        final agentId = user.email!.split('@')[0];
        
        await Supabase.instance.client
            .from('agents')
            .update({'must_change_password': false})
            .eq('agent_id', agentId);
      }

      if (mounted) {
        if (widget.isForced) {
           Navigator.of(context).pushReplacementNamed('/dashboard');
        } else {
           Navigator.of(context).pop();
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text('Password updated successfully')),
           );
        }
      }
    } on AuthException catch (e) {
      setState(() {
        _errorMessage = e.message;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'An unexpected error occurred: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: widget.isForced 
          ? null 
          : AppBar(
              title: Text('Change Password', style: TextStyle(color: colorScheme.onBackground)),
              backgroundColor: colorScheme.background,
              iconTheme: IconThemeData(color: colorScheme.onBackground),
            ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (widget.isForced) ...[
                Icon(Icons.lock_reset, size: 64, color: colorScheme.primary),
                const SizedBox(height: 24),
                Text(
                  'Setup New Password',
                  style: GoogleFonts.outfit(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onBackground,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'For security, you must change your default password before continuing.',
                  style: GoogleFonts.outfit(color: colorScheme.outline),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
              ],

              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  filled: true,
                  fillColor: colorScheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: Icon(Icons.lock_outline, color: colorScheme.secondary),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _confirmPasswordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  filled: true,
                  fillColor: colorScheme.surface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: Icon(Icons.lock_outline, color: colorScheme.secondary),
                ),
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 24),
                Text(
                  _errorMessage!,
                  style: TextStyle(color: colorScheme.error),
                  textAlign: TextAlign.center,
                ),
              ],

              const SizedBox(height: 32),
              FilledButton(
                onPressed: _isLoading ? null : _handleChangePassword,
                style: FilledButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Update Password'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
