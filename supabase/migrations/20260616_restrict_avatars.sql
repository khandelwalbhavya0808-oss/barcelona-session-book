-- Drop the old wide-open read policy if it exists
DROP POLICY IF EXISTS "Public Read Access on avatars" ON storage.objects;

-- Create the new restricted select policy
CREATE POLICY "Allow select own avatar or admin all" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
    AND (
      (auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
      OR (auth.role() = 'authenticated' AND public.is_admin(auth.uid()))
    )
  );
