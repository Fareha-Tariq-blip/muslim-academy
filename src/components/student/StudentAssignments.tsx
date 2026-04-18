import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, Filter } from 'lucide-react';
import { toast } from 'sonner';

const StudentAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      setStudentId(s.id);
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', s.id);
      if (enrollments?.length) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data: coursesData } = await supabase.from('courses').select('id, name, class, section').in('id', courseIds);
        setCourses(coursesData || []);
        const { data: assignmentsData } = await supabase.from('assignments').select('*').in('course_id', courseIds).order('due_date', { ascending: true });
        const { data: subs } = await supabase.from('assignment_submissions').select('*').eq('student_id', s.id);
        setAssignments((assignmentsData || []).map(a => ({
          ...a, submission: (subs || []).find(sub => sub.assignment_id === a.id),
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const submitAssignment = async (assignmentId: string, file: File) => {
    const a = assignments.find(x => x.id === assignmentId);
    if (a?.due_date && new Date(a.due_date) < new Date()) {
      toast.error('Submission closed — due date has passed.');
      return;
    }
    const filePath = `${user!.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('submissions').upload(filePath, file);
    if (uploadError) { toast.error('Upload failed'); return; }
    const { data: urlData } = supabase.storage.from('submissions').getPublicUrl(filePath);
    const { error } = await supabase.from('assignment_submissions').insert({
      assignment_id: assignmentId, student_id: studentId, file_url: urlData.publicUrl,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Submitted!');
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', studentId);
      if (enrollments?.length) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data: assignmentsData } = await supabase.from('assignments').select('*').in('course_id', courseIds);
        const { data: subs } = await supabase.from('assignment_submissions').select('*').eq('student_id', studentId);
        setAssignments((assignmentsData || []).map(a => ({ ...a, submission: (subs || []).find(sub => sub.assignment_id === a.id) })));
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const getCourseName = (id: string) => {
    const c = courses.find(c => c.id === id);
    return c ? `${c.name}` : '';
  };

  const filtered = courseFilter === 'all' ? assignments : assignments.filter(a => a.course_id === courseFilter);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Assignments</h2>

      {courses.length > 0 && (
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-56"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="All courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.class}-{c.section})</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No assignments</TableCell></TableRow>
              ) : filtered.map(a => {
                const overdue = a.due_date && new Date(a.due_date) < new Date();
                return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell className="text-sm">{getCourseName(a.course_id)}</TableCell>
                  <TableCell>{a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{a.submission ? (a.submission.graded ? '✅ Graded' : '📤 Submitted') : (overdue ? '⛔ Closed' : '⏳ Pending')}</TableCell>
                  <TableCell>{a.submission?.marks != null ? `${a.submission.marks} / ${a.total_marks ?? 100}` : `— / ${a.total_marks ?? 100}`}</TableCell>
                  <TableCell className="text-right">
                    {!a.submission && !overdue && (
                      <label className="cursor-pointer">
                        <Input type="file" className="hidden" onChange={e => { if (e.target.files?.[0]) submitAssignment(a.id, e.target.files[0]); }} />
                        <Button variant="outline" size="sm" asChild><span><Upload className="mr-1 h-3 w-3" /> Submit</span></Button>
                      </label>
                    )}
                    {!a.submission && overdue && (
                      <span className="text-xs text-destructive font-medium">Past due</span>
                    )}
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAssignments;
