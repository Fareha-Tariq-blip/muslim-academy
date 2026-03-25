import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import About from '@/components/home/About';
import CurriculumPreview from '@/components/home/CurriculumPreview';
import Achievements from '@/components/home/Achievements';
import Facilities from '@/components/home/Facilities';
import Testimonials from '@/components/home/Testimonials';
import CommunityReviews from '@/components/home/CommunityReviews';
import ContactSection from '@/components/home/ContactSection';
import { useEffect, useState } from 'react';

const Index = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <Header />
      <Hero />
      <About />
      <CurriculumPreview />
      <Achievements />
      <Facilities />
      <Testimonials />
      <CommunityReviews />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
