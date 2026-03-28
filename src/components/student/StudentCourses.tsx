import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, BookOpen, FileText, PlusCircle, Info, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const StudentCourses = () => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentSection, setStudentSection] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data: s } = await supabase.from('students').select('id, class, section').eq('user_id', user.id).single();
    if (!s) { setLoading(false); return; }
    setStudentId(s.id);
    setStudentClass(s.class);
    setStudentSection(s.section);

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

    const { data: all } = await supabase.from('courses').select('*').eq('class', s.class);
    const filtered = (all || []).filter(c => !enrolledCourseIds.includes(c.id));
    setAvailableCourses(filtered);
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

  const filterCourses = (courses: any[]) =>
    courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold text-foreground">My Courses</h2>
        {studentClass && (
          <Badge variant="secondary" className="text-sm px-3 py-1">
            Class {studentClass} - Section {studentSection}
          </Badge>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="enrolled" className="w-full">
        <TabsList>
          <TabsTrigger value="enrolled">Enrolled ({myCourses.length})</TabsTrigger>
          <TabsTrigger value="browse">Browse Courses ({availableCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled" className="mt-4">
          {filterCourses(myCourses).length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No courses found. Browse available courses to enroll!</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterCourses(myCourses).map(c => (
                <Card key={c.id} className="hover:shadow-lg transition-all hover:border-primary/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
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
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
            <Info className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              Showing courses for <span className="font-semibold text-foreground">Class {studentClass}</span> only
            </p>
          </div>

          {filterCourses(availableCourses).length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No more courses available for your class.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filterCourses(availableCourses).map(c => (
                <Card key={c.id} className="hover:shadow-lg transition-all hover:border-primary/30">
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentCourses;
