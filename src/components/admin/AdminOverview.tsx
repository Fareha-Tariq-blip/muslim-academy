import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, BookOpen, Layers, UserPlus, Bell, Clock, FileText, Award, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const AdminOverview = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, classes: 0 });
  const [courseData, setCourseData] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [s, t, c] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id, class', { count: 'exact' }),
      ]);
      const uniqueClasses = new Set((c.data || []).map((x: any) => x.class));
      setStats({
        students: s.count || 0,
        teachers: t.count || 0,
        courses: c.count || 0,
        classes: uniqueClasses.size,
      });
    };

    const fetchCourseData = async () => {
      const { data } = await supabase.from('courses').select('class');
      if (data) {
        const grouped: Record<string, number> = {};
        data.forEach(c => { grouped[c.class] = (grouped[c.class] || 0) + 1; });
        const sorted = Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
        setCourseData(sorted.map(([name, value]) => ({ name: `Class ${name}`, value })));
      }
    };

    fetchStats();
    fetchCourseData();
  }, []);

  const statCards = [
    { icon: Users, label: 'Total Students', value: stats.students, gradient: 'from-primary/10 to-primary/5', iconBg: 'bg-primary/15', iconColor: 'text-primary' },
    { icon: GraduationCap, label: 'Total Teachers', value: stats.teachers, gradient: 'from-secondary/10 to-secondary/5', iconBg: 'bg-secondary/15', iconColor: 'text-secondary' },
    { icon: Layers, label: 'Total Classes', value: stats.classes, gradient: 'from-accent/10 to-accent/5', iconBg: 'bg-accent/15', iconColor: 'text-accent' },
    { icon: BookOpen, label: 'Active Courses', value: stats.courses, gradient: 'from-[hsl(38,92%,50%)]/10 to-[hsl(38,92%,50%)]/5', iconBg: 'bg-[hsl(38,92%,50%)]/15', iconColor: 'text-[hsl(38,92%,50%)]' },
  ];

  const enrollmentData = [
    { month: 'Jan', count: 180 },
    { month: 'Feb', count: 195 },
    { month: 'Mar', count: 210 },
    { month: 'Apr', count: 225 },
    { month: 'May', count: 240 },
  ];

  const topPerformers = [
    { name: 'Ayesha Khan', class: '1-A', grade: '98.5%', rank: 1 },
    { name: 'Ali Ahmed', class: '1-A', grade: '96.2%', rank: 2 },
    { name: 'Zainab Malik', class: '2-A', grade: '95.8%', rank: 3 },
    { name: 'Muhammad Hassan', class: '3-A', grade: '94.1%', rank: 4 },
    { name: 'Maryam Siddiqui', class: '1-B', grade: '93.5%', rank: 5 },
  ];

  const recentActivity = [
    { icon: UserPlus, title: 'New Student Added', desc: 'Maryam Siddiqui enrolled in Class 1-B', time: '2 hours ago' },
    { icon: FileText, title: 'Exam Results Published', desc: 'Mid-Term results declared', time: '4 hours ago' },
    { icon: Clock, title: 'Attendance Complete', desc: 'All classes attendance submitted', time: '6 hours ago' },
    { icon: Bell, title: 'Announcement Posted', desc: 'Quran Competition next week', time: '8 hours ago' },
    { icon: Award, title: 'Quiz Completed', desc: 'Quran Recitation quiz for Class 1', time: '10 hours ago' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Welcome, {profile?.full_name?.split(' ')[0] || 'Admin'}</h1>
        <p className="text-muted-foreground mt-1">Here's your academy's performance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c, i) => (
          <Card key={i} className={`bg-gradient-to-br ${c.gradient} border-border/30 shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{c.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1 font-display">{c.value.toLocaleString()}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.iconBg}`}>
                <c.icon className={`h-6 w-6 ${c.iconColor}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: UserPlus, label: 'Add Student', color: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
          { icon: GraduationCap, label: 'Add Teacher', color: 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' },
          { icon: Bell, label: 'New Announcement', color: 'bg-accent hover:bg-accent/90 text-accent-foreground' },
        ].map((action, i) => (
          <button key={i} className={`flex items-center justify-center gap-3 rounded-xl p-5 font-semibold text-sm transition-all ${action.color} shadow-sm hover:shadow-md`}>
            <action.icon className="h-5 w-5" />
            {action.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/30">
          <CardHeader><CardTitle className="font-display text-lg">Class Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={courseData.length ? courseData : [{ name: 'No data', value: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/30">
          <CardHeader><CardTitle className="font-display text-lg">Monthly Enrollment Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ fill: 'hsl(var(--accent))', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card className="shadow-sm border-border/30">
          <CardHeader><CardTitle className="font-display text-lg">🏆 Top Performers</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.map((s) => (
              <div key={s.rank} className="flex items-center gap-4">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${s.rank === 1 ? 'bg-[hsl(38,92%,50%)]/20 text-[hsl(38,92%,50%)]' : s.rank === 2 ? 'bg-muted text-muted-foreground' : 'bg-[hsl(25,70%,50%)]/15 text-[hsl(25,70%,50%)]'}`}>
                  {s.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">Class {s.class}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary flex items-center gap-1">
                    <ChevronUp className="h-3 w-3" />{s.grade}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Overall Grade</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm border-border/30">
          <CardHeader><CardTitle className="font-display text-lg">📋 Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                  <a.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.desc}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
