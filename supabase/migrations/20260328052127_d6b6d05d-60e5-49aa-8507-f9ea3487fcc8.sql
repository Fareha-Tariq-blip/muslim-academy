
CREATE TABLE public.teacher_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, date)
);

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage teacher attendance" ON public.teacher_attendance
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Teachers can view own attendance" ON public.teacher_attendance
  FOR SELECT TO authenticated
  USING (teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
