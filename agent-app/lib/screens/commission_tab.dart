import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../constants/colors.dart';

class CommissionTab extends StatefulWidget {
  const CommissionTab({super.key});

  @override
  State<CommissionTab> createState() => _CommissionTabState();
}

class _CommissionTabState extends State<CommissionTab> {
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;
  bool _isLoading = false;
  Map<String, dynamic>? _commission;
  String? _error;

  final List<String> _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  @override
  void initState() {
    super.initState();
    // Default to previous month as commissions are usually for past months
    if (_selectedMonth > 1) {
      _selectedMonth--;
    } else {
      _selectedMonth = 12;
      _selectedYear--;
    }
  }

  Future<void> _fetchCommission() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _commission = null;
    });

    try {
      final userEmail = Supabase.instance.client.auth.currentUser?.email;
      if (userEmail == null) return;
      
      final agentId = userEmail.split('@')[0];

      // Fetch commission for agent, year, month + APPROVED only
      final response = await Supabase.instance.client
          .from('commissions')
          .select()
          .ilike('agent_id', agentId)
          .eq('month', _selectedMonth)
          .eq('year', _selectedYear)
          .eq('approved', true) // RLS handles this too, but explicit check implies logic
          .maybeSingle();

      if (response == null) {
        setState(() {
          _error = 'No approved commission found for this period.';
        });
      } else {
        setState(() {
          _commission = response;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error fetching commission data';
      });
      debugPrint('Commission error: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  String _formatCurrency(num amount) {
    return NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2)
        .format(amount);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('My Commission', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: colorScheme.onBackground)),
        backgroundColor: colorScheme.background,
        elevation: 0,
        iconTheme: IconThemeData(color: colorScheme.onBackground),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Filter Card
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: colorScheme.outline.withOpacity(0.2)),
              ),
              color: colorScheme.surface,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: DropdownButtonFormField<int>(
                            value: _selectedMonth,
                            decoration: InputDecoration(
                              labelText: 'Month',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            items: List.generate(12, (index) {
                              return DropdownMenuItem(
                                value: index + 1,
                                child: Text(_months[index], style: GoogleFonts.outfit()),
                              );
                            }),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedMonth = val);
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<int>(
                            value: _selectedYear,
                            decoration: InputDecoration(
                              labelText: 'Year',
                              labelStyle: TextStyle(color: colorScheme.outline),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            ),
                            dropdownColor: colorScheme.surface,
                            items: [2023, 2024, 2025, 2026].map((y) {
                              return DropdownMenuItem(
                                value: y,
                                child: Text(y.toString(), style: GoogleFonts.outfit()),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _selectedYear = val);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _isLoading ? null : _fetchCommission,
                        style: FilledButton.styleFrom(
                          backgroundColor: colorScheme.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(_isLoading ? 'Loading...' : 'View Commission'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            if (_error != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colorScheme.errorContainer.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: colorScheme.error),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _error!,
                        style: GoogleFonts.outfit(color: colorScheme.onErrorContainer),
                      ),
                    ),
                  ],
                ),
              ),

            if (_commission != null) ...[
              // Summary Card
              Container(
                margin: const EdgeInsets.only(bottom: 24),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: colorScheme.tertiaryContainer,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: colorScheme.outline.withOpacity(0.1)),
                ),
                child: Column(
                  children: [
                    Text(
                      'NET PAYABLE AMOUNT',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                        color: colorScheme.onTertiaryContainer.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _formatCurrency(_commission!['agent_net_payable'] ?? 0),
                      style: GoogleFonts.outfit(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: colorScheme.onTertiaryContainer,
                      ),
                    ),
                    const Divider(height: 32),
                     Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('TDS Deducted (${_commission!['tds_percent']}%)', style: GoogleFonts.outfit(fontSize: 12)),
                        Text(
                          '- ${_formatCurrency(_commission!['tds_amount'] ?? 0)}',
                          style: GoogleFonts.outfit(
                            fontSize: 12, 
                            fontWeight: FontWeight.bold,
                            color: colorScheme.error,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Breakdown
              _buildSectionHeader('Account Opening'),
              _buildRow('Non-Funded (${_commission!['non_funded_account_open_count']})', _commission!['non_funded_account_open_comm']),
              _buildRow('Funded (${_commission!['funded_account_open_count']})', _commission!['funded_account_open_comm']),
              
              const SizedBox(height: 16),
              _buildSectionHeader('Transactions'),
              _buildRow('Financial Txns', _commission!['financial_txn_comm']),
              _buildRow('Remittance', _commission!['remittance_comm']),
              
              const SizedBox(height: 16),
              _buildSectionHeader('Schemes & Others'),
              _buildRow('APY (${_commission!['apy_count']})', _commission!['apy_comm']),
              _buildRow('PMJBY (${_commission!['pmjby_count']})', _commission!['pmjby_comm']),
              _buildRow('PMSBY (${_commission!['pmsby_count']})', _commission!['pmsby_comm']),
              _buildRow('Re-KYC (${_commission!['rekyc_count']})', _commission!['rekyc_comm']),
              _buildRow('Fixed Commission', _commission!['fixed_commission']),
              _buildRow('10% INCENTIVE for SSS', _commission!['sss_incentive']),
              
              const SizedBox(height: 40),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Text(
            title.toUpperCase(),
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(width: 8),
          const Expanded(child: Divider()),
        ],
      ),
    );
  }

  Widget _buildRow(String label, dynamic value) {
    // Determine the numeric value
    double numericValue = 0.0;
    if (value != null) {
      if (value is num) {
        numericValue = value.toDouble();
      } else if (value is String) {
        numericValue = double.tryParse(value) ?? 0.0;
      }
    }
    
    // Deduct 20% (Corporate Share) to show Agent Share (80%)
    double agentShare = numericValue * 0.8;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(fontSize: 14, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          Text(
            _formatCurrency(agentShare),
            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface),
          ),
        ],
      ),
    );
  }
}
