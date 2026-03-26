import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Mail } from 'lucide-react';
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
      const { data } = await supabase.from('profiles').select('role').eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '').maybeSingle();
      if (data?.role) {
        navigate(`/dashboard/${data.role}`);
      } else {
        navigate('/dashboard/student');
      }
    }, 500);
  };

  const fillDemo = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Dark branded panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[hsl(210,45%,12%)] relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
        <div className="relative z-10 text-center max-w-md">
          <h1 className="font-display text-5xl font-bold text-[hsl(40,30%,96%)] leading-tight">
            Welcome to<br />
            <span className="text-accent">Muslim Academy</span>
          </h1>
          <p className="mt-6 text-lg text-[hsl(40,20%,75%)] leading-relaxed">
            Learn better. Grow faster. Succeed with us.
          </p>
          <div className="mt-10 flex justify-center gap-8 text-[hsl(40,20%,65%)]">
            <div>
              <p className="text-3xl font-bold text-accent font-display">200+</p>
              <p className="text-sm mt-1">Students</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary font-display">15+</p>
              <p className="text-sm mt-1">Teachers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary font-display">18+</p>
              <p className="text-sm mt-1">Courses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-xl border-border/30">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-3xl">Sign In</CardTitle>
            <CardDescription className="mt-1">Access your Muslim Academy Portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 shadow-md font-semibold text-sm" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 rounded-xl bg-muted/50 border border-border/30 p-4">
              <p className="font-semibold text-sm text-foreground mb-3">Quick Login</p>
              <div className="grid gap-2">
                {[
                  { label: 'Admin', email: 'admin@muslimacademy.com', password: 'admin123', color: 'bg-primary/10 hover:bg-primary/20 text-primary border-primary/20' },
                  { label: 'Teacher', email: 'teacher1@muslimacademy.com', password: 'teacher123', color: 'bg-secondary/10 hover:bg-secondary/20 text-secondary border-secondary/20' },
                  { label: 'Student', email: 'student1@muslimacademy.com', password: 'student123', color: 'bg-accent/10 hover:bg-accent/20 text-accent border-accent/20' },
                ].map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => fillDemo(demo.email, demo.password)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${demo.color}`}
                  >
                    Login as {demo.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">← Back to Home</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
