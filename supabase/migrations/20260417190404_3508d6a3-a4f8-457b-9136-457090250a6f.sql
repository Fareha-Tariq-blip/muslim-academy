-- Community posts
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by authenticated"
  ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create posts"
  ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update own post"
  ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Author or admin can delete post"
  ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.get_user_role(auth.uid()) = 'admin');

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Likes (one like per user per post)
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes viewable by authenticated"
  ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can like"
  ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can unlike own"
  ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Replies
CREATE TABLE public.post_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies viewable by authenticated"
  ON public.post_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can reply"
  ON public.post_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author or admin can delete reply"
  ON public.post_replies FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.get_user_role(auth.uid()) = 'admin');

-- Storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-posts', 'community-posts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Community post images public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'community-posts');
CREATE POLICY "Authenticated can upload community images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'community-posts');
CREATE POLICY "Users can delete own community images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'community-posts' AND owner = auth.uid());