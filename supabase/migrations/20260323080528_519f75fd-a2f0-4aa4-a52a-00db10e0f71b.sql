
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'parent',
  content text NOT NULL,
  image_url text,
  approved boolean NOT NULL DEFAULT false,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit reviews" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Approved reviews visible to all" ON public.reviews
  FOR SELECT TO anon, authenticated
  USING (approved = true OR get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can update reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can delete reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true);

CREATE POLICY "Anyone can upload review images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'review-images');

CREATE POLICY "Review images publicly readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'review-images');
