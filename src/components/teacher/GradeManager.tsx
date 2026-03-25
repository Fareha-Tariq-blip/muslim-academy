import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const TERMS = ['1st Term', '2nd Term', 'Mid Term', 'Final Term'];

const GradeManager = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, { marks: number; grade_letter: string; existingId?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const loadStudents = async () => {
    if (!selectedCourse || !selectedTerm) return;
    setLoading(true);

    const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', selectedCourse);
    if (!enrollments?.length) { setStudents([]); setLoading(false); return; }

    const ids = enrollments.map(e => e.student_id);
    const { data: studentsData } = await supabase.from('students').select('*').in('id', ids);

    // Fetch existing grades for this course + term
    const { data: existingGrades } = await supabase.from('grades')
      .select('*')
      .eq('course_id', selectedCourse)
      .eq('term', selectedTerm)
      .in('student_id', ids);

    const gradeMap: Record<string, any> = {};
    (existingGrades || []).forEach(g => {
      gradeMap[g.student_id] = { marks: g.marks, grade_letter: g.grade_letter || '', existingId: g.id };
    });

    const enriched = await Promise.all((studentsData || []).map(async (s) => {
      const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', s.user_id).single();
      return { ...s, full_name: p?.full_name || 'Unknown' };
    }));

    setStudents(enriched);
    setMarks(Object.fromEntries(enriched.map(s => [
      s.id,
      gradeMap[s.id] || { marks: 0, grade_letter: '' }
    ])));
    setLoading(false);
  };

  useEffect(() => { if (selectedCourse && selectedTerm) loadStudents(); }, [selectedCourse, selectedTerm]);

  const getGradeLetter = (m: number): string => {
    if (m >= 90) return 'A+';
    if (m >= 80) return 'A';
    if (m >= 70) return 'B';
    if (m >= 60) return 'C';
    if (m >= 50) return 'D';
    return 'F';
  };

  const updateMark = (studentId: string, value: number) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: value, grade_letter: getGradeLetter(value) }
    }));
  };

  const saveAllGrades = async () => {
    setSaving(true);
    try {
      for (const [studentId, data] of Object.entries(marks)) {
        if (data.existingId) {
          await supabase.from('grades').update({
            marks: data.marks,
            grade_letter: data.grade_letter,
          }).eq('id', data.existingId);
        } else {
          await supabase.from('grades').insert({
            student_id: studentId,
            course_id: selectedCourse,
            term: selectedTerm,
            marks: data.marks,
            grade_letter: data.grade_letter,
          });
        }
      }
      toast.success('All grades saved successfully!');
      await loadStudents(); // Refresh to get existing IDs
    } catch (err: any) {
      toast.error(err.message || 'Failed to save grades');
    }
    setSaving(false);
  };

  if (loading && !courses.length) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Grade / Marks Management</h2>

      <div className="flex gap-3 flex-wrap">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select Course" /></SelectTrigger>
          <SelectContent>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name} (Class {c.class}-{c.section})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Select Term" /></SelectTrigger>
          <SelectContent>
            {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedCourse && selectedTerm && (
        <>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : students.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No students enrolled in this course</CardContent></Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-display text-lg">
                  Enter Marks — {selectedTerm}
                </CardTitle>
                <Button onClick={saveAllGrades} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save All Grades
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Marks (out of 100)</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>{s.roll_number}</TableCell>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-24"
                            value={marks[s.id]?.marks ?? 0}
                            onChange={e => updateMark(s.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                          />
                        </TableCell>
                        <TableCell className="font-bold text-primary">{marks[s.id]?.grade_letter || '—'}</TableCell>
                        <TableCell>
                          {marks[s.id]?.existingId ? (
                            <CheckCircle className="h-4 w-4 text-secondary" />
                          ) : (
                            <span className="text-xs text-muted-foreground">New</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default GradeManager;
