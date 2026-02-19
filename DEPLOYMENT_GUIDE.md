# Daily Performance Engine - Deployment Guide

## 🔷 Step 0: Create the Database Table (IMPORTANT!)

**If you're getting "column does not exist" errors, you need to create the table first!**

### Instructions:

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Create the daily_performance table**
   - Open the file: `supabase/schema_daily_performance.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter / Cmd+Enter)
   - You should see: "Success. No rows returned"

4. **Verify Table Creation**
   - In the left sidebar, navigate to "Database" → "Tables"
   - You should see `daily_performance` listed with all columns

---

## 🔷 Step 1: Deploy the SQL Function to Supabase

After creating the table, deploy the upload function.

### Instructions:

1. **In SQL Editor, click "New query"**

2. **Copy and Paste SQL**
   - Open the file: `supabase/daily_upload.sql`
   - Copy ALL the contents (lines 1 to end)
   - Paste into the SQL Editor

4. **Execute the SQL**
   - Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)
   - You should see: "Success. No rows returned"

5. **Verify Function Creation**
   - In the left sidebar, navigate to "Database" → "Functions"
   - You should see `daily_upload` listed

---

## 🔷 Step 2: Verify Database Tables Exist

The RPC function expects these tables to exist:
- `devices` 
- `daily_performance`
- `upload_logs`

If you haven't created them yet, you'll need to run the schema creation SQL first.

---

## 🔷 Step 3: Test the Upload Flow

### Start Development Server

```bash
npm run dev
```

### Navigate to Daily Upload Page

Open your browser and go to:
```
http://localhost:3000/admin/daily-upload
```

### Test Scenarios

#### ✅ Test 1: Valid Upload (New Date)
1. Select tomorrow's date in the date picker
2. Download the CSV template using the button
3. Or use the sample file: `test_data/test_daily_valid.csv`
4. Upload the file
5. Should see success message with row counts

#### ✅ Test 2: Replace Existing Data
1. Upload the same file again with the same date
2. Should see confirmation dialog
3. Click "OK" to confirm replace
4. Should see success message

#### ✅ Test 3: Duplicate Device Detection
1. Upload `test_data/test_daily_duplicate.csv`
2. Should see error: "Duplicate Deviceid..."

#### ✅ Test 4: Missing Date
1. Try uploading without selecting a date first
2. Should see error: "Please select a date first."

---

## 🔷 Troubleshooting

### Error: "function daily_upload does not exist"
- Make sure you ran the SQL in Supabase SQL Editor
- Check that the function name is exactly `daily_upload`

### Error: "relation daily_performance does not exist"
- You need to create the `daily_performance` table first
- Refer to your database schema documentation

### Error: "Invalid Daily file format"
- Download the template from the UI
- Make sure CSV headers match exactly (case-sensitive)

---

## 🔷 Next Steps

Once the upload is working:
1. Test with real production data (small batch first)
2. Verify data appears correctly in Supabase dashboard
3. Check upload_logs table for audit trail
4. Test RLS policies if you have agent-level access configured

---

## 📋 File Locations

- **SQL Function**: `supabase/daily_upload.sql`
- **Validation Logic**: `lib/daily/validation.ts`
- **Upload Component**: `components/daily/DailyUploadPage.tsx`
- **Admin Page**: `app/admin/daily-upload/page.tsx`
- **Test Data**: `test_data/test_daily_valid.csv`
