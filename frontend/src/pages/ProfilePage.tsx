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
import { LogOut, Mail, User, BookOpen, Moon, Zap, Battery, Edit, Save, X, Briefcase, GraduationCap, TrendingUp, Sparkles, Globe, Eye, EyeOff, Linkedin, Hash, HelpCircle, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { resetTour } from '@/components/OnboardingTour';
import { toast } from 'sonner';
import { authApi, publicProfilesApi, gmailApi } from '@/lib/api';
import { useSearchParams } from 'react-router-dom';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { darkMode, animationsEnabled, efficientLoading, tooltipsEnabled, setDarkMode, setAnimationsEnabled, setEfficientLoading, setTooltipsEnabled } = useSettings();
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
  
  // Gmail sync state
  const [searchParams, setSearchParams] = useSearchParams();
  const [gmailSyncStatus, setGmailSyncStatus] = useState<any>(null);
  const [isLoadingGmailStatus, setIsLoadingGmailStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [isUpdatingAutoSync, setIsUpdatingAutoSync] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedName(user.name || '');
      setEditedCompanyOrSchool(user.company_or_school || '');
      setEditedRole(user.role || '');
      loadPublicProfile();
    }
  }, [user]);
  
  // Check for OAuth callback params
  useEffect(() => {
    const gmailConnected = searchParams.get('gmail_connected');
    const gmailError = searchParams.get('gmail_error');
    
    if (gmailConnected === 'true') {
      toast.success('Gmail connected successfully!');
      setSearchParams({}); // Clear params
      loadGmailStatus();
    } else if (gmailError) {
      toast.error(`Gmail connection failed: ${gmailError}`);
      setSearchParams({}); // Clear params
    }
  }, [searchParams, setSearchParams]);
  
  // Load Gmail sync status
  useEffect(() => {
    if (user?.userId) {
      loadGmailStatus();
    }
  }, [user?.userId]);
  
  const loadGmailStatus = async () => {
    if (!user?.userId) return;
    
    setIsLoadingGmailStatus(true);
    try {
      const status = await gmailApi.getSyncStatus();
      setGmailSyncStatus(status);
    } catch (error) {
      console.error('Failed to load Gmail status:', error);
    } finally {
      setIsLoadingGmailStatus(false);
    }
  };
  
  const handleConnectGmail = async () => {
    try {
      const response = await gmailApi.getOAuthUrl();
      // Redirect to Google OAuth
      window.location.href = response.authorization_url;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to connect Gmail');
    }
  };
  
  const handleSyncGmail = async () => {
    if (!gmailSyncStatus?.oauth_connected) {
      toast.error('Please connect your Gmail account first');
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await gmailApi.triggerSync();
      if (result.success) {
        toast.success(`Synced ${result.messages_processed} messages, found ${result.networking_messages} networking emails`);
        loadGmailStatus(); // Refresh status
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to sync Gmail');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    if (!gmailSyncStatus?.oauth_connected) {
      toast.error('Please connect Gmail first');
      return;
    }
    
    setIsUpdatingAutoSync(true);
    try {
      await gmailApi.setAutoSync(enabled);
      setAutoSyncEnabled(enabled);
      toast.success(enabled ? 'Automatic sync enabled' : 'Automatic sync disabled');
      // Refresh status to get updated value
      loadGmailStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update auto-sync setting');
      // Revert toggle on error
      setAutoSyncEnabled(!enabled);
    } finally {
      setIsUpdatingAutoSync(false);
    }
  };

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
        // No public profile yet - default to public with user data
        setHasPublicProfile(false);
        setPublicProfileVisible(true); // Default to public
        setPublicProfileData({
          display_name: user.name || '',
          school: user.company_or_school || '',
          role: user.role || '',
          industry_tags: '',
          contact_method: 'email',
          contact_info: user.email || '',
          visibility: true, // Default to visible
        });
        // Auto-create public profile if user has name and (school or role)
        if (user.name && (user.company_or_school || user.role)) {
          // Auto-create in background
          setTimeout(() => {
            handleSavePublicProfile();
          }, 500);
        }
      }
    } catch (error: any) {
      // 404 means no public profile exists yet - default to public
      if (error.response?.status !== 404) {
        console.error('Failed to load public profile:', error);
      }
      setHasPublicProfile(false);
      setPublicProfileVisible(true); // Default to public
      setPublicProfileData({
        display_name: user.name || '',
        school: user.company_or_school || '',
        role: user.role || '',
        industry_tags: '',
        contact_method: 'email',
        contact_info: user.email || '',
        visibility: true, // Default to visible
      });
      // Auto-create public profile if user has name and (school or role)
      if (user.name && (user.company_or_school || user.role)) {
        setTimeout(() => {
          handleSavePublicProfile();
        }, 500);
      }
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
      
      // Auto-create/update public profile if it's visible
      if (publicProfileVisible && editedName.trim()) {
        try {
          const industryTagsArray = publicProfileData.industry_tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

          await publicProfilesApi.createOrUpdate({
            display_name: editedName.trim(),
            school: editedCompanyOrSchool.trim() || undefined,
            role: editedRole.trim() || undefined,
            industry_tags: industryTagsArray.length > 0 ? industryTagsArray : undefined,
            contact_method: publicProfileData.contact_method,
            contact_info: publicProfileData.contact_info.trim() || editedCompanyOrSchool.trim() || undefined,
            visibility: true,
          });
        } catch (pubError) {
          // Don't fail profile update if public profile fails
          console.error('Failed to update public profile:', pubError);
        }
      }
      
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
                <Card className="border-primary/50 bg-primary/5 mb-4">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">Your profile is public by default</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Only the following information is shared on the Discover page:
                        </p>
                        <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1 mb-2">
                          <li>Your display name</li>
                          <li>School or company</li>
                          <li>Role or profession</li>
                          <li>Industry tags (if you add them)</li>
                          <li>Contact method (email or LinkedIn - only if you choose to share)</li>
                        </ul>
                        <p className="text-xs font-medium text-primary">
                          ✓ Your contacts, meetings, goals, and other private data are never shared
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                      {publicProfileVisible ? "Profile is Public" : "Make Profile Private"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {publicProfileVisible 
                        ? "Your profile is visible on the Discover page. Turn off to make it private."
                        : "Your profile is hidden from other users. Turn on to make it public."}
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
            
            {/* Gmail Integration */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Gmail Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect your Gmail account to sync networking emails and contacts. Click "Sync Now" to sync manually.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  {isLoadingGmailStatus ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Connection Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <Label className="font-medium">
                              Gmail Connection
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {gmailSyncStatus?.oauth_connected 
                                ? `Connected • Last synced: ${gmailSyncStatus?.last_sync ? new Date(gmailSyncStatus.last_sync).toLocaleString() : 'Never'}`
                                : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {gmailSyncStatus?.oauth_connected ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Stats */}
                      {gmailSyncStatus?.oauth_connected && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{gmailSyncStatus?.contacts_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Gmail Contacts</div>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{gmailSyncStatus?.threads_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Email Threads</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {!gmailSyncStatus?.oauth_connected ? (
                          <Button onClick={handleConnectGmail} className="flex-1">
                            <Mail className="h-4 w-4 mr-2" />
                            Connect Gmail
                          </Button>
                        ) : (
                          <>
                            <Button 
                              onClick={handleSyncGmail} 
                              disabled={isSyncing}
                              variant="outline"
                              className="flex-1"
                            >
                              {isSyncing ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Sync Now
                                </>
                              )}
                            </Button>
                            <Button 
                              onClick={handleConnectGmail} 
                              variant="outline"
                            >
                              Reconnect
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Auto-sync toggle */}
                      {gmailSyncStatus?.oauth_connected && (
                        <div className="flex items-center justify-between pt-3 border-t mt-2">
                          <div className="flex flex-col">
                            <Label htmlFor="auto-sync" className="text-sm font-medium cursor-pointer">
                              Automatic Sync
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Sync Gmail every 5 minutes automatically
                            </p>
                          </div>
                          <Switch
                            id="auto-sync"
                            checked={autoSyncEnabled}
                            onCheckedChange={handleToggleAutoSync}
                            disabled={isUpdatingAutoSync}
                          />
                        </div>
                      )}
                      
                      {gmailSyncStatus?.oauth_connected && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          Click "Sync Now" to sync your Gmail emails and contacts manually.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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

              {/* Tooltips */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="tooltips" className="font-medium cursor-pointer">
                      Show Tooltips
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Display helpful tooltips when hovering over metrics
                    </p>
                  </div>
                </div>
                <Switch
                  id="tooltips"
                  checked={tooltipsEnabled}
                  onCheckedChange={setTooltipsEnabled}
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
