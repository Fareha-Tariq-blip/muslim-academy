import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Award, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }

      const [gradesRes, quizRes, subRes] = await Promise.all([
        supabase.from('grades').select('*, courses(name, class, section)').eq('student_id', s.id),
        supabase.from('quiz_attempts').select('*, quizzes(title, total_marks, courses(name))').eq('student_id', s.id).eq('completed', true),
        supabase.from('assignment_submissions').select('*, assignments(title, course_id, courses(name))').eq('student_id', s.id).eq('graded', true),
      ]);

      setGrades(gradesRes.data || []);
      setQuizAttempts(quizRes.data || []);
      setSubmissions(subRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Term grades stats
  const totalMarks = grades.reduce((sum, g) => sum + g.marks, 0);
  const avgMarks = grades.length ? Math.round(totalMarks / grades.length) : 0;
  const highest = grades.length ? Math.max(...grades.map(g => g.marks)) : 0;
  const lowest = grades.length ? Math.min(...grades.map(g => g.marks)) : 0;

  // Quiz stats
  const avgQuiz = quizAttempts.length ? Math.round(quizAttempts.reduce((sum, q) => sum + (q.score || 0), 0) / quizAttempts.length) : 0;

  // Assignment stats
  const avgAssignment = submissions.length ? Math.round(submissions.reduce((sum, s) => sum + (s.marks || 0), 0) / submissions.length) : 0;

  const chartData = grades.map(g => ({ term: g.term, marks: g.marks, course: (g.courses as any)?.name || '' }));

  const hasAnyData = grades.length > 0 || quizAttempts.length > 0 || submissions.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Grades & Results</h2>

      {!hasAnyData ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No grades or results recorded yet</CardContent></Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Term Average</p>
                <p className="text-2xl font-bold text-primary">{avgMarks || '—'}%</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <CardContent className="p-4 text-center">
                <Award className="h-5 w-5 text-secondary mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Quiz Average</p>
                <p className="text-2xl font-bold text-secondary">{avgQuiz || '—'}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-5 w-5 text-info mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Assignment Avg</p>
                <p className="text-2xl font-bold text-info">{avgAssignment || '—'}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-sm text-muted-foreground">Highest / Lowest</p>
                <p className="text-2xl font-bold text-foreground">{highest || '—'} / {lowest || '—'}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList>
              <TabsTrigger value="terms">Term Results ({grades.length})</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes ({quizAttempts.length})</TabsTrigger>
              <TabsTrigger value="assignments">Assignments ({submissions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="terms" className="mt-4 space-y-4">
              {grades.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground">No term results yet</CardContent></Card>
              ) : (
                <>
                  <Card>
                    <CardHeader><CardTitle className="font-display text-lg">Grade Progress</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="term" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value: number) => [value, 'Marks']} />
                          <Line type="monotone" dataKey="marks" stroke="hsl(224,76%,48%)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Course</TableHead>
                            <TableHead>Term</TableHead>
                            <TableHead>Marks</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grades.map(g => (
                            <TableRow key={g.id}>
                              <TableCell className="font-medium">{(g.courses as any)?.name || 'Unknown'}</TableCell>
                              <TableCell><Badge variant="outline">{g.term}</Badge></TableCell>
                              <TableCell className="font-bold">{g.marks}/100</TableCell>
                              <TableCell>{g.grade_letter ? <Badge variant="secondary">{g.grade_letter}</Badge> : '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="quizzes" className="mt-4">
              {quizAttempts.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground">No quiz results yet</CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quiz</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quizAttempts.map(q => {
                          const quiz = q.quizzes as any;
                          const pct = quiz?.total_marks ? Math.round((q.score / quiz.total_marks) * 100) : 0;
                          return (
                            <TableRow key={q.id}>
                              <TableCell className="font-medium">{quiz?.title || 'Unknown'}</TableCell>
                              <TableCell>{quiz?.courses?.name || '—'}</TableCell>
                              <TableCell className="font-bold">{q.score ?? '—'}</TableCell>
                              <TableCell>{quiz?.total_marks || '—'}</TableCell>
                              <TableCell>
                                <Badge variant={pct >= 70 ? 'default' : pct >= 50 ? 'secondary' : 'destructive'}>{pct}%</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="mt-4">
              {submissions.length === 0 ? (
                <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground">No graded assignments yet</CardContent></Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Marks</TableHead>
                          <TableHead>Feedback</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map(s => {
                          const assignment = s.assignments as any;
                          return (
                            <TableRow key={s.id}>
                              <TableCell className="font-medium">{assignment?.title || 'Unknown'}</TableCell>
                              <TableCell>{assignment?.courses?.name || '—'}</TableCell>
                              <TableCell className="font-bold">{s.marks ?? '—'}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{s.feedback || '—'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default StudentGrades;
