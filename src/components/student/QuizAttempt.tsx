import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const QuizAttempt = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      setStudentId(s.id);
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', s.id);
      if (enrollments?.length) {
        const courseIds = enrollments.map(e => e.course_id);
        const { data: quizzesData } = await supabase.from('quizzes').select('*').in('course_id', courseIds);
        const { data: attempts } = await supabase.from('quiz_attempts').select('quiz_id, score').eq('student_id', s.id);
        setQuizzes((quizzesData || []).map(q => ({ ...q, attempt: (attempts || []).find(a => a.quiz_id === q.id) })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const startQuiz = async (quiz: any) => {
    const { data } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quiz.id);
    setQuestions(data || []);
    setActiveQuiz(quiz);
    setAnswers({});
    setResult(null);
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    let score = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correct_answer) score += q.marks;
    });
    const total = questions.reduce((sum, q) => sum + q.marks, 0);

    await supabase.from('quiz_attempts').insert({
      quiz_id: activeQuiz.id, student_id: studentId, answers_json: answers, score, completed: true,
    });

    setResult({ score, total });
    toast.success(`Quiz completed! Score: ${score}/${total}`);
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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
                  <button
                    key={oi}
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
        <Button className="w-full" onClick={submitQuiz} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Quiz
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">Quiz Result</h2>
            <p className="text-5xl font-bold text-primary">{result.score}/{result.total}</p>
            <p className="mt-2 text-muted-foreground">{Math.round((result.score / result.total) * 100)}%</p>
            <Button className="mt-6" onClick={() => { setActiveQuiz(null); setResult(null); }}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Quizzes</h2>
      {quizzes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No quizzes available</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map(q => (
            <Card key={q.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground">{q.title}</h3>
                <p className="text-sm text-muted-foreground">Total: {q.total_marks} marks</p>
                {q.attempt ? (
                  <p className="mt-3 text-sm font-medium text-secondary">Score: {q.attempt.score}/{q.total_marks}</p>
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
