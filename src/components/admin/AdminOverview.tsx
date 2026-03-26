import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(224,76%,48%)', 'hsl(142,72%,29%)', 'hsl(45,93%,47%)', 'hsl(0,84%,60%)'];

const AdminOverview = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, attendance: 0 });
  const [courseData, setCourseData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [s, t, c, a] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        students: s.count || 0,
        teachers: t.count || 0,
        courses: c.count || 0,
        attendance: a.count || 0,
      });
    };

    const fetchCourseData = async () => {
      const { data } = await supabase.from('courses').select('class');
      if (data) {
        const grouped: Record<string, number> = {};
        data.forEach(c => { grouped[c.class] = (grouped[c.class] || 0) + 1; });
        setCourseData(Object.entries(grouped).map(([name, value]) => ({ name, value })));
      }
    };

    fetchStats();
    fetchCourseData();
  }, []);

  const cards = [
    { icon: Users, label: 'Total Students', value: stats.students, color: 'text-primary' },
    { icon: GraduationCap, label: 'Total Teachers', value: stats.teachers, color: 'text-secondary' },
    { icon: BookOpen, label: 'Active Courses', value: stats.courses, color: 'text-accent' },
    { icon: Calendar, label: 'Attendance Records', value: stats.attendance, color: 'text-info' },
  ];

  const attendanceData = [
    { month: 'Jan', present: 85, absent: 15 },
    { month: 'Feb', present: 88, absent: 12 },
    { month: 'Mar', present: 90, absent: 10 },
    { month: 'Apr', present: 87, absent: 13 },
    { month: 'May', present: 92, absent: 8 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h2>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="font-display">Attendance Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="hsl(142,72%,29%)" radius={[4,4,0,0]} />
                <Bar dataKey="absent" fill="hsl(0,84%,60%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display">Course Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={courseData.length ? courseData : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                  {(courseData.length ? courseData : [{ name: 'No data', value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
