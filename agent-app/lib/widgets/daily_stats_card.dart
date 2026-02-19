import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/colors.dart';

class DailyStatsCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtext;
  final bool highlight;

  const DailyStatsCard({
    super.key,
    required this.title,
    required this.value,
    this.subtext,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: highlight ? colorScheme.primaryContainer : colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: highlight
            ? null
            : Border.all(color: colorScheme.outline.withOpacity(0.2)),
        boxShadow: highlight
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: GoogleFonts.outfit(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
              color: highlight
                  ? colorScheme.onPrimaryContainer.withOpacity(0.7)
                  : colorScheme.outline,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: highlight
                  ? colorScheme.onPrimaryContainer
                  : colorScheme.onSurface,
            ),
          ),
          if (subtext != null) ...[
            const SizedBox(height: 4),
            Text(
              subtext!,
              style: GoogleFonts.outfit(
                fontSize: 10,
                color: highlight
                    ? colorScheme.onPrimaryContainer.withOpacity(0.8)
                    : colorScheme.outline,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
