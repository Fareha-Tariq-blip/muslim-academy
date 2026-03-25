import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const StudentPerformance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [remark, setRemark] = useState({ student_id: '', content: '' });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('*').eq('teacher_id', t.id);
        setCourses(c || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const loadStudents = async (courseId: string) => {
    setSelectedCourse(courseId);
    const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', courseId);
    if (enrollments) {
      const ids = enrollments.map(e => e.student_id);
      if (ids.length) {
        const { data: studentsData } = await supabase.from('students').select('*').in('id', ids);
        if (studentsData) {
          const enriched = await Promise.all(studentsData.map(async (s) => {
            const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', s.user_id).single();
            const { data: grades } = await supabase.from('grades').select('marks').eq('student_id', s.id).eq('course_id', courseId);
            const avg = grades?.length ? grades.reduce((sum, g) => sum + g.marks, 0) / grades.length : 0;
            return { ...s, full_name: p?.full_name || 'Unknown', avg_marks: Math.round(avg) };
          }));
          setStudents(enriched);
        }
      }
    }
  };

  const submitRemark = async () => {
    if (!remark.student_id || !remark.content) { toast.error('Select student and write remark'); return; }
    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single();
    if (!t) return;
    await supabase.from('remarks').insert({
      student_id: remark.student_id,
      teacher_id: t.id,
      content: remark.content,
    });
    toast.success('Remark added');
    setRemark({ student_id: '', content: '' });
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Student Performance</h2>
      <div className="max-w-xs">
        <Select value={selectedCourse} onValueChange={loadStudents}>
          <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
          <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedCourse && students.length > 0 && (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Avg Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.roll_number}</TableCell>
                      <TableCell>{s.avg_marks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-foreground">Write Remark</h3>
              <Select value={remark.student_id} onValueChange={v => setRemark(r => ({ ...r, student_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea value={remark.content} onChange={e => setRemark(r => ({ ...r, content: e.target.value }))} placeholder="Write your remark..." />
              <Button onClick={submitRemark}>Submit Remark</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default StudentPerformance;
