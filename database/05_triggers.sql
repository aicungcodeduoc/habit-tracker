-- =====================================================
-- DATABASE TRIGGERS
-- =====================================================
-- Run after functions are created
-- =====================================================

-- =====================================================
-- Triggers to update updated_at timestamp
-- =====================================================
DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habit_completions_updated_at ON habit_completions;
CREATE TRIGGER update_habit_completions_updated_at BEFORE UPDATE ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_habit_images_updated_at ON habit_images;
CREATE TRIGGER update_habit_images_updated_at BEFORE UPDATE ON habit_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_data_updated_at ON onboarding_data;
CREATE TRIGGER update_onboarding_data_updated_at BEFORE UPDATE ON onboarding_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Trigger to create profile when user signs up
-- =====================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Trigger to update streak on completion
-- =====================================================
DROP TRIGGER IF EXISTS update_streak_on_completion ON habit_completions;
CREATE TRIGGER update_streak_on_completion
  AFTER INSERT ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_habit_streak();
