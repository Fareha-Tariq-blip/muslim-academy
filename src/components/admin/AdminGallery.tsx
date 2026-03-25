import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  created_at: string;
}

const categories = ['campus', 'classrooms', 'events', 'students', 'sports', 'general'];

const AdminGallery = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
    if (data) setImages(data as GalleryItem[]);
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return toast.error('Title and image are required');
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('gallery').upload(path, file);
    if (uploadErr) { setUploading(false); return toast.error('Upload failed: ' + uploadErr.message); }

    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);

    const { error } = await supabase.from('gallery').insert({
      title,
      description: description || null,
      image_url: urlData.publicUrl,
      category,
      uploaded_by: user?.id || null,
    });

    setUploading(false);
    if (error) return toast.error('Failed to save');
    toast.success('Image uploaded!');
    setTitle(''); setDescription(''); setFile(null); setCategory('general');
    fetchImages();
  };

  const handleDelete = async (id: string, url: string) => {
    const fileName = url.split('/').pop();
    if (fileName) await supabase.storage.from('gallery').remove([fileName]);
    await supabase.from('gallery').delete().eq('id', id);
    toast.success('Deleted');
    fetchImages();
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">Gallery Management</h2>

      <Card>
        <CardHeader><CardTitle className="font-display">Upload New Image</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="md:col-span-2" />
            <Input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} required />
            <Button type="submit" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.length === 0 && (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground">No gallery images yet</p>
          </div>
        )}
        {images.map(img => (
          <Card key={img.id} className="overflow-hidden">
            <img src={img.image_url} alt={img.title} className="h-48 w-full object-cover" />
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">{img.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{img.category}</p>
              </div>
              <Button size="icon" variant="destructive" onClick={() => handleDelete(img.id, img.image_url)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminGallery;
