import {
  BookOpen, Calculator, Globe, Palette, Dumbbell,
  Code, BookMarked, FlaskConical, Landmark, Languages,
  Lightbulb, MonitorSmartphone, Atom, Leaf
} from 'lucide-react';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';

const subjects = [
  { name: 'Urdu', icon: BookMarked },
  { name: 'English', icon: Languages },
  { name: 'Mathematics', icon: Calculator },
  { name: 'Islamiyat', icon: BookOpen },
  { name: 'Science', icon: FlaskConical },
  { name: 'Physics', icon: Atom },
  { name: 'Chemistry', icon: FlaskConical },
  { name: 'Biology', icon: Leaf },
  { name: 'Computer Science', icon: Code },
  { name: 'Social Studies', icon: Globe },
  { name: 'Pakistan Studies', icon: Landmark },
  { name: 'Art & Design', icon: Palette },
  { name: 'Physical Ed.', icon: Dumbbell },
  { name: 'Nazra Quran', icon: Lightbulb },
  { name: 'IT Skills', icon: MonitorSmartphone },
];

const CurriculumPreview = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.15, 'fade');
  const { ref: gridRef, isVisible: gridVisible, getItemClass, getItemDelay } = useStaggerAnimation();

  return (
    <section className="py-20 bg-gradient-to-b from-accent/15 via-secondary/10 to-primary/15" id="curriculum">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className={`text-center mb-12 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Our Subjects</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            Comprehensive <span className="text-primary">Curriculum</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A well-rounded education covering 15+ subjects from core sciences to Islamic studies and modern technology.
          </p>
        </div>

        <div ref={gridRef} className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {subjects.map((subject, i) => (
            <div
              key={i}
              className={`group flex flex-col items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-5 text-center transition-all hover:shadow-lg hover:-translate-y-2 hover:bg-accent/20 cursor-pointer ${getItemClass(i, i % 2 === 0 ? 'left' : 'right')}`}
              style={getItemDelay(i)}
            >
              <div className="rounded-lg p-2 bg-accent text-accent-foreground transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">
                <subject.icon className="h-8 w-8" />
              </div>
              <span className="text-sm font-medium text-foreground">{subject.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CurriculumPreview;
