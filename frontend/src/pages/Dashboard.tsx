import { Users, Target, TrendingUp, Clock, Plus, UserPlus, ChevronDown, Calendar, Sparkles, ExternalLink, Send, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { contactsApi, goalsApi, followUpsApi, meetingsApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Helper function to parse date strings as local dates to avoid timezone issues
const parseLocalDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  try {
    // Handle both ISO format (with T) and simple YYYY-MM-DD format
    const cleanDate = dateString.split('T')[0];
    const dateParts = cleanDate.split('-');
    if (dateParts.length === 3) {
      return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }
    return new Date(dateString);
  } catch {
    return null;
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [followUpsThisWeek, setFollowUpsThisWeek] = useState([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinnedAnswers, setPinnedAnswers] = useState<{ id: number; createdAt: string; content: string }[]>([]);
  const [pinnedShowCount, setPinnedShowCount] = useState<number>(5);
  const [editingPinId, setEditingPinId] = useState<number | null>(null);
  const [editingPinText, setEditingPinText] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    // Load pinned answers from localStorage
    try {
      const data = JSON.parse(localStorage.getItem('pinnedAssistantAnswers') || '[]');
      setPinnedAnswers(data);
    } catch {}

    // Load pinned answers show count preference
    try {
      const savedCount = parseInt(localStorage.getItem('pinnedShowCount') || '5', 10);
      if (!Number.isNaN(savedCount)) setPinnedShowCount(savedCount);
    } catch {}

    const loadUserData = async () => {
      if (user?.userId) {
        try {
          // Load contacts, goals, and follow-ups in parallel
          const [contactsData, goalsData, followUpsData, overdueFollowUpsData, interactionFollowUpsData, meetingsData] = await Promise.all([
            contactsApi.getContacts(user.userId),
            goalsApi.getGoals(user.userId),
            followUpsApi.getUpcomingFollowUps(user.userId, 7),
            followUpsApi.getOverdueFollowUps(user.userId),
            followUpsApi.getUpcomingInteractionFollowUps(user.userId, 7),
            meetingsApi.getUpcomingMeetings(user.userId, 7)
          ]);
          setContacts(contactsData);
          setGoals(goalsData);
          // Combine contact follow-ups and interaction follow-ups
          const allFollowUps = [...(followUpsData || []), ...(interactionFollowUpsData || [])];
          setFollowUpsThisWeek(allFollowUps);
          setOverdueFollowUps(overdueFollowUpsData || []);
          setUpcomingMeetings(meetingsData || []);
          setCompletionRate(0); // Set to 0 for now until we define what completion rate means
        } catch (error) {
          console.error('Failed to load user data:', error);
          setContacts([]);
          setGoals([]);
          setFollowUpsThisWeek([]);
          setOverdueFollowUps([]);
          setUpcomingMeetings([]);
          setCompletionRate(0);
        }
      }
      setLoading(false);
    };

    if (user) {
      loadUserData();
    } else {
      setCompletionRate(0);
      setFollowUpsThisWeek([]);
      setLoading(false);
    }
  }, [user?.userId, user]);

  // Load recommendations
  useEffect(() => {
    // TODO: Replace with actual LinkedIn API integration
    // For now, using sample recommendations based on common connections
    const loadRecommendations = () => {
      const sampleRecommendations = [
        {
          id: 1,
          name: "Alex Morgan",
          headline: "Senior Product Designer at Google | AI Enthusiast",
          company: "Google",
          location: "San Francisco, CA",
          mutualConnections: 3,
          reason: "3 mutual connections in Product Design",
          profileUrl: "#",
          avatar: "AM",
          industry: "Technology",
          skills: ["Product Design", "AI/ML", "UX Research"]
        },
        {
          id: 2,
          name: "Jessica Liu",
          headline: "Software Engineer at Meta | Full Stack Developer",
          company: "Meta",
          location: "Menlo Park, CA",
          mutualConnections: 5,
          reason: "5 mutual connections and similar interests",
          profileUrl: "#",
          avatar: "JL",
          industry: "Technology",
          skills: ["React", "Node.js", "Python"]
        },
        {
          id: 3,
          name: "David Chen",
          headline: "Engineering Manager at Stripe | Mentoring Startups",
          company: "Stripe",
          location: "San Francisco, CA",
          mutualConnections: 2,
          reason: "Shared industry interests and location",
          profileUrl: "#",
          avatar: "DC",
          industry: "FinTech",
          skills: ["Leadership", "System Design", "Go"]
        },
        {
          id: 4,
          name: "Sarah Park",
          headline: "Data Scientist at Netflix | Machine Learning Expert",
          company: "Netflix",
          location: "Los Gatos, CA",
          mutualConnections: 4,
          reason: "4 mutual connections in Data Science",
          profileUrl: "#",
          avatar: "SP",
          industry: "Entertainment",
          skills: ["Python", "TensorFlow", "Data Analysis"]
        }
      ];
      setRecommendations(sampleRecommendations);
    };
    loadRecommendations();
  }, []);

  const stats = [
    { 
      title: "Total Contacts", 
      value: loading ? "..." : contacts.length.toString(), 
      icon: Users, 
      color: "text-primary" 
    },
    { 
      title: "Active Goals", 
      value: loading ? "..." : goals.length.toString(), 
      icon: Target, 
      color: "text-accent" 
    },
    { 
      title: "Completion Rate", 
      value: loading ? "..." : `${completionRate}%`, 
      icon: TrendingUp, 
      color: "text-primary" 
    },
    { 
      title: "This Week", 
      value: loading ? "..." : followUpsThisWeek.length.toString(), 
      icon: Clock, 
      color: "text-accent" 
    },
  ];

  // Use real contacts data if available, otherwise fallback to sample data
  const recentActivity = contacts.length > 0 
    ? contacts.slice(0, 4).map((contact: any, index: number) => ({
        name: contact.name,
        action: `Contact added`,
        time: contact.date_created ? (() => {
          const date = parseLocalDate(contact.date_created);
          return date ? date.toLocaleDateString() : "Recently";
        })() : "Recently",
        type: "contact"
      }))
    : [
        { name: "Sarah Chen", action: "Coffee meeting completed", time: "2 hours ago", type: "meeting" },
        { name: "Michael Rodriguez", action: "LinkedIn message sent", time: "5 hours ago", type: "message" },
        { name: "Emma Thompson", action: "Follow-up scheduled", time: "1 day ago", type: "reminder" },
        { name: "James Wilson", action: "Introduction made", time: "2 days ago", type: "intro" },
      ];

  // Transform follow-ups into reminder format for display
  const upcomingReminders = followUpsThisWeek.map((contact: any) => ({
    contact: contact.name || 'Unknown Contact',
    task: `Follow-up with ${contact.name}`,
    date: contact.date_next_follow_up 
      ? (() => {
          const date = parseLocalDate(contact.date_next_follow_up);
          return date ? date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          }) : 'No date set';
        })()
      : 'No date set',
    contactId: contact.contact_id,
    company: contact.company,
    jobTitle: contact.job_title
  }));

  // Handler to save recommendation as a contact
  const handleSaveAsContact = async (recommendation: any) => {
    if (!user?.userId) return;
    
    try {
      await contactsApi.createContact({
        userId: user.userId,
        name: recommendation.name,
        email: "", // LinkedIn doesn't expose emails
        phone: "",
        company: recommendation.company,
        jobTitle: recommendation.headline.split('|')[0].trim(), // Extract title from headline
        linkedinUrl: recommendation.profileUrl,
        notes: `Recommended via LinkedIn - ${recommendation.reason}. Skills: ${recommendation.skills.join(', ')}`
      });
      
      toast.success(`${recommendation.name} added to contacts!`);
      // Refresh contacts list
      const contactsData = await contactsApi.getContacts(user.userId);
      setContacts(contactsData);
      
      // Remove from recommendations
      setRecommendations(prev => prev.filter(r => r.id !== recommendation.id));
    } catch (error) {
      console.error('Failed to save contact:', error);
      toast.error('Failed to save contact');
    }
  };

  // Handler to schedule follow-up
  const handleScheduleFollowUp = (recommendation: any) => {
    // First save as contact, then navigate to their detail page
    handleSaveAsContact(recommendation);
    // The contact will be created, but we can't immediately navigate since it's async
    // In a real implementation, we'd handle this better
    toast.info('Save the contact first, then schedule a follow-up from their page');
  };

  // ----- Pinned answers helpers -----
  const persistPinnedAnswers = (items: { id: number; createdAt: string; content: string }[]) => {
    setPinnedAnswers(items);
    try {
      localStorage.setItem('pinnedAssistantAnswers', JSON.stringify(items));
    } catch {}
  };

  const handleUnpin = (id: number) => {
    const next = pinnedAnswers.filter(p => p.id !== id);
    persistPinnedAnswers(next);
  };

  const handleStartEditPin = (pin: { id: number; content: string }) => {
    setEditingPinId(pin.id);
    setEditingPinText(pin.content);
  };

  const handleCancelEditPin = () => {
    setEditingPinId(null);
    setEditingPinText("");
  };

  const handleSaveEditPin = () => {
    if (editingPinId == null) return;
    const next = pinnedAnswers.map(p => p.id === editingPinId ? { ...p, content: editingPinText } : p);
    persistPinnedAnswers(next);
    setEditingPinId(null);
    setEditingPinText("");
  };

  const handleChangePinnedShowCount = (count: number) => {
    setPinnedShowCount(count);
    try { localStorage.setItem('pinnedShowCount', String(count)); } catch {}
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your network
            {loading && <span className="text-sm"> (Loading...)</span>}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
              <Plus className="h-4 w-4 mr-2" />
              Quick Action
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/contacts')} className="cursor-pointer">
              <Users className="h-4 w-4 mr-2" />
              <span>Manage Contacts</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/goals')} className="cursor-pointer">
              <Target className="h-4 w-4 mr-2" />
              <span>Manage Goals</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/reminders')} className="cursor-pointer">
              <Clock className="h-4 w-4 mr-2" />
              <span>View Reminders</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/contacts')} className="cursor-pointer">
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Quick Add Contact</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/goals')} className="cursor-pointer">
              <Target className="h-4 w-4 mr-2" />
              <span>Quick Add Goal</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/progress')} className="cursor-pointer">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span>View Progress</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs for Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">
            <TrendingUp className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Sparkles className="h-4 w-4 mr-2" />
            Next Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-card border-border/50 hover:border-primary/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pinned Answers - Full width */}
      <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-primary" />
              Pinned Answers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Showing {Math.min(pinnedShowCount, pinnedAnswers.length)} of {pinnedAnswers.length}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show</span>
                <select
                  value={pinnedShowCount}
                  onChange={(e) => handleChangePinnedShowCount(parseInt(e.target.value, 10))}
                  className="text-sm border rounded-md px-2 py-1 bg-background"
                >
                  {[3,5,10,20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {pinnedAnswers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pinned answers yet</p>
            ) : (
              pinnedAnswers.slice(0, pinnedShowCount).map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-border/50 bg-background">
                  {editingPinId === p.id ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full text-sm border rounded-md p-2 bg-white"
                        rows={4}
                        value={editingPinText}
                        onChange={(e) => setEditingPinText(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <button onClick={handleCancelEditPin} className="text-xs px-3 py-1 rounded-md border">Cancel</button>
                        <button onClick={handleSaveEditPin} className="text-xs px-3 py-1 rounded-md bg-primary text-white">Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{p.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleStartEditPin(p)} className="text-xs px-3 py-1 rounded-md border">Edit</button>
                          <button onClick={() => handleUnpin(p.id)} className="text-xs px-3 py-1 rounded-md border text-red-600">Unpin</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

      {/* Two-column layout under Pinned Answers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Reminders */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Upcoming Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading reminders...</p>
              </div>
            ) : upcomingReminders.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No upcoming reminders</p>
                <p className="text-xs text-muted-foreground mt-1">Add follow-up dates to your contacts to see reminders here</p>
              </div>
            ) : (
              upcomingReminders.map((reminder, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/contacts`}>
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{reminder.contact}</p>
                    <p className="text-sm text-muted-foreground">{reminder.company ? `${reminder.company}${reminder.jobTitle ? ` • ${reminder.jobTitle}` : ''}` : reminder.task}</p>
                    <p className="text-xs text-accent mt-1">{reminder.date}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings (moved here) */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading meetings...</p>
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">No upcoming meetings</p>
                <p className="text-xs text-muted-foreground mt-1">Schedule meetings with your contacts to see them here</p>
              </div>
            ) : (
              upcomingMeetings.slice(0, 5).map((meeting, index) => {
                const meetingDate = parseLocalDate(meeting.meeting_date);
                const contact = contacts.find(c => c.contact_id === meeting.contact_id);
                return (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/contacts/${meeting.contact_id}`)}>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{meeting.meeting_type || "Meeting"}</p>
                      <p className="text-sm text-muted-foreground">
                        {contact?.name || "Unknown Contact"}
                        {meeting.location && ` • ${meeting.location}`}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        {meetingDate ? meetingDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "No date"}
                        {meeting.start_time && ` • ${new Date(`2000-01-01T${meeting.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (moved below) */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{activity.name}</p>
                <p className="text-sm text-muted-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                LinkedIn Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">No new recommendations</p>
                  <p className="text-sm text-muted-foreground">We'll suggest new connections based on your network activity</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div key={rec.id} className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all bg-gradient-to-r from-background to-muted/20">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-semibold text-primary">
                      {rec.avatar}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{rec.name}</h3>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{rec.headline}</p>
                          <p className="text-xs text-muted-foreground mt-1">{rec.location}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {rec.mutualConnections} mutual {rec.mutualConnections === 1 ? 'connection' : 'connections'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.industry}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {rec.skills.slice(0, 3).map((skill: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                        💡 {rec.reason}
                      </p>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleSaveAsContact(rec)}
                          className="flex-1"
                        >
                          <UserPlus className="h-3 w-3 mr-2" />
                          Save as Contact
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleScheduleFollowUp(rec)}
                        >
                          <Calendar className="h-3 w-3 mr-2" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
