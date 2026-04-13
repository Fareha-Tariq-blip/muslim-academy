import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const testimonials = [
  { name: 'Ahmed Khan', role: 'Parent', text: 'Muslim Academy has transformed my son\'s approach to education. The balance of academic rigor and Islamic values is exactly what we were looking for.' },
  { name: 'Fatima Zahra', role: 'Student, Class 10', text: 'The teachers here are incredibly supportive. I\'ve improved my grades significantly and also developed a deeper understanding of my faith.' },
  { name: 'Dr. Hassan Ali', role: 'Parent', text: 'The STEM program is outstanding. My daughter\'s passion for science was nurtured here, and she\'s now aiming for a career in medicine.' },
  { name: 'Aisha Siddiqui', role: 'Student, Class 8', text: 'I love the computer science classes and the Quran recitation program. Muslim Academy helped me grow in every way.' },
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);
  const { ref, isVisible } = useScrollAnimation(0.15, 'scale');

  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const t = testimonials[current];

  return (
    <section className="py-20 section-gradient-2" ref={ref}>
      <div className={`container mx-auto px-4 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="text-center mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Testimonials</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            What People <span className="text-primary">Say</span>
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="relative rounded-2xl border border-primary/20 bg-card/80 p-8 text-center shadow-lg">
            <Quote className="mx-auto mb-4 h-10 w-10 text-primary/30" />
            <p className="text-lg text-foreground italic leading-relaxed">"{t.text}"</p>
            <div className="mt-6">
              <p className="font-display font-semibold text-foreground">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <div key={i} className={`h-2 w-2 rounded-full transition-colors ${i === current ? 'bg-primary' : 'bg-muted'}`} />
                ))}
              </div>
              <Button variant="outline" size="icon" onClick={next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
