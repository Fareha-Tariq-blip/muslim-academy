import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import academyImg from '@/assets/academy_img.jpeg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={academyImg} alt="Muslim Academy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[hsl(210,45%,12%)]/75" />
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-24">
        <div className="max-w-2xl animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent mb-6 border border-accent/30">
            <Sparkles className="h-3 w-3" />
            Excellence in Education Since 2008
          </span>
          <h1 className="font-display text-5xl font-extrabold leading-[1.1] text-[hsl(40,30%,96%)] md:text-7xl">
            Welcome to{' '}
            <span className="block text-accent">Muslim Academy</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-[hsl(40,20%,80%)] leading-relaxed">
            Learn better. Grow faster. Succeed with us
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/contact">
              <Button size="lg" className="h-13 px-8 shadow-lg bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base">
                Apply for Admission
              </Button>
            </Link>
            <Link to="/curriculum">
              <Button size="lg" variant="outline" className="h-13 px-8 shadow-lg border-[hsl(40,30%,96%)]/30 text-[hsl(40,30%,96%)] hover:bg-[hsl(40,30%,96%)]/10 font-semibold text-base bg-transparent">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
