import { Users, Target, TrendingUp, Clock, Plus, UserPlus, ChevronDown, Calendar, ExternalLink, BookOpen, Pin, X, MessageCircle, Edit2, Check, Save, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { contactsApi, goalsApi, followUpsApi, interactionsApi, meetingsApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { networkingTips } from "@/data/networking-tips";

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
  const [interactions, setInteractions] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinnedAnswers, setPinnedAnswers] = useState<any[]>([]);
  const [editingPinId, setEditingPinId] = useState<number | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const FEEDBACK_FORM_URL = "https://forms.gle/tiKQHNF6k7Xy6jiw9";

  // Load pinned answers from localStorage
  useEffect(() => {
    const loadPinnedAnswers = () => {
      try {
        const pinKey = "pinnedAssistantAnswers";
        const stored = localStorage.getItem(pinKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setPinnedAnswers(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to load pinned answers:", error);
        setPinnedAnswers([]);
      }
    };

    loadPinnedAnswers();
    
    // Listen for custom event when pin is added (same tab)
    const handlePinnedUpdate = () => {
      loadPinnedAnswers();
    };
    
    // Listen for storage changes (when pinning from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pinnedAssistantAnswers") {
        loadPinnedAnswers();
      }
    };
    
    window.addEventListener("pinnedAnswerUpdated", handlePinnedUpdate);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("pinnedAnswerUpdated", handlePinnedUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Feedback popup after 5 minutes
  useEffect(() => {
    // Check if user has dismissed feedback forever
    const feedbackDismissed = localStorage.getItem("feedbackDismissedForever");
    if (feedbackDismissed === "true") {
      return;
    }

    // Set page load time
    const pageLoadTime = Date.now();
    
    // Check if there's a stored time from previous visit
    const storedTime = localStorage.getItem("dashboardTimeSpent");
    const timeSpent = storedTime ? parseInt(storedTime, 10) : 0;
    
    // If already spent 5 minutes or more, show immediately
    if (timeSpent >= 300000) {
      setShowFeedbackDialog(true);
      localStorage.removeItem("dashboardTimeSpent");
      return;
    }
    
    // Calculate remaining time to show popup (5 minutes = 300000ms)
    const timeUntilPopup = 300000 - timeSpent;
    
    const timer = setTimeout(() => {
      setShowFeedbackDialog(true);
      // Clear stored time since we've shown the popup
      localStorage.removeItem("dashboardTimeSpent");
    }, timeUntilPopup);

    // Track time spent on page
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = currentTime - pageLoadTime;
      const totalTime = timeSpent + elapsed;
      
      // Only store if we haven't shown the popup yet
      if (totalTime < 300000) {
        localStorage.setItem("dashboardTimeSpent", totalTime.toString());
      } else {
        // If we've reached 5 minutes, clear the interval
        clearInterval(interval);
      }
    }, 10000); // Update every 10 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (user?.userId) {
        try {
          // Load contacts, goals, follow-ups, interactions, and meetings in parallel
          const [contactsData, goalsData, followUpsData, overdueFollowUpsData, interactionFollowUpsData, interactionsData, meetingsData] = await Promise.all([
            contactsApi.getContacts(user.userId),
            goalsApi.getGoals(user.userId),
            followUpsApi.getUpcomingFollowUps(user.userId, 7),
            followUpsApi.getOverdueFollowUps(user.userId),
            followUpsApi.getUpcomingInteractionFollowUps(user.userId, 7),
            interactionsApi.getInteractionsForUser(user.userId),
            meetingsApi.getUserMeetings(user.userId)
          ]);
          setContacts(contactsData);
          setGoals(goalsData);
          setInteractions(interactionsData || []);
          setMeetings(meetingsData || []);
          // Combine contact follow-ups and interaction follow-ups
          const allFollowUps = [...(followUpsData || []), ...(interactionFollowUpsData || [])];
          setFollowUpsThisWeek(allFollowUps);
          setOverdueFollowUps(overdueFollowUpsData || []);
          setCompletionRate(0); // Set to 0 for now until we define what completion rate means
        } catch (error) {
          console.error('Failed to load user data:', error);
          setContacts([]);
          setGoals([]);
          setInteractions([]);
          setMeetings([]);
          setFollowUpsThisWeek([]);
          setOverdueFollowUps([]);
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

  // Build recent activity from actual interactions and meetings
  const buildRecentActivity = () => {
    const activities: any[] = [];
    
    // Create a map of contact IDs to names
    const contactMap = new Map();
    (contacts || []).forEach((contact: any) => {
      contactMap.set(contact.contact_id, contact.name);
    });
    
    // Add interactions
    (interactions || []).forEach((interaction: any) => {
      const interactionDate = parseLocalDate(interaction.interaction_date || interaction.date_created);
      if (interactionDate) {
        const contactName = contactMap.get(interaction.contact_id) || 'Contact';
        activities.push({
          name: contactName,
          action: getInteractionActionText(interaction.interaction_type, interaction.direction, interaction.subject),
          time: formatRelativeTime(interactionDate),
          type: 'interaction',
          date: interactionDate
        });
      }
    });
    
    // Add meetings
    (meetings || []).forEach((meeting: any) => {
      const meetingDate = parseLocalDate(meeting.meeting_date || meeting.date_created);
      if (meetingDate) {
        const contactName = contactMap.get(meeting.contact_id) || 'Contact';
        activities.push({
          name: contactName,
          action: `Meeting: ${meeting.meeting_type || 'General meeting'}`,
          time: formatRelativeTime(meetingDate),
          type: 'meeting',
          date: meetingDate
        });
      }
    });
    
    // Add recent contacts
    (contacts || []).slice(0, 2).forEach((contact: any) => {
      const contactDate = parseLocalDate(contact.date_created);
      if (contactDate) {
        activities.push({
          name: contact.name,
          action: 'Contact added',
          time: formatRelativeTime(contactDate),
          type: 'contact',
          date: contactDate
        });
      }
    });
    
    // Sort by date (most recent first) and return top 4
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4)
      .map(({ date, ...rest }) => rest);
  };
  
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };
  
  const getInteractionActionText = (type: string, direction: string, subject?: string): string => {
    const directionText = direction === 'outbound' ? 'Sent' : direction === 'inbound' ? 'Received' : 'Exchanged';
    const typeText = type === 'email' ? 'email' : type === 'call' ? 'call' : type === 'text' ? 'text message' : type;
    
    if (subject && subject.length > 40) {
      return `${directionText} ${typeText}: ${subject.substring(0, 40)}...`;
    }
    return subject ? `${directionText} ${typeText}: ${subject}` : `${directionText} ${typeText}`;
  };
  
  const recentActivity = buildRecentActivity();

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

  // Handle unpinning an answer
  const handleUnpin = (pinId: number) => {
    try {
      const updated = pinnedAnswers.filter((pin) => pin.id !== pinId);
      const pinKey = "pinnedAssistantAnswers";
      localStorage.setItem(pinKey, JSON.stringify(updated));
      setPinnedAnswers(updated);
    } catch (error) {
      console.error("Failed to unpin:", error);
    }
  };

  // Handle starting edit mode
  const handleStartEdit = (pin: any) => {
    setEditingPinId(pin.id);
    // Strip HTML tags for editing (show plain text)
    const textContent = pin.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    setEditedContent(textContent);
  };

  // Handle saving edited content
  const handleSaveEdit = (pinId: number) => {
    try {
      const updated = pinnedAnswers.map((pin) => {
        if (pin.id === pinId) {
          // Preserve HTML formatting if needed, or just save as plain text
          return {
            ...pin,
            content: editedContent.replace(/\n/g, '<br>'), // Convert newlines to <br>
            edited: true,
            editedAt: new Date().toISOString(),
          };
        }
        return pin;
      });
      const pinKey = "pinnedAssistantAnswers";
      localStorage.setItem(pinKey, JSON.stringify(updated));
      setPinnedAnswers(updated);
      setEditingPinId(null);
      setEditedContent("");
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingPinId(null);
    setEditedContent("");
  };

  // Handle feedback dialog dismissal
  const handleDismissFeedback = (dismissForever: boolean) => {
    setShowFeedbackDialog(false);
    if (dismissForever) {
      localStorage.setItem("feedbackDismissedForever", "true");
      localStorage.removeItem("dashboardTimeSpent");
    }
  };

  const handleOpenFeedback = () => {
    window.open(FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
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
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleOpenFeedback}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Leave Feedback
          </Button>
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
      </div>

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

      {/* Pinned Answers Section */}
      {pinnedAnswers.length > 0 && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-primary" />
              Pinned Assistant Answers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pinnedAnswers.map((pin) => (
                <div
                  key={pin.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-all relative group"
                >
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingPinId === pin.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleSaveEdit(pin.id)}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleStartEdit(pin)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleUnpin(pin.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-3 pr-16">
                    <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {editingPinId === pin.id ? (
                        <Textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full min-h-[100px] resize-y"
                          placeholder="Edit your pinned answer..."
                          autoFocus
                        />
                      ) : (
                        <div
                          className="text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: pin.content }}
                        />
                      )}
                      {pin.createdAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {pin.edited ? "Edited" : "Pinned"} {new Date(pin.editedAt || pin.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity / Tips Tabs */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activity & Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="tips" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Networking Tips
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity" className="p-6 space-y-4 mt-0">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading activity...</p>
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground mt-1">Add contacts or log interactions to see activity here</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
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
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="tips" className="p-6 mt-0 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <BookOpen className="h-4 w-4" />
                    <span>Curated networking resources from top business schools</span>
                  </div>
                  {networkingTips.map((tip, index) => (
                    <div 
                      key={index} 
                      className="border rounded-lg p-4 hover:border-primary/50 hover:bg-muted/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                            {tip.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{tip.source}</p>
                        </div>
                        <a
                          href={tip.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-primary hover:text-primary/80 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
      </div>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Help Us Improve!</DialogTitle>
            <DialogDescription>
              We'd love to hear your feedback about your experience with Ripple. Your input helps us make networking easier and more effective for everyone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              This quick survey takes about 5-7 minutes and will help shape future updates.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleDismissFeedback(false)}
              className="w-full sm:w-auto"
            >
              Maybe Later
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleDismissFeedback(true)}
              className="w-full sm:w-auto text-muted-foreground"
            >
              Don't Ask Again
            </Button>
            <Button
              onClick={handleOpenFeedback}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Give Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
