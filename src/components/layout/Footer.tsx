import { Link } from 'react-router-dom';
import { Phone, MapPin, Heart } from 'lucide-react';
import logo from '@/assets/muslim-academy-logo.png';

const Footer = () => {
  return (
    <footer className="bg-[hsl(210,45%,12%)] text-[hsl(40,20%,88%)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src={logo} alt="Muslim Academy" className="h-10 w-10 rounded-full shadow-md" />
              <span className="font-display text-lg font-bold text-[hsl(40,30%,96%)]">Muslim Academy</span>
            </div>
            <p className="text-sm text-[hsl(40,20%,70%)]">
              Nurturing minds with modern education rooted in Islamic values. Building leaders of tomorrow.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-[hsl(40,30%,96%)]">Quick Links</h3>
            <ul className="space-y-2 text-sm text-[hsl(40,20%,70%)]">
              <li><Link to="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link to="/curriculum" className="hover:text-accent transition-colors">Curriculum</Link></li>
              <li><Link to="/gallery" className="hover:text-accent transition-colors">Gallery</Link></li>
              <li><Link to="/community" className="hover:text-accent transition-colors">Community</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
              <li><Link to="/login" className="hover:text-accent transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-[hsl(40,30%,96%)]">Programs</h3>
            <ul className="space-y-2 text-sm text-[hsl(40,20%,70%)]">
              <li>Primary Education</li>
              <li>Secondary Education</li>
              <li>Hifz Program</li>
              <li>STEM Education</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg font-semibold mb-4 text-[hsl(40,30%,96%)]">Contact Info</h3>
            <ul className="space-y-3 text-sm text-[hsl(40,20%,70%)]">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-accent" />
                Daulat Khan Road, Shahdara Road, Lahore
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-accent" />
                0333 4555645
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[hsl(210,35%,22%)] pt-6 text-center text-sm text-[hsl(40,20%,55%)]">
          <p className="flex items-center justify-center gap-1">
            © {new Date().getFullYear()} Muslim Academy. Made with <Heart className="h-3 w-3 text-destructive fill-destructive" /> All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
