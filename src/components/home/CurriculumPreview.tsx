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
    <section className="py-20 unified-section" id="curriculum">
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
              className={`group flex flex-col items-center gap-3 rounded-xl border-2 border-secondary/40 bg-gradient-to-br from-secondary/30 via-card/80 to-secondary/20 p-5 text-center shadow-md transition-all hover:shadow-xl hover:-translate-y-1 hover:border-secondary/70 hover:from-secondary/40 hover:to-secondary/30 cursor-pointer ${getItemClass(i)}`}
              style={getItemDelay(i)}
            >
              <div className="rounded-lg p-2 bg-secondary text-secondary-foreground transition-transform duration-300 group-hover:scale-110 shadow-md shadow-secondary/30">
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
