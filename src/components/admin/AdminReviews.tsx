import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const visible = statusFilter === 'all' ? reviews : statusFilter === 'approved' ? reviews.filter(r => r.approved) : reviews.filter(r => !r.approved);

  const approve = async (id: string) => {
    await supabase.from('reviews').update({ approved: true }).eq('id', id);
    toast.success('Review approved');
    fetchReviews();
  };

  const reject = async (id: string) => {
    await supabase.from('reviews').update({ approved: false }).eq('id', id);
    toast.success('Review rejected');
    fetchReviews();
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    toast.success('Review deleted');
    fetchReviews();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-2xl font-bold text-foreground">Community Reviews</h2>
        <div className="flex gap-2">
          {(['all','pending','approved'] as const).map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="max-w-[300px]">Content</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reviews</TableCell></TableRow>
                ) : (
                  visible.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="capitalize">{r.role}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{r.content}</TableCell>
                      <TableCell>
                        {r.image_url ? (
                          <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">View</a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.approved ? 'default' : 'secondary'}>
                          {r.approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {!r.approved && (
                          <Button variant="ghost" size="icon" onClick={() => approve(r.id)} title="Approve">
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {r.approved && (
                          <Button variant="ghost" size="icon" onClick={() => reject(r.id)} title="Reject">
                            <X className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteReview(r.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
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

export default AdminReviews;
