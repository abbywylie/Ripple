import { TrendingUp, Users, Target, Calendar, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { contactsApi, meetingsApi, goalsApi } from "@/lib/api";
import { useEffect, useState } from "react";

const ProgressPage = () => {
  const { user } = useAuth();
  const { tooltipsEnabled } = useSettings();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) return;
      
      try {
        setLoading(true);
        const [contactsData, meetingsData, goalsData] = await Promise.all([
          contactsApi.getContacts(user.userId),
          meetingsApi.getUserMeetings(user.userId),
          goalsApi.getGoals(user.userId)
        ]);
        
        setContacts(Array.isArray(contactsData) ? contactsData : []);
        setMeetings(Array.isArray(meetingsData) ? meetingsData : []);
        setGoals(Array.isArray(goalsData) ? goalsData : []);
      } catch (error) {
        console.error('Failed to load progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.userId]);

  // Calculate statistics from real data
  const totalContacts = contacts.length;
  const totalInteractions = meetings.length;
  
  // Calculate goal completion (based on step completion)
  const calculateGoalProgress = (goal: any) => {
    const steps = goal.steps || [];
    if (steps.length === 0) return 0;
    const completedSteps = steps.filter((step: any) => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };
  
  const averageGoalCompletion = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + calculateGoalProgress(goal), 0) / goals.length)
    : 0;

  // Calculate interactions per week (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentMeetings = meetings.filter((meeting: any) => {
    if (!meeting.meeting_date) return false;
    const meetingDate = new Date(meeting.meeting_date);
    return meetingDate >= thirtyDaysAgo;
  });
  const avgInteractionsPerWeek = recentMeetings.length / 4.3; // 30 days ≈ 4.3 weeks

  // Group contacts by category for category breakdown
  const categoryBreakdown = contacts.reduce((acc: any, contact: any) => {
    const category = contact.category || "Professional";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  
  const categoryBreakdownArray = Object.entries(categoryBreakdown).map(([category, count]: [string, any]) => ({
    category,
    count,
    percentage: totalContacts > 0 ? Math.round((count / totalContacts) * 100) : 0
  }));

  // Calculate relationship strength based on meeting frequency
  const relationshipStrength = contacts.map((contact: any) => {
    const contactMeetings = meetings.filter((meeting: any) => meeting.contact_id === contact.contact_id);
    const strength = Math.min(100, Math.max(20, contactMeetings.length * 25)); // Rough calculation
    return {
      name: contact.name,
      strength,
      category: contact.category || "Professional",
      company: contact.company || "N/A"
    };
  }).sort((a, b) => b.strength - a.strength).slice(0, 5); // Top 5

  // Calculate monthly stats (simplified - just show current month data)
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
  const thisMonthContacts = contacts.filter((contact: any) => {
    if (!contact.date_created) return false;
    const contactDate = new Date(contact.date_created);
    const now = new Date();
    return contactDate.getMonth() === now.getMonth() && contactDate.getFullYear() === now.getFullYear();
  }).length;
  
  const thisMonthMeetings = meetings.filter((meeting: any) => {
    if (!meeting.meeting_date) return false;
    const meetingDate = new Date(meeting.meeting_date);
    const now = new Date();
    return meetingDate.getMonth() === now.getMonth() && meetingDate.getFullYear() === now.getFullYear();
  }).length;

  const monthlyStats = [
    { month: currentMonth, contacts: thisMonthContacts, interactions: thisMonthMeetings }
  ];

  if (!user && !loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-2">Progress Analytics</h1>
          <p className="text-muted-foreground">Please log in to view your progress</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold mb-2">Progress Analytics</h1>
          <p className="text-muted-foreground">Track your networking growth and engagement</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Progress Analytics</h1>
        <p className="text-muted-foreground">Track your networking growth and engagement</p>
      </div>

      {/* Key Metrics */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-primary" />
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {loading ? "..." : totalContacts}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Contacts</div>
                  <div className="text-xs text-accent mt-2">
                    {loading ? "..." : `+${thisMonthContacts} this month`}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Total Contacts</p>
                <p className="text-xs">
                  The total number of contacts in your network. Shows growth with the monthly addition count below.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Activity className="h-8 w-8 text-accent" />
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {loading ? "..." : totalInteractions}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Interactions</div>
                  <div className="text-xs text-accent mt-2">
                    {loading ? "..." : `+${thisMonthMeetings} this month`}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Total Interactions</p>
                <p className="text-xs">
                  Total number of meetings and interactions you've logged. Includes coffee chats, interviews, and networking events.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {loading ? "..." : `${averageGoalCompletion}%`}
                  </div>
                  <div className="text-sm text-muted-foreground">Goal Completion</div>
                  <div className="text-xs text-accent mt-2">
                    {loading ? "..." : `${goals.filter(g => g.status === 'In Progress').length} active goals`}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Goal Completion</p>
                <p className="text-xs">
                  Average completion percentage across all your goals. Calculated based on completed steps within each goal.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-accent" />
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {loading ? "..." : avgInteractionsPerWeek.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Interactions/Week</div>
                  <div className="text-xs text-primary mt-2">
                    {loading ? "..." : "Last 30 days"}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Average Interactions Per Week</p>
                <p className="text-xs">
                  Calculated from your interactions over the last 30 days. Helps you track your networking activity and consistency.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </TooltipProvider>

      <TooltipProvider>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Growth Chart */}
          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Monthly Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : monthlyStats.length > 0 ? (
                monthlyStats.map((stat, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">{stat.month}</span>
                      <span className="text-muted-foreground">
                        {stat.contacts} contacts • {stat.interactions} interactions
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Contacts</div>
                        <Progress value={Math.min(100, (stat.contacts / Math.max(stat.contacts, 1)) * 100)} className="h-2 bg-muted" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Interactions</div>
                        <Progress value={Math.min(100, (stat.interactions / Math.max(stat.interactions, 1)) * 100)} className="h-2 bg-muted" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">No data for current month</div>
              )}
            </div>
          </CardContent>
        </Card>
        {tooltipsEnabled && (
          <TooltipContent>
            <p className="font-semibold mb-1">Monthly Growth</p>
            <p className="text-xs max-w-xs">
              Tracks your networking activity for the current month. Shows both new contacts added and interactions scheduled.
            </p>
          </TooltipContent>
        )}
      </Tooltip>

      {/* Category Breakdown */}
      <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
        <TooltipTrigger asChild>
          <Card className="glass-card border-border/50 cursor-help">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : categoryBreakdownArray.length > 0 ? (
              categoryBreakdownArray.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.count} contacts ({item.percentage}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No contacts yet</div>
            )}
          </CardContent>
        </Card>
        {tooltipsEnabled && (
          <TooltipContent>
            <p className="font-semibold mb-1">Category Breakdown</p>
            <p className="text-xs max-w-xs">
              Distribution of your contacts by category (Professional, Personal, Academic, etc.). Shows the percentage of your network in each category.
            </p>
          </TooltipContent>
        )}
      </Tooltip>
        </div>
      </TooltipProvider>

      {/* Relationship Strength */}
      <TooltipProvider>
        <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
          <TooltipTrigger asChild>
            <Card className="glass-card border-border/50 cursor-help">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-accent" />
                  Top Relationship Strength
                </CardTitle>
              </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : relationshipStrength.length > 0 ? (
              relationshipStrength.map((person, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{person.name}</span>
                      <span className="text-sm">
                        <span className="text-accent font-semibold">{person.strength}%</span>
                        <span className="text-muted-foreground ml-2">• {person.category}</span>
                      </span>
                    </div>
                    <Progress value={person.strength} className="h-2" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No interactions yet</div>
            )}
          </div>
        </CardContent>
      </Card>
      {tooltipsEnabled && (
        <TooltipContent>
          <p className="font-semibold mb-1">Top Relationship Strength</p>
          <p className="text-xs max-w-xs">
            Shows your strongest relationships based on meeting frequency. Higher strength indicates more regular interactions with that contact.
          </p>
        </TooltipContent>
      )}
    </Tooltip>
      </TooltipProvider>

      {/* Engagement Insights */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Most Active Category</div>
                  <div className="text-2xl font-bold text-primary">
                    {loading ? "..." : categoryBreakdownArray.length > 0 ? categoryBreakdownArray[0].category : "None"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {loading ? "..." : categoryBreakdownArray.length > 0 ? `${categoryBreakdownArray[0].percentage}% of network` : "No data"}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent>
                <p className="font-semibold mb-1">Most Active Category</p>
                <p className="text-xs max-w-xs">
                  The category with the most contacts in your network. Helps you understand where your networking focus lies.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Active Goals</div>
                  <div className="text-2xl font-bold text-accent">
                    {loading ? "..." : goals.filter(g => g.status === 'In Progress').length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {loading ? "..." : `${averageGoalCompletion}% average completion`}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent>
                <p className="font-semibold mb-1">Active Goals</p>
                <p className="text-xs max-w-xs">
                  Number of goals currently in progress. Shows your average completion percentage to track overall progress.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground mb-2">Recent Activity</div>
                  <div className="text-2xl font-bold text-primary">
                    {loading ? "..." : recentMeetings.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {loading ? "..." : "interactions in last 30 days"}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent>
                <p className="font-semibold mb-1">Recent Activity</p>
                <p className="text-xs max-w-xs">
                  Total interactions (meetings, coffee chats, etc.) in the last 30 days. Measures your recent networking engagement.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ProgressPage;
