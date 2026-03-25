import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ClipboardList, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, attendance: 0, avgGrade: 0, announcements: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) return;
      const [enrollments, att, grades, ann] = await Promise.all([
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', s.id),
        supabase.from('attendance').select('status').eq('student_id', s.id),
        supabase.from('grades').select('marks').eq('student_id', s.id),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
      ]);
      const presentCount = att.data?.filter(a => a.status === 'present').length || 0;
      const totalAtt = att.data?.length || 1;
      const avgMarks = grades.data?.length ? Math.round(grades.data.reduce((sum, g) => sum + g.marks, 0) / grades.data.length) : 0;
      setStats({ courses: enrollments.count || 0, attendance: Math.round((presentCount / totalAtt) * 100), avgGrade: avgMarks, announcements: ann.count || 0 });
    };
    fetch();
  }, [user]);

  const gradeData = [
    { term: 'Term 1', marks: 75 }, { term: 'Term 2', marks: 80 },
    { term: 'Term 3', marks: 85 }, { term: 'Term 4', marks: 82 },
  ];

  const cards = [
    { icon: BookOpen, label: 'Enrolled Courses', value: stats.courses, color: 'text-primary' },
    { icon: Calendar, label: 'Attendance', value: `${stats.attendance}%`, color: 'text-secondary' },
    { icon: BarChart3, label: 'Avg Grade', value: stats.avgGrade, color: 'text-accent' },
    { icon: ClipboardList, label: 'Announcements', value: stats.announcements, color: 'text-info' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Student Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <CardHeader><CardTitle className="font-display">Grade Progress</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="term" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="marks" stroke="hsl(224,76%,48%)" strokeWidth={2} dot={{ fill: 'hsl(224,76%,48%)' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentOverview;
