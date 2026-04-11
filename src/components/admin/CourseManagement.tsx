import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const CourseManagement = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', teacher_id: '', class: '1', section: 'A' });

  const fetchData = async () => {
    setLoading(true);
    const [coursesRes, teachersRes] = await Promise.all([
      supabase.from('courses').select('*'),
      supabase.from('teachers').select('*'),
    ]);
    if (coursesRes.data) {
      const enriched = await Promise.all(coursesRes.data.map(async (c) => {
        if (c.teacher_id) {
          const t = teachersRes.data?.find(t => t.id === c.teacher_id);
          if (t) {
            const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', t.user_id).single();
            return { ...c, teacher_name: p?.full_name || 'Unknown' };
          }
        }
        return { ...c, teacher_name: 'Unassigned' };
      }));
      setCourses(enriched);
    }
    if (teachersRes.data) {
      const enrichedTeachers = await Promise.all(teachersRes.data.map(async (t) => {
        const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', t.user_id).single();
        return { ...t, full_name: p?.full_name || t.subject };
      }));
      setTeachers(enrichedTeachers);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', teacher_id: '', class: '1', section: 'A' });
    setEditingId(null);
  };

  const handleOpenEdit = (c: any) => {
    setForm({
      name: c.name,
      description: c.description || '',
      teacher_id: c.teacher_id || '',
      class: c.class,
      section: c.section,
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      description: form.description || null,
      teacher_id: form.teacher_id || null,
      class: form.class,
      section: form.section,
    };

    if (editingId) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editingId);
      if (error) toast.error(error.message);
      else {
        toast.success('Course updated');
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase.from('courses').insert(payload);
      if (error) toast.error(error.message);
      else {
        toast.success('Course created');
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    await supabase.from('courses').delete().eq('id', id);
    toast.success('Course deleted');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Course Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? 'Edit Course' : 'Create New Course'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Course Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Assign Teacher</Label>
                  <Select value={form.teacher_id} onValueChange={v => setForm(f => ({ ...f, teacher_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name} ({t.subject})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={form.class} onValueChange={v => setForm(f => ({ ...f, class: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => <SelectItem key={i+1} value={String(i+1)}>{`Class ${i+1}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingId ? 'Update Course' : 'Create Course'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No courses found</TableCell></TableRow>
                ) : (
                  courses.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.teacher_name}</TableCell>
                      <TableCell>{c.class}</TableCell>
                      <TableCell>{c.section}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(c)}><Pencil className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseManagement;
