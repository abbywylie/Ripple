import { Target, Plus, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const Goals = () => {
  const goals = [
    {
      title: "Connect with 10 professionals in AI field",
      description: "Build relationships with leaders in artificial intelligence",
      progress: 70,
      current: 7,
      target: 10,
      deadline: "End of March",
      status: "In Progress",
      milestones: [
        { title: "Research potential contacts", completed: true },
        { title: "Send introductory messages", completed: true },
        { title: "Schedule coffee chats", completed: false },
        { title: "Follow up after meetings", completed: false },
      ]
    },
    {
      title: "Attend 5 networking events",
      description: "Participate in industry conferences and meetups",
      progress: 40,
      current: 2,
      target: 5,
      deadline: "End of April",
      status: "In Progress",
      milestones: [
        { title: "Find relevant events", completed: true },
        { title: "Register for events", completed: true },
        { title: "Prepare introduction pitch", completed: false },
        { title: "Follow up with new contacts", completed: false },
      ]
    },
    {
      title: "Reconnect with 15 old colleagues",
      description: "Strengthen existing relationships and catch up",
      progress: 87,
      current: 13,
      target: 15,
      deadline: "End of February",
      status: "Near Complete",
      milestones: [
        { title: "Create list of contacts", completed: true },
        { title: "Draft personalized messages", completed: true },
        { title: "Send messages", completed: true },
        { title: "Schedule catch-up calls", completed: false },
      ]
    },
    {
      title: "Build presence on LinkedIn",
      description: "Share insights and engage with network regularly",
      progress: 55,
      current: 11,
      target: 20,
      deadline: "Ongoing",
      status: "In Progress",
      milestones: [
        { title: "Optimize profile", completed: true },
        { title: "Create content calendar", completed: true },
        { title: "Publish weekly posts", completed: false },
        { title: "Engage with others' content", completed: false },
      ]
    },
    {
      title: "Mentor 3 students",
      description: "Give back to the community and build teaching skills",
      progress: 33,
      current: 1,
      target: 3,
      deadline: "End of Semester",
      status: "In Progress",
      milestones: [
        { title: "Sign up for mentorship program", completed: true },
        { title: "Get matched with mentees", completed: false },
        { title: "Establish meeting schedule", completed: false },
        { title: "Provide career guidance", completed: false },
      ]
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Near Complete": return "bg-accent/20 text-accent border-accent/30";
      case "In Progress": return "bg-primary/20 text-primary border-primary/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Networking Goals</h1>
          <p className="text-muted-foreground">Track your relationship building objectives</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
          <Plus className="h-4 w-4 mr-2" />
          New Goal
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Active Goals</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold">87%</div>
                <div className="text-sm text-muted-foreground">Avg. Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm text-muted-foreground">Goals Achieved</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-6">
        {goals.map((goal, index) => (
          <Card key={index} className="glass-card border-border/50 hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{goal.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
                <Badge variant="outline" className={getStatusColor(goal.status)}>
                  {goal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    {goal.current} of {goal.target} completed
                  </span>
                  <span className="text-sm text-accent font-semibold">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>

              {/* Milestones */}
              <div>
                <div className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Milestones
                </div>
                <div className="space-y-2">
                  {goal.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        milestone.completed ? 'bg-primary' : 'border-2 border-border'
                      }`}>
                        {milestone.completed && <CheckCircle2 className="h-3 w-3 text-background" />}
                      </div>
                      <span className={milestone.completed ? 'text-muted-foreground line-through' : ''}>
                        {milestone.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border/50">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {goal.deadline}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Goals;
