-- Fix announcements SELECT policy so teachers don't see student-only announcements
DROP POLICY IF EXISTS "Announcements viewable by audience" ON public.announcements;

CREATE POLICY "Announcements viewable by audience"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  -- Admins see all
  (get_user_role(auth.uid()) = 'admin')
  OR
  -- Teachers see: their own posts, announcements with no target role, or those targeted to teachers
  (
    get_user_role(auth.uid()) = 'teacher'
    AND (
      author_id = auth.uid()
      OR target_role IS NULL
      OR (target_role)::text = 'teacher'
    )
  )
  OR
  -- Students see: announcements with no role or targeted to students, matching their class/section if set
  (
    get_user_role(auth.uid()) = 'student'
    AND (target_role IS NULL OR (target_role)::text = 'student')
    AND (
      target_class IS NULL
      OR EXISTS (
        SELECT 1 FROM students s
        WHERE s.user_id = auth.uid()
          AND s.class = announcements.target_class
          AND (announcements.target_section IS NULL OR s.section = announcements.target_section)
      )
    )
  )
);