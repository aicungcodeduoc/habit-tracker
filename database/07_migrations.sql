-- =====================================================
-- MIGRATIONS - For existing databases
-- =====================================================
-- Run these if you already have a database and need to add new fields
-- =====================================================

-- Add category field to existing habits table (if not exists)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index on category (if not exists)
CREATE INDEX IF NOT EXISTS habits_category_idx ON habits(category) WHERE category IS NOT NULL;

-- =====================================================
-- 7-day no-auto-pause: table, index, RLS, function
-- =====================================================

-- Table: one row per habit that passed 7 days since creation
CREATE TABLE IF NOT EXISTS habit_no_auto_pause (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(habit_id)
);

CREATE INDEX IF NOT EXISTS habit_no_auto_pause_habit_id_idx ON habit_no_auto_pause(habit_id);

ALTER TABLE habit_no_auto_pause ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own no-auto-pause" ON habit_no_auto_pause;
CREATE POLICY "Users can view their own no-auto-pause" ON habit_no_auto_pause
  FOR SELECT
  USING (auth.uid() = user_id);

-- Function: run daily to mark habits created >= 7 days ago as do-not-auto-pause
CREATE OR REPLACE FUNCTION insert_no_auto_pause_after_7_days()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  INSERT INTO habit_no_auto_pause (habit_id, user_id)
  SELECT h.id, h.user_id
  FROM habits h
  WHERE h.created_at <= (now() - interval '7 days')
    AND NOT EXISTS (SELECT 1 FROM habit_no_auto_pause n WHERE n.habit_id = h.id);
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

-- Optional: schedule daily via pg_cron (run in Supabase SQL Editor if extension enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('no-auto-pause-7d', '0 0 * * *', $$SELECT insert_no_auto_pause_after_7_days()$$);
