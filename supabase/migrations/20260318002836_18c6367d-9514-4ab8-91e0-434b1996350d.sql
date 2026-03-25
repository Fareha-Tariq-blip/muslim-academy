
-- Contact messages table
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact message (even anon could, but we'll use authenticated + anon)
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admin can view contact messages
CREATE POLICY "Admin can view contact messages"
ON public.contact_messages FOR SELECT
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- Admin can update (mark as read) and delete
CREATE POLICY "Admin can manage contact messages"
ON public.contact_messages FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');

-- Gallery table
CREATE TABLE public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  uploaded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Everyone can view gallery
CREATE POLICY "Gallery viewable by everyone"
ON public.gallery FOR SELECT
TO anon, authenticated
USING (true);

-- Admin can manage gallery
CREATE POLICY "Admin can manage gallery"
ON public.gallery FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');
