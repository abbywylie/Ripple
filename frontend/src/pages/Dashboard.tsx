import { Users, Target, TrendingUp, Clock, Plus, UserPlus, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { contactsApi, goalsApi, followUpsApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (user?.userId) {
        try {
          // Load contacts, goals, and follow-ups in parallel
          const [contactsData, goalsData, followUpsData, overdueFollowUpsData, interactionFollowUpsData] = await Promise.all([
            contactsApi.getContacts(user.userId),
            goalsApi.getGoals(user.userId),
            followUpsApi.getUpcomingFollowUps(user.userId, 7),
            followUpsApi.getOverdueFollowUps(user.userId),
            followUpsApi.getUpcomingInteractionFollowUps(user.userId, 7)
          ]);
          setContacts(contactsData);
          setGoals(goalsData);
          // Combine contact follow-ups and interaction follow-ups
          const allFollowUps = [...(followUpsData || []), ...(interactionFollowUpsData || [])];
          setFollowUpsThisWeek(allFollowUps);
          setOverdueFollowUps(overdueFollowUpsData || []);
          setCompletionRate(0); // Set to 0 for now until we define what completion rate means
        } catch (error) {
          console.error('Failed to load user data:', error);
          setContacts([]);
          setGoals([]);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
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
    </div>
  );
};

export default Dashboard;
