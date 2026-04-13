import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Loader2, CheckCircle, XCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

const QuizAttempt = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentId, setStudentId] = useState('');
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; questions: any[]; answers: Record<string, string> } | null>(null);
  const [courseFilter, setCourseFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      setStudentId(s.id);
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', s.id);
      if (enrollments?.length) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data: coursesData } = await supabase.from('courses').select('id, name, class, section').in('id', courseIds);
        setCourses(coursesData || []);
        const { data: quizzesData } = await supabase.from('quizzes').select('*').in('course_id', courseIds);
        const { data: attempts } = await supabase.from('quiz_attempts').select('quiz_id, score').eq('student_id', s.id);
        setQuizzes((quizzesData || []).map(q => ({ ...q, attempt: (attempts || []).find(a => a.quiz_id === q.id) })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const startQuiz = async (quiz: any) => {
    if (quiz.attempt) { toast.error('You can only take each quiz once.'); return; }
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
    setQuestions(data || []);
    setActiveQuiz(quiz);
    setAnswers({});
    setAnswerFile(null);
    setResult(null);
  };

  const viewResults = async (quiz: any) => {
    const { data: questionsData } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
    const { data: attemptData } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quiz.id).eq('student_id', studentId).single();
    if (questionsData && attemptData) {
      const mcqAnswers = (attemptData.answers_json as any)?.mcq_answers || {};
      setResult({ score: attemptData.score || 0, total: quiz.total_marks, questions: questionsData, answers: mcqAnswers });
      setActiveQuiz(quiz);
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmitting(true);
    if (!Object.keys(answers).length && !answerFile) { toast.error('Answer at least one question or upload a theory file.'); setSubmitting(false); return; }

    const { data: existingAttempt } = await supabase.from('quiz_attempts').select('id, score').eq('quiz_id', activeQuiz.id).eq('student_id', studentId).maybeSingle();
    if (existingAttempt) { toast.error('This quiz has already been submitted.'); setSubmitting(false); return; }

    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.correct_answer) score += q.marks; });
    const total = questions.reduce((sum, q) => sum + q.marks, 0);

    let theoryFileUrl: string | null = null;
    if (answerFile) {
      const extension = answerFile.name.split('.').pop();
      const filePath = `student-answers/${user!.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('quiz-files').upload(filePath, answerFile);
      if (uploadError) { toast.error(uploadError.message); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('quiz-files').getPublicUrl(filePath);
      theoryFileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('quiz_attempts').insert({
      quiz_id: activeQuiz.id, student_id: studentId,
      answers_json: { mcq_answers: answers, theory_file_url: theoryFileUrl, theory_file_name: answerFile?.name || null },
      score, completed: true,
    });

    if (error) { toast.error(error.message); setSubmitting(false); return; }
    setQuizzes(prev => prev.map(quiz => quiz.id === activeQuiz.id ? { ...quiz, attempt: { quiz_id: quiz.id, score } } : quiz));
    setResult({ score, total, questions, answers });
    toast.success(total > 0 ? `Quiz completed! Score: ${score}/${total}` : 'Quiz submitted successfully.');
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  // Active quiz - answering
  if (activeQuiz && !result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">{activeQuiz.title}</h2>
          <Button variant="outline" onClick={() => setActiveQuiz(null)}>Back</Button>
        </div>
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="p-6">
              <p className="font-medium text-foreground mb-3">Q{i + 1}. {q.question} <span className="text-xs text-muted-foreground">({q.marks} marks)</span></p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(q.options_json as string[]).map((opt, oi) => (
                  <button key={oi}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${answers[q.id] === opt ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                    onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card className="border-dashed">
          <CardContent className="p-6 space-y-3">
            <div>
              <Label htmlFor="theory-file">Theory answer file (optional)</Label>
              <p className="text-sm text-muted-foreground">Upload a supporting answer file if your teacher has included a theory part.</p>
            </div>
            <div className="flex items-center gap-3">
              <Input id="theory-file" type="file" onChange={(e) => setAnswerFile(e.target.files?.[0] || null)} />
              {answerFile && <div className="flex items-center gap-1 text-sm text-muted-foreground"><FileText className="h-4 w-4" /><span className="max-w-[180px] truncate">{answerFile.name}</span></div>}
            </div>
          </CardContent>
        </Card>
        <Button className="w-full" onClick={submitQuiz} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Quiz
        </Button>
      </div>
    );
  }

  // Result view with correct/wrong answers
  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">Quiz Result</h2>
          <Button variant="outline" onClick={() => { setActiveQuiz(null); setResult(null); }}>Back to Quizzes</Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-5xl font-bold text-primary">{result.total > 0 ? `${result.score}/${result.total}` : 'Submitted'}</p>
            <p className="mt-2 text-muted-foreground">
              {result.total > 0 ? `${Math.round((result.score / result.total) * 100)}%` : 'Your quiz file has been uploaded for review.'}
            </p>
          </CardContent>
        </Card>
        {result.questions.map((q, i) => {
          const userAnswer = result.answers[q.id];
          const isCorrect = userAnswer === q.correct_answer;
          return (
            <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Q{i + 1}. {q.question}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {userAnswer && !isCorrect && (
                        <p className="text-red-600">Your answer: <span className="font-medium">{userAnswer}</span></p>
                      )}
                      <p className="text-green-700">Correct answer: <span className="font-medium">{q.correct_answer}</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  const filteredQuizzes = courseFilter === 'all' ? quizzes : quizzes.filter(q => q.course_id === courseFilter);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Quizzes</h2>

      {courses.length > 0 && (
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-56"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="All courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.class}-{c.section})</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {filteredQuizzes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No quizzes available</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map(q => (
            <Card key={q.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground">{q.title}</h3>
                <p className="text-sm text-muted-foreground">Total: {q.total_marks} marks</p>
                {q.attempt ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-secondary">{q.total_marks > 0 ? `Score: ${q.attempt.score}/${q.total_marks}` : 'Submitted once'}</p>
                    <Button className="mt-2" size="sm" variant="outline" onClick={() => viewResults(q)}>View Answers</Button>
                  </div>
                ) : (
                  <Button className="mt-3" size="sm" onClick={() => startQuiz(q)}>Start Quiz</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizAttempt;
