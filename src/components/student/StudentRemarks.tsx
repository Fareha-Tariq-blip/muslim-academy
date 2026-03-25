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
      const { data } = await supabase.from('remarks').select('*').eq('student_id', s.id).order('created_at', { ascending: false });
      setRemarks(data || []);
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
                <div>
                  <p className="text-sm text-foreground">{r.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
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
