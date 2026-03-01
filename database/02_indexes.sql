-- =====================================================
-- INDEXES - All database indexes for performance
-- =====================================================
-- Run after tables are created
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);

-- Habits indexes
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);
CREATE INDEX IF NOT EXISTS habits_created_at_idx ON habits(created_at DESC);
CREATE INDEX IF NOT EXISTS habits_is_active_idx ON habits(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS habits_category_idx ON habits(category) WHERE category IS NOT NULL;

-- Habit completions indexes
CREATE INDEX IF NOT EXISTS habit_completions_habit_id_idx ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS habit_completions_user_id_idx ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS habit_completions_date_idx ON habit_completions(completion_date DESC);
CREATE INDEX IF NOT EXISTS habit_completions_habit_date_idx ON habit_completions(habit_id, completion_date);

-- Habit images indexes
CREATE INDEX IF NOT EXISTS habit_images_habit_id_idx ON habit_images(habit_id);
CREATE INDEX IF NOT EXISTS habit_images_user_id_idx ON habit_images(user_id);
CREATE INDEX IF NOT EXISTS habit_images_completion_id_idx ON habit_images(completion_id);
CREATE INDEX IF NOT EXISTS habit_images_created_at_idx ON habit_images(created_at DESC);

-- Onboarding data indexes
CREATE INDEX IF NOT EXISTS onboarding_data_user_id_idx ON onboarding_data(user_id);

-- Habit no auto-pause indexes
CREATE INDEX IF NOT EXISTS habit_no_auto_pause_habit_id_idx ON habit_no_auto_pause(habit_id);
