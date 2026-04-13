import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '@/components/layout/Footer';
import logo from '@/assets/muslim-academy-logo.png';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, profile, role, user } = useAuth();
  const navigate = useNavigate();

  const portalLabel = role === 'admin' ? 'Admin Dashboard' : role === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard';
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {/* Main header - dark navy */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(var(--navy))]">
          <div className="flex min-h-[80px] items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-[hsl(40,30%,96%)] hover:bg-white/10" />
              <Link to="/" className="flex items-center gap-3">
                <img src={logo} alt="Muslim Academy" className="h-12 w-12 rounded-full object-cover shadow-md" />
                <div className="hidden sm:block">
                  <span className="font-display text-xl font-bold text-[hsl(40,30%,96%)]">Muslim Academy</span>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(40,20%,80%)]">Excellence in Education</p>
                </div>
              </Link>
            </div>

            <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-[hsl(40,20%,85%)] lg:flex">
              <span className="font-medium text-[hsl(40,30%,96%)]">{portalLabel}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(174,55%,45%)]" />
              <span>Welcome, <span className="font-semibold text-[hsl(40,30%,96%)]">{displayName}</span></span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[hsl(40,20%,85%)] hover:bg-white/10 hover:text-[hsl(40,30%,96%)] text-sm font-medium">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto flex flex-col">
            {/* Sub-header with gradient */}
            <section className="border-b border-white/10 bg-gradient-to-r from-[hsl(var(--navy))] via-[hsl(var(--navy-light))] to-[hsl(var(--teal-dark))] px-6 py-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(174,55%,55%)]">Muslim Academy Portal</p>
                  <div>
                    <h1 className="font-display text-3xl font-bold text-[hsl(40,30%,96%)]">Assalamu Alaikum, {displayName}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-[hsl(40,20%,80%)]">
                      Continue your academy workflow in a dashboard styled to match the home page experience.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(174,55%,55%)]">Portal</p>
                    <p className="mt-1 font-display text-xl font-semibold text-[hsl(40,30%,96%)]">{portalLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(160,50%,50%)]">Status</p>
                    <p className="mt-1 text-sm font-medium text-[hsl(40,30%,96%)]">Signed in and ready to continue</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex-1 p-6 lg:p-8">
              {children}
            </div>

            <Footer />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
