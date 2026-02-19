# Quick Fix: Database Table Missing

## ✅ Solution

I've created the complete table schema for you: **`supabase/schema_daily_performance.sql`**

## 🚀 Steps to Fix

1. **Open Supabase Dashboard** → SQL Editor
2. **Run this file first**: `supabase/schema_daily_performance.sql`
   - This creates the `daily_performance` table with all required columns
3. **Then run**: `supabase/daily_upload.sql`
   - This creates the upload function

## 📋 What the Table Includes

The `daily_performance` table has all 26+ columns needed:
- `device_id`, `date` (with UNIQUE constraint)
- Location fields: `state`, `zone`, `sol_id`
- Transaction counts and amounts for deposits, withdrawals
- AEPS (onus/offus) metrics
- Card transactions (Rupay, Other)
- Remittance data
- Government schemes (PMJBY, PMSBY, APY)
- Enrollment and online account counts

## ⚠️ Prerequisites

Make sure these tables exist first:
- ✅ `devices` table (for foreign key reference)
- ✅ `upload_logs` table (for audit logging)
- ✅ `agents` table (for RLS policies)

If they don't exist, you'll need to create them too. Let me know if you need those schemas as well!

## 🔍 After Running the Schema

Verify in Supabase:
- Go to **Database** → **Tables**
- You should see `daily_performance` with all columns
- Check that the UNIQUE constraint exists on `(device_id, date)`

Then try uploading again - it should work! 🎉
