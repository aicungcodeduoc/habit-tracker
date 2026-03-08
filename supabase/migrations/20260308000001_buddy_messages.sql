-- =====================================================
-- Buddy Messages — Chat history for AI Buddy feature
-- =====================================================

-- 1. TABLE
CREATE TABLE IF NOT EXISTS buddy_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS buddy_messages_user_id_idx ON buddy_messages(user_id);
CREATE INDEX IF NOT EXISTS buddy_messages_user_created_idx ON buddy_messages(user_id, created_at DESC);

-- 3. RLS POLICIES
ALTER TABLE buddy_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own buddy messages"
  ON buddy_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own buddy messages"
  ON buddy_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buddy messages"
  ON buddy_messages FOR DELETE
  USING (auth.uid() = user_id);
