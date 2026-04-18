import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

const StudentPerformance = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [search, setSearch] = useState('');
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
    setSearch('');
    setClassFilter('all');
    setSectionFilter('all');
    setStudents([]);
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

  const classes = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);
  const sections = useMemo(() => Array.from(new Set(students.map(s => s.section))).sort(), [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter(s => {
      if (classFilter !== 'all' && s.class !== classFilter) return false;
      if (sectionFilter !== 'all' && s.section !== sectionFilter) return false;
      if (q && !s.full_name.toLowerCase().includes(q) && !String(s.roll_number).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, classFilter, sectionFilter, search]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Student Performance</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={selectedCourse} onValueChange={loadStudents}>
          <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
          <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — Class {c.class}-{c.section}</SelectItem>)}</SelectContent>
        </Select>

        <Select value={classFilter} onValueChange={setClassFilter} disabled={!selectedCourse || classes.length === 0}>
          <SelectTrigger><SelectValue placeholder="Filter by class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sectionFilter} onValueChange={setSectionFilter} disabled={!selectedCourse || sections.length === 0}>
          <SelectTrigger><SelectValue placeholder="Filter by section" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sections</SelectItem>
            {sections.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or roll no."
            disabled={!selectedCourse}
            className="pl-9"
          />
        </div>
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
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Avg Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No students match filters</TableCell></TableRow>
                  ) : filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.roll_number}</TableCell>
                      <TableCell>{s.class}</TableCell>
                      <TableCell>{s.section}</TableCell>
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
                <SelectContent>{filtered.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name} (Class {s.class}-{s.section})</SelectItem>)}</SelectContent>
              </Select>
              <Textarea value={remark.content} onChange={e => setRemark(r => ({ ...r, content: e.target.value }))} placeholder="Write your remark..." />
              <Button onClick={submitRemark}>Submit Remark</Button>
            </CardContent>
          </Card>
        </>
      )}

      {selectedCourse && students.length === 0 && (
        <p className="text-center text-muted-foreground py-6">No students enrolled in this course yet.</p>
      )}
    </div>
  );
};

export default StudentPerformance;
