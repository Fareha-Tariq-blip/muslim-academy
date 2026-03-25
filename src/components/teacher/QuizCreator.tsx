import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, Sparkles, Trash2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

const QuizCreator = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', course_id: '', total_marks: '10' });
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correct_answer: string; marks: number }[]>([]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const generateWithAI = async () => {
    if (!aiTopic.trim()) { toast.error('Enter a topic'); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { topic: aiTopic, count: 5 }
      });
      if (error) throw error;
      if (data?.questions) {
        setQuestions(data.questions.map((q: any) => ({
          question: q.question,
          options: q.options || ['', '', '', ''],
          correct_answer: q.correct_answer || q.options?.[0] || '',
          marks: 1,
        })));
        toast.success(`Generated ${data.questions.length} questions!`);
      }
    } catch (err: any) {
      toast.error('AI generation failed. Add questions manually.');
    }
    setAiLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) { toast.error('Add at least one question'); return; }
    setSaving(true);

    // Upload file if present
    let fileUrl: string | null = null;
    if (file) {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const filePath = `${user!.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('quiz-files').upload(filePath, file);
      if (uploadError) {
        toast.error('File upload failed: ' + uploadError.message);
        setSaving(false);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('quiz-files').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
      setUploading(false);
    }

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const { data: quiz, error } = await supabase.from('quizzes').insert({
      title: form.title + (fileUrl ? ` [File: ${fileUrl}]` : ''),
      course_id: form.course_id,
      total_marks: totalMarks,
      created_by: user?.id,
    }).select().single();

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
    setForm({ title: '', course_id: '', total_marks: '10' });
    setFile(null);

    // Refresh
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
                <div className="space-y-2"><Label>Quiz Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={form.course_id} onValueChange={v => setForm(f => ({ ...f, course_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} (Class {c.class} - {c.section})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attach File (optional - PDF, image, etc.)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="flex-1" />
                  {file && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span className="truncate max-w-[120px]">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <Card className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Input placeholder="Enter topic for AI generation..." value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                    <Button type="button" variant="secondary" onClick={generateWithAI} disabled={aiLoading}>
                      {aiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Generate with AI
                    </Button>
                  </div>
                </CardContent>
              </Card>

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
                {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading file...' : `Create Quiz (${questions.length} questions)`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizzes.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No quizzes</TableCell></TableRow>
                ) : (
                  quizzes.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.title}</TableCell>
                      <TableCell>{q.total_marks}</TableCell>
                      <TableCell>{new Date(q.created_at).toLocaleDateString()}</TableCell>
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

export default QuizCreator;
