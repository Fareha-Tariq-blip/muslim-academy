import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Loader2, Plus, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const TeacherAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', course_id: '', target_role: 'student' as string });
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('*').eq('teacher_id', t.id);
        setCourses(c || []);
      }
      const { data: a } = await supabase.from('announcements').select('*, courses(name)').eq('author_id', user.id).order('created_at', { ascending: false });
      setAnnouncements(a || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) { toast.error('Fill all fields'); return; }
    setSaving(true);
    const { error } = await supabase.from('announcements').insert({
      title: form.title,
      content: form.content,
      author_id: user!.id,
      course_id: form.course_id || null,
      target_role: form.target_role as any,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Announcement posted!');
      setDialogOpen(false);
      setForm({ title: '', content: '', course_id: '', target_role: 'student' });
      // Refresh
      const { data: a } = await supabase.from('announcements').select('*, courses(name)').eq('author_id', user!.id).order('created_at', { ascending: false });
      setAnnouncements(a || []);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Announcements</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Upcoming Quiz on Monday" required />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Details about the announcement..." rows={4} required />
              </div>
              <div className="space-y-2">
                <Label>Course (optional)</Label>
                <Select value={form.course_id} onValueChange={v => setForm(f => ({ ...f, course_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="All courses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.class} {c.section}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={form.target_role} onValueChange={v => setForm(f => ({ ...f, target_role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post Announcement
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

      {(() => {
        const visible = courseFilter === 'all' ? announcements : announcements.filter(a => a.course_id === courseFilter);
        return visible.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No announcements posted yet</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {visible.map(a => (
            <Card key={a.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{a.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
                      <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                        {a.courses?.name && <span>• {a.courses.name}</span>}
                        <span>• For: {a.target_role}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        );
      })()}
    </div>
  );
};

export default TeacherAnnouncements;
