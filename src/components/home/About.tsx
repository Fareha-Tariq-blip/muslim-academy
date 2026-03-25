import { BookOpen, Heart, Users, Award } from 'lucide-react';
import academyImg from '@/assets/academy_img.jpeg';

const About = () => {
  const features = [
    { icon: BookOpen, title: 'Modern Curriculum', desc: 'Comprehensive education covering sciences, arts, and technology', color: 'bg-primary/10 text-primary' },
    { icon: Heart, title: 'Islamic Values', desc: 'Character building rooted in Quran and Sunnah teachings', color: 'bg-secondary/10 text-secondary' },
    { icon: Users, title: 'Expert Faculty', desc: 'Qualified teachers dedicated to student success', color: 'bg-accent/10 text-accent' },
    { icon: Award, title: 'Proven Results', desc: '95% success rate with top board exam performances', color: 'bg-primary/10 text-primary' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-card via-card to-secondary/5" id="about">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">About Us</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            Where Knowledge Meets <span className="text-primary">Faith</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Muslim Academy has been nurturing young minds since 2008, providing a balanced education that prepares students for both academic excellence and moral integrity.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 items-center mb-12">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img src={academyImg} alt="Muslim Academy Campus" className="w-full h-72 object-cover" />
          </div>
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-foreground">Muslim Girls High School & College</h3>
            <p className="text-muted-foreground leading-relaxed">
              Located on Daulat Khan Road, Shahdara, Lahore, Muslim Academy has been a beacon of quality education since 2008. We combine the best of modern academics with strong Islamic values, creating well-rounded students prepared for the challenges of tomorrow.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our dedicated faculty, state-of-the-art facilities, and nurturing environment ensure every student reaches their full potential.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group rounded-xl border bg-card p-6 text-center transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/30"
            >
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${f.color} transition-colors group-hover:bg-primary group-hover:text-primary-foreground`}>
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
