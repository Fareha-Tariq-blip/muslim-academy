UPDATE public.announcements SET author_id = NULL WHERE author_id = 'fd4d1dec-ca7c-496c-8e45-486dd8a6ea50';
DELETE FROM auth.users WHERE id = 'fd4d1dec-ca7c-496c-8e45-486dd8a6ea50';