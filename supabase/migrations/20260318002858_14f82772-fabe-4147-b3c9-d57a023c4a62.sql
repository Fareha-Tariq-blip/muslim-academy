
-- Create gallery storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view gallery files
CREATE POLICY "Gallery files are public" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'gallery');

-- Admin can upload gallery files
CREATE POLICY "Admin can upload gallery files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'gallery' AND get_user_role(auth.uid()) = 'admin');

-- Admin can delete gallery files
CREATE POLICY "Admin can delete gallery files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'gallery' AND get_user_role(auth.uid()) = 'admin');
