import { Link } from 'react-router-dom';
import { Phone, MapPin } from 'lucide-react';
import logo from '@/assets/muslim-academy-logo.png';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Muslim Academy" className="h-10 w-10 rounded-full" />
              <span className="font-display text-lg font-bold">Muslim Academy</span>
            </div>
            <p className="text-sm text-background/70">
              Nurturing minds with modern education rooted in Islamic values. Building leaders of tomorrow.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/" className="hover:text-background transition-colors">Home</Link></li>
              <li><Link to="/curriculum" className="hover:text-background transition-colors">Curriculum</Link></li>
              <li><Link to="/gallery" className="hover:text-background transition-colors">Gallery</Link></li>
              <li><Link to="/contact" className="hover:text-background transition-colors">Contact</Link></li>
              <li><Link to="/login" className="hover:text-background transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Programs</h3>
            <ul className="space-y-2 text-sm text-background/70">
              <li>Primary Education</li>
              <li>Secondary Education</li>
              <li>Hifz Program</li>
              <li>STEM Education</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                Daulat Khan Road, Shahdara Road, Lahore
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                0333 4555645
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-background/20 pt-6 text-center text-sm text-background/50">
          © {new Date().getFullYear()} Muslim Academy. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
