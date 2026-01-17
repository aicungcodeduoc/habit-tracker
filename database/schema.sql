-- =====================================================
-- Supabase Database Schema for Habit Tracker App
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- This script creates all necessary tables for:
-- - User authentication and profiles
-- - Habits with full configuration
-- - Onboarding data
-- - Habit progress tracking
-- - Habit images/progress photos
-- =====================================================

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
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

-- Create index on profiles
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- =====================================================
-- 2. HABITS TABLE
-- =====================================================
-- Main table for storing user habits with all configuration
CREATE TABLE IF NOT EXISTS habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic habit information
  title TEXT NOT NULL,
  description TEXT,
  target TEXT, -- e.g., "target: 2l today"
  
  -- Frequency and scheduling
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
  selected_days INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of day numbers (0=Sunday, 1=Monday, etc.)
  
  -- Reminders
  reminders_enabled BOOLEAN DEFAULT true,
  reminder_time TIME, -- Time of day for reminders (HH:MM:SS)
  
  -- Environment/Context
  environment TEXT DEFAULT 'anywhere' CHECK (environment IN ('home', 'work', 'outdoors', 'gym', 'cafe', 'anywhere')),
  
  -- Progress tracking
  streak INTEGER DEFAULT 0,
  current_streak_start_date DATE,
  longest_streak INTEGER DEFAULT 0,
  
  -- Metadata
  color TEXT DEFAULT '#4A90E2',
  icon TEXT, -- Optional icon identifier
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert their own habits" ON habits;
DROP POLICY IF EXISTS "Users can update their own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete their own habits" ON habits;

-- Create policies for habits
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

-- Create indexes for habits
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);
CREATE INDEX IF NOT EXISTS habits_created_at_idx ON habits(created_at DESC);
CREATE INDEX IF NOT EXISTS habits_is_active_idx ON habits(is_active) WHERE is_active = true;

-- =====================================================
-- 3. HABIT COMPLETIONS TABLE
-- =====================================================
-- Tracks daily/weekly completions of habits
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Completion data
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Optional notes
  notes TEXT,
  
  -- Verification
  verified BOOLEAN DEFAULT false, -- Whether completion was verified (e.g., via image)
  verification_method TEXT, -- e.g., 'image', 'manual', 'ai'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one completion per habit per day
  UNIQUE(habit_id, completion_date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can update their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete their own completions" ON habit_completions;

-- Create policies for habit_completions
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

-- Create indexes for habit_completions
CREATE INDEX IF NOT EXISTS habit_completions_habit_id_idx ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS habit_completions_user_id_idx ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS habit_completions_date_idx ON habit_completions(completion_date DESC);
CREATE INDEX IF NOT EXISTS habit_completions_habit_date_idx ON habit_completions(habit_id, completion_date);

-- =====================================================
-- 4. HABIT IMAGES TABLE
-- =====================================================
-- Stores progress images uploaded by users
CREATE TABLE IF NOT EXISTS habit_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  completion_id UUID REFERENCES habit_completions(id) ON DELETE SET NULL, -- Optional link to completion
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Image data
  image_url TEXT NOT NULL, -- URL to image stored in Supabase Storage
  storage_path TEXT, -- Path in Supabase Storage bucket
  
  -- AI Analysis results
  ai_analysis_result TEXT, -- JSON or text response from Gemini
  ai_verification_status TEXT CHECK (ai_verification_status IN ('pending', 'verified', 'rejected', 'failed')),
  ai_verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE habit_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can insert their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can update their own images" ON habit_images;
DROP POLICY IF EXISTS "Users can delete their own images" ON habit_images;

-- Create policies for habit_images
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

-- Create indexes for habit_images
CREATE INDEX IF NOT EXISTS habit_images_habit_id_idx ON habit_images(habit_id);
CREATE INDEX IF NOT EXISTS habit_images_user_id_idx ON habit_images(user_id);
CREATE INDEX IF NOT EXISTS habit_images_completion_id_idx ON habit_images(completion_id);
CREATE INDEX IF NOT EXISTS habit_images_created_at_idx ON habit_images(created_at DESC);

-- =====================================================
-- 5. ONBOARDING DATA TABLE
-- =====================================================
-- Stores user onboarding information
CREATE TABLE IF NOT EXISTS onboarding_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Onboarding responses
  habit_name TEXT, -- Habit name from step 1
  distraction_index INTEGER, -- Selected distraction index (0-4)
  distraction_text TEXT, -- Selected distraction text
  
  -- Settings
  notifications_enabled BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- One onboarding record per user
  UNIQUE(user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON onboarding_data;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON onboarding_data;

-- Create policies for onboarding_data
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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS onboarding_data_user_id_idx ON onboarding_data(user_id);

-- =====================================================
-- 6. TRIGGER FUNCTIONS
-- =====================================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to automatically create profile when user signs up
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
-- 7. TRIGGERS
-- =====================================================
-- Trigger to update updated_at for habits
DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for habit_completions
DROP TRIGGER IF EXISTS update_habit_completions_updated_at ON habit_completions;
CREATE TRIGGER update_habit_completions_updated_at BEFORE UPDATE ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for habit_images
DROP TRIGGER IF EXISTS update_habit_images_updated_at ON habit_images;
CREATE TRIGGER update_habit_images_updated_at BEFORE UPDATE ON habit_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for onboarding_data
DROP TRIGGER IF EXISTS update_onboarding_data_updated_at ON onboarding_data;
CREATE TRIGGER update_onboarding_data_updated_at BEFORE UPDATE ON onboarding_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================
-- Function to update habit streak when completion is added
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

-- Trigger to update streak on completion
DROP TRIGGER IF EXISTS update_streak_on_completion ON habit_completions;
CREATE TRIGGER update_streak_on_completion
  AFTER INSERT ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_habit_streak();

-- =====================================================
-- 9. STORAGE BUCKET SETUP (Run separately in Storage section)
-- =====================================================
-- Note: You need to create the storage bucket manually in Supabase Dashboard
-- Go to Storage > Create Bucket
-- Bucket name: 'habit-images'
-- Public: false (private bucket)
-- File size limit: 10MB (or as needed)
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policies (run after creating bucket):
-- These will be created via Supabase Dashboard or via SQL:
/*
-- Allow users to upload their own images
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'habit-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own images
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'habit-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'habit-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
