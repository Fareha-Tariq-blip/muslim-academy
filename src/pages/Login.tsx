import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpen, Loader2, GraduationCap, Users, Award, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import campusImg from '@/assets/academy-campus.jpg';


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
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loginSuccess, setLoginSuccess] = useState(false);

  // After login, wait for AuthContext to resolve the role, then navigate
  useEffect(() => {
    if (loginSuccess && !authLoading && user && role) {
      navigate(`/dashboard/${role}`, { replace: true });
      setLoginSuccess(false);
    }
  }, [loginSuccess, authLoading, user, role, navigate]);

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
    setLoginSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 shadow-2xl backdrop-blur-xl">
            <div className="grid lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
              <div className="section-gradient-1 p-6 md:p-10 lg:p-12">
                <div className="mb-8 space-y-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Student & Staff Login
                  </span>
                  <div className="space-y-3">
                    <h2 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl">
                      Welcome back to the Muslim Academy portal.
                    </h2>
                    <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                      Securely access classes, attendance, grades, quizzes, and academy updates in one place.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-sm">
                      <ShieldCheck className="h-4 w-4 text-secondary" /> Protected access
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-sm">
                      <GraduationCap className="h-4 w-4 text-accent" /> Role-based dashboards
                    </span>
                  </div>
                </div>

                <Card className="glass-card border-border/60 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="font-display text-xl">Sign In</CardTitle>
                        <CardDescription>Use your academy email to continue</CardDescription>
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
                          className="h-11 bg-background/80"
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
                          className="h-11 bg-background/80"
                        />
                      </div>
                      <Button type="submit" className="h-11 w-full text-base font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        Continue to Dashboard
                      </Button>
                    </form>
 
                    <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 p-4 text-xs text-muted-foreground">
                      <p className="mb-2 font-semibold text-foreground">Demo Accounts</p>
                      <div className="space-y-1.5">
                        <p>Admin: admin@muslimacademy.com / admin123</p>
                        <p>Teacher: teacher1@muslimacademy.com / teacher123</p>
                        <p>Student: student1@muslimacademy.com / student123</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="relative min-h-[420px] overflow-hidden bg-[hsl(var(--sidebar-background))] lg:min-h-full">
                <img
                  src={campusImg}
                  alt="Muslim Academy campus and classroom environment"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  width={960}
                  height={1080}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sidebar-background))]/90 via-[hsl(var(--sidebar-background))]/68 to-[hsl(var(--accent))]/38" />

                <div className="relative flex h-full flex-col justify-between gap-10 p-6 text-[hsl(var(--sidebar-foreground))] md:p-10">
                  <div className="max-w-xl space-y-4 pt-6">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sidebar-foreground))] backdrop-blur-sm">
                      <BookOpen className="h-3.5 w-3.5 text-accent" />
                      Premium Education Since 2008
                    </span>
                    <div className="space-y-3">
                      <h3 className="font-display text-4xl font-bold leading-tight md:text-5xl">
                        Muslim Girls High School & College
                      </h3>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                        Affiliated with BISE Lahore
                      </p>
                      <p className="max-w-lg text-base leading-relaxed text-[hsl(var(--sidebar-foreground))]/82 md:text-lg">
                        Where academic excellence, discipline, and Islamic values come together to prepare confident leaders for tomorrow.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {stats.map((stat, i) => (
                      <div key={i} className="rounded-2xl border border-white/12 bg-white/10 p-4 shadow-lg backdrop-blur-md transition-transform duration-300 hover:-translate-y-1">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <p className="font-display text-3xl font-bold text-[hsl(var(--sidebar-foreground))]">{stat.value}</p>
                        <p className="mt-1 text-sm text-[hsl(var(--sidebar-foreground))]/72">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
