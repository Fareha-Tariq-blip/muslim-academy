import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, MessageCircle, Trash2, ImagePlus, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author_name?: string;
  author_role?: string;
  likes_count?: number;
  liked_by_me?: boolean;
  replies?: Reply[];
  showReplies?: boolean;
  replyText?: string;
}
interface Reply {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name?: string;
}

interface Props {
  /** Path prefix for back links within dashboard (unused but kept for flexibility). */
  basePath?: string;
}

const CommunityPosts = ({ basePath }: Props) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!postsData) { setLoading(false); return; }

    const authorIds = Array.from(new Set(postsData.map(p => p.author_id)));
    const postIds = postsData.map(p => p.id);

    const [{ data: profiles }, { data: likes }, { data: replies }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, role').in('user_id', authorIds),
      postIds.length ? supabase.from('post_likes').select('*').in('post_id', postIds) : Promise.resolve({ data: [] as any[] }),
      postIds.length ? supabase.from('post_replies').select('*').in('post_id', postIds).order('created_at', { ascending: true }) : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const replyAuthorIds = Array.from(new Set((replies || []).map((r: any) => r.author_id)));
    let replyProfileMap = profileMap;
    const missing = replyAuthorIds.filter(id => !profileMap.has(id));
    if (missing.length) {
      const { data: moreProfiles } = await supabase.from('profiles').select('user_id, full_name, role').in('user_id', missing);
      replyProfileMap = new Map([...profileMap.entries(), ...((moreProfiles || []).map((p: any) => [p.user_id, p] as [any, any]))]);
    }

    const formatted: Post[] = postsData.map((p: any) => {
      const postLikes = (likes || []).filter((l: any) => l.post_id === p.id);
      const postReplies = (replies || [])
        .filter((r: any) => r.post_id === p.id)
        .map((r: any) => ({
          ...r,
          author_name: replyProfileMap.get(r.author_id)?.full_name || 'User',
        }));
      const profile = profileMap.get(p.author_id);
      return {
        ...p,
        author_name: profile?.full_name || 'User',
        author_role: profile?.role || 'member',
        likes_count: postLikes.length,
        liked_by_me: user ? postLikes.some((l: any) => l.user_id === user.id) : false,
        replies: postReplies,
        showReplies: false,
        replyText: '',
      };
    });

    setPosts(formatted);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); /* eslint-disable-next-line */ }, [user?.id]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please log in to post');
    if (!content.trim()) return toast.error('Write something first');
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (file) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('community-posts').upload(path, file);
      if (upErr) { toast.error('Image upload failed'); setSubmitting(false); return; }
      imageUrl = supabase.storage.from('community-posts').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('community_posts').insert({
      author_id: user.id, content: content.trim(), image_url: imageUrl,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success('Posted!');
    setContent(''); setFile(null);
    fetchPosts();
  };

  const toggleLike = async (post: Post) => {
    if (!user) return toast.error('Please log in');
    if (post.liked_by_me) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, liked_by_me: !p.liked_by_me, likes_count: (p.likes_count || 0) + (p.liked_by_me ? -1 : 1) }
        : p
    ));
  };

  const submitReply = async (post: Post) => {
    if (!user) return toast.error('Please log in');
    const text = (post.replyText || '').trim();
    if (!text) return;
    const { error } = await supabase.from('post_replies').insert({
      post_id: post.id, author_id: user.id, content: text,
    });
    if (error) return toast.error(error.message);
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('community_posts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    fetchPosts();
  };

  const deleteReply = async (id: string) => {
    await supabase.from('post_replies').delete().eq('id', id);
    fetchPosts();
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="font-display text-2xl font-bold text-foreground">Community</h2>

      {user ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handlePost} className="space-y-3">
              <Textarea
                placeholder="Share something with the community..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <ImagePlus className="h-4 w-4" />
                  <span>{file ? file.name : 'Add photo'}</span>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <div className="ml-auto">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Post
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="p-4 text-sm text-muted-foreground">Log in to share a post.</CardContent></Card>
      )}

      {loading ? (
        <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No posts yet. Be the first to share!</p>
      ) : (
        posts.map(post => (
          <Card key={post.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {post.author_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{post.author_name}</p>
                    <span className="text-xs text-muted-foreground capitalize">· {post.author_role}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                    {user?.id === post.author_id && (
                      <button onClick={() => deletePost(post.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground mt-2 whitespace-pre-wrap break-words">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="mt-3 rounded-lg max-h-96 w-full object-cover" loading="lazy" />
                  )}

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <button
                      onClick={() => toggleLike(post)}
                      className={`inline-flex items-center gap-1 transition-colors ${post.liked_by_me ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                    >
                      <Heart className={`h-4 w-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
                      <span>{post.likes_count || 0}</span>
                    </button>
                    <button
                      onClick={() => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, showReplies: !p.showReplies } : p))}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.replies?.length || 0}</span>
                    </button>
                  </div>

                  {post.showReplies && (
                    <div className="mt-3 border-t border-border pt-3 space-y-3">
                      {post.replies?.map(r => (
                        <div key={r.id} className="flex items-start gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-secondary/10 text-secondary text-xs font-semibold">
                              {r.author_name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground">{r.author_name}</p>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                              </span>
                              {user?.id === r.author_id && (
                                <button onClick={() => deleteReply(r.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">{r.content}</p>
                          </div>
                        </div>
                      ))}

                      {user && (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Write a reply..."
                            value={post.replyText || ''}
                            onChange={e => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, replyText: e.target.value } : p))}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitReply(post); } }}
                          />
                          <Button size="sm" onClick={() => submitReply(post)}>Reply</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default CommunityPosts;
