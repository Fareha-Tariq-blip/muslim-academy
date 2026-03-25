-- Allow students to enroll themselves in courses
CREATE POLICY "Students can enroll themselves"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Allow students to unenroll themselves
CREATE POLICY "Students can unenroll themselves"
ON public.enrollments FOR DELETE
TO authenticated
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);