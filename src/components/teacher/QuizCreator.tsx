import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, Sparkles, Trash2, FileText, ChevronDown, ChevronUp, Users, CheckCircle, XCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const QuizCreator = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', course_id: '', total_marks: '10', due_date: '' });
  const [courseFilter, setCourseFilter] = useState('all');
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correct_answer: string; marks: number }[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState('5');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMaterialFile, setAiMaterialFile] = useState<File | null>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [attemptData, setAttemptData] = useState<Record<string, { attempts: any[]; enrolled: any[] }>>({});
  const [loadingAttempts, setLoadingAttempts] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
      if (t) {
        const { data: c } = await supabase.from('courses').select('*').eq('teacher_id', t.id);
        setCourses(c || []);
        const courseIds = c?.map(x => x.id) || [];
        if (courseIds.length) {
          const { data: q } = await supabase.from('quizzes').select('*').in('course_id', courseIds).order('created_at', { ascending: false });
          setQuizzes(q || []);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const loadAttempts = async (quiz: any) => {
    if (expandedQuiz === quiz.id) { setExpandedQuiz(null); return; }
    setExpandedQuiz(quiz.id);
    if (attemptData[quiz.id]) return;
    setLoadingAttempts(quiz.id);

    const { data: enrollments } = await supabase.from('enrollments').select('student_id').eq('course_id', quiz.course_id);
    const studentIds = enrollments?.map(e => e.student_id) || [];

    let enrolledStudents: any[] = [];
    if (studentIds.length) {
      const { data: students } = await supabase.from('students').select('id, user_id, roll_number').in('id', studentIds);
      if (students?.length) {
        const enriched = await Promise.all(students.map(async (s) => {
          const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', s.user_id).single();
          return { ...s, full_name: p?.full_name || 'Unknown' };
        }));
        enrolledStudents = enriched;
      }
    }

    const { data: attempts } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quiz.id);

    setAttemptData(prev => ({ ...prev, [quiz.id]: { attempts: attempts || [], enrolled: enrolledStudents } }));
    setLoadingAttempts(null);
  };

  const addQuestion = () => {
    setQuestions(q => [...q, { question: '', options: ['', '', '', ''], correct_answer: '', marks: 1 }]);
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(q => q.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions(q => q.map((item, i) => {
      if (i !== qIdx) return item;
      const options = [...item.options];
      options[oIdx] = value;
      return { ...item, options };
    }));
  };

  const readMaterialText = async (selectedFile: File) => {
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (selectedFile.type.startsWith('text/') || ['txt', 'md', 'csv', 'json'].includes(extension || '')) {
      return (await selectedFile.text()).slice(0, 12000);
    }
    if (extension === 'pdf') {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const rawText = Array.from(bytes)
        .map((byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ' '))
        .join('').replace(/\s+/g, ' ').trim();
      if (!rawText) throw new Error('Could not extract readable text from this PDF.');
      return rawText.slice(0, 12000);
    }
    throw new Error('Use a text or PDF file for AI quiz generation.');
  };

  const generateWithAI = async () => {
    if (!aiTopic.trim()) { toast.error('Enter a topic'); return; }
    setAiLoading(true);
    try {
      const count = Math.min(Math.max(Number(aiQuestionCount) || 5, 1), 20);
      const materialText = aiMaterialFile ? await readMaterialText(aiMaterialFile) : undefined;
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { topic: aiTopic, count, materialText }
      });
      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions.map((q: any) => ({
          question: q.question,
          options: q.options || ['', '', '', ''],
          correct_answer: q.correct_answer || q.options?.[0] || '',
          marks: 1,
        })));
        // Auto-fill title from topic if empty
        if (!form.title.trim()) {
          setForm(f => ({ ...f, title: aiTopic.trim() }));
        }
        toast.success(`Generated ${data.questions.length} questions!`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'AI generation failed. Add questions manually.');
    }
    setAiLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) { toast.error('Add at least one question'); return; }
    if (!form.title.trim()) { toast.error('Enter a quiz title'); return; }
    setSaving(true);

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const { data: quiz, error } = await supabase.from('quizzes').insert({
      title: form.title.trim(),
      course_id: form.course_id,
      total_marks: totalMarks,
      created_by: user?.id,
      due_date: form.due_date || null,
    } as any).select().single();

    if (error || !quiz) { toast.error(error?.message || 'Failed'); setSaving(false); return; }

    const questionInserts = questions.map(q => ({
      quiz_id: quiz.id,
      question: q.question,
      options_json: q.options,
      correct_answer: q.correct_answer,
      marks: q.marks,
    }));

    await supabase.from('quiz_questions').insert(questionInserts);
    toast.success('Quiz created!');
    setDialogOpen(false);
    setQuestions([]);
    setForm({ title: '', course_id: '', total_marks: '10', due_date: '' });
    setAiMaterialFile(null);
    setAiQuestionCount('5');
    setAiTopic('');

    const { data: t } = await supabase.from('teachers').select('id').eq('user_id', user!.id).single();
    if (t) {
      const { data: c } = await supabase.from('courses').select('id').eq('teacher_id', t.id);
      const ids = c?.map(x => x.id) || [];
      if (ids.length) {
        const { data: q } = await supabase.from('quizzes').select('*').in('course_id', ids).order('created_at', { ascending: false });
        setQuizzes(q || []);
      }
    }
    setSaving(false);
  };

  const getCourseName = (courseId: string) => {
    const c = courses.find(x => x.id === courseId);
    return c ? `${c.name} (${c.class}-${c.section})` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Quiz Creator</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Create Quiz</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Quiz</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Quiz Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Chapter 5 Quiz" /></div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={form.course_id} onValueChange={v => setForm(f => ({ ...f, course_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (Class {c.class} - {c.section})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Due Date (optional — students can't submit after this)</Label>
                  <Input type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>

              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
                      <Input placeholder="Enter topic for AI generation..." value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                      <Input type="number" min={1} max={20} value={aiQuestionCount} onChange={e => setAiQuestionCount(e.target.value)} placeholder="MCQs" />
                    </div>
                    <div className="space-y-2">
                      <Label>Related material for AI (optional text or PDF)</Label>
                      <div className="flex items-center gap-2">
                        <Input type="file" accept=".txt,.md,.csv,.json,.pdf,text/*,application/pdf" onChange={e => setAiMaterialFile(e.target.files?.[0] || null)} className="flex-1" />
                        {aiMaterialFile && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span className="max-w-[140px] truncate">{aiMaterialFile.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={generateWithAI} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generate with AI
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                Students can attempt each quiz only once and may upload a theory-answer file when needed.
              </p>

              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <Card key={qi}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Question {qi + 1}</Label>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Textarea value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Question text..." />
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, oi) => (
                          <Input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} />
                        ))}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Correct Answer</Label>
                          <Input value={q.correct_answer} onChange={e => updateQuestion(qi, 'correct_answer', e.target.value)} placeholder="Correct answer" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Marks</Label>
                          <Input type="number" value={q.marks} onChange={e => updateQuestion(qi, 'marks', Number(e.target.value))} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {`Create Quiz (${questions.length} questions)`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length > 0 && (
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-64"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (Class {c.class}-{c.section})</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (courseFilter === 'all' ? quizzes : quizzes.filter(q => q.course_id === courseFilter)).length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No quizzes</div>
          ) : (
            <div className="divide-y">
              {(courseFilter === 'all' ? quizzes : quizzes.filter(q => q.course_id === courseFilter)).map(q => (
                <div key={q.id}>
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => loadAttempts(q)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{q.title}</p>
                      <p className="text-xs text-muted-foreground">{getCourseName(q.course_id)} · {q.total_marks} marks · {new Date(q.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {expandedQuiz === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {expandedQuiz === q.id && (
                    <div className="border-t bg-muted/20 px-4 py-3">
                      {loadingAttempts === q.id ? (
                        <div className="flex items-center justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                      ) : attemptData[q.id] ? (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">
                            Student Attempts ({attemptData[q.id].attempts.length}/{attemptData[q.id].enrolled.length} students)
                          </p>
                          {attemptData[q.id].enrolled.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No students enrolled in this course.</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student</TableHead>
                                  <TableHead>Roll No</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Score</TableHead>
                                  <TableHead>File</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {attemptData[q.id].enrolled.map(student => {
                                  const attempt = attemptData[q.id].attempts.find(a => a.student_id === student.id);
                                  const answersJson = attempt?.answers_json as any;
                                  const theoryFileUrl = answersJson?.theory_file_url;
                                  const theoryFileName = answersJson?.theory_file_name;
                                  return (
                                    <TableRow key={student.id}>
                                      <TableCell className="font-medium">{student.full_name}</TableCell>
                                      <TableCell>{student.roll_number}</TableCell>
                                      <TableCell>
                                        {attempt ? (
                                          <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Attempted</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Not Attempted</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {attempt ? `${attempt.score ?? 0}/${q.total_marks}` : '—'}
                                      </TableCell>
                                      <TableCell>
                                        {theoryFileUrl ? (
                                          <a href={theoryFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs flex items-center gap-1">
                                            <FileText className="h-3 w-3" /> {theoryFileName || 'View File'}
                                          </a>
                                        ) : '—'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizCreator;
