-- Allow public (anon + authenticated) to read community posts, replies, likes, and basic profile info

DROP POLICY IF EXISTS "Posts viewable by authenticated" ON public.community_posts;
CREATE POLICY "Posts viewable by everyone"
  ON public.community_posts FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Replies viewable by authenticated" ON public.post_replies;
CREATE POLICY "Replies viewable by everyone"
  ON public.post_replies FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Likes viewable by authenticated" ON public.post_likes;
CREATE POLICY "Likes viewable by everyone"
  ON public.post_likes FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);