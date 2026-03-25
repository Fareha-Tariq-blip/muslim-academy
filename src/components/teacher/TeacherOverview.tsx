import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ClipboardList, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TeacherOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, assignments: 0, students: 0 });
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: t } = await supabase.from('teachers').select('*').eq('user_id', user.id).single();
      if (!t) return;
      setTeacher(t);
      const { data: courses } = await supabase.from('courses').select('id').eq('teacher_id', t.id);
      const courseIds = courses?.map(c => c.id) || [];
      const { count: assignmentCount } = await supabase.from('assignments').select('id', { count: 'exact', head: true }).in('course_id', courseIds.length ? courseIds : ['none']);
      const { count: enrollCount } = await supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', courseIds.length ? courseIds : ['none']);
      setStats({ courses: courses?.length || 0, assignments: assignmentCount || 0, students: enrollCount || 0 });
    };
    fetch();
  }, [user]);

  const cards = [
    { icon: BookOpen, label: 'My Courses', value: stats.courses, color: 'text-primary' },
    { icon: ClipboardList, label: 'Assignments', value: stats.assignments, color: 'text-secondary' },
    { icon: Users, label: 'Students', value: stats.students, color: 'text-accent' },
  ];

  const performanceData = [
    { subject: 'Quiz Avg', score: 78 },
    { subject: 'Assignment Avg', score: 82 },
    { subject: 'Attendance', score: 90 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Teacher Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${c.color}`}>
                <c.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="font-display">Class Performance</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(224,76%,48%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherOverview;
