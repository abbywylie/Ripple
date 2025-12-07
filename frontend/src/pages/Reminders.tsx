import { Bell, Clock, Calendar, AlertCircle, Plus, CheckCircle, User, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { followUpsApi, contactsApi } from "@/lib/api";
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

const Reminders = () => {
  const { user } = useAuth();
  const { tooltipsEnabled } = useSettings();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hasProfileInfo = user?.company_or_school && user?.role;
  // Load reminders data
  useEffect(() => {
    const loadReminders = async () => {
      if (user?.userId) {
        try {
          // Get upcoming follow-ups (reminders are based on follow-up dates)
          const followUpsData = await followUpsApi.getUpcomingFollowUps(user.userId, 30); // Get next 30 days
          
          // Transform follow-ups into reminder format
          const transformedReminders = followUpsData.map((contact: any) => {
            const followUpDate = parseLocalDate(contact.date_next_follow_up);
            if (!followUpDate) return null; // Skip invalid dates
            
            const today = new Date();
            const daysUntilFollowUp = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Determine urgency based on days until follow-up
            let urgency = "low";
            if (daysUntilFollowUp <= 1) urgency = "high";
            else if (daysUntilFollowUp <= 3) urgency = "medium";
            
            return {
              contact: contact.name || 'Unknown Contact',
              task: `Follow-up with ${contact.name}`,
              date: followUpDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
              time: "Scheduled", // We don't have time info, just dates
              urgency,
              category: "Follow-up",
              notes: contact.company ? `Follow-up at ${contact.company}` : "Scheduled follow-up",
              contactId: contact.contact_id,
              daysUntil: daysUntilFollowUp,
              rawDate: contact.date_next_follow_up
            };
          }).filter(Boolean); // Remove null entries
          
          // Sort by urgency and date
          transformedReminders.sort((a: any, b: any) => {
            const urgencyOrder = { high: 0, medium: 1, low: 2 };
            if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
              return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
            }
            return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
          });
          
          setReminders(transformedReminders);
        } catch (error) {
          console.error('Failed to load reminders:', error);
          setReminders([]);
        }
      }
      setLoading(false);
    };

    if (user) {
      loadReminders();
    } else {
      setLoading(false);
    }
  }, [user?.userId, user]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-destructive/20 text-destructive border-destructive/30";
      case "medium": return "bg-accent/20 text-accent border-accent/30";
      case "low": return "bg-muted text-muted-foreground border-border/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === "high") return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // Calculate stats
  const highPriorityCount = reminders.filter(r => r.urgency === 'high').length;
  const mediumPriorityCount = reminders.filter(r => r.urgency === 'medium').length;
  const thisWeekCount = reminders.filter(r => r.daysUntil <= 7).length;

  // Interactive functions
  const handleCompleteReminder = async (reminder: any) => {
    if (!user?.userId) return;
    
    try {
      // Mark the follow-up as completed by updating the contact's follow-up date to a future date
      // For now, we'll set it to 30 days from now
      const newFollowUpDate = new Date();
      newFollowUpDate.setDate(newFollowUpDate.getDate() + 30);
      
      await contactsApi.updateContact(reminder.contactId, {
        date_next_follow_up: newFollowUpDate.toISOString().split('T')[0]
      });
      
      // Reload reminders
      const followUpsData = await followUpsApi.getUpcomingFollowUps(user.userId, 30);
      // Transform and update state (same logic as in useEffect)
      const transformedReminders = followUpsData.map((contact: any) => {
        const followUpDate = parseLocalDate(contact.date_next_follow_up);
        if (!followUpDate) return null; // Skip invalid dates
        
        const today = new Date();
        const daysUntilFollowUp = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let urgency = "low";
        if (daysUntilFollowUp <= 1) urgency = "high";
        else if (daysUntilFollowUp <= 3) urgency = "medium";
        
        return {
          contact: contact.name || 'Unknown Contact',
          task: `Follow-up with ${contact.name}`,
          date: followUpDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
          time: "Scheduled",
          urgency,
          category: "Follow-up",
          notes: contact.company ? `Follow-up at ${contact.company}` : "Scheduled follow-up",
          contactId: contact.contact_id,
          daysUntil: daysUntilFollowUp,
          rawDate: contact.date_next_follow_up
        };
      }).filter(Boolean); // Remove null entries
      
      transformedReminders.sort((a: any, b: any) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        }
        return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
      });
      
      setReminders(transformedReminders);
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const handleRescheduleReminder = (reminder: any) => {
    // Navigate to contacts page to edit the contact's follow-up date
    window.location.href = `/contacts`;
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Reminders</h1>
          <p className="text-muted-foreground">Stay on top of your networking commitments</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
          onClick={() => window.location.href = '/contacts'}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Reminder
        </Button>
      </div>

      {!hasProfileInfo && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Add your company or school and role so others can learn more about you. This information will be visible to other users.
                </p>
                <Button onClick={() => navigate('/profile')} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{loading ? "..." : highPriorityCount}</div>
                    <div className="text-xs text-muted-foreground">High Priority</div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent>
                <p className="font-semibold mb-1">High Priority Reminders</p>
                <p className="text-xs max-w-xs">
                  Follow-ups that are due within 1 day. These are urgent and should be addressed immediately to maintain strong relationships.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{loading ? "..." : mediumPriorityCount}</div>
                    <div className="text-xs text-muted-foreground">Medium Priority</div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent>
                <p className="font-semibold mb-1">Medium Priority Reminders</p>
                <p className="text-xs max-w-xs">
                  Follow-ups due within 2-3 days. Important but not urgent. Plan to address these soon to stay on top of your networking.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{loading ? "..." : thisWeekCount}</div>
                    <div className="text-xs text-muted-foreground">This Week</div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent>
                <p className="font-semibold mb-1">This Week</p>
                <p className="text-xs max-w-xs">
                  Total number of follow-ups scheduled for the next 7 days. Helps you plan your weekly networking outreach.
                </p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip delayDuration={tooltipsEnabled ? 300 : 999999}>
            <TooltipTrigger asChild>
              <Card className="glass-card border-border/50 cursor-help">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">{loading ? "..." : reminders.length}</div>
                    <div className="text-xs text-muted-foreground">Total Upcoming</div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            {tooltipsEnabled && (
              <TooltipContent>
                <p className="font-semibold mb-1">Total Upcoming</p>
                <p className="text-xs max-w-xs">
                  All follow-up reminders scheduled for the next 30 days. This gives you a complete view of your upcoming networking commitments.
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Timeline */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reminders...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upcoming reminders</h3>
            <p className="text-muted-foreground mb-4">Add follow-up dates to your contacts to see reminders here</p>
            <Button onClick={() => window.location.href = '/contacts'} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Go to Contacts
            </Button>
          </div>
        ) : (
          reminders.map((reminder, index) => (
            <Card key={index} className="glass-card border-border/50 hover:border-primary/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      reminder.urgency === 'high' ? 'bg-destructive/20' :
                      reminder.urgency === 'medium' ? 'bg-accent/20' : 'bg-muted'
                    }`}>
                      {getUrgencyIcon(reminder.urgency)}
                    </div>
                    {index < reminders.length - 1 && (
                      <div className="w-0.5 h-full bg-border/50 mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{reminder.contact}</h3>
                        <p className="text-foreground/90">{reminder.task}</p>
                      </div>
                      <Badge variant="outline" className={getUrgencyColor(reminder.urgency)}>
                        {reminder.urgency.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {reminder.date}
                        {reminder.daysUntil !== undefined && (
                          <span className="text-xs ml-1">({reminder.daysUntil} day{reminder.daysUntil !== 1 ? 's' : ''} away)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {reminder.time}
                      </div>
                      <Badge variant="outline" className="border-border/50 text-xs">
                        {reminder.category}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                      {reminder.notes}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-border/50 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                        onClick={() => handleCompleteReminder(reminder)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-border/50 hover:bg-muted"
                        onClick={() => handleRescheduleReminder(reminder)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Reminders;
