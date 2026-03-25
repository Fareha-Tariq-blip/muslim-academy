import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Check, X, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';

const AttendanceMarker = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('*').eq('teacher_id', t.id);
        setCourses(c || []);
      }
      setLoading(false);
    };
    fetchCourses();
  }, [user]);

  const loadStudents = async (courseId: string) => {
    setSelectedCourse(courseId);
    setLoadingStudents(true);
    setStudents([]);

    const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', courseId);

    if (!enrollments || enrollments.length === 0) {
      setStudents([]);
      setLoadingStudents(false);
      return;
    }

    const studentIds = enrollments.map(e => e.student_id);
    const { data: studentsData } = await supabase.from('students').select('*').in('id', studentIds);

    if (studentsData && studentsData.length > 0) {
      const enriched = await Promise.all(studentsData.map(async (s) => {
        const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', s.user_id).single();
        return { ...s, full_name: p?.full_name || 'Unknown' };
      }));
      setStudents(enriched);
      const defaultAttendance: Record<string, string> = {};
      enriched.forEach(s => { defaultAttendance[s.id] = 'present'; });
      setAttendance(defaultAttendance);
    }

    setLoadingStudents(false);
  };

  const saveAttendance = async () => {
    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      course_id: selectedCourse,
      date: today,
      status,
    }));

    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,course_id,date' });
    if (error) toast.error(error.message);
    else toast.success('Attendance saved!');
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Attendance</h2>
      
      <div className="max-w-xs">
        <Select value={selectedCourse} onValueChange={loadStudents}>
          <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
          <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.class}-{c.section})</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedCourse && loadingStudents && (
        <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      )}

      {selectedCourse && !loadingStudents && students.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No students enrolled in this course</p>
            <p className="text-sm text-muted-foreground mt-1">Students need to enroll in this course before attendance can be marked.</p>
          </CardContent>
        </Card>
      )}

      {selectedCourse && !loadingStudents && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display flex items-center justify-between">
              <span>Mark Attendance - {new Date().toLocaleDateString()}</span>
              <Button onClick={saveAttendance} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>{s.roll_number}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        {['present', 'absent', 'late'].map(status => (
                          <Button
                            key={status}
                            size="sm"
                            variant={attendance[s.id] === status ? 'default' : 'outline'}
                            className={attendance[s.id] === status ? (status === 'present' ? 'bg-success' : status === 'absent' ? 'bg-destructive' : 'bg-warning') : ''}
                            onClick={() => setAttendance(a => ({ ...a, [s.id]: status }))}
                          >
                            {status === 'present' ? <Check className="h-3 w-3" /> : status === 'absent' ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            <span className="ml-1 text-xs capitalize">{status}</span>
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceMarker;
