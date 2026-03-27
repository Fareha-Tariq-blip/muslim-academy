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
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        {/* Dashboard Header matching home page style */}
        <header className="h-14 flex items-center justify-between bg-[hsl(210,45%,12%)] px-4 sticky top-0 z-50 border-b border-white/10">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-[hsl(40,30%,96%)] hover:text-accent" />
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Muslim Academy" className="h-8 w-8 rounded-full object-cover" />
              <span className="font-display text-sm font-bold text-[hsl(40,30%,96%)] hidden sm:inline">Muslim Academy</span>
            </Link>
            <span className="text-sm text-[hsl(40,20%,70%)] hidden md:inline">
              — Welcome, <span className="font-semibold text-[hsl(40,30%,96%)]">{profile?.full_name || 'User'}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-[hsl(40,20%,70%)] hover:text-accent transition-colors hidden sm:inline">Home</Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[hsl(40,20%,70%)] hover:text-red-400 hover:bg-white/10">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>

        <div className="flex flex-1">
          <DashboardSidebar />
          <main className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </main>
        </div>

        <Footer />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
