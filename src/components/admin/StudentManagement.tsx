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

const StudentManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: 'student123', roll_number: '', class: '1', section: 'A', guardian_name: '', phone: '' });
  const [editForm, setEditForm] = useState({ id: '', roll_number: '', class: '1', section: 'A', guardian_name: '', phone: '', full_name: '', profile_id: '' });

  const fetchStudents = async () => {
    setLoading(true);
    const { data } = await supabase.from('students').select('*');
    if (data) {
      const enriched = await Promise.all(data.map(async (s) => {
        const { data: p } = await supabase.from('profiles').select('id, full_name').eq('user_id', s.user_id).single();
        return { ...s, profile: p };
      }));
      setStudents(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, role: 'student' }),
    });
    const result = await res.json();
    if (!res.ok || result.error) { toast.error(result.error || 'Failed to create user'); setSaving(false); return; }

    const { error } = await supabase.from('students').insert({
      user_id: result.user.id, roll_number: form.roll_number, class: form.class, section: form.section,
      guardian_name: form.guardian_name || null, phone: form.phone || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Student registered successfully');
      setDialogOpen(false);
      setForm({ full_name: '', email: '', password: 'student123', roll_number: '', class: '1', section: 'A', guardian_name: '', phone: '' });
      fetchStudents();
    }
    setSaving(false);
  };

  const openEdit = (s: any) => {
    setEditForm({
      id: s.id, roll_number: s.roll_number, class: s.class, section: s.section,
      guardian_name: s.guardian_name || '', phone: s.phone || '',
      full_name: s.profile?.full_name || '', profile_id: s.profile?.id || '',
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('students').update({
      roll_number: editForm.roll_number, class: editForm.class, section: editForm.section,
      guardian_name: editForm.guardian_name || null, phone: editForm.phone || null,
    }).eq('id', editForm.id);
    if (editForm.profile_id) {
      await supabase.from('profiles').update({ full_name: editForm.full_name }).eq('id', editForm.profile_id);
    }
    if (error) toast.error(error.message);
    else { toast.success('Student updated'); setEditDialogOpen(false); fetchStudents(); }
    setSaving(false);
  };

  const handleDelete = async (student: any) => {
    if (!confirm('Delete this student? This will also remove their login account.')) return;
    // Delete from students table first
    await supabase.from('students').delete().eq('id', student.id);
    // Delete from profiles
    await supabase.from('profiles').delete().eq('user_id', student.user_id);
    // Delete from auth.users via edge function
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'delete', user_id: student.user_id }),
    });
    toast.success('Student deleted completely');
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Student Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register New Student</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Password</Label><Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required /></div>
                <div className="space-y-2"><Label>Roll Number</Label><Input value={form.roll_number} onChange={e => setForm(f => ({ ...f, roll_number: e.target.value }))} required /></div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={form.class} onValueChange={v => setForm(f => ({ ...f, class: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i+1} value={String(i+1)}>{`Class ${i+1}`}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{['A','B','C'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Guardian Name</Label><Input value={form.guardian_name} onChange={e => setForm(f => ({ ...f, guardian_name: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Register Student
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Full Name</Label><Input value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Roll Number</Label><Input value={editForm.roll_number} onChange={e => setEditForm(f => ({ ...f, roll_number: e.target.value }))} required /></div>
              <div className="space-y-2">
                <Label>Class</Label>
                <Select value={editForm.class} onValueChange={v => setEditForm(f => ({ ...f, class: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i+1} value={String(i+1)}>{`Class ${i+1}`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={editForm.section} onValueChange={v => setEditForm(f => ({ ...f, section: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['A','B','C'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Guardian Name</Label><Input value={editForm.guardian_name} onChange={e => setEditForm(f => ({ ...f, guardian_name: e.target.value }))} /></div>
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
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No students found</TableCell></TableRow>
                ) : (
                  students.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.profile?.full_name || 'N/A'}</TableCell>
                      <TableCell>{s.roll_number}</TableCell>
                      <TableCell>{s.class}</TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell>{s.guardian_name || '-'}</TableCell>
                      <TableCell>{s.phone || '-'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default StudentManagement;
