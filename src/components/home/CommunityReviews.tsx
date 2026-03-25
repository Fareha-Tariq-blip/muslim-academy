import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Quote, Star, Send, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

const CommunityReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'parent', content: '' });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase.from('reviews').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(6);
      setReviews(data || []);
    };
    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let imageUrl: string | null = null;

    if (file) {
      const ext = file.name.split('.').pop();
      const filePath = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('review-images').upload(filePath, file);
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('review-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await supabase.from('reviews').insert({
      name: form.name, role: form.role, content: form.content, image_url: imageUrl,
    });

    if (error) toast.error(error.message);
    else {
      toast.success('Thank you! Your review has been submitted for approval.');
      setDialogOpen(false);
      setForm({ name: '', role: 'parent', content: '' });
      setFile(null);
    }
    setSaving(false);
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Community</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            Reviews & <span className="text-primary">Stories</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Hear from our parents and students about their experiences at Muslim Academy
          </p>
        </div>

        {reviews.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
            {reviews.map(r => (
              <Card key={r.id} className="overflow-hidden">
                {r.image_url && (
                  <img src={r.image_url} alt="" className="w-full h-48 object-cover" />
                )}
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 text-primary/30 mb-2" />
                  <p className="text-foreground italic leading-relaxed text-sm">"{r.content}"</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{r.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{r.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground mb-10">
            No reviews yet. Be the first to share your experience!
          </div>
        )}

        <div className="text-center">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Send className="h-4 w-4" /> Share Your Experience
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Write a Review</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>You are a</Label>
                  <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="community member">Community Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Your Review</Label>
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Share your experience..." rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label>Photo (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="flex-1" />
                    {file && <ImagePlus className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Your review will be visible after admin approval.</p>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Review
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
};

export default CommunityReviews;
