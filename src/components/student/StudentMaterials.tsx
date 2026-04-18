import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Filter, FileText } from 'lucide-react';
import { toast } from 'sonner';

const StudentMaterials = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', s.id);
      const courseIds = (enrollments || []).map(e => e.course_id);
      if (courseIds.length) {
        const { data: c } = await supabase.from('courses').select('id, name, class, section').in('id', courseIds);
        setCourses(c || []);
        const { data: m } = await supabase.from('course_materials').select('*').in('course_id', courseIds).order('created_at', { ascending: false });
        setMaterials(m || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const downloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || 'material';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Download failed');
    }
  };

  const courseName = (id: string) => {
    const c = courses.find(x => x.id === id);
    return c ? `${c.name} (${c.class}-${c.section})` : '-';
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const filtered = courseFilter === 'all' ? materials : materials.filter(m => m.course_id === courseFilter);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Study Materials</h2>

      {courses.length > 0 && (
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-64"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="All courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.class}-{c.section})</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No materials available yet</TableCell></TableRow>
              ) : filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {m.title}</TableCell>
                  <TableCell className="text-sm">{courseName(m.course_id)}</TableCell>
                  <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => downloadFile(m.file_url, m.title)}>
                      <Download className="mr-1 h-3 w-3" /> Download
                    </Button>
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

export default StudentMaterials;
