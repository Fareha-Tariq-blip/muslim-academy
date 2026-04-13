import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, X, Clock, Users, History, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const AttendanceMarker = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('mark');
  const [studentSearch, setStudentSearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('*').eq('teacher_id', t.id);
        setCourses(c || []);
      }
      setLoading(false);
    };
    fetchCourses();
  }, [user]);

  const loadStudents = async (courseId: string) => {
    setSelectedCourse(courseId);
    setLoadingStudents(true);
    setStudents([]);

    const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', courseId);
    if (!enrollments || enrollments.length === 0) { setStudents([]); setLoadingStudents(false); return; }

    const studentIds = enrollments.map(e => e.student_id);
    const { data: studentsData } = await supabase.from('students').select('*').in('id', studentIds);

    if (studentsData && studentsData.length > 0) {
      const enriched = await Promise.all(studentsData.map(async (s) => {
        const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', s.user_id).single();
        return { ...s, full_name: p?.full_name || 'Unknown' };
      }));
      setStudents(enriched);

      const { data: existing } = await supabase.from('attendance').select('student_id, status').eq('course_id', courseId).eq('date', selectedDate);
      const defaultAttendance: Record<string, string> = {};
      enriched.forEach(s => { defaultAttendance[s.id] = 'present'; });
      if (existing) existing.forEach(a => { defaultAttendance[a.student_id] = a.status; });
      setAttendance(defaultAttendance);
    }
    setLoadingStudents(false);
  };

  const loadDateAttendance = async (date: string) => {
    setSelectedDate(date);
    if (!selectedCourse || students.length === 0) return;
    const { data: existing } = await supabase.from('attendance').select('student_id, status').eq('course_id', selectedCourse).eq('date', date);
    const defaultAttendance: Record<string, string> = {};
    students.forEach(s => { defaultAttendance[s.id] = 'present'; });
    if (existing) existing.forEach(a => { defaultAttendance[a.student_id] = a.status; });
    setAttendance(defaultAttendance);
  };

  const saveAttendance = async () => {
    setSaving(true);
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId, course_id: selectedCourse, date: selectedDate, status,
    }));
    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'student_id,course_id,date' });
    if (error) toast.error(error.message);
    else toast.success('Attendance saved!');
    setSaving(false);
  };

  const loadHistory = async () => {
    if (!selectedCourse) { toast.error('Select a course first'); return; }
    setLoadingHistory(true);
    const { data } = await supabase.from('attendance').select('*').eq('course_id', selectedCourse).order('date', { ascending: false }).limit(200);
    if (data) {
      const enriched = await Promise.all(data.map(async (r) => {
        const student = students.find(s => s.id === r.student_id);
        return { ...r, full_name: student?.full_name || 'Unknown', roll_number: student?.roll_number || '' };
      }));
      setHistoryRecords(enriched);
    }
    setLoadingHistory(false);
  };

  const saveHistoryEdit = async (id: string) => {
    const { error } = await supabase.from('attendance').update({ status: editingStatus }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Updated'); setEditingId(null); loadHistory(); }
  };

  const filteredStudents = students.filter(s => s.full_name.toLowerCase().includes(studentSearch.toLowerCase()));

  const filteredHistory = historyRecords.filter(r => {
    const matchesDate = !historyDateFilter || r.date === historyDateFilter;
    const matchesSearch = !historySearch || r.full_name.toLowerCase().includes(historySearch.toLowerCase());
    return matchesDate && matchesSearch;
  });

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Attendance</h2>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="w-64">
          <Label className="text-xs">Course</Label>
          <Select value={selectedCourse} onValueChange={loadStudents}>
            <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
            <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.class}-{c.section})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Date</Label>
          <Input type="date" value={selectedDate} onChange={e => loadDateAttendance(e.target.value)} className="w-44" />
        </div>
      </div>

      {selectedCourse && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="history" onClick={loadHistory}><History className="mr-1 h-4 w-4" /> History</TabsTrigger>
          </TabsList>

          <TabsContent value="mark">
            <div className="mb-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            {loadingStudents ? (
              <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredStudents.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground font-medium">No students found</p></CardContent></Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display flex items-center justify-between">
                    <span>Attendance - {new Date(selectedDate + 'T00:00').toLocaleDateString()}</span>
                    <Button onClick={saveAttendance} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Roll No.</TableHead><TableHead className="text-center">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filteredStudents.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.full_name}</TableCell>
                          <TableCell>{s.roll_number}</TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              {['present', 'absent', 'late'].map(status => (
                                <Button key={status} size="sm" variant={attendance[s.id] === status ? 'default' : 'outline'}
                                  className={attendance[s.id] === status ? (status === 'present' ? 'bg-green-600 hover:bg-green-700' : status === 'absent' ? 'bg-destructive hover:bg-destructive/90' : 'bg-yellow-500 hover:bg-yellow-600') : ''}
                                  onClick={() => setAttendance(a => ({ ...a, [s.id]: status }))}
                                >
                                  {status === 'present' ? <Check className="h-3 w-3" /> : status === 'absent' ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                  <span className="ml-1 text-xs capitalize">{status}</span>
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="flex flex-wrap gap-3 mb-4">
              <Input type="date" value={historyDateFilter} onChange={e => setHistoryDateFilter(e.target.value)} className="w-44" placeholder="Filter by date" />
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search student..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} className="pl-9" />
              </div>
            </div>
            {loadingHistory ? (
              <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredHistory.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No attendance history found</CardContent></Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Roll No</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Edit</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filteredHistory.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>{new Date(r.date + 'T00:00').toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{r.full_name}</TableCell>
                          <TableCell>{r.roll_number}</TableCell>
                          <TableCell>
                            {editingId === r.id ? (
                              <Select value={editingStatus} onValueChange={setEditingStatus}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'present' ? 'bg-green-100 text-green-700' : r.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {r.status === 'present' ? <Check className="h-3 w-3" /> : r.status === 'absent' ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}{r.status}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingId === r.id ? (
                              <div className="flex justify-end gap-1">
                                <Button size="sm" onClick={() => saveHistoryEdit(r.id)}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => { setEditingId(r.id); setEditingStatus(r.status); }}><Pencil className="h-4 w-4 text-primary" /></Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AttendanceMarker;
