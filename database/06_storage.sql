-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================
-- Note: You need to create the storage bucket manually in Supabase Dashboard
-- Go to Storage > Create Bucket
-- Bucket name: 'habit-images'
-- Public: false (private bucket)
-- File size limit: 10MB (or as needed)
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- =====================================================

-- Storage policies (run after creating bucket):
-- These will be created via Supabase Dashboard or via SQL:

-- Allow users to upload their own images
CREATE POLICY IF NOT EXISTS "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'habit-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own images
CREATE POLICY IF NOT EXISTS "Users can view their own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'habit-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY IF NOT EXISTS "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'habit-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
