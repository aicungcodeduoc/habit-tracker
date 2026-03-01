-- =====================================================
-- TABLES - All table definitions
-- =====================================================
-- Run this file first to create all tables
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
  category TEXT, -- Extracted category from title (e.g., "read book", "run 5km")
  
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

-- =====================================================
-- 6. HABIT NO AUTO PAUSE TABLE
-- =====================================================
-- One row per habit that has passed 7 days since creation;
-- used to mark "do not auto-pause" (inserted by scheduled job).
CREATE TABLE IF NOT EXISTS habit_no_auto_pause (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(habit_id)
);
