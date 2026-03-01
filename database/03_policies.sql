-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Run after tables are created
-- =====================================================

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- HABITS POLICIES
-- =====================================================
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert their own habits" ON habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON habits;

CREATE POLICY "Users can view their own habits" ON habits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits" ON habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" ON habits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" ON habits
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HABIT COMPLETIONS POLICIES
-- =====================================================
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can update their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete their own completions" ON habit_completions;

CREATE POLICY "Users can view their own completions" ON habit_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions" ON habit_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completions" ON habit_completions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completions" ON habit_completions
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HABIT IMAGES POLICIES
-- =====================================================
ALTER TABLE habit_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can insert their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can update their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can delete their own images" ON habit_images;

CREATE POLICY "Users can view their own images" ON habit_images
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images" ON habit_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" ON habit_images
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON habit_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- ONBOARDING DATA POLICIES
-- =====================================================
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON onboarding_data;

CREATE POLICY "Users can view their own onboarding data" ON onboarding_data
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data" ON onboarding_data
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data" ON onboarding_data
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HABIT NO AUTO PAUSE POLICIES
-- =====================================================
-- Users can only SELECT their own rows; inserts are done by scheduled function (SECURITY DEFINER).
ALTER TABLE habit_no_auto_pause ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own no-auto-pause" ON habit_no_auto_pause;
CREATE POLICY "Users can view their own no-auto-pause" ON habit_no_auto_pause
  FOR SELECT
  USING (auth.uid() = user_id);
