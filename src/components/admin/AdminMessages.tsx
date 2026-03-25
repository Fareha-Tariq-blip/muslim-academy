import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  created_at: string;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const fetch = async () => {
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (data) setMessages(data as Message[]);
  };

  useEffect(() => { fetch(); }, []);

  const markRead = async (id: string) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', id);
    fetch();
  };

  const deleteMsg = async (id: string) => {
    await supabase.from('contact_messages').delete().eq('id', id);
    toast.success('Message deleted');
    fetch();
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Contact Messages</h2>
        {unreadCount > 0 && <Badge variant="destructive">{unreadCount} unread</Badge>}
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-20">
          <Mail className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <Card key={msg.id} className={`transition-colors ${!msg.read ? 'border-primary/40 bg-primary/5' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.read ? <Mail className="h-4 w-4 text-primary" /> : <MailOpen className="h-4 w-4 text-muted-foreground" />}
                      <span className="font-semibold text-foreground">{msg.name}</span>
                      <span className="text-xs text-muted-foreground">{msg.email}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{format(new Date(msg.created_at), 'PPp')}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!msg.read && (
                      <Button size="sm" variant="outline" onClick={() => markRead(msg.id)}>Mark Read</Button>
                    )}
                    <Button size="icon" variant="destructive" onClick={() => deleteMsg(msg.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
