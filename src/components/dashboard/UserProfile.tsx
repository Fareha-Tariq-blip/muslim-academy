import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Phone, BookOpen, GraduationCap, User, Shield, KeyRound, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const UserProfile = () => {
  const { user, role, profile } = useAuth();
  const [extra, setExtra] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetting, setResetting] = useState(false);

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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) { toast.error('Please enter your current password'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPassword)) { toast.error('Password must contain an uppercase letter'); return; }
    if (!/[a-z]/.test(newPassword)) { toast.error('Password must contain a lowercase letter'); return; }
    if (!/[0-9]/.test(newPassword)) { toast.error('Password must contain a number'); return; }
    if (!/[^A-Za-z0-9]/.test(newPassword)) { toast.error('Password must contain a special character'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setResetting(true);
    // Verify old password by re-signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: oldPassword,
    });
    if (signInError) {
      toast.error('Current password is incorrect');
      setResetting(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      setShowPasswordReset(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setResetting(false);
  };

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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
            {!showPasswordReset && (
              <Button variant="outline" size="sm" onClick={() => setShowPasswordReset(true)}>
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        {showPasswordReset && (
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="old-password">Current Password</Label>
                <Input
                  id="old-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="e.g. Student@123"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <ul className="text-[11px] text-muted-foreground space-y-0.5">
                  <li className={newPassword.length >= 8 ? 'text-secondary' : ''}>• At least 8 characters</li>
                  <li className={/[A-Z]/.test(newPassword) ? 'text-secondary' : ''}>• One uppercase letter</li>
                  <li className={/[a-z]/.test(newPassword) ? 'text-secondary' : ''}>• One lowercase letter</li>
                  <li className={/[0-9]/.test(newPassword) ? 'text-secondary' : ''}>• One number</li>
                  <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-secondary' : ''}>• One special character</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-destructive">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-[11px] text-secondary flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Passwords match</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={resetting} className="shadow-md">
                  {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Update Password
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setShowPasswordReset(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;
