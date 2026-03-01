# Database Schema

This directory contains the database schema for the Habit Tracker app, split into organized files for better maintainability.

## File Structure

- **`schema.sql`** - Master file (for reference, uses \i commands for PostgreSQL)
- **`01_tables.sql`** - All table definitions
- **`02_indexes.sql`** - All database indexes
- **`03_policies.sql`** - Row Level Security (RLS) policies
- **`04_functions.sql`** - Database functions
- **`05_triggers.sql`** - Database triggers
- **`06_storage.sql`** - Storage bucket policies (optional)
- **`07_migrations.sql`** - Migration scripts for existing databases

## Setup Instructions

### For New Databases

Run these files in order in your Supabase SQL Editor:

1. `01_tables.sql` - Creates all tables
2. `02_indexes.sql` - Creates all indexes
3. `03_policies.sql` - Sets up Row Level Security
4. `04_functions.sql` - Creates database functions
5. `05_triggers.sql` - Sets up triggers
6. `06_storage.sql` - Storage policies (after creating bucket manually)

### For Existing Databases

If you already have a database and need to add new fields:

1. Run `07_migrations.sql` to add new columns/indexes
2. Or manually run the specific migration you need

## Storage Setup

Before running `06_storage.sql`, you need to:

1. Go to Supabase Dashboard > Storage
2. Create a new bucket named `habit-images`
3. Set it as private (not public)
4. Configure file size limits and MIME types as needed
5. Then run `06_storage.sql` to set up the policies

## Tables Overview

- **profiles** - User profile information
- **habits** - Main habits table with full configuration (includes category field)
- **habit_completions** - Tracks daily/weekly completions
- **habit_images** - Stores progress images
- **onboarding_data** - User onboarding information
- **habit_no_auto_pause** - One row per habit that has passed 7 days since creation; used to mark "do not auto-pause" (filled by a daily job)

## Key Features

- **Row Level Security (RLS)** - All tables have RLS enabled
- **Automatic Timestamps** - `updated_at` fields update automatically
- **Automatic Profile Creation** - Profiles created when users sign up
- **Automatic Streak Calculation** - Streaks update when completions are added
- **Category Support** - Habits have categories extracted from titles
- **7-day no-auto-pause** - The function `insert_no_auto_pause_after_7_days()` inserts into `habit_no_auto_pause` for habits created at least 7 days ago. Run it daily (e.g. via pg_cron in Supabase SQL Editor: enable `pg_cron` then run the commented snippet at the end of `07_migrations.sql`), or call it from a Supabase Edge Function with a cron trigger.
