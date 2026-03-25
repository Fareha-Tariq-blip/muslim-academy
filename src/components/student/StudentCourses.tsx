import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, FileText, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StudentCourses = () => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: s } = await supabase.from('students').select('id, class, section').eq('user_id', user.id).single();
    if (!s) { setLoading(false); return; }
    setStudentId(s.id);

    const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', s.id);
    const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];
    setEnrolledIds(new Set(enrolledCourseIds));

    if (enrolledCourseIds.length) {
      const { data: coursesData } = await supabase.from('courses').select('*').in('id', enrolledCourseIds);
      const { data: materials } = await supabase.from('course_materials').select('*').in('course_id', enrolledCourseIds);
      setMyCourses((coursesData || []).map(c => ({ ...c, materials: (materials || []).filter(m => m.course_id === c.id) })));
    } else {
      setMyCourses([]);
    }

    const { data: all } = await supabase.from('courses').select('*');
    setAllCourses(all || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const enrollInCourse = async (courseId: string) => {
    if (!studentId) return;
    setEnrolling(courseId);
    const { error } = await supabase.from('enrollments').insert({ student_id: studentId, course_id: courseId });
    if (error) toast.error(error.message);
    else { toast.success('Enrolled successfully!'); await fetchData(); }
    setEnrolling(null);
  };

  const unenroll = async (courseId: string) => {
    if (!studentId) return;
    setEnrolling(courseId);
    const { error } = await supabase.from('enrollments').delete().eq('student_id', studentId).eq('course_id', courseId);
    if (error) toast.error(error.message);
    else { toast.success('Unenrolled successfully'); await fetchData(); }
    setEnrolling(null);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const availableCourses = allCourses.filter(c => !enrolledIds.has(c.id));

  const filteredAvailable = availableCourses.filter(c => {
    if (selectedClass !== 'all' && c.class !== selectedClass) return false;
    if (selectedSection !== 'all' && c.section !== selectedSection) return false;
    return true;
  });

  // Group by class for display
  const groupedByClass: Record<string, any[]> = {};
  filteredAvailable.forEach(c => {
    const key = `Class ${c.class} - Section ${c.section}`;
    if (!groupedByClass[key]) groupedByClass[key] = [];
    groupedByClass[key].push(c);
  });
  const sortedGroups = Object.keys(groupedByClass).sort((a, b) => {
    const classA = parseInt(a.match(/\d+/)?.[0] || '0');
    const classB = parseInt(b.match(/\d+/)?.[0] || '0');
    return classA - classB;
  });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">My Courses</h2>
      <Tabs defaultValue="enrolled" className="w-full">
        <TabsList>
          <TabsTrigger value="enrolled">Enrolled ({myCourses.length})</TabsTrigger>
          <TabsTrigger value="browse">Browse Courses ({availableCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-4">
          {myCourses.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Not enrolled in any courses. Browse available courses to enroll!</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myCourses.map(c => (
                <Card key={c.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold text-foreground">{c.name}</h3>
                        <p className="text-xs text-muted-foreground">Class {c.class} - Section {c.section}</p>
                      </div>
                    </div>
                    {c.description && <p className="text-sm text-muted-foreground mb-3">{c.description}</p>}
                    {c.materials?.length > 0 && (
                      <div className="border-t pt-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Materials:</p>
                        {c.materials.map((m: any) => (
                          <a key={m.id} href={m.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline">
                            <FileText className="h-3 w-3" /> {m.title}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => unenroll(c.id)} disabled={enrolling === c.id}>
                        {enrolling === c.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Unenroll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>Class {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter by section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {['A', 'B', 'C'].map(s => <SelectItem key={s} value={s}>Section {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {sortedGroups.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No courses available for the selected filters.</CardContent></Card>
          ) : (
            sortedGroups.map(group => (
              <div key={group}>
                <h3 className="font-semibold text-foreground mb-3 text-lg">{group}</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                  {groupedByClass[group].map(c => (
                    <Card key={c.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><BookOpen className="h-5 w-5 text-muted-foreground" /></div>
                          <div>
                            <h3 className="font-semibold text-foreground">{c.name}</h3>
                            <p className="text-xs text-muted-foreground">Class {c.class} - Section {c.section}</p>
                          </div>
                        </div>
                        {c.description && <p className="text-sm text-muted-foreground mb-3">{c.description}</p>}
                        <Button className="w-full mt-2" onClick={() => enrollInCourse(c.id)} disabled={enrolling === c.id}>
                          {enrolling === c.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                          Enroll
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentCourses;
