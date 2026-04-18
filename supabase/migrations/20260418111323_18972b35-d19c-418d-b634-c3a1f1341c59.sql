
-- Add total marks to assignments
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS total_marks integer NOT NULL DEFAULT 100;

-- Add class/section targeting to announcements (in addition to target_role)
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS target_class text,
  ADD COLUMN IF NOT EXISTS target_section text;

-- Update the SELECT policy on announcements so that target_class/section is honored for students
DROP POLICY IF EXISTS "Announcements viewable by target role" ON public.announcements;

CREATE POLICY "Announcements viewable by audience"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  -- Admins see all
  get_user_role(auth.uid()) = 'admin'
  -- Teachers see all role-targeted/teacher-targeted, plus any author of their own
  OR (get_user_role(auth.uid()) = 'teacher' AND (target_role IS NULL OR target_role::text IN ('teacher','student') OR author_id = auth.uid()))
  -- Students: see if no class targeting OR matches their class/section
  OR (
    get_user_role(auth.uid()) = 'student'
    AND (target_role IS NULL OR target_role::text = 'student')
    AND (
      target_class IS NULL
      OR EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.user_id = auth.uid()
          AND s.class = announcements.target_class
          AND (announcements.target_section IS NULL OR s.section = announcements.target_section)
      )
    )
  )
);
