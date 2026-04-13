import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Check, X, Clock, Filter } from 'lucide-react';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [dateFilter, setDateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', s.id);
      const courseIds = enrollments?.map(e => e.course_id) || [];
      if (courseIds.length) {
        const { data: coursesData } = await supabase.from('courses').select('id, name, class, section').in('id', courseIds);
        setCourses(coursesData || []);
      }
      const { data } = await supabase.from('attendance').select('*').eq('student_id', s.id).order('date', { ascending: false });
      setRecords(data || []);
      const present = data?.filter(r => r.status === 'present').length || 0;
      const absent = data?.filter(r => r.status === 'absent').length || 0;
      const late = data?.filter(r => r.status === 'late').length || 0;
      setStats({ present, absent, late, total: data?.length || 0 });
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const percentage = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

  const filtered = records.filter(r => {
    const matchesDate = !dateFilter || r.date === dateFilter;
    const matchesCourse = courseFilter === 'all' || r.course_id === courseFilter;
    return matchesDate && matchesCourse;
  });

  const getCourseName = (id: string) => {
    const c = courses.find(c => c.id === id);
    return c ? `${c.name} (${c.class}-${c.section})` : '';
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Attendance</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{percentage}%</p><p className="text-xs text-muted-foreground">Overall</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-secondary">{stats.present}</p><p className="text-xs text-muted-foreground">Present</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.absent}</p><p className="text-xs text-muted-foreground">Absent</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">{stats.late}</p><p className="text-xs text-muted-foreground">Late</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-44" />
        {courses.length > 0 && (
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-56"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="All courses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.class}-{c.section})</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Course</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{getCourseName(r.course_id)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'present' ? 'bg-secondary/10 text-secondary' : r.status === 'absent' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      {r.status === 'present' ? <Check className="h-3 w-3" /> : r.status === 'absent' ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;
