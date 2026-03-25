import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Login failed');
      return;
    }

    toast.success('Welcome back!');
    setTimeout(async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('profiles').select('role').eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '').single();
      if (data?.role) {
        navigate(`/dashboard/${data.role}`);
      } else {
        navigate('/dashboard/student');
      }
    }, 500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="mx-auto flex items-center gap-2 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <BookOpen className="h-7 w-7 text-primary-foreground" />
            </div>
          </Link>
          <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to Muslim Academy Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 shadow-md" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-muted/60 border border-border/50 p-3 text-xs text-muted-foreground">
            <p className="font-semibold mb-1 text-foreground">Demo Accounts:</p>
            <p>Admin: admin@muslimacademy.com / admin123</p>
            <p>Teacher: teacher1@muslimacademy.com / teacher123</p>
            <p>Student: student1@muslimacademy.com / student123</p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-primary hover:text-accent hover:underline transition-colors">← Back to Home</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
