import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  BookOpen, Calculator, Globe, Microscope, Palette, Dumbbell,
  Code, BookMarked, FlaskConical, Landmark, Languages,
  Lightbulb, MonitorSmartphone, Atom, Leaf
} from 'lucide-react';
import { useStaggerAnimation } from '@/hooks/useScrollAnimation';

const subjects = [
  { name: 'Urdu', icon: BookMarked, desc: 'Language skills, grammar, literature, and creative writing in the national language.' },
  { name: 'English', icon: Languages, desc: 'Comprehensive English language program covering reading, writing, grammar, and communication.' },
  { name: 'Mathematics', icon: Calculator, desc: 'From basic arithmetic to advanced algebra, geometry, and statistics.' },
  { name: 'Islamiyat', icon: BookOpen, desc: 'Islamic studies including Quran, Hadith, Fiqh, and Islamic history.' },
  { name: 'General Science', icon: FlaskConical, desc: 'Foundation of scientific principles covering physics, chemistry, and biology basics.' },
  { name: 'Physics', icon: Atom, desc: 'Mechanics, optics, electricity, and modern physics with lab experiments.' },
  { name: 'Chemistry', icon: Microscope, desc: 'Organic, inorganic, and physical chemistry with practical lab sessions.' },
  { name: 'Biology', icon: Leaf, desc: 'Botany, zoology, human anatomy, and ecology with dissection practicals.' },
  { name: 'Computer Science', icon: Code, desc: 'Programming, algorithms, databases, and web development fundamentals.' },
  { name: 'Social Studies', icon: Globe, desc: 'Geography, civics, economics, and current world affairs.' },
  { name: 'Pakistan Studies', icon: Landmark, desc: 'History of Pakistan, political geography, and cultural heritage.' },
  { name: 'Art & Design', icon: Palette, desc: 'Visual arts, graphic design, calligraphy, and creative expression.' },
  { name: 'Physical Education', icon: Dumbbell, desc: 'Sports, fitness, health education, and team building activities.' },
  { name: 'Nazra Quran', icon: Lightbulb, desc: 'Quran recitation with Tajweed rules and memorization (Hifz) program.' },
  { name: 'IT Skills', icon: MonitorSmartphone, desc: 'Digital literacy, office applications, internet safety, and basic networking.' },
];

const Curriculum = () => {
  const { ref, isVisible, getItemClass, getItemDelay } = useStaggerAnimation();

  return (
    <div className="min-h-screen">
      <Header />
      {/* Page header banner */}
      <div className="page-header-banner pt-24 pb-12">
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold text-[hsl(40,30%,96%)] md:text-5xl">
            Our <span className="text-[hsl(174,55%,55%)]">Curriculum</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[hsl(40,20%,80%)]">
            A comprehensive education covering 15+ subjects designed to prepare students for academic excellence and personal growth.
          </p>
        </div>
      </div>

      <div className="py-12">
        <div className="container mx-auto px-4">
          <div ref={ref} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s, i) => (
              <div
                key={i}
                className={`group rounded-xl border border-accent/30 bg-accent/10 p-6 transition-all hover:shadow-xl hover:bg-accent/20 ${getItemClass(i, i % 2 === 0 ? 'left' : 'right')}`}
                style={getItemDelay(i)}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:scale-110">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{s.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Curriculum;
