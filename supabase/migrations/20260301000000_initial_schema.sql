-- =====================================================
-- Initial schema — SSOT for Habit Tracker DB
-- Consolidated from database/ (01_tables → 05_triggers)
-- =====================================================

-- =====================================================
-- 1. TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target TEXT,
  category TEXT,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  selected_days INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  reminders_enabled BOOLEAN DEFAULT true,
  reminder_time TIME,
  environment TEXT DEFAULT 'anywhere' CHECK (environment IN ('home', 'work', 'outdoors', 'gym', 'cafe', 'anywhere')),
  streak INTEGER DEFAULT 0,
  current_streak_start_date DATE,
  longest_streak INTEGER DEFAULT 0,
  color TEXT DEFAULT '#4A90E2',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT,
  verified BOOLEAN DEFAULT false,
  verification_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(habit_id, completion_date)
);

CREATE TABLE IF NOT EXISTS habit_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completion_id UUID REFERENCES habit_completions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT,
  ai_analysis_result TEXT,
  ai_verification_status TEXT CHECK (ai_verification_status IN ('pending', 'verified', 'rejected', 'failed')),
  ai_verified_at TIMESTAMP WITH TIME ZONE,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS onboarding_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_name TEXT,
  distraction_index INTEGER,
  distraction_text TEXT,
  notifications_enabled BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS habit_no_auto_pause (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(habit_id)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);
CREATE INDEX IF NOT EXISTS habits_created_at_idx ON habits(created_at DESC);
CREATE INDEX IF NOT EXISTS habits_is_active_idx ON habits(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS habits_category_idx ON habits(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS habit_completions_habit_id_idx ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS habit_completions_user_id_idx ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS habit_completions_date_idx ON habit_completions(completion_date DESC);
CREATE INDEX IF NOT EXISTS habit_completions_habit_date_idx ON habit_completions(habit_id, completion_date);
CREATE INDEX IF NOT EXISTS habit_images_habit_id_idx ON habit_images(habit_id);
CREATE INDEX IF NOT EXISTS habit_images_user_id_idx ON habit_images(user_id);
CREATE INDEX IF NOT EXISTS habit_images_completion_id_idx ON habit_images(completion_id);
CREATE INDEX IF NOT EXISTS habit_images_created_at_idx ON habit_images(created_at DESC);
CREATE INDEX IF NOT EXISTS onboarding_data_user_id_idx ON onboarding_data(user_id);
CREATE INDEX IF NOT EXISTS habit_no_auto_pause_habit_id_idx ON habit_no_auto_pause(habit_id);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert their own habits" ON habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON habits;
CREATE POLICY "Users can view their own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON habits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can update their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete their own completions" ON habit_completions;
CREATE POLICY "Users can view their own completions" ON habit_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own completions" ON habit_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own completions" ON habit_completions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own completions" ON habit_completions FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE habit_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can insert their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can update their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can delete their own images" ON habit_images;
CREATE POLICY "Users can view their own images" ON habit_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own images" ON habit_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own images" ON habit_images FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own images" ON habit_images FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON onboarding_data;
CREATE POLICY "Users can view their own onboarding data" ON onboarding_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own onboarding data" ON onboarding_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own onboarding data" ON onboarding_data FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE habit_no_auto_pause ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own no-auto-pause" ON habit_no_auto_pause;
CREATE POLICY "Users can view their own no-auto-pause" ON habit_no_auto_pause FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_streak INTEGER;
  last_completion_date DATE;
  new_streak_start DATE;
BEGIN
  SELECT streak, current_streak_start_date INTO current_streak, last_completion_date
  FROM habits WHERE id = NEW.habit_id;
  IF last_completion_date IS NULL OR NEW.completion_date = last_completion_date + INTERVAL '1 day' THEN
    IF last_completion_date IS NULL THEN
      new_streak_start := NEW.completion_date;
      current_streak := 1;
    ELSE
      new_streak_start := COALESCE((SELECT current_streak_start_date FROM habits WHERE id = NEW.habit_id), NEW.completion_date);
      current_streak := current_streak + 1;
    END IF;
  ELSE
    new_streak_start := NEW.completion_date;
    current_streak := 1;
  END IF;
  UPDATE habits SET streak = current_streak, current_streak_start_date = new_streak_start, longest_streak = GREATEST(longest_streak, current_streak) WHERE id = NEW.habit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_habit_completions_updated_at ON habit_completions;
CREATE TRIGGER update_habit_completions_updated_at BEFORE UPDATE ON habit_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_habit_images_updated_at ON habit_images;
CREATE TRIGGER update_habit_images_updated_at BEFORE UPDATE ON habit_images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_onboarding_data_updated_at ON onboarding_data;
CREATE TRIGGER update_onboarding_data_updated_at BEFORE UPDATE ON onboarding_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
DROP TRIGGER IF EXISTS update_streak_on_completion ON habit_completions;
CREATE TRIGGER update_streak_on_completion AFTER INSERT ON habit_completions FOR EACH ROW EXECUTE FUNCTION update_habit_streak();
