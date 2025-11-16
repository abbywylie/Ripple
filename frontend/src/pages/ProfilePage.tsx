import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LogOut, Mail, User, BookOpen, Moon, Zap, Battery } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resetTour } from '@/components/OnboardingTour';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { darkMode, animationsEnabled, efficientLoading, setDarkMode, setAnimationsEnabled, setEfficientLoading } = useSettings();

  if (!user) {
    return null;
  }

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.name || 'User'}</CardTitle>
              <CardDescription>Account Information</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name || 'Not provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">
                #
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-medium">{user.userId}</p>
              </div>
            </div>
            <Separator className="my-6" />
            
            {/* UI Settings */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Display & Performance</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Optimize your experience for battery life and device performance
                </p>
              </div>

              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="dark-mode" className="font-medium cursor-pointer">
                      Dark Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Reduces battery drain on OLED screens
                    </p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>

              {/* Animations */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="animations" className="font-medium cursor-pointer">
                      Enable Animations
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Turn off to improve battery life and performance
                    </p>
                  </div>
                </div>
                <Switch
                  id="animations"
                  checked={animationsEnabled}
                  onCheckedChange={setAnimationsEnabled}
                />
              </div>

              {/* Efficient Loading */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Battery className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="efficient-loading" className="font-medium cursor-pointer">
                      Efficient Loading
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Reduce background refreshes to save resources
                    </p>
                  </div>
                </div>
                <Switch
                  id="efficient-loading"
                  checked={efficientLoading}
                  onCheckedChange={setEfficientLoading}
                />
              </div>
            </div>

            <Separator className="my-6" />

            <div className="pt-4 space-y-2">
              <Link to="/dashboard">
                <Button variant="secondary" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetTour();
                  toast.success("Tour reset! Refresh the page to see the welcome prompt again.");
                }}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Rewatch Quick Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
