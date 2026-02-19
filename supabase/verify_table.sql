-- =====================================================
-- STEP 1: Check if the table exists and what columns it has
-- =====================================================
-- Run this in Supabase SQL Editor to see current structure

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_performance'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: If the table has wrong columns, drop and recreate
-- =====================================================
-- WARNING: This will DELETE ALL DATA in daily_performance table!
-- Only run if you're sure you want to start fresh

DROP TABLE IF EXISTS daily_performance CASCADE;

-- Then run the full schema from schema_daily_performance.sql
