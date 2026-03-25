import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const CourseMaterialsManager = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', course_id: '', file: null as File | null });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('*').eq('teacher_id', t.id);
        setCourses(c || []);
        const courseIds = c?.map(x => x.id) || [];
        if (courseIds.length) {
          const { data: m } = await supabase.from('course_materials').select('*').in('course_id', courseIds).order('created_at', { ascending: false });
          setMaterials(m || []);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let fileUrl = '';
    if (form.file) {
      const filePath = `${form.course_id}/${Date.now()}-${form.file.name}`;
      const { error: uploadError } = await supabase.storage.from('course-materials').upload(filePath, form.file);
      if (uploadError) { toast.error('Upload failed'); setSaving(false); return; }
      const { data: urlData } = supabase.storage.from('course-materials').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('course_materials').insert({
      title: form.title,
      course_id: form.course_id,
      file_url: fileUrl || 'No file',
      uploaded_by: user?.id,
    });

    if (error) toast.error(error.message);
    else {
      toast.success('Material uploaded');
      setDialogOpen(false);
      setForm({ title: '', course_id: '', file: null });
      // Refresh
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('id').eq('teacher_id', t.id);
        const ids = c?.map(x => x.id) || [];
        if (ids.length) {
          const { data: m } = await supabase.from('course_materials').select('*').in('course_id', ids).order('created_at', { ascending: false });
          setMaterials(m || []);
        }
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Course Materials</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Upload Material</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Course Material</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={form.course_id} onValueChange={v => setForm(f => ({ ...f, course_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (Class {c.class} - {c.section})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <Input type="file" onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload</Button>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No materials</TableCell></TableRow>
                ) : (
                  materials.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />{m.title}</TableCell>
                      <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {m.file_url !== 'No file' ? <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Download</a> : '-'}
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

export default CourseMaterialsManager;
