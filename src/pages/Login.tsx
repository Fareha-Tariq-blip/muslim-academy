import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Loader2, GraduationCap, Users, Award, Clock } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import campusImg from '@/assets/academy-campus.jpg';
import { supabase } from '@/integrations/supabase/client';

const stats = [
  { icon: Clock, value: '15+', label: 'Years of Experience' },
  { icon: Users, value: '200+', label: 'Students' },
  { icon: BookOpen, value: '18+', label: 'Professional Courses' },
  { icon: Award, value: '95%', label: 'Success Rate' },
];

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
    if (error) {
      toast.error(error.message || 'Login failed');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    // Fetch role directly and navigate
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
      const role = data?.role || 'student';
      navigate(`/dashboard/${role}`, { replace: true });
    } else {
      navigate('/dashboard/student', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-10 lg:grid-cols-2 items-start">
            {/* Left: Login Form */}
            <div className="flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
                  Welcome to <span className="text-primary">Muslim Academy</span> Portal
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Sign in to access your dashboard, courses, grades, and more.
                </p>
              </div>

              <Card className="shadow-xl border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-xl">Sign In</CardTitle>
                      <CardDescription>Access your academy portal</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@muslimacademy.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
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
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 shadow-md text-base font-semibold" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>

                  <div className="mt-5 rounded-lg bg-accent/10 border border-accent/30 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold mb-1 text-foreground">Demo Accounts:</p>
                    <p>Admin: admin@muslimacademy.com / admin123</p>
                    <p>Teacher: teacher1@muslimacademy.com / teacher123</p>
                    <p>Student: student1@muslimacademy.com / student123</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Academy image + info */}
            <div className="space-y-6">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border/30">
                <img src={campusImg} alt="Muslim Academy Campus" className="w-full h-64 md:h-80 object-cover" loading="lazy" width={960} height={1080} />
              </div>

              <div className="rounded-xl bg-accent/10 border border-accent/30 p-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-1">Muslim Girls High School & College</h3>
                <p className="text-sm text-primary font-semibold mb-2">Affiliated with BISE Lahore</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Empowering young minds with quality education rooted in Islamic values since 2008. Building confident, knowledgeable leaders for tomorrow.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="rounded-xl bg-primary/10 border border-primary/20 p-4 text-center transition-all hover:shadow-md hover:bg-primary/15">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
