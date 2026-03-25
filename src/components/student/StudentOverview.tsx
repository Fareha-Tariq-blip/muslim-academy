import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ClipboardList, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, attendance: 0, avgGrade: 0, announcements: 0 });
  const [gradeData, setGradeData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) return;
      const [enrollments, att, grades, ann] = await Promise.all([
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('student_id', s.id),
        supabase.from('attendance').select('status').eq('student_id', s.id),
        supabase.from('grades').select('marks, term').eq('student_id', s.id),
        supabase.from('announcements').select('id', { count: 'exact', head: true }),
      ]);
      const presentCount = att.data?.filter(a => a.status === 'present').length || 0;
      const totalAtt = att.data?.length || 1;
      const avgMarks = grades.data?.length ? Math.round(grades.data.reduce((sum, g) => sum + g.marks, 0) / grades.data.length) : 0;
      setStats({ courses: enrollments.count || 0, attendance: Math.round((presentCount / totalAtt) * 100), avgGrade: avgMarks, announcements: ann.count || 0 });
      
      // Use real grade data for chart
      if (grades.data?.length) {
        const termMap: Record<string, number[]> = {};
        grades.data.forEach(g => {
          if (!termMap[g.term]) termMap[g.term] = [];
          termMap[g.term].push(g.marks);
        });
        setGradeData(Object.entries(termMap).map(([term, marks]) => ({
          term,
          marks: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length)
        })));
      }
    };
    fetch();
  }, [user]);

  const cards = [
    { icon: BookOpen, label: 'Enrolled Courses', value: stats.courses, gradient: 'from-primary/10 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/20' },
    { icon: Calendar, label: 'Attendance', value: `${stats.attendance}%`, gradient: 'from-secondary/10 to-secondary/5', iconColor: 'text-secondary', borderColor: 'border-secondary/20' },
    { icon: BarChart3, label: 'Avg Grade', value: stats.avgGrade, gradient: 'from-accent/10 to-accent/5', iconColor: 'text-accent', borderColor: 'border-accent/20' },
    { icon: ClipboardList, label: 'Announcements', value: stats.announcements, gradient: 'from-info/10 to-info/5', iconColor: 'text-info', borderColor: 'border-info/20' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Student Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Card key={i} className={`bg-gradient-to-br ${c.gradient} ${c.borderColor} hover:shadow-md transition-shadow`}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-card shadow-sm ${c.iconColor}`}>
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
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="term" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="marks" stroke="hsl(210,70%,42%)" strokeWidth={2} dot={{ fill: 'hsl(174,55%,40%)' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No grade data yet. Grades will appear here once your teacher uploads them.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentOverview;
