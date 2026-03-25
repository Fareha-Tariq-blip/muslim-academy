import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Star } from 'lucide-react';
import academyImg from '@/assets/academy_img.jpeg';
import logo from '@/assets/muslim-academy-logo.png';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Academy background image with blur */}
      <div className="absolute inset-0">
        <img src={academyImg} alt="Muslim Academy Building" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-foreground/60 to-primary/40 backdrop-blur-sm" />
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 animate-float opacity-20">
        <GraduationCap className="h-16 w-16 text-accent" />
      </div>
      <div className="absolute top-40 right-20 animate-float opacity-15" style={{ animationDelay: '2s' }}>
        <BookOpen className="h-12 w-12 text-secondary" />
      </div>
      <div className="absolute bottom-40 left-1/4 animate-float opacity-10" style={{ animationDelay: '4s' }}>
        <Star className="h-10 w-10 text-accent" />
      </div>

      {/* Paper airplane */}
      <div className="absolute top-1/2 animate-fly-across pointer-events-none">
        <svg viewBox="0 0 24 24" className="h-8 w-8 text-accent/40 fill-current" style={{ transform: 'rotate(-30deg)' }}>
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-block rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-6">
              Excellence in Education Since 2008
            </span>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-white md:text-6xl">
              Nurturing Minds,{' '}
              <span className="text-accent">Building</span>{' '}
              <span className="text-secondary">Futures</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/80 leading-relaxed">
              A premier institution combining modern education with Islamic values. Empowering students with knowledge, character, and a strong foundation for success.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/curriculum">
                <Button size="lg" className="shadow-lg shadow-primary/25 bg-accent text-accent-foreground hover:bg-accent/90">
                  Explore Curriculum
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" className="shadow-lg shadow-accent/25 bg-accent text-accent-foreground hover:bg-accent/90">
                  Student Portal
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative animate-slide-up hidden md:block">
            <div className="relative mx-auto h-80 w-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/30 to-secondary/30 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <div className="text-center space-y-3">
                  <img src={logo} alt="Muslim Academy Logo" className="h-24 w-24 mx-auto rounded-full" />
                  <p className="font-display text-2xl font-bold text-white">Since 2008</p>
                  <p className="text-sm text-white/70">15+ Years of Excellence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
