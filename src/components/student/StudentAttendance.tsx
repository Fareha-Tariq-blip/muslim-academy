import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Check, X, Clock } from 'lucide-react';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      const { data } = await supabase.from('attendance').select('*').eq('student_id', s.id).order('date', { ascending: false });
      setRecords(data || []);
      const present = data?.filter(r => r.status === 'present').length || 0;
      const absent = data?.filter(r => r.status === 'absent').length || 0;
      const late = data?.filter(r => r.status === 'late').length || 0;
      setStats({ present, absent, late, total: data?.length || 0 });
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const percentage = stats.total ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Attendance</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{percentage}%</p><p className="text-xs text-muted-foreground">Overall</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-secondary">{stats.present}</p><p className="text-xs text-muted-foreground">Present</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{stats.absent}</p><p className="text-xs text-muted-foreground">Absent</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-warning">{stats.late}</p><p className="text-xs text-muted-foreground">Late</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No records</TableCell></TableRow>
              ) : records.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'present' ? 'bg-secondary/10 text-secondary' : r.status === 'absent' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                      {r.status === 'present' ? <Check className="h-3 w-3" /> : r.status === 'absent' ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {r.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendance;
