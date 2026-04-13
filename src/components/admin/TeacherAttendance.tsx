import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  leave: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const TeacherAttendance = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [historyTeacher, setHistoryTeacher] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingHistoryStatus, setEditingHistoryStatus] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase.from('teachers').select('*');
    if (data) {
      const enriched = await Promise.all(data.map(async (t) => {
        const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', t.user_id).single();
        return { ...t, name: p?.full_name || 'N/A' };
      }));
      setTeachers(enriched);
    }
    setLoading(false);
  };

  const fetchAttendanceForDate = async () => {
    const { data } = await supabase.from('teacher_attendance').select('*').eq('date', selectedDate);
    const map: Record<string, string> = {};
    data?.forEach(a => { map[a.teacher_id] = a.status; });
    setAttendance(map);
  };

  useEffect(() => { fetchTeachers(); }, []);
  useEffect(() => { fetchAttendanceForDate(); }, [selectedDate]);

  const setStatus = (teacherId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [teacherId]: status }));
  };

  const saveAttendance = async () => {
    setSaving(true);
    for (const teacher of teachers) {
      const status = attendance[teacher.id] || 'present';
      const { error } = await supabase.from('teacher_attendance').upsert(
        { teacher_id: teacher.id, date: selectedDate, status },
        { onConflict: 'teacher_id,date' }
      );
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    toast.success('Attendance saved successfully');
    setSaving(false);
  };

  const viewHistory = async (teacherId: string) => {
    setHistoryTeacher(teacherId);
    const { data } = await supabase.from('teacher_attendance').select('*').eq('teacher_id', teacherId).order('date', { ascending: false }).limit(30);
    setHistory(data || []);
  };

  const saveHistoryEdit = async (id: string) => {
    const { error } = await supabase.from('teacher_attendance').update({ status: editingHistoryStatus }).eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Attendance updated');
      setEditingHistoryId(null);
      if (historyTeacher) viewHistory(historyTeacher);
    }
  };

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">Teacher Attendance</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-44" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Attendance for {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">History</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell>
                    <Select value={attendance[t.id] || 'present'} onValueChange={v => setStatus(t.id, v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="present">Present</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => viewHistory(t.id)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Button onClick={saveAttendance} disabled={saving} className="w-full sm:w-auto">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Attendance
      </Button>

      {historyTeacher && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Attendance History — {teachers.find(t => t.id === historyTeacher)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No records found</TableCell></TableRow>
                ) : history.map(h => (
                  <TableRow key={h.id}>
                    <TableCell>{format(new Date(h.date + 'T00:00:00'), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {editingHistoryId === h.id ? (
                        <Select value={editingHistoryStatus} onValueChange={setEditingHistoryStatus}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className={statusColors[h.status] || ''}>{h.status.charAt(0).toUpperCase() + h.status.slice(1)}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingHistoryId === h.id ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={() => saveHistoryEdit(h.id)}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingHistoryId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => { setEditingHistoryId(h.id); setEditingHistoryStatus(h.status); }}>
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                      )}
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

export default TeacherAttendance;
