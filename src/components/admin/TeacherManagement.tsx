import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Loader2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { validateAcademyEmail, validatePassword } from '@/lib/validation';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', subject: '', qualification: '', phone: '' });
  const [editForm, setEditForm] = useState({ id: '', subject: '', qualification: '', phone: '', full_name: '', profile_id: '' });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase.from('teachers').select('*');
    if (data) {
      const enriched = await Promise.all(data.map(async (t) => {
        const { data: p } = await supabase.from('profiles').select('id, full_name').eq('user_id', t.user_id).single();
        return { ...t, profile: p };
      }));
      setTeachers(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTeachers(); }, []);

  const subjects = ['all', ...new Set(teachers.map(t => t.subject).filter(Boolean))];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateAcademyEmail(form.email);
    if (emailErr) { toast.error(emailErr); return; }
    const pwdErrs = validatePassword(form.password);
    if (pwdErrs.length) { setPasswordErrors(pwdErrs); return; }

    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, role: 'teacher' }),
    });
    const result = await res.json();
    if (!res.ok || result.error) { toast.error(result.error || 'Failed to create user'); setSaving(false); return; }

    const { error } = await supabase.from('teachers').insert({
      user_id: result.user.id, subject: form.subject,
      qualification: form.qualification || null, phone: form.phone || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Teacher registered successfully');
      setDialogOpen(false);
      setForm({ full_name: '', email: '', password: '', subject: '', qualification: '', phone: '' });
      setPasswordErrors([]);
      fetchTeachers();
    }
    setSaving(false);
  };

  const openEdit = (t: any) => {
    setEditForm({
      id: t.id, subject: t.subject, qualification: t.qualification || '',
      phone: t.phone || '', full_name: t.profile?.full_name || '', profile_id: t.profile?.id || '',
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('teachers').update({
      subject: editForm.subject, qualification: editForm.qualification || null, phone: editForm.phone || null,
    }).eq('id', editForm.id);
    if (editForm.profile_id) {
      await supabase.from('profiles').update({ full_name: editForm.full_name }).eq('id', editForm.profile_id);
    }
    if (error) toast.error(error.message);
    else { toast.success('Teacher updated'); setEditDialogOpen(false); fetchTeachers(); }
    setSaving(false);
  };

  const handleDelete = async (teacher: any) => {
    if (!confirm('Delete this teacher? This will also remove their login account.')) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'delete', user_id: teacher.user_id }),
    });
    const result = await res.json();
    if (result.error) { toast.error(result.error); return; }
    await supabase.from('teachers').delete().eq('id', teacher.id);
    await supabase.from('profiles').delete().eq('user_id', teacher.user_id);
    toast.success('Teacher deleted completely');
    fetchTeachers();
  };

  const filtered = teachers.filter(t => {
    const matchesSearch = (t.profile?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || t.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Teacher Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Teacher</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="name@muslimacademy.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  <p className="text-[10px] text-muted-foreground">Must be @muslimacademy.com</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="e.g. Teacher@123" value={form.password} onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setPasswordErrors([]); }} required />
                  {passwordErrors.length > 0 && (
                    <ul className="text-[10px] text-destructive space-y-0.5">
                      {passwordErrors.map((err, i) => <li key={i}>• {err}</li>)}
                    </ul>
                  )}
                  <p className="text-[10px] text-muted-foreground">Min 8 chars, uppercase, lowercase, number, special char</p>
                </div>
                <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Qualification</Label><Input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Register Teacher
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Subject filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Teacher</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Subject</Label><Input value={editForm.subject} onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Qualification</Label><Input value={editForm.qualification} onChange={e => setEditForm(f => ({ ...f, qualification: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No teachers found</TableCell></TableRow>
                ) : (
                  filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.profile?.full_name || 'N/A'}</TableCell>
                      <TableCell>{t.subject}</TableCell>
                      <TableCell>{t.qualification || '-'}</TableCell>
                      <TableCell>{t.phone || '-'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default TeacherManagement;
