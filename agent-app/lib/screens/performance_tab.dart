import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../constants/colors.dart';

class PerformanceTab extends StatefulWidget {
  const PerformanceTab({super.key});

  @override
  State<PerformanceTab> createState() => _PerformanceTabState();
}

class _PerformanceTabState extends State<PerformanceTab> {
  DateTime _selectedDate = DateTime.now();
  Map<String, dynamic>? _data;
  bool _isLoading = false;

  Map<String, dynamic>? _agentProfile;
  String? _deviceId;
  
  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    setState(() => _isLoading = true);
    await _fetchAgentProfile();
    await _fetchLatestDate();
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchAgentProfile() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user?.email == null) return;
      final agentId = user!.email!.split('@')[0];

      final agentResponse = await Supabase.instance.client
          .from('agents')
          .select()
          .ilike('agent_id', agentId)
          .maybeSingle();
      
      _agentProfile = agentResponse;
      
      // Normalize Device ID
      var deviceId = _agentProfile?['assigned_device_id']?.toString() ?? '';
      if (deviceId.length == 9) {
        deviceId = '0$deviceId';
      }
      _deviceId = deviceId;
      print('DEBUG: PerformanceTab Device ID: $_deviceId');

    } catch (e) {
      debugPrint('Error fetching agent profile: $e');
    }
  }

  Future<void> _fetchLatestDate() async {
    try {
      // 1. Start Query
      var query = Supabase.instance.client
          .from('daily_performance')
          .select('date');

      // 2. Apply Filters
      if (_deviceId != null && _deviceId!.isNotEmpty) {
        query = query.eq('device_id', _deviceId!);
      }

      // 3. Apply Ordering/Limit & Execute
      final response = await query
          .order('date', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response != null) {
        final lastDate = DateTime.parse(response['date']);
        _selectedDate = lastDate;
        await _fetchData(lastDate);
      } else {
        await _fetchData(DateTime.now());
      }
    } catch (e) {
      debugPrint('Error fetching latest date: $e');
    }
  }

  Future<void> _fetchData(DateTime date) async {
    setState(() => _isLoading = true);
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(date);
      
      var query = Supabase.instance.client
          .from('daily_performance')
          .select()
          .eq('date', dateStr);

      if (_deviceId != null && _deviceId!.isNotEmpty) {
         query = query.eq('device_id', _deviceId!);
      }
      
      final response = await query.maybeSingle();
      
      if (mounted) {
        setState(() {
          _data = response;
          _selectedDate = date;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      debugPrint('Error fetching performance data: $e');
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2023),
      lastDate: DateTime.now(),
       builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: AppColors.primary),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      _fetchData(picked);
    }
  }

  String _fmt(dynamic value, {bool isCurrency = false}) {
    if (value == null) return '0';
    num val = value is String ? num.tryParse(value) ?? 0 : value;
    if (isCurrency) {
      return NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(val);
    }
    return NumberFormat.decimalPattern().format(val);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      backgroundColor: colorScheme.background,
      appBar: AppBar(
        title: Text('Performance Analysis', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: colorScheme.onBackground)),
        backgroundColor: colorScheme.background,
        iconTheme: IconThemeData(color: colorScheme.onBackground),
        actions: [
          IconButton(
            onPressed: _pickDate,
            icon: Icon(Icons.calendar_today, color: colorScheme.onBackground),
          ),
        ],
      ),
      body: Column(
        children: [
          // Date Header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            color: colorScheme.surfaceVariant.withOpacity(0.3),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  DateFormat('EEEE, d MMMM yyyy').format(_selectedDate),
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    color: colorScheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.arrow_drop_down, color: colorScheme.primary),
              ],
            ),
          ),
          
          Expanded(
            child: _isLoading 
                ? const Center(child: CircularProgressIndicator())
                : _data == null 
                    ? _buildEmptyState()
                    : ListView(
                        padding: const EdgeInsets.all(16),
                        children: [
                           _buildSectionHeader('Financial Transactions'),
                           _buildFinancialSection(),
                           
                           _buildSectionHeader('AEPS & Cards'),
                           _buildAepsSection(),
                           
                           _buildSectionHeader('Schemes & Enrollment'),
                           _buildSchemesSection(),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.analytics_outlined, size: 64, color: colorScheme.outline.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(
            'No performance data found\nfor this date.',
            textAlign: TextAlign.center,
            style: GoogleFonts.outfit(color: colorScheme.outline, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 24, bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.outfit(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
          color: colorScheme.outline,
        ),
      ),
    );
  }

  Widget _buildFinancialSection() {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: colorScheme.outline.withOpacity(0.1))),
      color: colorScheme.surface,
      child: Column(
        children: [
          _buildRow('Deposits', _data!['deposit_count'], _data!['deposit_amount'], isCurrency: true),
          const Divider(height: 1),
          _buildRow('Withdrawals', _data!['withdrawal_count'], _data!['withdrawal_amount'], isCurrency: true),
          const Divider(height: 1),
          _buildRow('Remittance', _data!['remittance_count'], _data!['remittance_amt'], isCurrency: true),
        ],
      ),
    );
  }

  Widget _buildAepsSection() {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: colorScheme.outline.withOpacity(0.1))),
      color: colorScheme.surface,
      child: Column(
        children: [
          _buildRow('AEPS On-Us', _data!['aeps_onus_count'], _data!['aeps_onus_amt'], isCurrency: true),
          const Divider(height: 1),
          _buildRow('AEPS Off-Us', _data!['aeps_offus_count'], _data!['aeps_offus_amt'], isCurrency: true),
          const Divider(height: 1),
          _buildRow('Rupay Card', _data!['rupay_card_count'], _data!['rupay_card_amount'], isCurrency: true),
          const Divider(height: 1),
          _buildRow('Other Card', _data!['other_card_count'], _data!['other_card_amount'], isCurrency: true),
        ],
      ),
    );
  }

  Widget _buildSchemesSection() {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: colorScheme.outline.withOpacity(0.1))),
      color: colorScheme.surface,
      child: Column(
        children: [
          _buildRow('Enrollments', _data!['enrollment_count'], null), // Just count
          const Divider(height: 1),
          _buildRow('APY', _data!['apy_count'], null),
          const Divider(height: 1),
          _buildRow('PMJBY', _data!['pmjby_count'], null),
          const Divider(height: 1),
          _buildRow('PMSBY', _data!['pmsby_count'], null),
          const Divider(height: 1),
           _buildRow('Online Accounts', _data!['online_account_count'], null),
        ],
      ),
    );
  }

  Widget _buildRow(String label, dynamic count, dynamic amount, {bool isCurrency = false}) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500)),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (amount != null)
                Text(
                  _fmt(amount, isCurrency: isCurrency),
                  style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold),
                ),
              Text(
                '${count ?? 0} Count',
                style: GoogleFonts.outfit(fontSize: 12, color: AppColors.outline),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
