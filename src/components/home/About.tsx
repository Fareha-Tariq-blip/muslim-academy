import { BookOpen, Heart, Users, Award } from 'lucide-react';
import academyImg from '@/assets/academy_img.jpeg';
import { useScrollAnimation, useStaggerAnimation } from '@/hooks/useScrollAnimation';

const About = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation(0.15, 'fade');
  const { ref: imgRef, isVisible: imgVisible } = useScrollAnimation(0.15, 'left');
  const { ref: textRef, isVisible: textVisible } = useScrollAnimation(0.15, 'right');
  const { ref: cardsRef, isVisible: cardsVisible, getItemClass, getItemDelay } = useStaggerAnimation();

  const features = [
    { icon: BookOpen, title: 'Modern Curriculum', desc: 'Comprehensive education covering sciences, arts, and technology' },
    { icon: Heart, title: 'Islamic Values', desc: 'Character building rooted in Quran and Sunnah teachings' },
    { icon: Users, title: 'Expert Faculty', desc: 'Qualified teachers dedicated to student success' },
    { icon: Award, title: 'Proven Results', desc: '95% success rate with top board exam performances' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-secondary/15 via-accent/10 to-primary/15" id="about">
      <div className="container mx-auto px-4">
        <div ref={headerRef} className={`text-center mb-12 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">About Us</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            Where Knowledge Meets <span className="text-primary">Faith</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Muslim Academy has been nurturing young minds since 2008, providing a balanced education that prepares students for both academic excellence and moral integrity.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 items-center mb-12">
          <div ref={imgRef} className={`rounded-2xl overflow-hidden shadow-xl transition-all duration-700 ${imgVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-16'}`}>
            <img src={academyImg} alt="Muslim Academy Campus" className="w-full h-72 object-cover" />
          </div>
          <div ref={textRef} className={`space-y-4 transition-all duration-700 ${textVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-16'}`}>
            <h3 className="font-display text-2xl font-bold text-foreground">Muslim Girls High School & College</h3>
            <p className="text-muted-foreground leading-relaxed">
              Located on Daulat Khan Road, Shahdara, Lahore, Muslim Academy has been a beacon of quality education since 2008. We combine the best of modern academics with strong Islamic values, creating well-rounded students prepared for the challenges of tomorrow.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our dedicated faculty, state-of-the-art facilities, and nurturing environment ensure every student reaches their full potential.
            </p>
          </div>
        </div>

        <div ref={cardsRef} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group rounded-xl border border-accent/30 bg-accent/10 p-6 text-center transition-all hover:shadow-xl hover:-translate-y-1 hover:bg-accent/20 ${getItemClass(i, i % 2 === 0 ? 'left' : 'right')}`}
              style={getItemDelay(i)}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:scale-110 animate-pulse-glow">
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
