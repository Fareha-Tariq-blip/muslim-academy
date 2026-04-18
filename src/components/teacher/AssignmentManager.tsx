import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, Upload, FileText, Save, Filter } from 'lucide-react';
import { toast } from 'sonner';

const AssignmentManager = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingGrades, setSavingGrades] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', course_id: '', due_date: '', total_marks: '100' });
  const [file, setFile] = useState<File | null>(null);
  const [editedSubmissions, setEditedSubmissions] = useState<Record<string, { marks: string; feedback: string }>>({});
  const [courseFilter, setCourseFilter] = useState('all');
  const [currentTotalMarks, setCurrentTotalMarks] = useState<number>(100);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('*').eq('teacher_id', t.id);
        setCourses(c || []);
        const courseIds = c?.map(x => x.id) || [];
        if (courseIds.length) {
          const { data: a } = await supabase.from('assignments').select('*').in('course_id', courseIds).order('created_at', { ascending: false });
          setAssignments(a || []);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let fileUrl: string | null = null;

    if (file) {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const filePath = `${user!.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('assignments').upload(filePath, file);
      if (uploadError) {
        toast.error('File upload failed: ' + uploadError.message);
        setSaving(false);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
      setUploading(false);
    }

    const { error } = await supabase.from('assignments').insert({
      title: form.title, description: form.description, course_id: form.course_id,
      due_date: form.due_date || null, file_url: fileUrl, created_by: user?.id,
      total_marks: parseInt(form.total_marks) || 100,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Assignment created');
      setDialogOpen(false);
      setForm({ title: '', description: '', course_id: '', due_date: '', total_marks: '100' });
      setFile(null);
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('id').eq('teacher_id', t.id);
        const ids = c?.map(x => x.id) || [];
        if (ids.length) {
          const { data: a } = await supabase.from('assignments').select('*').in('course_id', ids).order('created_at', { ascending: false });
          setAssignments(a || []);
        }
      }
    }
    setSaving(false);
  };

  const viewSubmissions = async (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    const a = assignments.find(x => x.id === assignmentId);
    setCurrentTotalMarks(a?.total_marks ?? 100);
    const { data } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId);
    if (data) {
      const enriched = await Promise.all(data.map(async (s) => {
        const { data: student } = await supabase.from('students').select('roll_number, user_id').eq('id', s.student_id).single();
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', student?.user_id || '').single();
        return { ...s, student_name: profile?.full_name || 'Unknown', roll_number: student?.roll_number || '' };
      }));
      setSubmissions(enriched);
      const edits: Record<string, { marks: string; feedback: string }> = {};
      enriched.forEach(s => {
        edits[s.id] = { marks: s.marks?.toString() || '', feedback: s.feedback || '' };
      });
      setEditedSubmissions(edits);
    }
    setSubDialogOpen(true);
  };

  const downloadSubmission = async (fileUrl: string, studentName: string) => {
    try {
      // Submissions bucket is private — extract path and create a signed URL
      const marker = '/submissions/';
      const idx = fileUrl.indexOf(marker);
      const path = idx >= 0 ? fileUrl.substring(idx + marker.length) : fileUrl;
      const { data, error } = await supabase.storage.from('submissions').createSignedUrl(path, 60);
      if (error || !data?.signedUrl) { toast.error('Could not access file'); return; }
      const res = await fetch(data.signedUrl);
      const blob = await res.blob();
      const ext = path.split('.').pop() || 'file';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${studentName.replace(/\s+/g, '_')}_submission.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleSaveAllGrades = async () => {
    setSavingGrades(true);
    for (const sub of submissions) {
      const edit = editedSubmissions[sub.id];
      if (edit) {
        const marks = edit.marks ? Number(edit.marks) : null;
        await supabase.from('assignment_submissions').update({
          marks, feedback: edit.feedback || null, graded: marks !== null,
        }).eq('id', sub.id);
      }
    }
    toast.success('All grades saved!');
    setSavingGrades(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Assignment Manager</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Create Assignment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Assignment</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course_id} onValueChange={v => setForm(f => ({ ...f, course_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (Class {c.class} - {c.section})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Due Date</Label><Input type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Total Marks</Label><Input type="number" min={1} value={form.total_marks} onChange={e => setForm(f => ({ ...f, total_marks: e.target.value }))} required /></div>
              </div>
              <div className="space-y-2">
                <Label>Attachment (optional)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="flex-1" />
                  {file && <div className="flex items-center gap-1 text-sm text-muted-foreground"><FileText className="h-4 w-4" /><span className="truncate max-w-[120px]">{file.name}</span></div>}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading...' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length > 0 && (
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-64"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (Class {c.class}-{c.section})</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(courseFilter === 'all' ? assignments : assignments.filter(a => a.course_id === courseFilter)).length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No assignments</TableCell></TableRow>
                ) : (
                  (courseFilter === 'all' ? assignments : assignments.filter(a => a.course_id === courseFilter)).map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No deadline'}</TableCell>
                      <TableCell>
                        {a.file_url ? (
                          <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <Upload className="h-3 w-3" /> View
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => viewSubmissions(a.id)}>View Submissions</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={subDialogOpen} onOpenChange={(open) => { setSubDialogOpen(open); if (!open) { setSubmissions([]); setEditedSubmissions({}); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Submissions</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{s.student_name}</TableCell>
                  <TableCell>{s.roll_number}</TableCell>
                  <TableCell>
                    {s.file_url ? (
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View</a>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20"
                      value={editedSubmissions[s.id]?.marks || ''}
                      onChange={(e) => setEditedSubmissions(prev => ({
                        ...prev, [s.id]: { ...prev[s.id], marks: e.target.value }
                      }))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-36"
                      placeholder="Add remark..."
                      value={editedSubmissions[s.id]?.feedback || ''}
                      onChange={(e) => setEditedSubmissions(prev => ({
                        ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value }
                      }))}
                    />
                  </TableCell>
                  <TableCell>{s.graded ? '✓ Graded' : 'Pending'}</TableCell>
                </TableRow>
              ))}
              {submissions.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-4">No submissions yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {submissions.length > 0 && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveAllGrades} disabled={savingGrades}>
                {savingGrades ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save All Grades & Remarks
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentManager;
