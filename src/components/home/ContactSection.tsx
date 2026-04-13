import { Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const ContactSection = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation(0.15, 'left');
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation(0.15, 'right');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name, email: form.email, message: form.message,
    });
    setLoading(false);
    if (error) {
      toast.error('Failed to send message. Please try again.');
    } else {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setForm({ name: '', email: '', message: '' });
    }
  };

  return (
    <section className="py-20 section-gradient-3" id="contact">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Get in Touch</span>
          <h2 className="font-display text-3xl font-bold text-foreground mt-2 md:text-4xl">
            Contact <span className="text-primary">Us</span>
          </h2>
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div ref={leftRef} className={`space-y-6 transition-all duration-700 ${leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Address</h3>
                <p className="text-sm text-muted-foreground">Daulat Khan Road, Shahdara Road, Lahore</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Phone</h3>
                <p className="text-sm text-muted-foreground">0333 4555645</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border shadow-sm h-64">
              <iframe
                title="Muslim Academy Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3399.5!2d74.38!3d31.63!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDM3JzQ4LjAiTiA3NMKwMjInNDguMCJF!5e0!3m2!1sen!2spk!4v1234567890"
                width="100%" height="100%" style={{ border: 0 }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div ref={rightRef} className={`transition-all duration-700 ${rightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Your Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
              <Input type="email" placeholder="Your Email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
              <Textarea placeholder="Your Message" value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={5} required />
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="mr-2 h-4 w-4" /> {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
