import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Camera } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  created_at: string;
}

const Gallery = () => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
      if (data) setImages(data as GalleryItem[]);
    };
    fetch();
  }, []);

  const categories = ['all', ...new Set(images.map(i => i.category))];
  const filtered = filter === 'all' ? images : images.filter(i => i.category === filter);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold uppercase tracking-wider text-secondary">Our Gallery</span>
            <h1 className="font-display text-4xl font-bold text-foreground mt-2 md:text-5xl">
              Academy <span className="text-primary">Gallery</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Glimpses of life at Muslim Academy — our classrooms, events, students, and campus.
            </p>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={filter === cat ? 'default' : 'outline'}
                  className="cursor-pointer capitalize"
                  onClick={() => setFilter(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Camera className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No gallery images yet. Check back soon!</p>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {filtered.map(img => (
                <div
                  key={img.id}
                  className="group relative overflow-hidden rounded-xl cursor-pointer break-inside-avoid"
                  onClick={() => setSelected(img)}
                >
                  <img
                    src={img.image_url}
                    alt={img.title}
                    className="w-full rounded-xl transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-end p-4">
                    <div>
                      <p className="text-white font-semibold text-sm">{img.title}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px] capitalize">{img.category}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl p-2">
          {selected && (
            <div>
              <img src={selected.image_url} alt={selected.title} className="w-full rounded-lg" />
              <div className="p-4">
                <h3 className="font-display text-lg font-bold">{selected.title}</h3>
                {selected.description && <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Gallery;
