import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, BookOpen, GraduationCap, User, Shield } from 'lucide-react';

const UserProfile = () => {
  const { user, role, profile } = useAuth();
  const [extra, setExtra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      if (role === 'teacher') {
        const { data } = await supabase.from('teachers').select('*').eq('user_id', user.id).maybeSingle();
        setExtra(data);
      } else if (role === 'student') {
        const { data } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle();
        setExtra(data);
      }
      setLoading(false);
    };
    fetch();
  }, [user, role]);

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-foreground">My Profile</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
                <Badge variant="secondary" className="mt-1 capitalize">{role}</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email}</span>
              </div>
              {role === 'admin' && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">System Administrator</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {role === 'teacher' && extra && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Teacher Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="font-medium text-foreground">{extra.subject}</p>
                </div>
              </div>
              {extra.qualification && (
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="font-medium text-foreground">{extra.qualification}</p>
                  </div>
                </div>
              )}
              {extra.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{extra.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {role === 'student' && extra && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Student Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Roll Number</p>
                  <p className="font-medium text-foreground">{extra.roll_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Class & Section</p>
                  <p className="font-medium text-foreground">{extra.class} - {extra.section}</p>
                </div>
              </div>
              {extra.guardian_name && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Guardian</p>
                    <p className="font-medium text-foreground">{extra.guardian_name}</p>
                  </div>
                </div>
              )}
              {extra.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{extra.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Admin Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium text-foreground">Administrator</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Account ID</p>
                  <p className="font-medium text-foreground text-xs">{user?.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
