import { Microscope, MonitorSmartphone, Library, Dumbbell } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const facilities = [
  { icon: Microscope, title: 'Science Labs', desc: 'State-of-the-art physics, chemistry, and biology labs with modern equipment for hands-on experiments.' },
  { icon: MonitorSmartphone, title: 'Computer Lab', desc: 'Fully equipped computer lab with latest hardware and software for IT and programming classes.' },
  { icon: Library, title: 'Library', desc: 'Extensive collection of academic books, Islamic literature, and digital resources for research.' },
  { icon: Dumbbell, title: 'Sports Complex', desc: 'Indoor and outdoor sports facilities including cricket, football, basketball, and table tennis.' },
];

const Facilities = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" ref={ref}>
      <div className={`container mx-auto px-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Campus</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            World-Class <span className="text-primary">Facilities</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {facilities.map((f, i) => (
            <div
              key={i}
              className={`group overflow-hidden rounded-xl border border-accent/30 bg-accent/10 transition-all hover:shadow-xl hover:-translate-y-1 hover:bg-accent/20 duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100 + 200}ms` }}
            >
              <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 transition-colors group-hover:from-primary/10 group-hover:to-secondary/10">
                <f.icon className="h-16 w-16 text-primary/60 transition-transform group-hover:scale-110" />
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Facilities;
