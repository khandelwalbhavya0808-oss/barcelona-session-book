-- ==========================================================
-- Storage setup for avatars and session-media buckets
-- Date: 2026-06-11
-- ==========================================================

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('session-media', 'session-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configure RLS on storage.objects
-- Enable RLS on storage.objects if not already enabled (it usually is by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Storage Policies for 'avatars'
CREATE POLICY "Public Read Access on avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow Auth Upload Own Avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow Auth Update Own Avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow Auth Delete Own Avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Storage Policies for 'session-media'
CREATE POLICY "Public Read Access on session-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'session-media');

CREATE POLICY "Admin manage session-media" ON storage.objects
  FOR ALL USING (
    bucket_id = 'session-media' 
    AND auth.role() = 'authenticated'
    AND public.is_admin(auth.uid())
  );
