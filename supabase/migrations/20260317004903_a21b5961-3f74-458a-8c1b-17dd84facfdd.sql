
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table (role stored directly here)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user role (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = _user_id
$$;

-- Profiles RLS
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can do everything on profiles" ON public.profiles FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  roll_number TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  guardian_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own record" ON public.students FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Admin can manage students" ON public.students FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Teachers table
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  qualification TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers viewable by authenticated" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage teachers" ON public.teachers FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'A',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses viewable by authenticated" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage courses" ON public.courses FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enrollments table
CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrollments viewable by relevant users" ON public.enrollments FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin'
  OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR course_id IN (SELECT id FROM public.courses WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
);
CREATE POLICY "Admin can manage enrollments" ON public.enrollments FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments viewable by enrolled students and teachers" ON public.assignments FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin'
  OR course_id IN (SELECT course_id FROM public.enrollments WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR course_id IN (SELECT id FROM public.courses WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
);
CREATE POLICY "Teachers can manage own course assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE POLICY "Teachers can update own course assignments" ON public.assignments FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE POLICY "Teachers can delete own course assignments" ON public.assignments FOR DELETE TO authenticated USING (
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Assignment Submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT,
  marks INTEGER,
  graded BOOLEAN NOT NULL DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own submissions" ON public.assignment_submissions FOR SELECT TO authenticated USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE POLICY "Students can submit assignments" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Teachers can grade submissions" ON public.assignment_submissions FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quizzes viewable by relevant users" ON public.quizzes FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin'
  OR course_id IN (SELECT course_id FROM public.enrollments WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR course_id IN (SELECT id FROM public.courses WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
);
CREATE POLICY "Teachers can manage quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Teachers can update quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Teachers can delete quizzes" ON public.quizzes FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quiz Questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quiz questions viewable with quiz" ON public.quiz_questions FOR SELECT TO authenticated USING (
  quiz_id IN (SELECT id FROM public.quizzes)
);
CREATE POLICY "Teachers can manage quiz questions" ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Teachers can update quiz questions" ON public.quiz_questions FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Teachers can delete quiz questions" ON public.quiz_questions FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- Quiz Attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  answers_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE POLICY "Students can create attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE POLICY "Students can update own attempts" ON public.quiz_attempts FOR UPDATE TO authenticated USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);
CREATE TRIGGER update_quiz_attempts_updated_at BEFORE UPDATE ON public.quiz_attempts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  term TEXT NOT NULL,
  marks INTEGER NOT NULL DEFAULT 0,
  grade_letter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own grades" ON public.grades FOR SELECT TO authenticated USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE POLICY "Teachers can manage grades" ON public.grades FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Teachers can update grades" ON public.grades FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance viewable by relevant users" ON public.attendance FOR SELECT TO authenticated USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE POLICY "Teachers can manage attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Teachers can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- Announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  target_role app_role,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements viewable by target role" ON public.announcements FOR SELECT TO authenticated USING (
  target_role IS NULL
  OR target_role::text = public.get_user_role(auth.uid())
  OR public.get_user_role(auth.uid()) = 'admin'
);
CREATE POLICY "Admin and teachers can create announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Admin and teachers can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Admin and teachers can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Remarks table
CREATE TABLE public.remarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.remarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Remarks viewable by student and teachers" ON public.remarks FOR SELECT TO authenticated USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR public.get_user_role(auth.uid()) IN ('admin', 'teacher')
);
CREATE POLICY "Teachers can create remarks" ON public.remarks FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- Course Materials table
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materials viewable by enrolled students and teachers" ON public.course_materials FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'admin'
  OR course_id IN (SELECT course_id FROM public.enrollments WHERE student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR course_id IN (SELECT id FROM public.courses WHERE teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid()))
);
CREATE POLICY "Teachers can manage materials" ON public.course_materials FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
CREATE POLICY "Teachers can delete materials" ON public.course_materials FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) IN ('admin', 'teacher'));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('quiz-files', 'quiz-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

-- Storage policies
CREATE POLICY "Assignment files publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');
CREATE POLICY "Teachers can upload assignments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND public.get_user_role(auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Submission files viewable by teachers and owner" ON storage.objects FOR SELECT USING (bucket_id = 'submissions' AND (public.get_user_role(auth.uid()) IN ('admin', 'teacher') OR auth.uid()::text = (storage.foldername(name))[1]));
CREATE POLICY "Students can upload submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Course materials publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'course-materials');
CREATE POLICY "Teachers can upload course materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'course-materials' AND public.get_user_role(auth.uid()) IN ('admin', 'teacher'));

CREATE POLICY "Quiz files publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'quiz-files');
CREATE POLICY "Teachers can upload quiz files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'quiz-files' AND public.get_user_role(auth.uid()) IN ('admin', 'teacher'));
