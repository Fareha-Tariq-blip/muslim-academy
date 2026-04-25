import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MessageSquare } from 'lucide-react';

const StudentRemarks = () => {
  const { user } = useAuth();
  const [remarks, setRemarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: s } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (!s) { setLoading(false); return; }
      const { data } = await supabase
        .from('remarks')
        .select('*')
        .eq('student_id', s.id)
        .order('created_at', { ascending: false });

      if (data && data.length) {
        const teacherIds = Array.from(new Set(data.map(r => r.teacher_id)));
        const { data: teachers } = await supabase
          .from('teachers')
          .select('id, user_id, subject')
          .in('id', teacherIds);

        const userIds = (teachers || []).map(t => t.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const teacherMap = new Map(
          (teachers || []).map(t => {
            const p = profiles?.find(p => p.user_id === t.user_id);
            return [t.id, { name: p?.full_name || 'Teacher', subject: t.subject }];
          })
        );

        setRemarks(data.map(r => ({
          ...r,
          teacher_name: teacherMap.get(r.teacher_id)?.name || 'Teacher',
          teacher_subject: teacherMap.get(r.teacher_id)?.subject || '—',
        })));
      } else {
        setRemarks([]);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Teacher Remarks</h2>
      {remarks.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No remarks yet</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {remarks.map(r => (
            <Card key={r.id}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                  <MessageSquare className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{r.teacher_name}</span>
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        {r.teacher_subject}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{r.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentRemarks;
