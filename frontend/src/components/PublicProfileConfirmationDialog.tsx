import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Eye, EyeOff, Shield, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { publicProfilesApi } from '@/lib/api';
import { toast } from 'sonner';

const DIALOG_SEEN_KEY = 'public_profile_confirmation_seen';

export const PublicProfileConfirmationDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [makeProfilePublic, setMakeProfilePublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;

    // Check if user has seen this dialog before
    const hasSeenDialog = localStorage.getItem(`${DIALOG_SEEN_KEY}_${user.userId}`) === 'true';
    
    if (!hasSeenDialog) {
      // Check if user already has a public profile
      publicProfilesApi.getByUserId(user.userId)
        .then((profile) => {
          // If they have a profile, they've already been migrated - just mark as seen
          if (profile) {
            localStorage.setItem(`${DIALOG_SEEN_KEY}_${user.userId}`, 'true');
          } else {
            // Show dialog for existing users
            setOpen(true);
          }
        })
        .catch(() => {
          // 404 means no profile - show dialog
          setOpen(true);
        });
    }
  }, [user?.userId]);

  const handleConfirm = async () => {
    if (!user?.userId) return;

    setIsSaving(true);
    try {
      if (makeProfilePublic && user.name && (user.company_or_school || user.role)) {
        // Create public profile
        await publicProfilesApi.createOrUpdate({
          display_name: user.name,
          school: user.company_or_school,
          role: user.role,
          visibility: true,
        });
        toast.success('Your profile is now public on Discover!');
      } else if (!makeProfilePublic) {
        // Create private profile (visibility false)
        await publicProfilesApi.createOrUpdate({
          display_name: user.name || 'User',
          school: user.company_or_school,
          role: user.role,
          visibility: false,
        });
        toast.success('Your profile is set to private.');
      }
      
      // Mark dialog as seen
      localStorage.setItem(`${DIALOG_SEEN_KEY}_${user.userId}`, 'true');
      setOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (!user?.userId) return;
    // Mark as seen but don't create profile (they can do it later in settings)
    localStorage.setItem(`${DIALOG_SEEN_KEY}_${user.userId}`, 'true');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-5 w-5 text-primary" />
            <DialogTitle>Your Profile is Now Public</DialogTitle>
          </div>
          <DialogDescription>
            We've updated our privacy settings. Here's what changed:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">What's shared publicly:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 mb-2">
                    <li>Your name</li>
                    <li>School or company</li>
                    <li>Role or profession</li>
                    <li>Industry tags (if you add them)</li>
                    <li>Contact method (only if you choose to share)</li>
                  </ul>
                  <p className="text-xs font-medium text-primary">
                    ✓ Your contacts, meetings, goals, and other private data are never shared
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {makeProfilePublic ? (
                <Eye className="h-5 w-5 text-primary" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="public-toggle" className="font-medium cursor-pointer">
                  Keep my profile public
                </Label>
                <p className="text-xs text-muted-foreground">
                  {makeProfilePublic 
                    ? "Others can find you on the Discover page"
                    : "Make my profile private"}
                </p>
              </div>
            </div>
            <Switch
              id="public-toggle"
              checked={makeProfilePublic}
              onCheckedChange={setMakeProfilePublic}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSaving}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Skip for Now
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


