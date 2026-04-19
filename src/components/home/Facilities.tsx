import { Microscope, MonitorSmartphone, Library, Dumbbell } from 'lucide-react';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';

const facilities = [
  { icon: Microscope, title: 'Science Labs', desc: 'State-of-the-art physics, chemistry, and biology labs with modern equipment for hands-on experiments.' },
  { icon: MonitorSmartphone, title: 'Computer Lab', desc: 'Fully equipped computer lab with latest hardware and software for IT and programming classes.' },
  { icon: Library, title: 'Library', desc: 'Extensive collection of academic books, Islamic literature, and digital resources for research.' },
  { icon: Dumbbell, title: 'Sports Complex', desc: 'Indoor and outdoor sports facilities including cricket, football, basketball, and table tennis.' },
];

const Facilities = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.15, 'scale');
  const { ref: cardsRef, isVisible: cardsVisible, getItemClass, getItemDelay } = useStaggerAnimation();

  return (
    <section className="py-20 unified-section">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className={`text-center mb-12 transition-all duration-700 ${headerVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Campus</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            World-Class <span className="text-primary">Facilities</span>
          </h2>
        </div>

        <div ref={cardsRef} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {facilities.map((f, i) => (
            <div
              key={i}
              className={`group overflow-hidden rounded-xl border border-secondary/40 bg-gradient-to-br from-secondary/25 via-card/90 to-secondary/15 shadow-md transition-all hover:shadow-xl hover:-translate-y-1 ${getItemClass(i, i % 2 === 0 ? 'left' : 'right')}`}
              style={getItemDelay(i)}
            >
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-secondary/30 to-secondary/10 transition-colors group-hover:from-secondary/40 group-hover:to-secondary/20">
                <f.icon className="h-16 w-16 text-secondary transition-transform group-hover:scale-110" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-foreground/80">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Facilities;
