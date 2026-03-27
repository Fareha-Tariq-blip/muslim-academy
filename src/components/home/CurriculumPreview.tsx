import {
  BookOpen, Calculator, Globe, Microscope, Palette, Dumbbell,
  Code, BookMarked, FlaskConical, Landmark, Languages,
  Lightbulb, MonitorSmartphone, Atom, Leaf
} from 'lucide-react';

const subjects = [
  { name: 'Urdu', icon: BookMarked, color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'English', icon: Languages, color: 'text-secondary', bg: 'bg-secondary/10' },
  { name: 'Mathematics', icon: Calculator, color: 'text-accent', bg: 'bg-accent/10' },
  { name: 'Islamiyat', icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'Science', icon: FlaskConical, color: 'text-secondary', bg: 'bg-secondary/10' },
  { name: 'Physics', icon: Atom, color: 'text-accent', bg: 'bg-accent/10' },
  { name: 'Chemistry', icon: FlaskConical, color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'Biology', icon: Leaf, color: 'text-secondary', bg: 'bg-secondary/10' },
  { name: 'Computer Science', icon: Code, color: 'text-accent', bg: 'bg-accent/10' },
  { name: 'Social Studies', icon: Globe, color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'Pakistan Studies', icon: Landmark, color: 'text-secondary', bg: 'bg-secondary/10' },
  { name: 'Art & Design', icon: Palette, color: 'text-accent', bg: 'bg-accent/10' },
  { name: 'Physical Ed.', icon: Dumbbell, color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'Nazra Quran', icon: Lightbulb, color: 'text-secondary', bg: 'bg-secondary/10' },
  { name: 'IT Skills', icon: MonitorSmartphone, color: 'text-accent', bg: 'bg-accent/10' },
];

const CurriculumPreview = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-accent/10 via-secondary/5 to-primary/10" id="curriculum">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Our Subjects</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            Comprehensive <span className="text-primary">Curriculum</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A well-rounded education covering 15+ subjects from core sciences to Islamic studies and modern technology.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {subjects.map((subject, i) => (
            <div
              key={i}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-2 hover:border-primary/40 cursor-pointer"
            >
              <div className={`rounded-lg p-2 ${subject.bg} transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12`}>
                <subject.icon className={`h-8 w-8 ${subject.color}`} />
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
