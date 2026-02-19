import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../constants/colors.dart';
import '../widgets/daily_stats_card.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  bool _isLoading = true;
  int _activeSegment = 0; // 0: Today, 1: Month, 2: Schemes
  
  // Data Placeholders
  Map<String, dynamic>? _agentProfile;
  
  // -- Today View Data --
  Map<String, dynamic>? _dailyStats;
  DateTime _todayViewDate = DateTime.now();
  
  // -- Month View Data --
  List<dynamic> _monthDailyRecords = [];
  DateTime _monthViewDate = DateTime.now();
  
  // -- Schemes View Data --
  bool _isSchemesMonthly = false; // Toggle state
  Map<String, dynamic>? _approvedCommission; // If available

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  // --- Data Fetching Methods ---

  Future<void> _fetchInitialData() async {
    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user?.email == null) return;
      final agentId = user!.email!.split('@')[0];

      // 1. Fetch Agent Profile
      final agentResponse = await Supabase.instance.client
          .from('agents')
          .select()
          .eq('agent_id', agentId)
          .maybeSingle();
      
      _agentProfile = agentResponse;

      // 2. Fetch Latest Daily Performance (For "Today" default)
      final latestPerf = await Supabase.instance.client
          .from('daily_performance')
          .select()
          .order('date', ascending: false)
          .limit(1)
          .maybeSingle();

      if (latestPerf != null) {
        _dailyStats = latestPerf;
        _todayViewDate = DateTime.parse(latestPerf['date']);
      } else {
        // Fallback: Try fetching for actual today if DB is empty? 
        // Or just leave it as null
      }

      // 3. Pre-fetch Month Data for current month
      await _fetchMonthData();

    } catch (e) {
      debugPrint('Error fetching initial data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchDailyData(DateTime date) async {
    setState(() => _isLoading = true);
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(date);
      final response = await Supabase.instance.client
          .from('daily_performance')
          .select()
          .eq('date', dateStr)
          .maybeSingle(); // RLS handles device_id filter
      
      setState(() {
        _dailyStats = response;
        _todayViewDate = date;
      });
    } catch (e) {
      debugPrint('Error fetching daily data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchMonthData() async {
    // Fetches all daily records for the selected _monthViewDate
    setState(() => _isLoading = true);
    try {
      final startOfMonth = DateTime(_monthViewDate.year, _monthViewDate.month, 1);
      final endOfMonth = DateTime(_monthViewDate.year, _monthViewDate.month + 1, 0);
      
      final startStr = DateFormat('yyyy-MM-dd').format(startOfMonth);
      final endStr = DateFormat('yyyy-MM-dd').format(endOfMonth);

      final response = await Supabase.instance.client
          .from('daily_performance')
          .select()
          .gte('date', startStr)
          .lte('date', endStr);
      
      setState(() {
        _monthDailyRecords = response as List<dynamic>;
      });

      // Also check for Commission if needed for Schemes Monthly logic
      if (_activeSegment == 2 && _isSchemesMonthly) {
        await _fetchApprovedCommission();
      }

    } catch (e) {
      debugPrint('Error fetching month data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchApprovedCommission() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user?.email == null) return;
    final agentId = user!.email!.split('@')[0];

    try {
      final response = await Supabase.instance.client
          .from('commissions')
          .select()
          .eq('agent_id', agentId)
          .eq('month', _monthViewDate.month)
          .eq('year', _monthViewDate.year)
          .eq('approved', true) // Only approved
          .maybeSingle();
      
      setState(() {
        _approvedCommission = response;
      });
    } catch (e) {
      debugPrint('Error fetching commissions: $e');
    }
  }

  // --- Helper Methods ---

  String _formatCurrency(num amount) {
    return NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0).format(amount);
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _todayViewDate,
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
    if (picked != null && picked != _todayViewDate) {
      _fetchDailyData(picked);
    }
  }

  Future<void> _selectMonth() async {
    // Simple month picker dialog using native date picker logic restricted or custom
    // For simplicity in Flutter, we can use showDatePicker limited to year/month or custom dialogs.
    // Here we'll stick to picking a date and ignoring the day.
    final picked = await showDatePicker(
      context: context,
      initialDate: _monthViewDate,
      firstDate: DateTime(2023),
      lastDate: DateTime.now(),
      helpText: 'SELECT MONTH',
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
      setState(() {
        _monthViewDate = picked;
      });
      _fetchMonthData();
    }
  }

  // --- Aggregation Logic ---

  Map<String, num> _aggregateMonthData() {
    num totalDepositAmt = 0;
    num totalWithdrawalAmt = 0;
    num totalAepsAmt = 0;
    num totalRemittanceAmt = 0;
    
    num totalTxnCount = 0;

    for (var row in _monthDailyRecords) {
        totalDepositAmt += (row['deposit_amount'] ?? 0);
        totalWithdrawalAmt += (row['withdrawal_amount'] ?? 0);
        totalAepsAmt += (row['aeps_onus_amt'] ?? 0) + (row['aeps_offus_amt'] ?? 0);
        totalRemittanceAmt += (row['remittance_amt'] ?? 0);
        
        totalTxnCount += (row['deposit_count'] ?? 0) as int;
        totalTxnCount += (row['withdrawal_count'] ?? 0) as int;
        totalTxnCount += (row['aeps_onus_count'] ?? 0) as int;
        totalTxnCount += (row['aeps_offus_count'] ?? 0) as int;
        totalTxnCount += (row['rupay_card_count'] ?? 0) as int;
        totalTxnCount += (row['other_card_count'] ?? 0) as int;
        totalTxnCount += (row['remittance_count'] ?? 0) as int;
    }

    return {
      'deposit': totalDepositAmt,
      'withdrawal': totalWithdrawalAmt,
      'aeps': totalAepsAmt,
      'remittance': totalRemittanceAmt,
      'total_amt': totalDepositAmt + totalWithdrawalAmt + totalAepsAmt + totalRemittanceAmt, 
      'total_count': totalTxnCount,
    };
  }

  Map<String, int> _getSchemeCounts() {
    int apy = 0;
    int pmsby = 0;
    int pmjby = 0;
    int pmjdy = 0;

    if (_activeSegment == 2 && _isSchemesMonthly) {
        // Monthly logic
        if (_approvedCommission != null) {
            // Use Commission Data (Final)
            apy = (_approvedCommission!['apy_count'] ?? 0) as int;
            pmsby = (_approvedCommission!['pmsby_count'] ?? 0) as int;
            pmjby = (_approvedCommission!['pmjby_count'] ?? 0) as int;
            pmjdy = (_approvedCommission!['total_account_open_count'] ?? 0) as int; // Mapping Total Account to PMJDY for Monthly
        } else {
            // Aggregate from Daily (Provisional)
            for (var row in _monthDailyRecords) {
                apy += (row['apy_count'] ?? 0) as int;
                pmsby += (row['pmsby_count'] ?? 0) as int;
                pmsby += (row['pmsby_count'] ?? 0) as int;
                pmjby += (row['pmjby_count'] ?? 0) as int;
                pmjdy += (row['online_account_count'] ?? 0) as int;
            }
        }
    } else {
        // Daily Logic (Today View or selected date) or Schemes Daily
        // For "Schemes > Daily Mode", we use _dailyStats (which matches "Last Updated Date" or selected date)
        // Wait, blueprint says: "Schemes -> Daily Mode Default date: Last updated date".
        // It should behave like the Today View date selector? Yes.
        // We will reuse _dailyStats which is controlled by _todayViewDate.
        
        if (_dailyStats != null) {
             apy = (_dailyStats!['apy_count'] ?? 0) as int;
             pmsby = (_dailyStats!['pmsby_count'] ?? 0) as int;
             pmjby = (_dailyStats!['pmjby_count'] ?? 0) as int;
             pmjdy = (_dailyStats!['online_account_count'] ?? 0) as int;
        }
    }

    return {'apy': apy, 'pmsby': pmsby, 'pmjby': pmjby, 'pmjdy': pmjdy};
  }

  // --- UI Building ---

  @override
  Widget build(BuildContext context) {
    final agentName = _agentProfile?['agent_name'] ?? 'Agent';
    final colorScheme = Theme.of(context).colorScheme;

    return RefreshIndicator(
      onRefresh: () async {
        await _fetchInitialData();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 60, 20, 20),
        children: [
          // Header with Gradient
          Container(
             margin: const EdgeInsets.only(bottom: 24),
             padding: const EdgeInsets.all(24),
             decoration: BoxDecoration(
               gradient: const LinearGradient(
                 colors: [AppColors.primary, Color(0xFF0D3311)], // Deep Green Gradient
                 begin: Alignment.topLeft,
                 end: Alignment.bottomRight,
               ),
               borderRadius: BorderRadius.circular(24),
               boxShadow: [
                 BoxShadow(
                   color: AppColors.primary.withOpacity(0.3),
                   blurRadius: 15,
                   offset: const Offset(0, 8),
                 ),
               ],
             ),
             child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, $agentName',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _activeSegment == 1 
                        ? DateFormat('MMMM yyyy').format(_monthViewDate)
                        : DateFormat('EEEE, d MMM').format(_todayViewDate),
                      style: GoogleFonts.outfit(fontSize: 14, color: Colors.white70),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: CircleAvatar(
                    backgroundColor: Colors.white,
                    radius: 22,
                    child: Text(
                      agentName.isNotEmpty ? agentName[0] : 'A',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Segmented Control
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: colorScheme.surfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Row(
              children: [
                _buildSegmentButton('Today', 0),
                _buildSegmentButton('Month', 1),
                _buildSegmentButton('Schemes', 2),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Filters (Date/Month Pickers)
          if (_activeSegment == 0) ...[
             Row(
               mainAxisAlignment: MainAxisAlignment.spaceBetween,
               children: [
                 Text('Operational Data', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: colorScheme.primary)),
                 TextButton.icon(
                   onPressed: _selectDate,
                   icon: const Icon(Icons.calendar_today, size: 16),
                   label: Text(DateFormat('dd MMM yyyy').format(_todayViewDate)),
                 ),
               ],
             )
          ] else if (_activeSegment == 1) ...[
             Row(
               mainAxisAlignment: MainAxisAlignment.spaceBetween,
               children: [
                 Text('Monthly Aggregation', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: colorScheme.primary)),
                 TextButton.icon(
                   onPressed: _selectMonth,
                   icon: const Icon(Icons.calendar_month, size: 16),
                   label: Text(DateFormat('MMM yyyy').format(_monthViewDate)),
                 ),
               ],
             )
          ] else if (_activeSegment == 2) ...[
              // Toggle for Schemes
              Center(
                child: ToggleButtons(
                  isSelected: [!_isSchemesMonthly, _isSchemesMonthly],
                  onPressed: (index) {
                      setState(() {
                          _isSchemesMonthly = index == 1;
                          if (_isSchemesMonthly) {
                              _fetchApprovedCommission();
                          }
                      });
                  },
                  borderRadius: BorderRadius.circular(100),
                  constraints: const BoxConstraints(minWidth: 100, minHeight: 36),
                  fillColor: colorScheme.primaryContainer,
                  selectedColor: colorScheme.onPrimaryContainer,
                  color: colorScheme.outline,
                  children: const [
                      Text('Daily'),
                      Text('Monthly'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Date picker depending on mode
               Row(
               mainAxisAlignment: MainAxisAlignment.center,
               children: [
                 TextButton.icon(
                   onPressed: _isSchemesMonthly ? _selectMonth : _selectDate,
                   icon: Icon(_isSchemesMonthly ? Icons.calendar_month : Icons.calendar_today, size: 16),
                   label: Text(
                     _isSchemesMonthly 
                      ? DateFormat('MMM yyyy').format(_monthViewDate)
                      : DateFormat('dd MMM yyyy').format(_todayViewDate)
                   ),
                 ),
               ],
             )
          ],

          const SizedBox(height: 16),

          // Content Views
          if (_isLoading)
             const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator()))
          else if (_activeSegment == 0) 
             _buildTodayView()
          else if (_activeSegment == 1) 
             _buildMonthView()
          else if (_activeSegment == 2) 
             _buildSchemesView(),
        ],
      ),
    );
  }

  Widget _buildSegmentButton(String label, int index) {
    final isActive = _activeSegment == index;
    final colorScheme = Theme.of(context).colorScheme;
    return Expanded(
      child: GestureDetector(
        onTap: () {
            setState(() => _activeSegment = index);
             // Verify data needed for the new segment
            if (index == 1 && _monthDailyRecords.isEmpty) {
                _fetchMonthData();
            }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isActive ? colorScheme.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(100),
            boxShadow: isActive
                ? [
                    BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isActive ? colorScheme.primary : colorScheme.outline,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTodayView() {
    final colorScheme = Theme.of(context).colorScheme;
    if (_dailyStats == null) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(32),
          child: Column(
            children: [
              Icon(Icons.cloud_off, size: 48, color: colorScheme.outline),
              const SizedBox(height: 16),
              Text('No data for selected date', style: GoogleFonts.outfit(color: colorScheme.outline)),
            ],
          ),
        ),
      );
    }
    
    // Aggregation Logic (Single Day)
    final deposit = _dailyStats!['deposit_amount'] ?? 0;
    final withdrawal = _dailyStats!['withdrawal_amount'] ?? 0;
    final aeps = (_dailyStats!['aeps_onus_amt'] ?? 0) + (_dailyStats!['aeps_offus_amt'] ?? 0);
    final remittance = _dailyStats!['remittance_amt'] ?? 0;
    // Note: Blueprint says "Total txn amount". Usually this means sum of above.
    final totalAmt = deposit + withdrawal + aeps + remittance;
    
    final totalTxns = ((_dailyStats!['deposit_count'] ?? 0) as int) +
        ((_dailyStats!['withdrawal_count'] ?? 0) as int) +
        ((_dailyStats!['aeps_onus_count'] ?? 0) as int) +
        ((_dailyStats!['aeps_offus_count'] ?? 0) as int) +
        ((_dailyStats!['remittance_count'] ?? 0) as int);

    return Column(
      children: [

        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            DailyStatsCard(
              title: 'Deposits',
              value: _formatCurrency(deposit),
              subtext: '${_dailyStats!['deposit_count'] ?? 0} txns',
            ),
            DailyStatsCard(
              title: 'Withdrawals',
              value: _formatCurrency(withdrawal),
              subtext: '${_dailyStats!['withdrawal_count'] ?? 0} txns',
            ),
            DailyStatsCard(
              title: 'AEPS (All)',
              value: _formatCurrency(aeps),
              subtext: '${(_dailyStats!['aeps_onus_count'] ?? 0) + (_dailyStats!['aeps_offus_count'] ?? 0)} txns',
            ),
            DailyStatsCard(
              title: 'Remittance',
              value: _formatCurrency(remittance),
              subtext: '${_dailyStats!['remittance_count'] ?? 0} txns',
              highlight: true,
            ),
            DailyStatsCard(
              title: 'PMJDY',
              value: (_dailyStats!['online_account_count'] ?? 0).toString(),
              subtext: 'Online Accounts',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMonthView() {
    final totals = _aggregateMonthData();

    return Column(
      children: [

        GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.5,
            children: [
                DailyStatsCard(
                    title: 'Deposits',
                    value: _formatCurrency(totals['deposit']!),
                ),
                DailyStatsCard(
                    title: 'Withdrawals',
                    value: _formatCurrency(totals['withdrawal']!),
                ),
                DailyStatsCard(
                    title: 'AEPS',
                    value: _formatCurrency(totals['aeps']!),
                ),
                DailyStatsCard(
                    title: 'Remittance',
                    value: _formatCurrency(totals['remittance']!),
                    highlight: true,
                ),
            ],
        ),
         const SizedBox(height: 16),
         Text(
             'Aggregated from daily uploads. No commission logic applied.',
             style: GoogleFonts.outfit(fontSize: 12, color: AppColors.outline, fontStyle: FontStyle.italic),
         ),
      ],
    );
  }

  Widget _buildSchemesView() {
      final counts = _getSchemeCounts();
      final isFinal = _isSchemesMonthly && _approvedCommission != null;
      final badgeText = isFinal ? "Final (Approved)" : "Provisional (Daily Data)";
      final badgeColor = isFinal ? Colors.green : Colors.orange;

      return Column(
          children: [
              Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                      color: badgeColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: badgeColor.withOpacity(0.5))
                  ),
                  child: Text(
                      badgeText.toUpperCase(),
                      style: GoogleFonts.outfit(
                          fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor
                      ),
                  ),
              ),
              const SizedBox(height: 24),
              
              _buildSchemeCard('APY', counts['apy']!, Icons.savings_outlined, Colors.purple),
              const SizedBox(height: 12),
              _buildSchemeCard('PMJBY', counts['pmjby']!, Icons.health_and_safety_outlined, Colors.blue),
              const SizedBox(height: 12),
              _buildSchemeCard('PMJBY', counts['pmjby']!, Icons.health_and_safety_outlined, Colors.blue),
              const SizedBox(height: 12),
              _buildSchemeCard('PMSBY', counts['pmsby']!, Icons.shield_outlined, Colors.orange),
              const SizedBox(height: 12),
              _buildSchemeCard('PMJDY', counts['pmjdy']!, Icons.account_balance_outlined, Colors.teal),
          ],
      );
  }

  Widget _buildSchemeCard(String title, int count, IconData icon, Color color) {
      final colorScheme = Theme.of(context).colorScheme;
      return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
              color: colorScheme.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colorScheme.outline.withOpacity(0.1)),
          ),
          child: Row(
              children: [
                  Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: color),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                      child: Text(
                          title,
                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
                      ),
                  ),
                  Text(
                      count.toString(),
                      style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: colorScheme.onSurface),
                  ),
              ],
          ),
      );
  }

  Widget _buildTotalCard({required String label, required num amount, required int count}) {
      final colorScheme = Theme.of(context).colorScheme;
      return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: colorScheme.tertiaryContainer,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                      color: colorScheme.onTertiaryContainer.withOpacity(0.7),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatCurrency(amount),
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onTertiaryContainer,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$count Txns',
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      color: colorScheme.onTertiaryContainer.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(Icons.trending_up,
                    color: colorScheme.onTertiaryContainer),
              ),
            ],
          ),
        );
  }
}
