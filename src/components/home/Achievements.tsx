import { useEffect, useRef, useState } from 'react';
import { Users, GraduationCap, BookOpen, Trophy } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const stats = [
  { icon: Users, value: 200, suffix: '+', label: 'Students' },
  { icon: GraduationCap, value: 15, suffix: '+', label: 'Teachers' },
  { icon: BookOpen, value: 18, suffix: '', label: 'Courses' },
  { icon: Trophy, value: 95, suffix: '%', label: 'Success Rate' },
];

const Counter = ({ end, suffix }: { end: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.ceil(end / 40);
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(current);
    }, 30);
    return () => clearInterval(timer);
  }, [started, end]);

  return <div ref={ref}>{count}{suffix}</div>;
};

const Achievements = () => {
  const { ref, isVisible } = useScrollAnimation(0.15, 'scale');

  return (
    <section className="py-20 bg-gradient-to-r from-[hsl(160,50%,32%)] via-[hsl(160,45%,28%)] to-[hsl(174,45%,30%)]" ref={ref}>
      <div className={`container mx-auto px-4 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-[hsl(40,30%,96%)] md:text-4xl">
            Our Achievements
          </h2>
          <p className="mt-3 text-[hsl(40,20%,82%)]">Numbers that speak for our commitment to excellence</p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={i} className={`text-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${i * 150}ms` }}>
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(40,30%,96%)]/15 backdrop-blur-sm animate-pulse-glow">
                <stat.icon className="h-8 w-8 text-[hsl(40,30%,96%)]" />
              </div>
              <div className="font-display text-4xl font-bold text-[hsl(40,30%,96%)]">
                <Counter end={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-1 text-sm text-[hsl(40,20%,82%)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievements;
