# Habit Tracker

A simple React Native/Expo habit tracking app with Supabase backend.

## Features

- ✅ Create, Read, Update, Delete habits
- ✅ Track daily streaks
- ✅ Simple and clean UI
- ✅ Supabase database integration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the SQL script from `database/schema.sql`
3. Go to Project Settings > API to get your credentials

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Update `config/supabase.js` with your credentials if you don't use environment variables.

### 4. Run the App

```bash
# Start Expo
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## Database Schema

The app uses a `habits` table with the following structure:

- `id` (UUID) - Primary key
- `name` (TEXT) - Habit name (required)
- `description` (TEXT) - Optional description
- `color` (TEXT) - Color code (default: '#4A90E2')
- `streak` (INTEGER) - Current streak count (default: 0)
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

See `database/schema.sql` for the complete schema and RLS policies.

## Project Structure

```
├── App.js                 # Main app component
├── components/
│   └── HabitTracker.js   # Main habit tracker UI component
├── config/
│   └── supabase.js       # Supabase client configuration
├── services/
│   └── habitService.js   # CRUD operations for habits
├── database/
│   └── schema.sql        # Database schema
└── .cursor/
    └── rules.md          # Supabase best practices
```

## Usage

1. **Add a Habit**: Enter a habit name (required) and optional description, then tap "Add Habit"
2. **Track Streak**: Tap the "+1" button on a habit card to increment the streak
3. **Edit Habit**: Tap "Edit" on a habit card, modify the fields, and tap "Update Habit"
4. **Delete Habit**: Tap "Delete" on a habit card and confirm

## Notes

- Make sure to enable Row Level Security (RLS) policies in Supabase for production use
- The current setup uses anonymous access for development - customize RLS policies for production
- Check `.cursor/rules.md` for Supabase best practices
