import { Users, Target, TrendingUp, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const stats = [
    { title: "Total Contacts", value: "42", icon: Users, color: "text-primary" },
    { title: "Active Goals", value: "5", icon: Target, color: "text-accent" },
    { title: "Completion Rate", value: "87%", icon: TrendingUp, color: "text-primary" },
    { title: "This Week", value: "12", icon: Clock, color: "text-accent" },
  ];

  const recentActivity = [
    { name: "Sarah Chen", action: "Coffee meeting completed", time: "2 hours ago", type: "meeting" },
    { name: "Michael Rodriguez", action: "LinkedIn message sent", time: "5 hours ago", type: "message" },
    { name: "Emma Thompson", action: "Follow-up scheduled", time: "1 day ago", type: "reminder" },
    { name: "James Wilson", action: "Introduction made", time: "2 days ago", type: "intro" },
  ];

  const upcomingReminders = [
    { contact: "David Kim", task: "Coffee catch-up", date: "Tomorrow, 2:00 PM" },
    { contact: "Lisa Park", task: "Project discussion", date: "Thursday, 10:00 AM" },
    { contact: "Alex Johnson", task: "Monthly check-in", date: "Friday, 3:00 PM" },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Welcome back, Yu Ning!</h1>
          <p className="text-muted-foreground">Here's what's happening with your network</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          Quick Action
        </Button>
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
            {upcomingReminders.map((reminder, index) => (
              <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{reminder.contact}</p>
                  <p className="text-sm text-muted-foreground">{reminder.task}</p>
                  <p className="text-xs text-accent mt-1">{reminder.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
