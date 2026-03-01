-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================
-- Run after tables are created
-- =====================================================

-- =====================================================
-- Function to automatically update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- Function to automatically create profile when user signs up
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function to update habit streak when completion is added
-- =====================================================
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_streak INTEGER;
  last_completion_date DATE;
  new_streak_start DATE;
BEGIN
  -- Get current streak and last completion date
  SELECT 
    streak,
    current_streak_start_date
  INTO 
    current_streak,
    last_completion_date
  FROM habits
  WHERE id = NEW.habit_id;

  -- If this is the first completion or continuation of streak
  IF last_completion_date IS NULL OR NEW.completion_date = last_completion_date + INTERVAL '1 day' THEN
    -- Continue or start streak
    IF last_completion_date IS NULL THEN
      new_streak_start := NEW.completion_date;
      current_streak := 1;
    ELSE
      new_streak_start := COALESCE(
        (SELECT current_streak_start_date FROM habits WHERE id = NEW.habit_id),
        NEW.completion_date
      );
      current_streak := current_streak + 1;
    END IF;
  ELSE
    -- Streak broken, start new streak
    new_streak_start := NEW.completion_date;
    current_streak := 1;
  END IF;

  -- Update longest streak if current is longer
  UPDATE habits
  SET 
    streak = current_streak,
    current_streak_start_date = new_streak_start,
    longest_streak = GREATEST(longest_streak, current_streak)
  WHERE id = NEW.habit_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function to insert no-auto-pause rows after 7 days
-- =====================================================
-- Run daily (e.g. via pg_cron); inserts one row per habit created >= 7 days ago.
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
