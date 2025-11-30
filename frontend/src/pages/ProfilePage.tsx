import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { LogOut, Mail, User, BookOpen, Moon, Zap, Battery, Edit, Save, X, Briefcase, GraduationCap, TrendingUp, Sparkles, Globe, Eye, EyeOff, Linkedin, Hash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { resetTour } from '@/components/OnboardingTour';
import { toast } from 'sonner';
import { authApi, publicProfilesApi } from '@/lib/api';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { darkMode, animationsEnabled, efficientLoading, setDarkMode, setAnimationsEnabled, setEfficientLoading } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedCompanyOrSchool, setEditedCompanyOrSchool] = useState('');
  const [editedRole, setEditedRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingExperienceLevel, setIsChangingExperienceLevel] = useState(false);
  
  // Public profile state
  const [hasPublicProfile, setHasPublicProfile] = useState(false);
  const [publicProfileVisible, setPublicProfileVisible] = useState(false);
  const [publicProfileData, setPublicProfileData] = useState({
    display_name: '',
    school: '',
    role: '',
    industry_tags: '',
    contact_method: 'email',
    contact_info: '',
    visibility: true,
  });
  const [isLoadingPublicProfile, setIsLoadingPublicProfile] = useState(false);
  const [isSavingPublicProfile, setIsSavingPublicProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedName(user.name || '');
      setEditedCompanyOrSchool(user.company_or_school || '');
      setEditedRole(user.role || '');
      loadPublicProfile();
    }
  }, [user]);

  const loadPublicProfile = async () => {
    if (!user?.userId) return;
    
    setIsLoadingPublicProfile(true);
    try {
      const profile = await publicProfilesApi.getByUserId(user.userId);
      if (profile) {
        setHasPublicProfile(true);
        setPublicProfileVisible(profile.visibility);
        setPublicProfileData({
          display_name: profile.display_name || user.name || '',
          school: profile.school || user.company_or_school || '',
          role: profile.role || user.role || '',
          industry_tags: Array.isArray(profile.industry_tags) 
            ? profile.industry_tags.join(', ') 
            : profile.industry_tags || '',
          contact_method: profile.contact_method || 'email',
          contact_info: profile.contact_info || user.email || '',
          visibility: profile.visibility !== false,
        });
      } else {
        // No public profile yet - initialize with user data
        setHasPublicProfile(false);
        setPublicProfileVisible(false);
        setPublicProfileData({
          display_name: user.name || '',
          school: user.company_or_school || '',
          role: user.role || '',
          industry_tags: '',
          contact_method: 'email',
          contact_info: user.email || '',
          visibility: true,
        });
      }
    } catch (error: any) {
      // 404 means no public profile exists yet - that's fine
      if (error.response?.status !== 404) {
        console.error('Failed to load public profile:', error);
      }
      setHasPublicProfile(false);
      setPublicProfileVisible(false);
      setPublicProfileData({
        display_name: user.name || '',
        school: user.company_or_school || '',
        role: user.role || '',
        industry_tags: '',
        contact_method: 'email',
        contact_info: user.email || '',
        visibility: true,
      });
    } finally {
      setIsLoadingPublicProfile(false);
    }
  };

  const handleTogglePublicProfile = async (enabled: boolean) => {
    if (!user?.userId) return;
    
    setPublicProfileVisible(enabled);
    
    if (enabled) {
      // Create or update public profile
      await handleSavePublicProfile();
    } else {
      // Hide profile (set visibility to false)
      setIsSavingPublicProfile(true);
      try {
        await publicProfilesApi.createOrUpdate({
          ...publicProfileData,
          visibility: false,
        });
        toast.success('Public profile hidden');
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to update public profile');
        setPublicProfileVisible(true); // Revert toggle on error
      } finally {
        setIsSavingPublicProfile(false);
      }
    }
  };

  const handleSavePublicProfile = async () => {
    if (!user?.userId) return;
    
    if (!publicProfileData.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsSavingPublicProfile(true);
    try {
      const industryTagsArray = publicProfileData.industry_tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await publicProfilesApi.createOrUpdate({
        display_name: publicProfileData.display_name.trim(),
        school: publicProfileData.school.trim() || undefined,
        role: publicProfileData.role.trim() || undefined,
        industry_tags: industryTagsArray.length > 0 ? industryTagsArray : undefined,
        contact_method: publicProfileData.contact_method,
        contact_info: publicProfileData.contact_info.trim() || undefined,
        visibility: publicProfileData.visibility,
      });
      
      setHasPublicProfile(true);
      toast.success('Public profile saved! You will now appear in Discover.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save public profile');
    } finally {
      setIsSavingPublicProfile(false);
    }
  };

  if (!user) {
    return null;
  }

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user.email[0].toUpperCase();

  const hasProfileInfo = user.company_or_school && user.role;

  const handleSave = async () => {
    if (!editedName.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsSaving(true);
    try {
      await authApi.updateProfile({
        name: editedName.trim(),
        company_or_school: editedCompanyOrSchool.trim() || undefined,
        role: editedRole.trim() || undefined,
      });
      toast.success('Profile updated successfully!');
      // Force a page reload to update the auth context
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(user.name || '');
    setEditedCompanyOrSchool(user.company_or_school || '');
    setEditedRole(user.role || '');
    setIsEditing(false);
  };

  const handleExperienceLevelChange = async (newLevel: string) => {
    setIsChangingExperienceLevel(true);
    try {
      await authApi.updateProfile({ experience_level: newLevel });
      toast.success('Experience level updated! The page will refresh to apply changes.');
      // Reload to update the user context and show new features
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update experience level');
    } finally {
      setIsChangingExperienceLevel(false);
    }
  };

  const getExperienceLevelLabel = (level: string | undefined) => {
    switch (level) {
      case 'beginner':
        return 'I\'m new to networking';
      case 'intermediate':
        return 'I know the basics';
      case 'advanced':
        return 'I\'m a confident networker';
      default:
        return 'Not set';
    }
  };

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

        {!hasProfileInfo && !isEditing && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add your company or school and role so others can learn more about you.
                  </p>
                  <Button onClick={() => setIsEditing(true)} size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Add Profile Info
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name || 'User'}</CardTitle>
                <CardDescription>Account Information</CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_or_school">Company or School</Label>
                  <Input
                    id="company_or_school"
                    value={editedCompanyOrSchool}
                    onChange={(e) => setEditedCompanyOrSchool(e.target.value)}
                    placeholder="e.g., Google or Stanford University"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={editedRole}
                    onChange={(e) => setEditedRole(e.target.value)}
                    placeholder="e.g., Software Engineer or Computer Science Student"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
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
                {user.company_or_school && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {user.role?.toLowerCase().includes('student') ? (
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Company or School</p>
                      <p className="font-medium">{user.company_or_school}</p>
                    </div>
                  </div>
                )}
                {user.role && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="font-medium">{user.role}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">
                    #
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-medium">{user.userId}</p>
                  </div>
                </div>
              </>
            )}
            <Separator className="my-6" />
            
            {/* Experience Level */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Networking Experience Level</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This helps us personalize your experience with the right features and guidance.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Label htmlFor="experience-level" className="font-medium">
                      Current Level
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {getExperienceLevelLabel(user.experience_level)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience-level-select">Change Experience Level</Label>
                  <Select
                    value={user.experience_level || ''}
                    onValueChange={handleExperienceLevelChange}
                    disabled={isChangingExperienceLevel}
                  >
                    <SelectTrigger id="experience-level-select">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          <span>I'm new to networking</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="intermediate">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>I know the basics</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="advanced">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span>I'm a confident networker</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Changing your level will update the features and guidance you see throughout the app.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />
            
            {/* Public Profile / Discover Settings */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Public Profile & Discover</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Make your profile visible on the Discover page so other users can find and connect with you.
                </p>
              </div>

              {/* Toggle Public Profile */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {publicProfileVisible ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="public-profile" className="font-medium cursor-pointer">
                      Make My Profile Public
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {publicProfileVisible 
                        ? "Your profile is visible on the Discover page"
                        : "Your profile is hidden from other users"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="public-profile"
                  checked={publicProfileVisible}
                  onCheckedChange={handleTogglePublicProfile}
                  disabled={isSavingPublicProfile || isLoadingPublicProfile}
                />
              </div>

              {/* Public Profile Form */}
              {publicProfileVisible && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Public Profile Information
                    </CardTitle>
                    <CardDescription>
                      This information will be visible to other users on the Discover page
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name *</Label>
                      <Input
                        id="display_name"
                        value={publicProfileData.display_name}
                        onChange={(e) => setPublicProfileData({...publicProfileData, display_name: e.target.value})}
                        placeholder="How you want to appear to others"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="public_school">School</Label>
                      <Input
                        id="public_school"
                        value={publicProfileData.school}
                        onChange={(e) => setPublicProfileData({...publicProfileData, school: e.target.value})}
                        placeholder="e.g., Stanford University"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="public_role">Role</Label>
                      <Input
                        id="public_role"
                        value={publicProfileData.role}
                        onChange={(e) => setPublicProfileData({...publicProfileData, role: e.target.value})}
                        placeholder="e.g., Software Engineer or Computer Science Student"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry_tags" className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Industry Tags
                      </Label>
                      <Input
                        id="industry_tags"
                        value={publicProfileData.industry_tags}
                        onChange={(e) => setPublicProfileData({...publicProfileData, industry_tags: e.target.value})}
                        placeholder="e.g., Technology, Finance, Healthcare (comma-separated)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate multiple tags with commas
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_method">Contact Method</Label>
                      <Select
                        value={publicProfileData.contact_method}
                        onValueChange={(value) => setPublicProfileData({...publicProfileData, contact_method: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>Email</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="linkedin">
                            <div className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4" />
                              <span>LinkedIn</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_info">
                        {publicProfileData.contact_method === 'email' ? 'Email Address' : 'LinkedIn URL'}
                      </Label>
                      <Input
                        id="contact_info"
                        value={publicProfileData.contact_info}
                        onChange={(e) => setPublicProfileData({...publicProfileData, contact_info: e.target.value})}
                        placeholder={
                          publicProfileData.contact_method === 'email' 
                            ? 'your.email@example.com'
                            : 'https://linkedin.com/in/yourprofile'
                        }
                      />
                    </div>

                    <Button 
                      onClick={handleSavePublicProfile} 
                      disabled={isSavingPublicProfile || !publicProfileData.display_name.trim()}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSavingPublicProfile ? 'Saving...' : 'Save Public Profile'}
                    </Button>
                  </CardContent>
                </Card>
              )}
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
