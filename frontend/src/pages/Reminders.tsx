import { Bell, Clock, Calendar, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Reminders = () => {
  const reminders = [
    {
      contact: "David Kim",
      task: "Coffee catch-up at Starbucks",
      date: "Tomorrow",
      time: "2:00 PM",
      urgency: "high",
      category: "Meeting",
      notes: "Discuss potential collaboration on AI research project"
    },
    {
      contact: "Sarah Chen",
      task: "Follow-up on product feedback",
      date: "Tomorrow",
      time: "4:30 PM",
      urgency: "medium",
      category: "Follow-up",
      notes: "Share thoughts on new feature release"
    },
    {
      contact: "Lisa Park",
      task: "Project discussion call",
      date: "Thursday",
      time: "10:00 AM",
      urgency: "high",
      category: "Meeting",
      notes: "Q2 marketing campaign strategy"
    },
    {
      contact: "Michael Rodriguez",
      task: "Send introduction to Emma",
      date: "Thursday",
      time: "3:00 PM",
      urgency: "medium",
      category: "Introduction",
      notes: "Connect Michael with Emma for UX collaboration"
    },
    {
      contact: "Alex Johnson",
      task: "Monthly check-in",
      date: "Friday",
      time: "3:00 PM",
      urgency: "low",
      category: "Check-in",
      notes: "Casual catch-up on life and business"
    },
    {
      contact: "Emma Thompson",
      task: "Design review session",
      date: "Next Monday",
      time: "11:00 AM",
      urgency: "medium",
      category: "Meeting",
      notes: "Review wireframes for new dashboard"
    },
    {
      contact: "James Wilson",
      task: "Send thank you note",
      date: "Next Monday",
      time: "5:00 PM",
      urgency: "low",
      category: "Follow-up",
      notes: "Thanks for the introduction to venture capitalist"
    },
    {
      contact: "Rachel Green",
      task: "Quarterly academic advisor meeting",
      date: "Next Tuesday",
      time: "2:00 PM",
      urgency: "high",
      category: "Meeting",
      notes: "Discuss thesis progress and summer research plans"
    },
  ];

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

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Reminders</h1>
          <p className="text-muted-foreground">Stay on top of your networking commitments</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          New Reminder
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <div className="text-xl font-bold">3</div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="text-xl font-bold">3</div>
              <div className="text-xs text-muted-foreground">Medium Priority</div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">2</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-bold">8</div>
              <div className="text-xs text-muted-foreground">Total Upcoming</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {reminders.map((reminder, index) => (
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
                    <Button size="sm" variant="outline" className="border-border/50 hover:bg-primary/10 hover:text-primary">
                      Complete
                    </Button>
                    <Button size="sm" variant="outline" className="border-border/50 hover:bg-muted">
                      Reschedule
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Reminders;
