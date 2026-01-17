# Database Schema Documentation

This document explains the database structure for the Habit Tracker app.

## Overview

The database uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled for all tables. All tables are user-scoped, meaning users can only access their own data.

## Tables

### 1. `profiles`
Extends Supabase `auth.users` with additional profile information.

**Columns:**
- `id` (UUID) - References `auth.users(id)`, primary key
- `email` (TEXT) - User email
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - URL to user's avatar image
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

**Auto-created:** A profile is automatically created when a user signs up via the `handle_new_user()` trigger function.

---

### 2. `habits`
Main table for storing user habits with full configuration.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References `auth.users(id)`
- `title` (TEXT) - Habit name (required)
- `description` (TEXT) - Optional description
- `target` (TEXT) - Target description, e.g., "target: 2l today"
- `frequency` (TEXT) - 'daily' or 'weekly' (default: 'daily')
- `selected_days` (INTEGER[]) - Array of day numbers for weekly habits (0=Sunday, 1=Monday, etc.)
- `reminders_enabled` (BOOLEAN) - Whether reminders are enabled (default: true)
- `reminder_time` (TIME) - Time of day for reminders (HH:MM:SS format)
- `environment` (TEXT) - Where habit is performed: 'home', 'work', 'outdoors', 'gym', 'cafe', 'anywhere' (default: 'anywhere')
- `streak` (INTEGER) - Current streak count (default: 0)
- `current_streak_start_date` (DATE) - When current streak started
- `longest_streak` (INTEGER) - Longest streak achieved (default: 0)
- `color` (TEXT) - Color code for UI (default: '#4A90E2')
- `icon` (TEXT) - Optional icon identifier
- `is_active` (BOOLEAN) - Whether habit is active (default: true)
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Last update time

**Indexes:**
- `habits_user_id_idx` - Fast lookup by user
- `habits_created_at_idx` - Fast sorting by creation date
- `habits_is_active_idx` - Fast filtering of active habits

---

### 3. `habit_completions`
Tracks daily/weekly completions of habits.

**Columns:**
- `id` (UUID) - Primary key
- `habit_id` (UUID) - References `habits(id)`
- `user_id` (UUID) - References `auth.users(id)`
- `completion_date` (DATE) - Date of completion (required)
- `completed_at` (TIMESTAMP) - Exact time of completion
- `notes` (TEXT) - Optional notes about the completion
- `verified` (BOOLEAN) - Whether completion was verified (e.g., via image) (default: false)
- `verification_method` (TEXT) - How it was verified: 'image', 'manual', 'ai'
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Last update time

**Constraints:**
- `UNIQUE(habit_id, completion_date)` - One completion per habit per day

**Indexes:**
- `habit_completions_habit_id_idx` - Fast lookup by habit
- `habit_completions_user_id_idx` - Fast lookup by user
- `habit_completions_date_idx` - Fast sorting by date
- `habit_completions_habit_date_idx` - Fast lookup by habit and date

**Auto-updates:** When a completion is added, the `update_habit_streak()` function automatically updates the habit's streak count.

---

### 4. `habit_images`
Stores progress images uploaded by users.

**Columns:**
- `id` (UUID) - Primary key
- `habit_id` (UUID) - References `habits(id)`
- `completion_id` (UUID) - Optional reference to `habit_completions(id)`
- `user_id` (UUID) - References `auth.users(id)`
- `image_url` (TEXT) - URL to image in Supabase Storage (required)
- `storage_path` (TEXT) - Path in Supabase Storage bucket
- `ai_analysis_result` (TEXT) - JSON or text response from Gemini AI
- `ai_verification_status` (TEXT) - 'pending', 'verified', 'rejected', or 'failed'
- `ai_verified_at` (TIMESTAMP) - When AI verification completed
- `taken_at` (TIMESTAMP) - When image was taken
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Last update time

**Indexes:**
- `habit_images_habit_id_idx` - Fast lookup by habit
- `habit_images_user_id_idx` - Fast lookup by user
- `habit_images_completion_id_idx` - Fast lookup by completion
- `habit_images_created_at_idx` - Fast sorting by creation date

---

### 5. `onboarding_data`
Stores user onboarding information collected during the onboarding flow.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References `auth.users(id)`, unique
- `habit_name` (TEXT) - Habit name from onboarding step 1
- `distraction_index` (INTEGER) - Selected distraction index (0-4)
- `distraction_text` (TEXT) - Selected distraction text
- `notifications_enabled` (BOOLEAN) - Whether notifications are enabled (default: false)
- `onboarding_completed` (BOOLEAN) - Whether onboarding is completed (default: false)
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Last update time

**Constraints:**
- `UNIQUE(user_id)` - One onboarding record per user

**Indexes:**
- `onboarding_data_user_id_idx` - Fast lookup by user

---

## Triggers

### Automatic Profile Creation
When a new user signs up via `auth.users`, a profile is automatically created in the `profiles` table via the `handle_new_user()` trigger function.

### Automatic Streak Updates
When a habit completion is added, the `update_habit_streak()` function automatically:
- Calculates the current streak
- Updates the habit's streak count
- Updates the longest streak if current streak is longer
- Sets the streak start date

### Automatic Timestamp Updates
All tables with `updated_at` columns automatically update this timestamp when a row is updated via the `update_updated_at_column()` trigger function.

## Storage Setup

### Create Storage Bucket
1. Go to Supabase Dashboard > Storage
2. Click "Create Bucket"
3. Name: `habit-images`
4. Public: **false** (private bucket)
5. File size limit: 10MB (or as needed)
6. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### Storage Policies
After creating the bucket, run these SQL commands to set up policies:

```sql
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
```

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only view their own data
- Users can only insert/update/delete their own data
- All operations require authentication

## Usage Examples

### Create a Habit
```sql
INSERT INTO habits (user_id, title, frequency, reminders_enabled, reminder_time, environment)
VALUES (
  auth.uid(),
  'Drink water',
  'daily',
  true,
  '08:30:00',
  'anywhere'
);
```

### Mark Habit as Complete
```sql
INSERT INTO habit_completions (habit_id, user_id, completion_date, verified)
VALUES (
  'habit-uuid-here',
  auth.uid(),
  CURRENT_DATE,
  true
);
-- Streak will be automatically updated
```

### Get User's Habits with Completions
```sql
SELECT 
  h.*,
  COUNT(hc.id) as total_completions,
  MAX(hc.completion_date) as last_completion
FROM habits h
LEFT JOIN habit_completions hc ON h.id = hc.habit_id
WHERE h.user_id = auth.uid()
  AND h.is_active = true
GROUP BY h.id
ORDER BY h.created_at DESC;
```

## Notes

- All timestamps use UTC timezone
- All foreign keys have `ON DELETE CASCADE` to maintain data integrity
- The `selected_days` array uses PostgreSQL array type for weekly habit scheduling
- Image storage uses Supabase Storage with user-scoped folders (`{user_id}/image.jpg`)
