import { Search, Filter, Users, Mail, Linkedin, Building2, GraduationCap, Briefcase, Plus, X, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { publicProfilesApi, contactsApi, recommendationsApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PublicProfile {
  profile_id: number;
  user_id: number;
  display_name: string;
  school?: string;
  role?: string;
  industry_tags: string[];
  contact_method?: string;
  contact_info?: string;
  visibility: boolean;
}

interface Recommendation {
  user_id: number;
  name: string;
  role?: string;
  company_or_school?: string;
  similarity_score: number;
}

const Discover = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<PublicProfile[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationProfiles, setRecommendationProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("");
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [isAddingContact, setIsAddingContact] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"recommended" | "browse">("recommended");

  useEffect(() => {
    if (user?.userId) {
      loadProfiles();
      loadRecommendations();
    } else {
      setLoading(false);
      setLoadingRecommendations(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (profiles.length > 0 || !loading) {
      filterProfiles();
    }
  }, [profiles, searchQuery, industryFilter, schoolFilter, roleFilter, loading]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (industryFilter) params.industry = industryFilter;
      if (schoolFilter) params.school = schoolFilter;
      if (roleFilter) params.role = roleFilter;
      
      const data = await publicProfilesApi.getAll(params);
      if (Array.isArray(data)) {
        // Filter out current user's profile
        const filtered = data.filter((p: PublicProfile) => p.user_id !== user?.userId);
        setProfiles(filtered);
        // Immediately set filtered profiles to show results
        setFilteredProfiles(filtered);
      } else {
        setProfiles([]);
        setFilteredProfiles([]);
      }
    } catch (error: any) {
      console.error("Failed to load profiles:", error);
      setProfiles([]);
      setFilteredProfiles([]);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!user?.userId) {
      setLoadingRecommendations(false);
      return;
    }

    try {
      setLoadingRecommendations(true);
      const recs = await recommendationsApi.getRecommendations({ threshold: 0.5 });
      if (Array.isArray(recs)) {
        setRecommendations(recs);
        
        // Fetch public profile details for recommended users
        const profilePromises = recs.map((rec: Recommendation) =>
          publicProfilesApi.getByUserId(rec.user_id).catch(() => null)
        );
        const profileResults = await Promise.all(profilePromises);
        const validProfiles = profileResults.filter((p): p is PublicProfile => p !== null);
        setRecommendationProfiles(validProfiles);
      } else {
        setRecommendations([]);
        setRecommendationProfiles([]);
      }
    } catch (error: any) {
      console.error("Failed to load recommendations:", error);
      setRecommendations([]);
      setRecommendationProfiles([]);
      // Don't show error toast - recommendations are optional
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const filterProfiles = () => {
    if (!profiles || !Array.isArray(profiles)) {
      setFilteredProfiles([]);
      return;
    }

    let filtered = [...profiles];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (profile) =>
          profile.display_name?.toLowerCase().includes(query) ||
          profile.school?.toLowerCase().includes(query) ||
          profile.role?.toLowerCase().includes(query) ||
          (Array.isArray(profile.industry_tags) && profile.industry_tags.some((tag) => tag?.toLowerCase().includes(query)))
      );
    }

    setFilteredProfiles(filtered);
  };

  const handleAddToContacts = async (profile: PublicProfile) => {
    if (!user?.userId) {
      toast.error("Please log in to add contacts");
      return;
    }

    setIsAddingContact(profile.user_id);
    try {
      await contactsApi.createContact({
        user_id: user.userId,
        name: profile.display_name,
        email: profile.contact_method === "email" ? profile.contact_info : undefined,
        company: profile.school || undefined,
        job_title: profile.role || undefined,
        category: "Professional",
      });
      toast.success(`Added ${profile.display_name} to your contacts!`);
    } catch (error: any) {
      console.error("Failed to add contact:", error);
      toast.error(error.response?.data?.detail || "Failed to add contact");
    } finally {
      setIsAddingContact(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedProfile || !messageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // In a real implementation, this would send a message through the platform
    // For now, we'll just show a success message
    toast.success(`Message prepared for ${selectedProfile.display_name}. Copy the message to send via ${selectedProfile.contact_method === "email" ? "email" : "LinkedIn"}.`);
    setShowMessageDialog(false);
    setMessageContent("");
    setSelectedProfile(null);
  };

  const getUniqueValues = (key: keyof PublicProfile) => {
    const values = new Set<string>();
    if (!profiles || !Array.isArray(profiles)) return [];
    profiles.forEach((profile) => {
      if (key === "industry_tags") {
        if (Array.isArray(profile.industry_tags)) {
          profile.industry_tags.forEach((tag) => {
            if (tag && typeof tag === "string") values.add(tag);
          });
        }
      } else {
        const value = profile[key];
        if (value && typeof value === "string") {
          values.add(value);
        }
      }
    });
    return Array.from(values).sort();
  };

  const uniqueIndustries = getUniqueValues("industry_tags");
  const uniqueSchools = getUniqueValues("school");
  const uniqueRoles = getUniqueValues("role");

  const renderProfileCard = (profile: PublicProfile, similarityScore?: number) => {
    const rec = recommendations.find((r) => r.user_id === profile.user_id);
    return (
      <Card key={profile.profile_id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{profile.display_name}</CardTitle>
                {similarityScore !== undefined && (
                  <Badge variant="default" className="bg-primary/10 text-primary">
                    {Math.round(similarityScore * 100)}% match
                  </Badge>
                )}
              </div>
              {profile.role && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {profile.role}
                </p>
              )}
              {profile.school && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {profile.school}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.industry_tags && profile.industry_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.industry_tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {profile.contact_method && profile.contact_info && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProfile(profile);
                  setShowMessageDialog(true);
                }}
                className="flex-1"
              >
                {profile.contact_method === "email" ? (
                  <Mail className="h-4 w-4 mr-2" />
                ) : (
                  <Linkedin className="h-4 w-4 mr-2" />
                )}
                Contact
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => handleAddToContacts(profile)}
              disabled={isAddingContact === profile.user_id}
              className="flex-1"
            >
              {isAddingContact === profile.user_id ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Contacts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Safety check - ensure component always renders
  if (!user) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Discover</h1>
            <p className="text-muted-foreground mt-1">
              Connect with other professionals on Ripple
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please log in to discover connections.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-muted-foreground mt-1">
            Connect with other professionals on Ripple
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "recommended" | "browse")} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Recommended for You
          </TabsTrigger>
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Browse All
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-6 mt-6">
          {loadingRecommendations ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading recommendations...</p>
            </div>
          ) : recommendationProfiles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  No personalized recommendations available yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Make sure you've added your role and company in your profile, and that other users have created public profiles.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setActiveTab("browse")}
                >
                  Browse All Profiles Instead
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Personalized Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        These users have similar roles and companies to you. Great connections to start building your network!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendationProfiles.map((profile) => {
                  const rec = recommendations.find((r) => r.user_id === profile.user_id);
                  return renderProfileCard(profile, rec?.similarity_score);
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-6 mt-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, school, role, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All industries</SelectItem>
                      {uniqueIndustries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>School</Label>
                  <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All schools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All schools</SelectItem>
                      {uniqueSchools.map((school) => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All roles</SelectItem>
                      {uniqueRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(industryFilter || schoolFilter || roleFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIndustryFilter("");
                    setSchoolFilter("");
                    setRoleFilter("");
                    loadProfiles();
                  }}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading profiles...</p>
            </div>
          ) : (!filteredProfiles || filteredProfiles.length === 0) ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {!profiles || profiles.length === 0
                    ? "No public profiles found. Be the first to create one!"
                    : "No profiles match your filters. Try adjusting your search."}
                </p>
                {(!profiles || profiles.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    Users need to create a public profile to appear here. Check back soon!
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map((profile) => renderProfileCard(profile))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Networking Message</DialogTitle>
            <DialogDescription>
              Send a message to {selectedProfile?.display_name} via{" "}
              {selectedProfile?.contact_method === "email" ? "email" : "LinkedIn"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Hi! I saw your profile on Ripple and would love to connect..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={6}
              />
            </div>
            {selectedProfile?.contact_info && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {selectedProfile.contact_method === "email" ? "Email" : "LinkedIn"}:{" "}
                  <span className="font-medium">{selectedProfile.contact_info}</span>
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSendMessage} className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Prepare Message
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowMessageDialog(false);
                  setMessageContent("");
                  setSelectedProfile(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discover;

