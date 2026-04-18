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
import { Plus, Loader2, Bell, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS = ['A','B','C'];

const AdminAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target_class: 'all', target_section: 'all' });

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('announcements').insert({
      title: form.title,
      content: form.content,
      author_id: user?.id,
      target_role: 'student' as any, // class targeting implies students
      target_class: form.target_class === 'all' ? null : form.target_class,
      target_section: form.target_section === 'all' ? null : form.target_section,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Announcement posted');
      setDialogOpen(false);
      setForm({ title: '', content: '', target_class: 'all', target_section: 'all' });
      fetchAnnouncements();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Announcement deleted');
      fetchAnnouncements();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Announcements</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Announcement</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Post Announcement</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Target Class</Label>
                  <Select value={form.target_class} onValueChange={v => setForm(f => ({ ...f, target_class: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {CLASSES.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Section</Label>
                  <Select value={form.target_section} onValueChange={v => setForm(f => ({ ...f, target_section: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {SECTIONS.map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post Announcement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : announcements.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No announcements yet</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <Card key={a.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{a.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.content}</p>
                    <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      For: {a.target_class ? `Class ${a.target_class}${a.target_section ? `-${a.target_section}` : ''}` : 'All Classes'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
