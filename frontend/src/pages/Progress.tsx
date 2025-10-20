import { TrendingUp, Users, Target, Calendar, BarChart3, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ProgressPage = () => {
  const monthlyStats = [
    { month: "Jan", contacts: 8, interactions: 42 },
    { month: "Feb", contacts: 12, interactions: 58 },
    { month: "Mar", contacts: 15, interactions: 73 },
    { month: "Apr", contacts: 7, interactions: 34 },
  ];

  const relationshipStrength = [
    { name: "David Kim", strength: 95, category: "Academic" },
    { name: "Sarah Chen", strength: 88, category: "Professional" },
    { name: "Alex Johnson", strength: 92, category: "Personal" },
    { name: "Lisa Park", strength: 85, category: "Professional" },
    { name: "Michael Rodriguez", strength: 78, category: "Professional" },
  ];

  const categoryBreakdown = [
    { category: "Professional", count: 28, percentage: 67 },
    { category: "Academic", count: 10, percentage: 24 },
    { category: "Personal", count: 4, percentage: 9 },
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Progress Analytics</h1>
        <p className="text-muted-foreground">Track your networking growth and engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-primary" />
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="text-3xl font-bold mb-1">42</div>
            <div className="text-sm text-muted-foreground">Total Contacts</div>
            <div className="text-xs text-accent mt-2">+15 this month</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-accent" />
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="text-3xl font-bold mb-1">207</div>
            <div className="text-sm text-muted-foreground">Total Interactions</div>
            <div className="text-xs text-accent mt-2">+73 this month</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1">87%</div>
            <div className="text-sm text-muted-foreground">Goal Completion</div>
            <div className="text-xs text-accent mt-2">5 active goals</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-accent" />
            </div>
            <div className="text-3xl font-bold mb-1">4.9</div>
            <div className="text-sm text-muted-foreground">Avg Interactions/Week</div>
            <div className="text-xs text-primary mt-2">Above target</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth Chart */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyStats.map((stat, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{stat.month}</span>
                    <span className="text-muted-foreground">
                      {stat.contacts} contacts • {stat.interactions} interactions
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Progress value={(stat.contacts / 15) * 100} className="h-2 bg-muted" />
                    </div>
                    <div className="flex-1">
                      <Progress value={(stat.interactions / 100) * 100} className="h-2 bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {categoryBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-sm text-muted-foreground">
                    {item.count} contacts ({item.percentage}%)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Relationship Strength */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            Top Relationship Strength
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relationshipStrength.map((person, index) => (
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Best Day to Connect</div>
            <div className="text-2xl font-bold text-primary">Tuesday</div>
            <div className="text-xs text-muted-foreground mt-1">35% more responses</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Avg Response Time</div>
            <div className="text-2xl font-bold text-accent">2.4 hrs</div>
            <div className="text-xs text-muted-foreground mt-1">Better than 78% of users</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground mb-2">Most Active Category</div>
            <div className="text-2xl font-bold text-primary">Professional</div>
            <div className="text-xs text-muted-foreground mt-1">67% of network</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressPage;
