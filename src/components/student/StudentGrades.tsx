import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      const { data } = await supabase.from('grades').select('*, courses(name, class, section)').eq('student_id', s.id);
      setGrades(data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const chartData = grades.map(g => ({ term: g.term, marks: g.marks, course: (g.courses as any)?.name || '' }));
  const totalMarks = grades.reduce((sum, g) => sum + g.marks, 0);
  const avgMarks = grades.length ? Math.round(totalMarks / grades.length) : 0;
  const highest = grades.length ? Math.max(...grades.map(g => g.marks)) : 0;
  const lowest = grades.length ? Math.min(...grades.map(g => g.marks)) : 0;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Grades</h2>
      {grades.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No grades recorded yet</CardContent></Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Subjects</p>
                <p className="text-2xl font-bold text-foreground">{grades.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-2xl font-bold text-primary">{avgMarks}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Highest</p>
                <p className="text-2xl font-bold text-secondary">{highest}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Lowest</p>
                <p className="text-2xl font-bold text-destructive">{lowest}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="font-display">Grade Progress</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="term" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: number, name: string) => [value, 'Marks']} />
                  <Line type="monotone" dataKey="marks" stroke="hsl(224,76%,48%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {grades.map(g => (
              <Card key={g.id}>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-primary">{(g.courses as any)?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">Class {(g.courses as any)?.class} - {(g.courses as any)?.section} • {g.term}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{g.marks}/100</p>
                  {g.grade_letter && <span className="text-sm font-medium text-secondary">{g.grade_letter}</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentGrades;
