import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import logo from '@/assets/muslim-academy-logo.png';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/curriculum', label: 'Curriculum' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/community', label: 'Community' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[hsl(210,45%,12%)]/95 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-[hsl(210,45%,12%)]/80 backdrop-blur-sm'}`}>
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Muslim Academy" className="h-10 w-10 rounded-full object-cover shadow-md" />
          <div>
            <h1 className={`font-display text-lg font-bold leading-tight ${isScrolled ? 'text-foreground' : 'text-[hsl(40,30%,96%)]'}`}>Muslim Academy</h1>
            <p className={`text-[10px] leading-none ${isScrolled ? 'text-muted-foreground' : 'text-[hsl(40,20%,80%)]'}`}>Excellence in Education</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-accent/15 ${location.pathname === link.to ? 'text-accent font-semibold bg-accent/10' : 'text-[hsl(40,30%,96%)] hover:text-accent'}`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/login">
            <Button size="sm" className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">Login</Button>
          </Link>
        </nav>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6 text-[hsl(40,30%,96%)]" /> : <Menu className="h-6 w-6 text-[hsl(40,30%,96%)]" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-card/95 backdrop-blur-md md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent ${location.pathname === link.to ? 'text-accent font-semibold bg-accent/10' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button size="sm" className="mt-2 w-full">Login</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
