
-- Add photo_url and service_ids columns to operators
ALTER TABLE public.operators ADD COLUMN photo_url TEXT;
ALTER TABLE public.operators ADD COLUMN service_ids UUID[] DEFAULT '{}';

-- Create public bucket for operator photos
INSERT INTO storage.buckets (id, name, public) VALUES ('operator-photos', 'operator-photos', true);

-- Public read access
CREATE POLICY "Anyone can view operator photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'operator-photos');

-- Only owner can upload
CREATE POLICY "Users can upload operator photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'operator-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only owner can update
CREATE POLICY "Users can update operator photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'operator-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only owner can delete
CREATE POLICY "Users can delete operator photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'operator-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
